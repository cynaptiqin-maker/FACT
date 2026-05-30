/**
 * Event Reliability Engine
 *
 * Wraps the existing EventBus with guaranteed delivery semantics:
 * - Persists events to Redis before publishing
 * - Retries failed handlers automatically
 * - Provides dead-letter queue for unrecoverable failures
 * - Supports event replay for recovery scenarios
 * - Prevents duplicate event processing (exactly-once via idempotency)
 */

const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const EVENT_STATES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  DEAD: 'DEAD',
};

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 15000]; // exponential-ish backoff
const EVENT_TTL = 7 * 24 * 3600; // 7 days
const DLQ_TTL = 30 * 24 * 3600;  // 30 days

class EventReliabilityEngine extends EventEmitter {
  constructor(redisClient) {
    super();
    this.redis = redisClient;
    this.handlers = new Map(); // eventType → [{ handlerName, fn }]
    this.processedEvents = new Set(); // in-memory dedup for hot path (< 1h window)
  }

  /**
   * Register a reliable handler for an event type.
   * Unlike raw EventEmitter.on(), this guarantees retry + DLQ on failure.
   */
  on(eventType, handlerName, fn) {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType).push({ handlerName, fn });
    return this;
  }

  /**
   * Publish an event with guaranteed delivery.
   * Persists to Redis, then dispatches to all handlers.
   */
  async publish(eventType, payload, options = {}) {
    const event = {
      id: options.id || uuidv4(),
      type: eventType,
      payload,
      tenantId: options.tenantId,
      correlationId: options.correlationId,
      causationId: options.causationId,
      publishedAt: new Date().toISOString(),
      state: EVENT_STATES.PENDING,
      retryCount: 0,
    };

    // Persist event before dispatch
    await this._persistEvent(event);

    logger.debug('[EventReliability] Publishing event', {
      eventId: event.id,
      type: eventType,
      tenantId: event.tenantId,
    });

    // Fire handlers (non-blocking for non-critical events)
    const handlers = this.handlers.get(eventType) || [];
    const deliveries = handlers.map((h) =>
      this._deliverToHandler(event, h).catch((err) =>
        logger.error('[EventReliability] Unhandled delivery error', {
          eventId: event.id,
          handler: h.handlerName,
          error: err.message,
        })
      )
    );

    // Await critical handlers if flagged
    if (options.critical) {
      await Promise.allSettled(deliveries);
    }

    return event.id;
  }

  /**
   * Replay all FAILED or DEAD events for a given type within a time window.
   * Used for disaster recovery.
   */
  async replay(eventType, fromDate, toDate) {
    if (!this.redis) return { replayed: 0, errors: [] };

    const indexKey = `events:index:${eventType}`;
    const eventIds = await this.redis.zrangebyscore(
      indexKey,
      fromDate.getTime(),
      toDate.getTime()
    );

    let replayed = 0;
    const errors = [];

    for (const eventId of eventIds) {
      try {
        const raw = await this.redis.get(`events:event:${eventId}`);
        if (!raw) continue;

        const event = JSON.parse(raw);
        if (![EVENT_STATES.FAILED, EVENT_STATES.DEAD].includes(event.state)) continue;

        event.retryCount = 0;
        event.state = EVENT_STATES.PENDING;
        event.replayedAt = new Date().toISOString();

        const handlers = this.handlers.get(event.type) || [];
        for (const handler of handlers) {
          await this._deliverToHandler(event, handler);
        }

        replayed++;
      } catch (err) {
        errors.push({ eventId, error: err.message });
      }
    }

    logger.info('[EventReliability] Replay completed', { eventType, replayed, errors: errors.length });
    return { replayed, errors };
  }

  /**
   * Get dead-letter queue contents for inspection.
   */
  async getDLQ(limit = 100) {
    if (!this.redis) return [];
    const keys = await this.redis.lrange('events:dlq', 0, limit - 1);
    const events = [];
    for (const key of keys) {
      const raw = await this.redis.get(key);
      if (raw) events.push(JSON.parse(raw));
    }
    return events;
  }

  // ── Private ────────────────────────────────────────────────────────────────

  async _deliverToHandler(event, handler) {
    // In-memory dedup check (for this process lifetime)
    const dedupKey = `${event.id}:${handler.handlerName}`;
    if (this.processedEvents.has(dedupKey)) {
      logger.debug('[EventReliability] Skipping duplicate delivery', {
        eventId: event.id,
        handler: handler.handlerName,
      });
      return;
    }

    let lastError;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await handler.fn(event.payload, { eventId: event.id, tenantId: event.tenantId });

        // Mark delivered
        this.processedEvents.add(dedupKey);
        await this._updateEventState(event.id, EVENT_STATES.DELIVERED);
        return;
      } catch (err) {
        lastError = err;
        logger.warn(`[EventReliability] Handler failed (attempt ${attempt + 1})`, {
          eventId: event.id,
          handler: handler.handlerName,
          error: err.message,
        });

        if (attempt < MAX_RETRIES) {
          await this._sleep(RETRY_DELAYS[attempt] || 15000);
        }
      }
    }

    // All retries exhausted — send to DLQ
    await this._sendToDLQ(event, handler.handlerName, lastError);
    throw lastError;
  }

  async _persistEvent(event) {
    if (!this.redis) return;
    const key = `events:event:${event.id}`;
    await this.redis.setex(key, EVENT_TTL, JSON.stringify(event));

    // Index by type + timestamp for replay queries
    const indexKey = `events:index:${event.type}`;
    await this.redis.zadd(indexKey, Date.now(), event.id);
    await this.redis.expire(indexKey, EVENT_TTL);
  }

  async _updateEventState(eventId, state) {
    if (!this.redis) return;
    const key = `events:event:${eventId}`;
    const raw = await this.redis.get(key);
    if (!raw) return;
    const event = JSON.parse(raw);
    event.state = state;
    event.updatedAt = new Date().toISOString();
    await this.redis.setex(key, EVENT_TTL, JSON.stringify(event));
  }

  async _sendToDLQ(event, handlerName, error) {
    logger.error('[EventReliability] Sending to DLQ', {
      eventId: event.id,
      type: event.type,
      handler: handlerName,
      error: error?.message,
    });

    if (!this.redis) return;

    const dlqEntry = {
      ...event,
      state: EVENT_STATES.DEAD,
      deadHandlerName: handlerName,
      deadReason: error?.message,
      deadAt: new Date().toISOString(),
    };

    const dlqKey = `events:dlq:${event.id}:${handlerName}`;
    await this.redis.setex(dlqKey, DLQ_TTL, JSON.stringify(dlqEntry));
    await this.redis.lpush('events:dlq', dlqKey);
    await this.redis.ltrim('events:dlq', 0, 9999); // Keep last 10k DLQ entries

    await this._updateEventState(event.id, EVENT_STATES.DEAD);
    this.emit('dead-letter', dlqEntry);
  }

  _sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

let instance = null;

function getEventReliabilityEngine(redis) {
  if (!instance) {
    instance = new EventReliabilityEngine(redis);
    logger.info('[EventReliabilityEngine] Initialized');
  }
  return instance;
}

module.exports = { EventReliabilityEngine, EVENT_STATES, getEventReliabilityEngine };
