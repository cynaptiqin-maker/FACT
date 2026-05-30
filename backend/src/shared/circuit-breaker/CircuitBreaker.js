/**
 * Circuit Breaker
 *
 * Prevents cascade failures when a downstream service (DB, Redis, OpenAI,
 * external API) is degraded. States: CLOSED → OPEN → HALF_OPEN → CLOSED.
 *
 * Usage:
 *   const cb = new CircuitBreaker('OpenAI', { threshold: 5, timeout: 30_000 })
 *   const result = await cb.execute(() => openai.chat.completions.create(...))
 */

const { EventEmitter } = require('events');
const logger = require('../utils/logger');

const CB_STATE = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Failing — reject all requests
  HALF_OPEN: 'HALF_OPEN', // Probing — allow one request through
};

class CircuitBreaker extends EventEmitter {
  /**
   * @param {string} name - Service name (for logging/metrics)
   * @param {object} options
   *   threshold: number of failures before OPEN (default 5)
   *   timeout: ms to stay OPEN before probing (default 30_000)
   *   successThreshold: successes in HALF_OPEN needed to CLOSE (default 2)
   *   fallback: async fn to call when circuit is OPEN (optional)
   */
  constructor(name, options = {}) {
    super();
    this.name = name;
    this.threshold = options.threshold ?? 5;
    this.timeout = options.timeout ?? 30_000;
    this.successThreshold = options.successThreshold ?? 2;
    this.fallback = options.fallback ?? null;

    this.state = CB_STATE.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.nextAttemptTime = null;
  }

  async execute(fn) {
    if (this.state === CB_STATE.OPEN) {
      if (Date.now() < this.nextAttemptTime) {
        if (this.fallback) {
          return this.fallback();
        }
        const err = new CircuitOpenError(
          `Circuit breaker OPEN for ${this.name}. Retry after ${new Date(this.nextAttemptTime).toISOString()}`
        );
        this.emit('rejected', { name: this.name, nextAttemptTime: this.nextAttemptTime });
        throw err;
      }
      // Transition to HALF_OPEN for a probe
      this._transitionTo(CB_STATE.HALF_OPEN);
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure(err);
      throw err;
    }
  }

  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime,
    };
  }

  reset() {
    this.failureCount = 0;
    this.successCount = 0;
    this._transitionTo(CB_STATE.CLOSED);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  _onSuccess() {
    this.failureCount = 0;

    if (this.state === CB_STATE.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this._transitionTo(CB_STATE.CLOSED);
      }
    }
  }

  _onFailure(err) {
    this.failureCount += 1;
    this.lastFailureTime = new Date();

    logger.warn(`[CircuitBreaker:${this.name}] Failure recorded`, {
      failureCount: this.failureCount,
      threshold: this.threshold,
      error: err.message,
    });

    if (
      this.state === CB_STATE.CLOSED &&
      this.failureCount >= this.threshold
    ) {
      this._transitionTo(CB_STATE.OPEN);
    } else if (this.state === CB_STATE.HALF_OPEN) {
      this._transitionTo(CB_STATE.OPEN);
    }
  }

  _transitionTo(newState) {
    const previous = this.state;
    this.state = newState;

    if (newState === CB_STATE.OPEN) {
      this.nextAttemptTime = Date.now() + this.timeout;
      this.successCount = 0;
      logger.error(`[CircuitBreaker:${this.name}] OPEN — blocking requests for ${this.timeout}ms`, {
        failureCount: this.failureCount,
      });
    } else if (newState === CB_STATE.CLOSED) {
      this.failureCount = 0;
      this.successCount = 0;
      this.nextAttemptTime = null;
      logger.info(`[CircuitBreaker:${this.name}] CLOSED — normal operation resumed`);
    } else if (newState === CB_STATE.HALF_OPEN) {
      logger.info(`[CircuitBreaker:${this.name}] HALF_OPEN — probing`);
    }

    this.emit('state-change', { name: this.name, from: previous, to: newState });
  }
}

class CircuitOpenError extends Error {
  constructor(message) {
    super(message);
    this.name = 'CircuitOpenError';
    this.statusCode = 503;
    this.code = 'CIRCUIT_OPEN';
  }
}

// ─── Registry — centralized breaker management ────────────────────────────────

class CircuitBreakerRegistry {
  constructor() {
    this.breakers = new Map();
  }

  get(name, options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name);
  }

  getAll() {
    return Array.from(this.breakers.values()).map((cb) => cb.getState());
  }

  resetAll() {
    for (const cb of this.breakers.values()) cb.reset();
  }
}

const registry = new CircuitBreakerRegistry();

// Pre-register breakers for critical external dependencies
registry.get('PostgreSQL', { threshold: 10, timeout: 60_000 });
registry.get('Redis', { threshold: 10, timeout: 30_000 });
registry.get('OpenAI', {
  threshold: 5,
  timeout: 60_000,
  fallback: async () => ({ content: 'AI assistant temporarily unavailable. Please try again.' }),
});
registry.get('EmailSMTP', { threshold: 3, timeout: 30_000 });
registry.get('ExternalPaymentGateway', { threshold: 3, timeout: 60_000 });

module.exports = { CircuitBreaker, CircuitOpenError, CircuitBreakerRegistry, registry };
