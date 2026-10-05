export type AITaskType =
  | 'chat'
  | 'general-question'
  | 'article-generation'
  | 'article-rewrite'
  | 'headline'
  | 'summarization'
  | 'tldr'
  | 'seo-tags'
  | 'suggest-category'
  | 'translation'
  | 'fact-check'
  | 'web-story'
  | 'whatsapp-ingest'
  | 'dpivs-vision'
  | 'dpivs-text-parse'
  | 'structured-json';

export type AIProviderName = 'gemini' | 'openrouter';

export type AIProviderStatus =
  | 'available'
  | 'rate-limited'
  | 'quota-exhausted'
  | 'degraded'
  | 'unavailable';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
}

export interface AIRequestOptions {
  task: AITaskType;
  prompt?: string;
  systemPrompt?: string;
  messages?: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonOutput?: boolean;
  images?: string[];
  stream?: boolean;
  timeoutMs?: number;
}

export interface AIResponse {
  text: string;
  json?: any;
  provider: AIProviderName;
  model: string;
  latencyMs: number;
  fallbackUsed: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface TaskModelConfig {
  task: AITaskType;
  primaryProvider: AIProviderName;
  primaryModel: string;
  fallbackProvider: AIProviderName;
  fallbackModel: string;
  defaultTemperature: number;
  defaultTimeoutMs: number;
  maxTokens?: number;
}
