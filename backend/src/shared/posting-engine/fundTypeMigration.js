'use strict';

/**
 * fundTypeMigration — idempotent schema migration for the fund_type columns.
 *
 * Adds the following columns if they do not already exist:
 *   accounts.fund_type              VARCHAR(30) DEFAULT 'LOCAL'
 *   journal_entries.fund_type       VARCHAR(30) DEFAULT 'LOCAL'
 *   journal_entries.recon_status    VARCHAR(30) DEFAULT 'UNMATCHED'
 *   journal_entries.posting_event   VARCHAR(60)
 *   journal_entries.posting_explanation  JSONB
 *
 * Also auto-classifies existing FCRA accounts (code LIKE 'FCRA-%') by setting
 * their fund_type to 'FCRA' if it is currently NULL or 'LOCAL'.
 *
 * Safe to run on every application startup — uses ADD COLUMN IF NOT EXISTS.
 *
 * @module posting-engine/fundTypeMigration
 */

const logger = require('../utils/logger');

/**
 * @param {import('sequelize').Sequelize} sequelize
 */
async function ensureFundTypeColumn(sequelize) {
  const migrations = [
    // ── accounts table ────────────────────────────────────────────────────────
    {
      sql: `ALTER TABLE accounts ADD COLUMN IF NOT EXISTS fund_type VARCHAR(30) DEFAULT 'LOCAL'`,
      description: "accounts.fund_type",
    },
    // ── journal_entries table ─────────────────────────────────────────────────
    {
      sql: `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS fund_type VARCHAR(30) DEFAULT 'LOCAL'`,
      description: "journal_entries.fund_type",
    },
    {
      sql: `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS recon_status VARCHAR(30) DEFAULT 'UNMATCHED'`,
      description: "journal_entries.recon_status",
    },
    {
      sql: `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS posting_event VARCHAR(60)`,
      description: "journal_entries.posting_event",
    },
    {
      sql: `ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS posting_explanation JSONB`,
      description: "journal_entries.posting_explanation",
    },
  ];

  const applied = [];
  const skipped = [];

  for (const migration of migrations) {
    try {
      await sequelize.query(migration.sql);
      applied.push(migration.description);
    } catch (err) {
      // Column may already exist (non-IF NOT EXISTS DBs) or table may not exist yet
      skipped.push({ column: migration.description, reason: err.message });
    }
  }

  if (applied.length > 0) {
    logger.info('fundTypeMigration: columns ensured', { applied });
  }
  if (skipped.length > 0) {
    logger.info('fundTypeMigration: some migrations skipped (likely already applied)', { skipped });
  }

  // ── Auto-classify existing FCRA accounts ─────────────────────────────────
  try {
    const result = await sequelize.query(
      `UPDATE accounts
       SET fund_type = 'FCRA', updated_at = NOW()
       WHERE code LIKE 'FCRA-%'
         AND (fund_type IS NULL OR fund_type = 'LOCAL')`,
      { type: sequelize.QueryTypes.UPDATE }
    );

    // Sequelize UPDATE returns [result, rowCount] — rowCount may vary by driver
    const rowCount = Array.isArray(result) ? (result[1] || 0) : 0;
    if (rowCount > 0) {
      logger.info('fundTypeMigration: auto-classified FCRA accounts', { rowsUpdated: rowCount });
    }
  } catch (err) {
    // Non-fatal: table may not exist yet on first boot before syncDatabase()
    logger.info('fundTypeMigration: FCRA account auto-classification skipped', { reason: err.message });
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { ensureFundTypeColumn };
