'use strict';

const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * FACT Event Bus
 *
 * In-process event bus for decoupled module communication.
 * For distributed scenarios, replace with Redis Pub/Sub or a message broker.
 *
 * Usage:
 *   eventBus.publish(EVENT_TYPES.BILLING.INVOICE_FINALIZED, { invoiceId, tenantId, amount });
 *   eventBus.subscribe(EVENT_TYPES.BILLING.INVOICE_FINALIZED, async (payload) => { ... });
 */

class FactEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100); // Many modules may listen to the same event
    this._subscriptions = new Map(); // Track subscription count per event
  }

  /**
   * Publish an event to all subscribers.
   *
   * @param {string} eventType - Event type constant from eventTypes.js
   * @param {Object} payload - Event data
   * @param {Object} [options]
   * @param {boolean} [options.async=true] - Fire handlers asynchronously
   */
  publish(eventType, payload, options = {}) {
    const { async: isAsync = true } = options;

    const enrichedPayload = {
      ...payload,
      _eventType: eventType,
      _timestamp: new Date().toISOString(),
      _eventId: require('uuid').v4(),
    };

    logger.debug('Event published', {
      eventType,
      tenantId: payload.tenantId,
      eventId: enrichedPayload._eventId,
    });

    if (isAsync) {
      setImmediate(() => {
        try {
          this.emit(eventType, enrichedPayload);
        } catch (err) {
          logger.error('Event handler error', { eventType, error: err.message });
        }
      });
    } else {
      this.emit(eventType, enrichedPayload);
    }

    return enrichedPayload._eventId;
  }

  /**
   * Subscribe to an event type.
   *
   * @param {string} eventType
   * @param {Function} handler - async (payload) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventType, handler) {
    const wrappedHandler = async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        logger.error('Event subscription handler failed', {
          eventType,
          error: err.message,
          stack: err.stack,
        });
      }
    };

    this.on(eventType, wrappedHandler);

    const count = (this._subscriptions.get(eventType) || 0) + 1;
    this._subscriptions.set(eventType, count);

    logger.debug('Event subscription added', { eventType, totalSubscribers: count });

    // Return unsubscribe function
    return () => {
      this.off(eventType, wrappedHandler);
      const newCount = (this._subscriptions.get(eventType) || 1) - 1;
      this._subscriptions.set(eventType, newCount);
    };
  }

  /**
   * Subscribe to an event, handle it only once.
   */
  subscribeOnce(eventType, handler) {
    this.once(eventType, async (payload) => {
      try {
        await handler(payload);
      } catch (err) {
        logger.error('Once-event handler failed', { eventType, error: err.message });
      }
    });
  }

  /**
   * Get subscription statistics.
   */
  getStats() {
    const stats = {};
    for (const [eventType, count] of this._subscriptions.entries()) {
      stats[eventType] = count;
    }
    return stats;
  }

  /**
   * Remove all subscribers for an event type.
   */
  clearSubscriptions(eventType) {
    if (eventType) {
      this.removeAllListeners(eventType);
      this._subscriptions.delete(eventType);
    } else {
      this.removeAllListeners();
      this._subscriptions.clear();
    }
  }
}

// Singleton instance
const eventBus = new FactEventBus();

module.exports = { eventBus };
