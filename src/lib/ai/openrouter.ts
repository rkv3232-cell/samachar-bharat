import { AIMessage, AIRequestOptions, AIResponse } from './types';
import { AICircuitBreaker } from './circuit-breaker';
import { classifyAIError } from './errors';
import { assertStrictlyFreeModel, isFreeModelId } from './openrouter-catalog';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Builds OpenAI/OpenRouter compatible messages array
 */
function buildOpenRouterMessages(
  messages: AIMessage[] = [],
  prompt?: string,
  systemPrompt?: string,
  images?: string[]
): Array<{ role: string; content: any }> {
  const result: Array<{ role: string; content: any }> = [];

  if (systemPrompt) {
    result.push({ role: 'system', content: systemPrompt });
  }

  for (const msg of messages) {
    if (msg.role === 'system' && !systemPrompt) {
      result.push({ role: 'system', content: msg.content });
    } else if (msg.role !== 'system') {
      result.push({ role: msg.role, content: msg.content });
    }
  }

  if (prompt && (!messages || messages.length === 0)) {
    if (images && images.length > 0) {
      const contentParts: Array<any> = [{ type: 'text', text: prompt }];
      images.forEach((url) => {
        contentParts.push({ type: 'image_url', image_url: { url } });
      });
      result.push({ role: 'user', content: contentParts });
    } else {
      result.push({ role: 'user', content: prompt });
    }
  }

  return result.length > 0 ? result : [{ role: 'user', content: 'Hello' }];
}

/**
 * Execute OpenRouter request (STRICTLY FREE MODELS ONLY)
 */
export async function callOpenRouter(
  model: string,
  options: AIRequestOptions,
  timeoutMs: number
): Promise<AIResponse> {
  // HARD REQUIREMENT: Block paid models immediately
  assertStrictlyFreeModel(model);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env.local');
  }

  const startTime = Date.now();
  const messages = buildOpenRouterMessages(
    options.messages,
    options.prompt,
    options.systemPrompt,
    options.images
  );

  const requestBody: Record<string, any> = {
    model,
    messages,
    temperature: options.temperature ?? 0.5,
  };

  if (options.maxTokens) {
    requestBody.max_tokens = options.maxTokens;
  }

  if (options.jsonOutput) {
    requestBody.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://samacharbharat.in',
        'X-Title': 'Samachar Bharat AI System',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    if (!response.ok) {
      const errorText = await response.text();
      let parsedErr: any = {};
      try {
        parsedErr = JSON.parse(errorText);
      } catch {
        // raw text
      }
      const err = new Error(
        parsedErr?.error?.message || `OpenRouter returned HTTP ${response.status}: ${errorText}`
      );
      (err as any).status = response.status;
      throw err;
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const latencyMs = Date.now() - startTime;

    let parsedJson: any = undefined;
    if (options.jsonOutput) {
      try {
        const cleaned = text.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
        parsedJson = JSON.parse(cleaned);
      } catch {
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          try {
            parsedJson = JSON.parse(match[0]);
          } catch {
            parsedJson = undefined;
          }
        }
      }
    }

    AICircuitBreaker.recordSuccess('openrouter');

    return {
      text,
      json: parsedJson,
      provider: 'openrouter',
      model,
      latencyMs,
      fallbackUsed: true,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error: any) {
    clearTimeout(timeoutTimer);
    const classified = classifyAIError(error);
    AICircuitBreaker.recordFailure('openrouter', classified.category as any);
    throw error;
  }
}

/**
 * OpenRouter SSE Streaming (STRICTLY FREE MODELS ONLY)
 * Streams standard SSE chunks: data: {"choices":[{"delta":{"content":"..."}}]}\n\n
 */
export async function streamOpenRouter(
  model: string,
  options: AIRequestOptions,
  timeoutMs: number,
  onChunk: (text: string) => void
): Promise<{ fullText: string; latencyMs: number }> {
  // HARD REQUIREMENT: Block paid models immediately
  assertStrictlyFreeModel(model);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in .env.local');
  }

  const startTime = Date.now();
  const messages = buildOpenRouterMessages(
    options.messages,
    options.prompt,
    options.systemPrompt,
    options.images
  );

  const requestBody: Record<string, any> = {
    model,
    messages,
    stream: true,
    temperature: options.temperature ?? 0.5,
  };

  if (options.maxTokens) {
    requestBody.max_tokens = options.maxTokens;
  }

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://samacharbharat.in',
        'X-Title': 'Samachar Bharat AI System',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    if (!response.ok) {
      const errText = await response.text();
      const err = new Error(`OpenRouter streaming HTTP ${response.status}: ${errText}`);
      (err as any).status = response.status;
      throw err;
    }

    if (!response.body) {
      throw new Error('No readable response stream returned from OpenRouter');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(':')) continue;
        if (trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta?.content || '';
            if (delta) {
              fullText += delta;
              onChunk(delta);
            }
          } catch {
            // non-json keepalive or fragment
          }
        }
      }
    }

    AICircuitBreaker.recordSuccess('openrouter');
    return {
      fullText,
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    clearTimeout(timeoutTimer);
    const classified = classifyAIError(error);
    AICircuitBreaker.recordFailure('openrouter', classified.category as any);
    throw error;
  }
}
