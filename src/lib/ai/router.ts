import { AIRequestOptions, AIResponse } from './types';
import { getTaskModelConfig } from './models';
import { callGemini, streamGemini } from './gemini';
import { callOpenRouter, streamOpenRouter } from './openrouter';
import { AICircuitBreaker } from './circuit-breaker';
import { classifyAIError, AIException } from './errors';

/**
 * Cleans markdown code blocks, backticks, and whitespace from AI text
 */
export function cleanAIText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * Robustly extracts structured JSON from text, handling markdown wrappers and inner JSON objects
 */
export function extractStructuredJSON<T = any>(raw: string): T | null {
  if (!raw) return null;
  const cleaned = cleanAIText(raw);
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = raw.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Central AI Execution Router:
 * 1. Matches task with best Gemini model (Primary)
 * 2. Attempts Gemini execution with timeout & circuit breaker
 * 3. On recoverable error / rate limit / quota exhaustion, automatically cascades to OpenRouter Free Model (Fallback)
 */
export async function executeAITask(options: AIRequestOptions): Promise<AIResponse> {
  const config = getTaskModelConfig(options.task);
  const timeoutMs = options.timeoutMs || config.defaultTimeoutMs;

  const mergedOptions: AIRequestOptions = {
    ...options,
    temperature: options.temperature ?? config.defaultTemperature,
    maxTokens: options.maxTokens || config.maxTokens,
  };

  const isGeminiHealthy = AICircuitBreaker.isProviderAvailable('gemini');

  // ─────────────────────────────────────────────────────────────
  // 1. PRIMARY: GOOGLE GEMINI
  // ─────────────────────────────────────────────────────────────
  if (isGeminiHealthy && process.env.GEMINI_API_KEY) {
    try {
      const response = await callGemini(config.primaryModel, mergedOptions, timeoutMs);
      console.log(
        `[AI Router] Task: ${options.task} | Provider: gemini (${config.primaryModel}) | Latency: ${response.latencyMs}ms | Fallback: no`
      );
      return response;
    } catch (geminiError: any) {
      const classified = classifyAIError(geminiError);

      // If user input is invalid or violates safety policies, do not blindly retry
      if (!classified.isRecoverable) {
        console.warn(`[AI Router] Unrecoverable Gemini error (${classified.category}): ${classified.originalMessage}`);
        throw new AIException(classified);
      }

      console.warn(
        `[AI Router] Gemini primary failed (${classified.category}). Triggering OpenRouter Free fallback (${config.fallbackModel})...`
      );
      AICircuitBreaker.recordFallback('gemini', 'openrouter');
    }
  } else if (!isGeminiHealthy) {
    console.info(
      `[AI Router] Gemini circuit breaker active (in cooldown). Routing directly to OpenRouter Free model (${config.fallbackModel}).`
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. FALLBACK: OPENROUTER (STRICTLY FREE MODELS)
  // ─────────────────────────────────────────────────────────────
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const fallbackResponse = await callOpenRouter(config.fallbackModel, mergedOptions, timeoutMs);
      console.log(
        `[AI Router] Task: ${options.task} | Provider: openrouter (${config.fallbackModel}) | Latency: ${fallbackResponse.latencyMs}ms | Fallback: yes`
      );
      return fallbackResponse;
    } catch (openRouterError: any) {
      const classified = classifyAIError(openRouterError);
      console.error(
        `[AI Router] Both Gemini and OpenRouter free fallback failed. Reason: ${classified.originalMessage}`
      );
      throw new AIException(classified);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 3. NO PROVIDER CONFIGURED
  // ─────────────────────────────────────────────────────────────
  throw new Error('No AI providers configured or available. Please check GEMINI_API_KEY or OPENROUTER_API_KEY in .env.local.');
}

/**
 * Streams AI tokens progressively via Server-Sent Events (SSE).
 * Prevents 20-second blank loading by yielding the first token immediately (~800ms).
 * Flow:
 * 1. Primary: Gemini SSE stream
 * 2. Fallback: OpenRouter Free model SSE stream
 */
export function streamAITask(options: AIRequestOptions): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const config = getTaskModelConfig(options.task);
  const timeoutMs = options.timeoutMs || config.defaultTimeoutMs;

  const mergedOptions: AIRequestOptions = {
    ...options,
    temperature: options.temperature ?? config.defaultTemperature,
    maxTokens: options.maxTokens || config.maxTokens,
  };

  return new ReadableStream({
    async start(controller) {
      const sendChunk = (deltaText: string) => {
        const payload = JSON.stringify({
          choices: [{ delta: { content: deltaText } }],
        });
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      const closeStream = () => {
        controller.enqueue(encoder.encode(`data: [DONE]\n\n`));
        controller.close();
      };

      const isGeminiHealthy = AICircuitBreaker.isProviderAvailable('gemini');
      let geminiAttempted = false;

      // 1. Try Gemini streaming first (Primary)
      if (isGeminiHealthy && process.env.GEMINI_API_KEY) {
        geminiAttempted = true;
        try {
          let hasEmittedFirstToken = false;
          await streamGemini(config.primaryModel, mergedOptions, timeoutMs, (chunk) => {
            hasEmittedFirstToken = true;
            sendChunk(chunk);
          });
          closeStream();
          return;
        } catch (geminiError: any) {
          const classified = classifyAIError(geminiError);
          console.warn(
            `[AI Stream] Gemini stream error (${classified.category}): ${classified.originalMessage}. Trying OpenRouter Free fallback...`
          );
          AICircuitBreaker.recordFallback('gemini', 'openrouter');
        }
      }

      // 2. Fallback to OpenRouter Free model streaming
      if (process.env.OPENROUTER_API_KEY) {
        try {
          await streamOpenRouter(config.fallbackModel, mergedOptions, timeoutMs, (chunk) => {
            sendChunk(chunk);
          });
          closeStream();
          return;
        } catch (openRouterError: any) {
          const classified = classifyAIError(openRouterError);
          console.error(
            `[AI Stream] OpenRouter free stream fallback failed: ${classified.originalMessage}`
          );
          // Send friendly user message chunk so UI doesn't freeze
          sendChunk('नमस्ते! सेवा वर्तमान में व्यस्त है। कृपया कुछ ही क्षणों में पुनः प्रयास करें।');
          closeStream();
          return;
        }
      }

      // Fallback message if neither is available
      sendChunk('नमस्ते! सेवा वर्तमान में उपलब्ध नहीं है। कृपया व्यवस्थापक से संपर्क करें।');
      closeStream();
    },
  });
}
