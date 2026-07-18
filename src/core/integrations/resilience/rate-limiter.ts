/**
 * RATE LIMITER + CIRCUIT BREAKER
 * Controla taxa de requisições por provider/tenant
 * Implementa circuit breaker para falhas
 */

export interface RateLimitConfig {
  requestsPerSecond: number;
  burst?: number; // Permitir burst de requisições
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open',
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Quantas falhas antes de abrir
  successThreshold: number; // Quantas sucessos para fechar
  timeout: number; // Tempo em ms antes de tentar novamente (HALF_OPEN)
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map(); // [timestamp, timestamp, ...]
  private config: RateLimitConfig;
  private readonly key: string;

  constructor(key: string, config: RateLimitConfig) {
    this.key = key;
    this.config = {
      requestsPerSecond: config.requestsPerSecond,
      burst: config.burst || config.requestsPerSecond * 2,
    };
  }

  /**
   * Verificar se pode fazer requisição
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    const oneSecondAgo = now - 1000;

    // Limpar requisições antigas
    const recent = (this.requests.get(this.key) || []).filter((t) => t > oneSecondAgo);

    this.requests.set(this.key, recent);

    // Verificar limite
    if (recent.length < this.config.requestsPerSecond!) {
      recent.push(now);
      this.requests.set(this.key, recent);
      return true;
    }

    // Verificar burst
    if (recent.length < this.config.burst!) {
      const oldestRecent = Math.min(...recent);
      const timeSinceOldest = now - oldestRecent;

      if (timeSinceOldest > 100) {
        // Permitir burst se espaçado
        recent.push(now);
        this.requests.set(this.key, recent);
        return true;
      }
    }

    return false;
  }

  /**
   * Tempo de espera até próxima requisição
   */
  getWaitTime(): number {
    const recent = this.requests.get(this.key) || [];

    if (recent.length < this.config.requestsPerSecond!) {
      return 0;
    }

    const oldest = Math.min(...recent);
    const waitTime = 1000 - (Date.now() - oldest);

    return Math.max(0, waitTime);
  }

  /**
   * Reset
   */
  reset(): void {
    this.requests.delete(this.key);
  }
}

/**
 * Circuit Breaker para detectar falhas em cascata
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private config: CircuitBreakerConfig;
  private readonly key: string;

  constructor(key: string, config: CircuitBreakerConfig) {
    this.key = key;
    this.config = config;
  }

  /**
   * Registrar sucesso
   */
  recordSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;

      if (this.successCount >= this.config.successThreshold) {
        console.log(`[CircuitBreaker] Fechando circuit breaker: ${this.key}`);
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
      }
    }
  }

  /**
   * Registrar falha
   */
  recordFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        console.log(`[CircuitBreaker] Abrindo circuit breaker: ${this.key}`);
        this.state = CircuitState.OPEN;
      }
    } else if (this.state === CircuitState.HALF_OPEN) {
      console.log(`[CircuitBreaker] Reabrindo circuit breaker: ${this.key}`);
      this.state = CircuitState.OPEN;
      this.successCount = 0;
    }
  }

  /**
   * Verificar se pode fazer requisição
   */
  canMakeRequest(): boolean {
    if (this.state === CircuitState.CLOSED) {
      return true;
    }

    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;

      if (timeSinceLastFailure >= this.config.timeout) {
        console.log(`[CircuitBreaker] Testando circuit breaker: ${this.key}`);
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        return true;
      }

      return false;
    }

    // HALF_OPEN
    return true;
  }

  /**
   * Obter estado
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Reset
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

/**
 * Gerenciador de Rate Limiters e Circuit Breakers
 */
export class ResilienceManager {
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  private defaultRateLimitConfig: RateLimitConfig = {
    requestsPerSecond: 10,
    burst: 20,
  };

  private defaultCircuitBreakerConfig: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 60000, // 1 minuto
  };

  /**
   * Obter rate limiter para provider/tenant
   */
  getRateLimiter(provider: string, companyId: string): RateLimiter {
    const key = `${provider}:${companyId}`;

    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, new RateLimiter(key, this.defaultRateLimitConfig));
    }

    return this.rateLimiters.get(key)!;
  }

  /**
   * Obter circuit breaker para provider/tenant
   */
  getCircuitBreaker(provider: string, companyId: string): CircuitBreaker {
    const key = `${provider}:${companyId}`;

    if (!this.circuitBreakers.has(key)) {
      this.circuitBreakers.set(
        key,
        new CircuitBreaker(key, this.defaultCircuitBreakerConfig)
      );
    }

    return this.circuitBreakers.get(key)!;
  }

  /**
   * Executar com rate limit + circuit breaker
   */
  async execute<T>(
    provider: string,
    companyId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const rateLimiter = this.getRateLimiter(provider, companyId);
    const circuitBreaker = this.getCircuitBreaker(provider, companyId);

    // Verificar circuit breaker
    if (!circuitBreaker.canMakeRequest()) {
      const state = circuitBreaker.getState();
      throw new Error(`Circuit breaker ${state} para ${provider}/${companyId}`);
    }

    // Esperar se necessário (rate limiting)
    let waitTime = rateLimiter.getWaitTime();
    if (waitTime > 0) {
      console.log(
        `[ResilienceManager] Rate limit atingido, aguardando ${waitTime}ms para ${provider}`
      );
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    // Executar
    try {
      const result = await fn();
      circuitBreaker.recordSuccess();
      return result;
    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }
  }

  /**
   * Status
   */
  getStatus(): Record<string, any> {
    const status: Record<string, any> = {
      rateLimiters: {},
      circuitBreakers: {},
    };

    for (const [key, limiter] of this.rateLimiters) {
      status.rateLimiters[key] = {
        waitTime: limiter.getWaitTime(),
      };
    }

    for (const [key, breaker] of this.circuitBreakers) {
      status.circuitBreakers[key] = {
        state: breaker.getState(),
      };
    }

    return status;
  }

  /**
   * Reset
   */
  reset(): void {
    for (const limiter of this.rateLimiters.values()) {
      limiter.reset();
    }

    for (const breaker of this.circuitBreakers.values()) {
      breaker.reset();
    }

    console.log('[ResilienceManager] Rate limiters e circuit breakers resetados');
  }
}

let resilienceManager: ResilienceManager;

export function getResilienceManager(): ResilienceManager {
  if (!resilienceManager) {
    resilienceManager = new ResilienceManager();
  }
  return resilienceManager;
}
