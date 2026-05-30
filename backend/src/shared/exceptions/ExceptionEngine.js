'use strict';

/**
 * ExceptionEngine — centralized financial exception management.
 *
 * Every module can raise() an exception. Exceptions are deduped by
 * (tenant_id, exception_type, entity_id) — raising the same exception twice
 * while it is OPEN is a no-op (idempotent).
 *
 * Exception lifecycle:  OPEN → ACKNOWLEDGED → RESOLVED
 *                       OPEN → DISMISSED
 *
 * @module shared/exceptions/ExceptionEngine
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

// ─── Exception Types ──────────────────────────────────────────────────────────

const EXCEPTION_TYPES = Object.freeze({
  POSTING_FAILED:      'POSTING_FAILED',
  BANK_UNMATCHED:      'BANK_UNMATCHED',
  FCRA_ADMIN_CAP:      'FCRA_ADMIN_CAP',
  MISSING_APPROVAL:    'MISSING_APPROVAL',
  DUPLICATE_INVOICE:   'DUPLICATE_INVOICE',
  BUDGET_BREACH:       'BUDGET_BREACH',
  STALE_CLAIM:         'STALE_CLAIM',
  AUDIT_EXCEPTION:     'AUDIT_EXCEPTION',
  RECON_MISMATCH:      'RECON_MISMATCH',
  PERIOD_OVERDUE:      'PERIOD_OVERDUE',
});

const SEVERITIES = Object.freeze({
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
});

const STATUSES = Object.freeze({
  OPEN:         'OPEN',
  ACKNOWLEDGED: 'ACKNOWLEDGED',
  RESOLVED:     'RESOLVED',
  DISMISSED:    'DISMISSED',
});

// ─── Default severity per exception type ──────────────────────────────────────

const DEFAULT_SEVERITY = {
  [EXCEPTION_TYPES.POSTING_FAILED]:    SEVERITIES.CRITICAL,
  [EXCEPTION_TYPES.BANK_UNMATCHED]:    SEVERITIES.MEDIUM,
  [EXCEPTION_TYPES.FCRA_ADMIN_CAP]:    SEVERITIES.HIGH,
  [EXCEPTION_TYPES.MISSING_APPROVAL]:  SEVERITIES.MEDIUM,
  [EXCEPTION_TYPES.DUPLICATE_INVOICE]: SEVERITIES.HIGH,
  [EXCEPTION_TYPES.BUDGET_BREACH]:     SEVERITIES.HIGH,
  [EXCEPTION_TYPES.STALE_CLAIM]:       SEVERITIES.MEDIUM,
  [EXCEPTION_TYPES.AUDIT_EXCEPTION]:   SEVERITIES.CRITICAL,
  [EXCEPTION_TYPES.RECON_MISMATCH]:    SEVERITIES.HIGH,
  [EXCEPTION_TYPES.PERIOD_OVERDUE]:    SEVERITIES.MEDIUM,
};

// ─── Engine ───────────────────────────────────────────────────────────────────

class ExceptionEngine {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.qt = sequelize.QueryTypes;
  }

  /**
   * Raise a financial exception (idempotent — duplicate OPEN exceptions are skipped).
   *
   * @param {Object} params
   * @param {string} params.tenantId
   * @param {string} params.exceptionType   One of EXCEPTION_TYPES
   * @param {string} [params.severity]      Defaults based on type
   * @param {string} [params.entityType]    e.g. 'patient_invoice'
   * @param {string} [params.entityId]      UUID of the affected entity
   * @param {string} [params.sourceModule]
   * @param {string} params.title
   * @param {string} [params.description]
   * @param {Object} [params.metadata]
   * @param {string} [params.raisedBy]      defaults to 'SYSTEM'
   * @returns {Promise<string|null>}  ID of the exception, or null if deduped
   */
  async raise({
    tenantId,
    exceptionType,
    severity,
    entityType,
    entityId,
    sourceModule,
    title,
    description,
    metadata,
    raisedBy = 'SYSTEM',
  }) {
    if (!EXCEPTION_TYPES[exceptionType]) {
      logger.warn('ExceptionEngine.raise: unknown exception type', { exceptionType });
    }

    const resolvedSeverity = severity || DEFAULT_SEVERITY[exceptionType] || SEVERITIES.MEDIUM;
    const id = uuidv4();

    try {
      // Upsert — skip if an OPEN exception for same type+entity already exists
      const [result] = await this.sequelize.query(
        `INSERT INTO financial_exceptions (
           id, tenant_id, exception_type, severity, status,
           entity_type, entity_id, source_module,
           title, description, metadata,
           raised_by, created_at, updated_at
         ) VALUES (
           :id, :tenantId, :exceptionType, :severity, 'OPEN',
           :entityType, :entityId, :sourceModule,
           :title, :description, :metadata,
           :raisedBy, NOW(), NOW()
         )
         ON CONFLICT (dedup_key) WHERE status = 'OPEN'
         DO NOTHING
         RETURNING id`,
        {
          replacements: {
            id,
            tenantId,
            exceptionType,
            severity: resolvedSeverity,
            entityType: entityType || null,
            entityId: entityId || null,
            sourceModule: sourceModule || null,
            title,
            description: description || null,
            metadata: metadata ? JSON.stringify(metadata) : null,
            raisedBy,
          },
          type: this.qt.INSERT,
        }
      );

      const inserted = Array.isArray(result) ? result[0] : null;
      if (inserted?.id) {
        logger.info('ExceptionEngine: exception raised', {
          id: inserted.id, exceptionType, severity: resolvedSeverity, tenantId,
        });
        return inserted.id;
      }

      // Deduped — already have an OPEN exception
      return null;
    } catch (err) {
      logger.error('ExceptionEngine.raise failed', { error: err.message, exceptionType, tenantId });
      return null;
    }
  }

  /**
   * Acknowledge an exception.
   */
  async acknowledge(id, tenantId, userId) {
    const [updated] = await this.sequelize.query(
      `UPDATE financial_exceptions
       SET status = 'ACKNOWLEDGED', acknowledged_by = :userId, acknowledged_at = NOW(), updated_at = NOW()
       WHERE id = :id AND tenant_id = :tenantId AND status = 'OPEN'
       RETURNING id`,
      { replacements: { id, tenantId, userId }, type: this.qt.UPDATE }
    );
    return updated?.[0] || null;
  }

  /**
   * Resolve an exception with a note.
   */
  async resolve(id, tenantId, userId, resolutionNote) {
    const [updated] = await this.sequelize.query(
      `UPDATE financial_exceptions
       SET status = 'RESOLVED',
           resolved_by = :userId,
           resolved_at = NOW(),
           resolution_note = :note,
           updated_at = NOW()
       WHERE id = :id AND tenant_id = :tenantId AND status IN ('OPEN', 'ACKNOWLEDGED')
       RETURNING id`,
      { replacements: { id, tenantId, userId, note: resolutionNote || null }, type: this.qt.UPDATE }
    );

    const row = Array.isArray(updated) ? updated[0] : null;
    if (row?.id) {
      // Auto-clear the dedup slot so a fresh exception can be raised later
      logger.info('ExceptionEngine: exception resolved', { id, tenantId, userId });
    }
    return row;
  }

  /**
   * Dismiss an exception with a reason.
   */
  async dismiss(id, tenantId, userId, reason) {
    const [updated] = await this.sequelize.query(
      `UPDATE financial_exceptions
       SET status = 'DISMISSED',
           dismissed_by = :userId,
           dismissed_at = NOW(),
           dismiss_reason = :reason,
           updated_at = NOW()
       WHERE id = :id AND tenant_id = :tenantId AND status IN ('OPEN', 'ACKNOWLEDGED')
       RETURNING id`,
      { replacements: { id, tenantId, userId, reason: reason || null }, type: this.qt.UPDATE }
    );
    return Array.isArray(updated) ? updated[0] : null;
  }

  /**
   * Query exceptions with filters and pagination.
   */
  async query(tenantId, filters = {}, pagination = {}) {
    const { status, exceptionType, severity, search } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = ['tenant_id = :tenantId'];
    const replacements = { tenantId, limit, offset };

    if (status) { conditions.push('status = :status'); replacements.status = status; }
    if (exceptionType) { conditions.push('exception_type = :exceptionType'); replacements.exceptionType = exceptionType; }
    if (severity) { conditions.push('severity = :severity'); replacements.severity = severity; }
    if (search) {
      conditions.push('(title ILIKE :search OR description ILIKE :search)');
      replacements.search = `%${search}%`;
    }

    const where = conditions.join(' AND ');

    const [rows, countResult] = await Promise.all([
      this.sequelize.query(
        `SELECT id, exception_type, severity, status,
                entity_type, entity_id, source_module,
                title, description, metadata,
                raised_by, acknowledged_by, acknowledged_at,
                resolved_by, resolved_at, resolution_note,
                dismissed_by, dismissed_at, dismiss_reason,
                created_at, updated_at
         FROM financial_exceptions
         WHERE ${where}
         ORDER BY
           CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
           created_at DESC
         LIMIT :limit OFFSET :offset`,
        { replacements, type: this.qt.SELECT }
      ),
      this.sequelize.query(
        `SELECT COUNT(*) AS total FROM financial_exceptions WHERE ${where}`,
        { replacements, type: this.qt.SELECT }
      ),
    ]);

    return {
      data: rows,
      total: parseInt(countResult[0]?.total || 0, 10),
      page,
      limit,
    };
  }

  /**
   * Stats for the inbox header cards.
   */
  async getStats(tenantId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [rows] = await this.sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'OPEN')                                     AS open,
         COUNT(*) FILTER (WHERE status = 'OPEN'   AND severity = 'CRITICAL')          AS critical,
         COUNT(*) FILTER (WHERE status = 'ACKNOWLEDGED')                              AS acknowledged,
         COUNT(*) FILTER (WHERE status = 'RESOLVED' AND resolved_at >= :today)        AS resolved_today,
         COUNT(*) FILTER (WHERE status = 'OPEN' AND exception_type = 'POSTING_FAILED') AS posting_failed,
         COUNT(*) FILTER (WHERE status = 'OPEN' AND exception_type = 'FCRA_ADMIN_CAP') AS fcra_cap,
         COUNT(*) FILTER (WHERE status = 'OPEN' AND exception_type = 'RECON_MISMATCH') AS recon_mismatch
       FROM financial_exceptions
       WHERE tenant_id = :tenantId`,
      { replacements: { tenantId, today }, type: this.qt.SELECT }
    );

    return rows[0] || {};
  }

  /**
   * Auto-detect stale claims and raise exceptions.
   * Called by SelfHealingService or a scheduled job.
   */
  async detectStaleClaims(tenantId, staleDays = 30) {
    const [claims] = await this.sequelize.query(
      `SELECT id, claim_number, claimed_amount, submitted_at
       FROM claims
       WHERE tenant_id = :tenantId
         AND status IN ('SUBMITTED', 'PENDING', 'UNDER_REVIEW')
         AND submitted_at < NOW() - INTERVAL '${staleDays} days'`,
      { replacements: { tenantId }, type: this.qt.SELECT }
    );

    for (const claim of claims) {
      await this.raise({
        tenantId,
        exceptionType: EXCEPTION_TYPES.STALE_CLAIM,
        entityType: 'claim',
        entityId: claim.id,
        sourceModule: 'insurance-tpa',
        title: `Stale claim: ${claim.claim_number}`,
        description: `Claim submitted ${staleDays}+ days ago with no settlement`,
        metadata: { claimNumber: claim.claim_number, amount: claim.claimed_amount, submittedAt: claim.submitted_at },
      });
    }

    return claims.length;
  }

  /**
   * Raise exception when a posting fails — call from catch blocks in services.
   */
  async raisePostingFailed(tenantId, { sourceModule, sourceId, error }) {
    return this.raise({
      tenantId,
      exceptionType: EXCEPTION_TYPES.POSTING_FAILED,
      entityType: sourceModule,
      entityId: sourceId,
      sourceModule,
      title: `GL posting failed: ${sourceModule}`,
      description: error,
      metadata: { sourceId, error },
    });
  }

  /**
   * Raise exception when FCRA admin cap is approaching or breached.
   */
  async raiseFCRAAdminCap(tenantId, { registrationId, currentPct, threshold }) {
    const isBreached = currentPct >= 20;
    return this.raise({
      tenantId,
      exceptionType: EXCEPTION_TYPES.FCRA_ADMIN_CAP,
      severity: isBreached ? SEVERITIES.CRITICAL : SEVERITIES.HIGH,
      entityType: 'fcra_registration',
      entityId: registrationId,
      sourceModule: 'fcra',
      title: isBreached
        ? `FCRA admin cap BREACHED at ${currentPct.toFixed(1)}%`
        : `FCRA admin cap warning: ${currentPct.toFixed(1)}% (limit 20%)`,
      description: `Current admin expense ratio: ${currentPct.toFixed(2)}%. Regulatory limit: 20%.`,
      metadata: { currentPct, threshold, registrationId },
    });
  }

  /**
   * Raise reconciliation mismatch exception.
   */
  async raiseReconMismatch(tenantId, { reconType, variance, period }) {
    return this.raise({
      tenantId,
      exceptionType: EXCEPTION_TYPES.RECON_MISMATCH,
      sourceModule: 'reconciliation',
      title: `Reconciliation mismatch: ${reconType} for ${period}`,
      description: `Variance of ₹${variance} detected between ${reconType} and GL.`,
      metadata: { reconType, variance, period },
    });
  }
}

// ─── Singleton factory ─────────────────────────────────────────────────────────

let _instance = null;

function getExceptionEngine() {
  if (!_instance) {
    const { sequelize } = require('../../config/database');
    _instance = new ExceptionEngine(sequelize);
  }
  return _instance;
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  ExceptionEngine,
  getExceptionEngine,
  EXCEPTION_TYPES,
  SEVERITIES,
  STATUSES,
};
