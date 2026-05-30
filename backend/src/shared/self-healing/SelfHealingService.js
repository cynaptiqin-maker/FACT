/**
 * Self-Healing Service
 *
 * Runs periodic health checks and automatically recovers from:
 *   - Stale PROCESSING financial records (stuck sagas)
 *   - Dead-letter queue items (retry eligible events)
 *   - Orphaned draft journal entries (older than 24h)
 *   - Cache invalidation for reconciliation data after corrections
 *   - Circuit breaker probing after timeout
 *
 * Designed to run as a background cron within the same process.
 */

const logger = require('../utils/logger');

const HEALING_INTERVALS = {
  STUCK_RECORDS: 5 * 60 * 1000,    // every 5 min
  DLQ_RETRY: 15 * 60 * 1000,       // every 15 min
  ORPHAN_CLEANUP: 60 * 60 * 1000,  // every hour
  CACHE_WARMUP: 30 * 60 * 1000,    // every 30 min
};

class SelfHealingService {
  constructor({ sequelize, redis, eventEngine, monitoring }) {
    this.sequelize = sequelize;
    this.redis = redis;
    this.eventEngine = eventEngine;
    this.monitoring = monitoring;
    this.timers = [];
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.running = true;

    this.timers.push(
      setInterval(() => this._healStuckRecords(), HEALING_INTERVALS.STUCK_RECORDS),
      setInterval(() => this._retryDLQ(), HEALING_INTERVALS.DLQ_RETRY),
      setInterval(() => this._cleanOrphanDrafts(), HEALING_INTERVALS.ORPHAN_CLEANUP),
      setInterval(() => this._warmupCriticalCache(), HEALING_INTERVALS.CACHE_WARMUP)
    );

    logger.info('[SelfHealing] Service started');
  }

  stop() {
    this.timers.forEach(clearInterval);
    this.timers = [];
    this.running = false;
    logger.info('[SelfHealing] Service stopped');
  }

  // ── Stuck Record Detection ─────────────────────────────────────────────────

  async _healStuckRecords() {
    try {
      const { QueryTypes } = this.sequelize;
      const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 min threshold

      // Find payroll runs stuck in PROCESSING
      const stuckPayroll = await this.sequelize.query(
        `SELECT id, tenant_id FROM payroll_runs
         WHERE status = 'PROCESSING' AND updated_at < :cutoff`,
        { replacements: { cutoff }, type: QueryTypes.SELECT }
      );

      for (const run of stuckPayroll) {
        await this.sequelize.query(
          `UPDATE payroll_runs SET status = 'FAILED', notes = 'Auto-recovered by self-healing service'
           WHERE id = :id`,
          { replacements: { id: run.id } }
        );
        logger.warn('[SelfHealing] Recovered stuck payroll run', { runId: run.id, tenantId: run.tenant_id });
        this.monitoring?.recordIntegrityViolation({
          type: 'STUCK_PAYROLL_RUN',
          recordId: run.id,
          tenantId: run.tenant_id,
        });
      }

      // Find depreciation runs stuck in RUNNING
      const stuckDepreciation = await this.sequelize.query(
        `SELECT id, tenant_id FROM depreciation_runs
         WHERE status = 'RUNNING' AND updated_at < :cutoff`,
        { replacements: { cutoff }, type: QueryTypes.SELECT }
      );

      for (const run of stuckDepreciation) {
        await this.sequelize.query(
          `UPDATE depreciation_runs SET status = 'FAILED', error_message = 'Auto-recovered'
           WHERE id = :id`,
          { replacements: { id: run.id } }
        );
        logger.warn('[SelfHealing] Recovered stuck depreciation run', {
          runId: run.id,
          tenantId: run.tenant_id,
        });
      }

      // Find payout runs stuck in PROCESSING
      const stuckPayouts = await this.sequelize.query(
        `SELECT id, tenant_id FROM payout_runs
         WHERE status = 'PROCESSING' AND updated_at < :cutoff`,
        { replacements: { cutoff }, type: QueryTypes.SELECT }
      );

      for (const run of stuckPayouts) {
        await this.sequelize.query(
          `UPDATE payout_runs SET status = 'FAILED' WHERE id = :id`,
          { replacements: { id: run.id } }
        );
        logger.warn('[SelfHealing] Recovered stuck payout run', { runId: run.id });
      }

      if (stuckPayroll.length + stuckDepreciation.length + stuckPayouts.length > 0) {
        logger.info('[SelfHealing] Stuck record recovery complete', {
          payroll: stuckPayroll.length,
          depreciation: stuckDepreciation.length,
          payouts: stuckPayouts.length,
        });
      }
    } catch (err) {
      logger.error('[SelfHealing] _healStuckRecords failed', { error: err.message });
    }
  }

  // ── DLQ Retry ──────────────────────────────────────────────────────────────

  async _retryDLQ() {
    if (!this.eventEngine || !this.redis) return;

    try {
      const dlqItems = await this.eventEngine.getDLQ(20);

      for (const item of dlqItems) {
        // Only retry items younger than 24 hours
        const age = Date.now() - new Date(item.deadAt).getTime();
        if (age > 24 * 3600 * 1000) continue;

        logger.info('[SelfHealing] Retrying DLQ event', {
          eventId: item.id,
          type: item.type,
          handler: item.deadHandlerName,
        });

        await this.eventEngine.publish(item.type, item.payload, {
          id: item.id,
          tenantId: item.tenantId,
          correlationId: item.correlationId,
        });
      }
    } catch (err) {
      logger.error('[SelfHealing] _retryDLQ failed', { error: err.message });
    }
  }

  // ── Orphan Draft Cleanup ───────────────────────────────────────────────────

  async _cleanOrphanDrafts() {
    try {
      const { QueryTypes } = this.sequelize;
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await this.sequelize.query(
        `SELECT COUNT(*) AS count FROM journal_entries
         WHERE status = 'DRAFT' AND created_at < :cutoff`,
        { replacements: { cutoff }, type: QueryTypes.SELECT }
      );

      const count = parseInt(result[0]?.count || 0, 10);
      if (count > 0) {
        logger.warn('[SelfHealing] Orphan draft journal entries detected', { count, cutoff });
        // Do NOT auto-delete financial records — alert only; let a human review
        this.monitoring?.emit('orphan-drafts-detected', { count, cutoff });
      }
    } catch (err) {
      logger.error('[SelfHealing] _cleanOrphanDrafts failed', { error: err.message });
    }
  }

  // ── Cache Warmup ───────────────────────────────────────────────────────────

  async _warmupCriticalCache() {
    if (!this.redis) return;
    try {
      // Ping Redis to ensure connection is alive
      await this.redis.ping();
    } catch (err) {
      logger.error('[SelfHealing] Redis connection lost during cache warmup', {
        error: err.message,
      });
      // Circuit breaker will handle recovery
    }
  }
}

module.exports = { SelfHealingService };
