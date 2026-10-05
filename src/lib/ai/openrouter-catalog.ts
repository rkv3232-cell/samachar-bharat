/**
 * OpenRouter Free Model Discovery & Dynamic Routing Catalog
 * 
 * STRICT COMPLIANCE REQUIREMENTS:
 * 1. ONLY FREE MODELS ALLOWED.
 * 2. PAID MODELS ARE STRICTLY FORBIDDEN. NO EXCEPTIONS.
 * 3. Never select a paid model as fallback.
 * 4. Never automatically switch to a paid model.
 * 5. Discover free models dynamically from OpenRouter catalog, cache for 1 hour.
 * 6. Hard assertion blocks any non-free model from ever being called.
 */

import { AITaskType } from './types';

export interface OpenRouterModelInfo {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt: string | number;
    completion: string | number;
  };
}

// Fallback list of known free models if catalog discovery is unreachable or during initial boot
const DEFAULT_FREE_MODELS: string[] = [
  'openrouter/free',
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'qwen/qwen3.8-27b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'liquid/lfm-2.5-2.6b:free',
];

interface CatalogCache {
  freeModelIds: Set<string>;
  freeModelsList: OpenRouterModelInfo[];
  lastFetched: number;
}

const CATALOG_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedCatalog: CatalogCache = {
  freeModelIds: new Set(DEFAULT_FREE_MODELS),
  freeModelsList: [],
  lastFetched: 0,
};

/**
 * Checks if a model ID is guaranteed free:
 * 1. Is 'openrouter/free'
 * 2. Explicitly ends with ':free'
 * 3. Or has pricing: prompt=0 and completion=0 in verified catalog
 */
export function isFreeModelId(modelId: string): boolean {
  if (!modelId) return false;
  const normalized = modelId.trim().toLowerCase();
  
  // Explicit :free suffix or openrouter free router
  if (normalized === 'openrouter/free' || normalized.endsWith(':free')) {
    return true;
  }

  // Check cached catalog
  return cachedCatalog.freeModelIds.has(modelId);
}

/**
 * Hard enforcement: Throws immediately if a paid model is specified.
 */
export function assertStrictlyFreeModel(modelId: string): void {
  if (!isFreeModelId(modelId)) {
    throw new Error(
      `[SECURITY/BUDGET POLICY] Access to model "${modelId}" blocked. Only FREE OpenRouter models are allowed. Paid models are strictly forbidden.`
    );
  }
}

/**
 * Dynamically fetches model catalog from OpenRouter, filters strictly free models,
 * and caches for 1 hour.
 */
export async function getDiscoveredFreeModels(): Promise<string[]> {
  const now = Date.now();
  if (
    cachedCatalog.freeModelIds.size > 0 &&
    now - cachedCatalog.lastFetched < CATALOG_CACHE_TTL_MS
  ) {
    return Array.from(cachedCatalog.freeModelIds);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('https://openrouter.ai/api/v1/models', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.data)) {
        const discovered = new Set<string>();
        const modelsList: OpenRouterModelInfo[] = [];

        // Always include 'openrouter/free'
        discovered.add('openrouter/free');

        for (const m of data.data) {
          const id = m.id as string;
          if (!id) continue;

          const isEndingWithFree = id.endsWith(':free');
          const isPricingFree =
            m.pricing &&
            parseFloat(String(m.pricing.prompt || '1')) === 0 &&
            parseFloat(String(m.pricing.completion || '1')) === 0;

          if (isEndingWithFree || isPricingFree) {
            discovered.add(id);
            modelsList.push({
              id,
              name: m.name || id,
              context_length: m.context_length,
              pricing: m.pricing,
            });
          }
        }

        if (discovered.size > 0) {
          cachedCatalog = {
            freeModelIds: discovered,
            freeModelsList: modelsList,
            lastFetched: now,
          };
          console.info(
            `[OpenRouter Discovery] Successfully refreshed free models catalog: ${discovered.size} free models found.`
          );
          return Array.from(discovered);
        }
      }
    }
  } catch (err: any) {
    console.warn(
      `[OpenRouter Discovery] Dynamic catalog refresh failed (${err?.message || err}). Using cached/default free models whitelist.`
    );
  }

  return Array.from(cachedCatalog.freeModelIds);
}

/**
 * Task-Based Free Model Selection:
 * Selects the highest quality, most suitable, strictly-free model currently available.
 */
export function getFreeFallbackModelForTask(task: AITaskType): string {
  // Check discovered catalog or default free models
  const available = cachedCatalog.freeModelIds;

  switch (task) {
    case 'chat':
    case 'general-question':
      // Prefer openrouter/free or gemma-4-31b-it:free
      if (available.has('openrouter/free')) return 'openrouter/free';
      if (available.has('google/gemma-4-31b-it:free')) return 'google/gemma-4-31b-it:free';
      return 'openrouter/free';

    case 'article-generation':
    case 'article-rewrite':
      // Prefer high context / high quality free writing model
      if (available.has('google/gemma-4-31b-it:free')) return 'google/gemma-4-31b-it:free';
      if (available.has('openrouter/free')) return 'openrouter/free';
      return 'openrouter/free';

    case 'translation':
    case 'structured-json':
    case 'dpivs-text-parse':
      // Prefer qwen3.8-27b:free (outstanding Hindi multilingual + JSON syntax accuracy)
      if (available.has('qwen/qwen3.8-27b:free')) return 'qwen/qwen3.8-27b:free';
      if (available.has('openrouter/free')) return 'openrouter/free';
      return 'openrouter/free';

    case 'headline':
    case 'summarization':
    case 'tldr':
    case 'seo-tags':
    case 'suggest-category':
    case 'web-story':
    case 'whatsapp-ingest':
    case 'fact-check':
    case 'dpivs-vision':
    default:
      if (available.has('openrouter/free')) return 'openrouter/free';
      return 'openrouter/free';
  }
}
