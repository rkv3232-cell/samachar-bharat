import { AIProviderName, AIProviderStatus } from './types';

interface ProviderHealth {
  status: AIProviderStatus;
  consecutiveFailures: number;
  lastFailureTime?: number;
  cooldownUntil?: number;
  totalRequests: number;
  successfulRequests: number;
  fallbackCount: number;
}

const healthState: Record<AIProviderName, ProviderHealth> = {
  gemini: {
    status: 'available',
    consecutiveFailures: 0,
    totalRequests: 0,
    successfulRequests: 0,
    fallbackCount: 0,
  },
  openrouter: {
    status: 'available',
    consecutiveFailures: 0,
    totalRequests: 0,
    successfulRequests: 0,
    fallbackCount: 0,
  },
};

// Default cooldown times in milliseconds
const COOLDOWN_RATE_LIMIT = 45000; // 45 seconds on rate limit
const COOLDOWN_QUOTA = 60000; // 60 seconds on quota exhausted
const COOLDOWN_UNAVAILABLE = 30000; // 30 seconds on 503 / network failure

export class AICircuitBreaker {
  /**
   * Checks whether the specified provider is currently healthy to handle requests.
   * If in cooldown, automatically skips waiting and suggests fallback.
   */
  static isProviderAvailable(provider: AIProviderName): boolean {
    const health = healthState[provider];
    if (!health) return true;

    if (health.cooldownUntil && Date.now() < health.cooldownUntil) {
      // Still in cooldown
      return false;
    }

    // Cooldown expired, allow trial request
    if (health.cooldownUntil && Date.now() >= health.cooldownUntil) {
      health.cooldownUntil = undefined;
      health.status = 'available';
    }

    return health.status === 'available' || health.status === 'degraded';
  }

  /**
   * Records a successful request, resetting failure counts
   */
  static recordSuccess(provider: AIProviderName): void {
    const health = healthState[provider];
    if (!health) return;

    health.totalRequests++;
    health.successfulRequests++;
    health.consecutiveFailures = 0;
    health.status = 'available';
    health.cooldownUntil = undefined;
  }

  /**
   * Records an error and decides whether to trip the circuit breaker into cooldown
   */
  static recordFailure(
    provider: AIProviderName,
    errorType: 'quota' | 'rate_limit' | 'timeout' | 'unavailable' | 'auth' | 'other'
  ): void {
    const health = healthState[provider];
    if (!health) return;

    health.totalRequests++;
    health.consecutiveFailures++;
    health.lastFailureTime = Date.now();

    if (errorType === 'quota') {
      health.status = 'quota-exhausted';
      health.cooldownUntil = Date.now() + COOLDOWN_QUOTA;
      console.warn(`[AI CircuitBreaker] ${provider} quota exhausted. Cooldown active for ${COOLDOWN_QUOTA / 1000}s.`);
    } else if (errorType === 'rate_limit') {
      health.status = 'rate-limited';
      health.cooldownUntil = Date.now() + COOLDOWN_RATE_LIMIT;
      console.warn(`[AI CircuitBreaker] ${provider} rate limited. Cooldown active for ${COOLDOWN_RATE_LIMIT / 1000}s.`);
    } else if (errorType === 'unavailable' || errorType === 'timeout') {
      if (health.consecutiveFailures >= 2) {
        health.status = 'unavailable';
        health.cooldownUntil = Date.now() + COOLDOWN_UNAVAILABLE;
        console.warn(`[AI CircuitBreaker] ${provider} unavailable after ${health.consecutiveFailures} consecutive failures.`);
      } else {
        health.status = 'degraded';
      }
    }
  }

  /**
   * Increment fallback count
   */
  static recordFallback(fromProvider: AIProviderName, toProvider: AIProviderName): void {
    const health = healthState[fromProvider];
    if (health) health.fallbackCount++;
    console.info(`[AI CircuitBreaker] Switched from ${fromProvider} to fallback ${toProvider}`);
  }

  /**
   * Get telemetry summary for observability (safe, non-sensitive)
   */
  static getHealthSummary() {
    return {
      gemini: {
        status: healthState.gemini.status,
        inCooldown: !!(healthState.gemini.cooldownUntil && Date.now() < healthState.gemini.cooldownUntil),
        consecutiveFailures: healthState.gemini.consecutiveFailures,
        totalRequests: healthState.gemini.totalRequests,
        successes: healthState.gemini.successfulRequests,
        fallbacks: healthState.gemini.fallbackCount,
      },
      openrouter: {
        status: healthState.openrouter.status,
        inCooldown: !!(healthState.openrouter.cooldownUntil && Date.now() < healthState.openrouter.cooldownUntil),
        consecutiveFailures: healthState.openrouter.consecutiveFailures,
        totalRequests: healthState.openrouter.totalRequests,
        successes: healthState.openrouter.successfulRequests,
      },
    };
  }
}
