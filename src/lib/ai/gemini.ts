import { AIMessage, AIRequestOptions, AIResponse } from './types';
import { AICircuitBreaker } from './circuit-breaker';
import { classifyAIError } from './errors';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Converts AIMessage[] into Gemini API content format
 */
function buildGeminiContents(
  messages: AIMessage[] = [],
  prompt?: string,
  images?: string[]
): { systemInstruction?: { parts: [{ text: string }] }; contents: Array<{ role: string; parts: Array<any> }> } {
  let systemInstructionText = '';
  const contents: Array<{ role: string; parts: Array<any> }> = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemInstructionText += (systemInstructionText ? '\n\n' : '') + String(msg.content);
    } else {
      const role = msg.role === 'assistant' ? 'model' : 'user';
      if (typeof msg.content === 'string') {
        contents.push({
          role,
          parts: [{ text: msg.content }],
        });
      } else if (Array.isArray(msg.content)) {
        const parts: Array<any> = [];
        for (const item of msg.content) {
          if (item.type === 'text' && item.text) {
            parts.push({ text: item.text });
          } else if (item.type === 'image_url' && item.image_url?.url) {
            parts.push({ text: `[Attached Image URL: ${item.image_url.url}]` });
          }
        }
        if (parts.length > 0) contents.push({ role, parts });
      }
    }
  }

  // If a single prompt is passed without messages
  if (prompt && contents.length === 0) {
    const parts: Array<any> = [{ text: prompt }];
    if (images && images.length > 0) {
      images.forEach((imgUrl) => {
        parts.push({ text: `[Attached Image URL: ${imgUrl}]` });
      });
    }
    contents.push({ role: 'user', parts });
  }

  return {
    systemInstruction: systemInstructionText ? { parts: [{ text: systemInstructionText }] } : undefined,
    contents: contents.length > 0 ? contents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
  };
}

/**
 * Execute Gemini request
 */
export async function callGemini(
  model: string,
  options: AIRequestOptions,
  timeoutMs: number
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const startTime = Date.now();
  const { systemInstruction, contents } = buildGeminiContents(
    options.messages,
    options.prompt,
    options.images
  );

  const generationConfig: Record<string, any> = {
    temperature: options.temperature ?? 0.5,
  };

  if (options.maxTokens) {
    generationConfig.maxOutputTokens = options.maxTokens;
  }

  if (options.jsonOutput) {
    generationConfig.responseMimeType = 'application/json';
  }

  const requestBody: Record<string, any> = {
    contents,
    generationConfig,
  };

  if (options.systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  } else if (systemInstruction) {
    requestBody.systemInstruction = systemInstruction;
  }

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_BASE_URL}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timeoutTimer);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(
        errorData?.error?.message || `Gemini API returned HTTP ${response.status}`
      );
      (err as any).status = response.status;
      (err as any).code = errorData?.error?.code || response.status;
      throw err;
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      if (candidate?.finishReason === 'SAFETY') {
        const safetyErr = new Error('Content blocked by Gemini safety policy');
        (safetyErr as any).status = 400;
        throw safetyErr;
      }
      throw new Error('Empty response received from Gemini');
    }

    const text = candidate.content.parts[0].text;
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

    AICircuitBreaker.recordSuccess('gemini');

    return {
      text,
      json: parsedJson,
      provider: 'gemini',
      model,
      latencyMs,
      fallbackUsed: false,
      usage: data.usageMetadata
        ? {
            promptTokens: data.usageMetadata.promptTokenCount,
            completionTokens: data.usageMetadata.candidatesTokenCount,
            totalTokens: data.usageMetadata.totalTokenCount,
          }
        : undefined,
    };
  } catch (error: any) {
    clearTimeout(timeoutTimer);
    const classified = classifyAIError(error);
    AICircuitBreaker.recordFailure('gemini', classified.category as any);
    throw error;
  }
}

/**
 * Gemini SSE Streaming
 * Streams chunks from Gemini: :streamGenerateContent?alt=sse
 */
export async function streamGemini(
  model: string,
  options: AIRequestOptions,
  timeoutMs: number,
  onChunk: (text: string) => void
): Promise<{ fullText: string; latencyMs: number }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env.local');
  }

  const startTime = Date.now();
  const { systemInstruction, contents } = buildGeminiContents(
    options.messages,
    options.prompt,
    options.images
  );

  const generationConfig: Record<string, any> = {
    temperature: options.temperature ?? 0.5,
  };

  if (options.maxTokens) {
    generationConfig.maxOutputTokens = options.maxTokens;
  }

  const requestBody: Record<string, any> = {
    contents,
    generationConfig,
  };

  if (options.systemPrompt) {
    requestBody.systemInstruction = {
      parts: [{ text: options.systemPrompt }],
    };
  } else if (systemInstruction) {
    requestBody.systemInstruction = systemInstruction;
  }

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutTimer);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const err = new Error(
        errorData?.error?.message || `Gemini stream returned HTTP ${response.status}`
      );
      (err as any).status = response.status;
      throw err;
    }

    if (!response.body) {
      throw new Error('No readable response stream returned from Gemini');
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
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        try {
          const parsed = JSON.parse(trimmed.slice(6));
          const delta = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (delta) {
            fullText += delta;
            onChunk(delta);
          }
        } catch {
          // ignore incomplete json chunk fragments
        }
      }
    }

    AICircuitBreaker.recordSuccess('gemini');
    return {
      fullText,
      latencyMs: Date.now() - startTime,
    };
  } catch (error: any) {
    clearTimeout(timeoutTimer);
    const classified = classifyAIError(error);
    AICircuitBreaker.recordFailure('gemini', classified.category as any);
    throw error;
  }
}
