'use strict';

const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../config/database');
const logger = require('../utils/logger');

/**
 * Immutable Audit Logger
 *
 * All financial events and data changes are recorded in append-only audit_logs table.
 * PostgreSQL RLS ensures no UPDATE/DELETE is possible from application role.
 *
 * Audit records capture:
 * - WHO: userId, userEmail, userRole
 * - WHAT: entity type, entity id, action
 * - WHEN: timestamp with timezone
 * - WHERE: IP address, user agent
 * - CHANGE: before/after JSON snapshots
 */

const AUDIT_ACTIONS = {
  // Auth events
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_VERIFIED: 'MFA_VERIFIED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET: 'PASSWORD_RESET',

  // Entity CRUD
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  RESTORE: 'RESTORE',

  // Financial actions
  JOURNAL_POSTED: 'JOURNAL_POSTED',
  JOURNAL_REVERSED: 'JOURNAL_REVERSED',
  JOURNAL_CANCELLED: 'JOURNAL_CANCELLED',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_MADE: 'PAYMENT_MADE',
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_CANCELLED: 'INVOICE_CANCELLED',
  CLAIM_SUBMITTED: 'CLAIM_SUBMITTED',
  CLAIM_SETTLED: 'CLAIM_SETTLED',
  PERIOD_LOCKED: 'PERIOD_LOCKED',
  PERIOD_UNLOCKED: 'PERIOD_UNLOCKED',
  FISCAL_YEAR_CLOSED: 'FISCAL_YEAR_CLOSED',
  REPORT_EXPORTED: 'REPORT_EXPORTED',

  // Workflow
  WORKFLOW_APPROVED: 'WORKFLOW_APPROVED',
  WORKFLOW_REJECTED: 'WORKFLOW_REJECTED',
  WORKFLOW_ESCALATED: 'WORKFLOW_ESCALATED',

  // Reconciliation
  RECON_MATCHED:   'RECON_MATCHED',
  RECON_UNMATCHED: 'RECON_UNMATCHED',
  RECON_DISPUTED:  'RECON_DISPUTED',

  // Sensitive admin
  EXPORT_SENSITIVE: 'EXPORT_SENSITIVE',
  FIELD_DECRYPTED:  'FIELD_DECRYPTED',

  // FCRA
  FCRA_RECEIPT_VERIFIED:      'FCRA_RECEIPT_VERIFIED',
  FCRA_UTILISATION_APPROVED:  'FCRA_UTILISATION_APPROVED',
  FCRA_UTILISATION_REJECTED:  'FCRA_UTILISATION_REJECTED',
  FCRA_ASSET_CREATED:         'FCRA_ASSET_CREATED',
  FCRA_ASSET_DISPOSED:        'FCRA_ASSET_DISPOSED',
  FCRA_FC4_SUBMITTED:         'FCRA_FC4_SUBMITTED',
  FCRA_COMPLIANCE_COMPLETED:  'FCRA_COMPLIANCE_COMPLETED',
  FCRA_REGISTRATION_UPDATED:  'FCRA_REGISTRATION_UPDATED',

  // System
  MODULE_ENABLED: 'MODULE_ENABLED',
  MODULE_DISABLED: 'MODULE_DISABLED',
  CONFIG_CHANGED: 'CONFIG_CHANGED',
  USER_CREATED: 'USER_CREATED',
  USER_DEACTIVATED: 'USER_DEACTIVATED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
};

/**
 * Log an audit event.
 *
 * @param {Object} params
 * @param {string} params.tenantId
 * @param {string} params.userId - Who performed the action
 * @param {string} params.userEmail
 * @param {string} params.userRole
 * @param {string} params.action - One of AUDIT_ACTIONS
 * @param {string} params.entity - Entity type (e.g., 'JournalEntry', 'Invoice')
 * @param {string} params.entityId - Entity UUID
 * @param {Object} [params.before] - State before change
 * @param {Object} [params.after] - State after change
 * @param {string} [params.ipAddress]
 * @param {string} [params.userAgent]
 * @param {string} [params.module] - Source module
 * @param {Object} [params.metadata] - Additional context
 * @param {Object} [params.transaction] - Sequelize transaction
 * @param {boolean} [params.critical=false] - When true, re-throws on failure so the calling transaction is aborted
 * @returns {Promise<string>} Audit log ID
 */
async function logEvent({
  tenantId,
  userId,
  userEmail,
  userRole,
  action,
  entity,
  entityId,
  before = null,
  after = null,
  ipAddress = null,
  userAgent = null,
  module: sourceModule = null,
  metadata = null,
  transaction,
  critical = false,
}) {
  const id = uuidv4();

  try {
    await sequelize.query(
      `INSERT INTO audit_logs (
        id, tenant_id, user_id, user_email, user_role,
        action, entity_type, entity_id,
        before_state, after_state,
        ip_address, user_agent,
        source_module, metadata,
        created_at
      ) VALUES (
        :id, :tenantId, :userId, :userEmail, :userRole,
        :action, :entity, :entityId,
        :before, :after,
        :ipAddress, :userAgent,
        :sourceModule, :metadata,
        NOW()
      )`,
      {
        replacements: {
          id,
          tenantId: tenantId || null,
          userId: userId || null,
          userEmail: userEmail || null,
          userRole: userRole || null,
          action,
          entity,
          entityId: entityId || null,
          before: before ? JSON.stringify(before) : null,
          after: after ? JSON.stringify(after) : null,
          ipAddress,
          userAgent: userAgent ? userAgent.substring(0, 500) : null,
          sourceModule,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
        transaction,
      }
    );

    return id;
  } catch (err) {
    if (critical) {
      // Critical audit failure must block the transaction — re-throw so the caller aborts
      logger.error('Critical audit logging failed — transaction aborted', {
        error: err.message,
        action,
        entity,
        entityId,
        userId,
      });
      throw err;
    }
    // Non-critical: log a warning and continue without breaking the main flow
    logger.warn('Audit logging failed (non-critical)', {
      error: err.message,
      action,
      entity,
      entityId,
      userId,
    });
    return null;
  }
}

/**
 * Log multiple events in a batch.
 */
async function logBatch(events, transaction) {
  return Promise.all(events.map((event) => logEvent({ ...event, transaction })));
}

/**
 * Query audit logs with filters.
 */
async function queryAuditLogs(tenantId, filters = {}, pagination = {}) {
  const {
    userId,
    action,
    entity,
    entityId,
    dateFrom,
    dateTo,
    search,
    sourceModule,
  } = filters;
  const { page = 1, limit = 50 } = pagination;
  const offset = (page - 1) * limit;

  const conditions = ['tenant_id = :tenantId'];
  const replacements = { tenantId, limit, offset };

  if (userId) { conditions.push('user_id = :userId'); replacements.userId = userId; }
  if (action) { conditions.push('action = :action'); replacements.action = action; }
  if (entity) { conditions.push('entity_type = :entity'); replacements.entity = entity; }
  if (entityId) { conditions.push('entity_id = :entityId'); replacements.entityId = entityId; }
  if (sourceModule) { conditions.push('source_module = :sourceModule'); replacements.sourceModule = sourceModule; }
  if (dateFrom) { conditions.push('created_at >= :dateFrom'); replacements.dateFrom = new Date(dateFrom); }
  if (dateTo) { conditions.push('created_at <= :dateTo'); replacements.dateTo = new Date(dateTo); }
  if (search) {
    conditions.push('(user_email ILIKE :search OR entity_id::text ILIKE :search)');
    replacements.search = `%${search}%`;
  }

  const whereClause = conditions.join(' AND ');

  const [logs, countResult] = await Promise.all([
    sequelize.query(
      `SELECT id, user_id, user_email, user_role, action, entity_type, entity_id,
              source_module, ip_address, created_at, metadata
       FROM audit_logs
       WHERE ${whereClause}
       ORDER BY created_at DESC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COUNT(*) as total FROM audit_logs WHERE ${whereClause}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  return {
    data: logs,
    total: parseInt(countResult[0].total, 10),
    page,
    limit,
  };
}

/**
 * Get full audit trail for a specific entity.
 */
async function getEntityAuditTrail(entity, entityId, tenantId) {
  return sequelize.query(
    `SELECT id, user_id, user_email, user_role, action,
            before_state, after_state, ip_address, created_at, metadata
     FROM audit_logs
     WHERE entity_type = :entity AND entity_id = :entityId AND tenant_id = :tenantId
     ORDER BY created_at ASC`,
    {
      replacements: { entity, entityId, tenantId },
      type: sequelize.QueryTypes.SELECT,
    }
  );
}

module.exports = {
  logEvent,
  logBatch,
  queryAuditLogs,
  getEntityAuditTrail,
  AUDIT_ACTIONS,
};
