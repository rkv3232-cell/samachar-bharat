export type AIErrorCategory =
  | 'quota'
  | 'rate_limit'
  | 'timeout'
  | 'unavailable'
  | 'auth'
  | 'safety'
  | 'invalid_input'
  | 'other';

export interface ClassifiedAIError {
  category: AIErrorCategory;
  isRecoverable: boolean;
  userMessage: string;
  originalMessage: string;
  statusCode: number;
}

export class AIException extends Error {
  category: AIErrorCategory;
  isRecoverable: boolean;
  statusCode: number;

  constructor(classified: ClassifiedAIError) {
    super(classified.userMessage);
    this.name = 'AIException';
    this.category = classified.category;
    this.isRecoverable = classified.isRecoverable;
    this.statusCode = classified.statusCode;
  }
}

export function classifyAIError(error: any): ClassifiedAIError {
  const message = error?.message || String(error || '');
  const status = error?.status || error?.statusCode || 500;
  const lowerMsg = message.toLowerCase();

  // 1. Quota / Token Limits
  if (
    status === 429 ||
    lowerMsg.includes('resource_exhausted') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('credit') ||
    lowerMsg.includes('insufficient_quota') ||
    lowerMsg.includes('exceeded your current quota')
  ) {
    return {
      category: 'quota',
      isRecoverable: true,
      statusCode: 429,
      originalMessage: message,
      userMessage: 'AI सेवा वर्तमान में अत्यधिक व्यस्त है। वैकल्पिक प्रदाता पर स्विच किया जा रहा है...',
    };
  }

  // 2. Rate Limits
  if (lowerMsg.includes('rate_limit') || lowerMsg.includes('too many requests')) {
    return {
      category: 'rate_limit',
      isRecoverable: true,
      statusCode: 429,
      originalMessage: message,
      userMessage: 'अनुरोध दर सीमित है। कृपया एक क्षण प्रतीक्षा करें...',
    };
  }

  // 3. Timeout
  if (
    error?.name === 'AbortError' ||
    lowerMsg.includes('aborted') ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('etimedout') ||
    lowerMsg.includes('deadline_exceeded')
  ) {
    return {
      category: 'timeout',
      isRecoverable: true,
      statusCode: 504,
      originalMessage: message,
      userMessage: 'AI अनुरोध समय समाप्त (Timeout) हो गया। पुनः प्रयास किया जा रहा है...',
    };
  }

  // 4. Model / Service Unavailable
  if (
    status === 502 ||
    status === 503 ||
    status === 504 ||
    lowerMsg.includes('unavailable') ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('no endpoints found') ||
    lowerMsg.includes('not found') ||
    status === 404
  ) {
    return {
      category: 'unavailable',
      isRecoverable: true,
      statusCode: 503,
      originalMessage: message,
      userMessage: 'AI मॉडल अस्थायी रूप से अनुपलब्ध है। बैकअप मॉडल का उपयोग किया जा रहा है...',
    };
  }

  // 5. Safety Rejection
  if (
    lowerMsg.includes('safety') ||
    lowerMsg.includes('blocked') ||
    lowerMsg.includes('violates') ||
    lowerMsg.includes('content moderation')
  ) {
    return {
      category: 'safety',
      isRecoverable: false,
      statusCode: 400,
      originalMessage: message,
      userMessage: 'सुरक्षा नीति के तहत इस अनुरोध का उत्तर नहीं दिया जा सकता।',
    };
  }

  // 6. Invalid Input
  if (
    status === 400 &&
    (lowerMsg.includes('invalid') || lowerMsg.includes('missing') || lowerMsg.includes('empty'))
  ) {
    return {
      category: 'invalid_input',
      isRecoverable: false,
      statusCode: 400,
      originalMessage: message,
      userMessage: 'अमान्य इनपुट। कृपया सही विवरण दर्ज करें।',
    };
  }

  // 7. Authentication
  if (status === 401 || status === 403 || lowerMsg.includes('api_key') || lowerMsg.includes('unauthenticated')) {
    return {
      category: 'auth',
      isRecoverable: true, // can try fallback provider if primary key has an issue
      statusCode: 401,
      originalMessage: message,
      userMessage: 'AI प्रमाणन त्रुटि। बैकअप प्रदाता आज़माया जा रहा है...',
    };
  }

  // Default
  return {
    category: 'other',
    isRecoverable: true,
    statusCode: status >= 400 && status < 600 ? status : 500,
    originalMessage: message,
    userMessage: 'AI सेवा से संपर्क करने में समस्या आई।',
  };
}
