'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * JournalEntry — Voucher Header
 *
 * Represents one complete financial transaction with balanced DR/CR.
 * IMMUTABLE after posting — use reversal to correct.
 *
 * Voucher Types:
 *   JOURNAL  → General journal entry (JV-2026-000001)
 *   PAYMENT  → Money going out (PV-2026-000001)
 *   RECEIPT  → Money coming in (RV-2026-000001)
 *   CONTRA   → Bank/Cash transfers (CV-2026-000001)
 *   DEBIT_NOTE → Purchase return or debit to vendor (DN-2026-000001)
 *   CREDIT_NOTE → Sales return or credit to customer (CN-2026-000001)
 */
const JournalEntry = sequelize.define(
  'JournalEntry',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    entry_number: {
      type: DataTypes.STRING(30),
      comment: 'Auto-generated: JV-2026-000001',
    },
    voucher_type: {
      type: DataTypes.ENUM(
        'JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA',
        'DEBIT_NOTE', 'CREDIT_NOTE', 'PURCHASE', 'SALES', 'OPENING'
      ),
      allowNull: false,
      defaultValue: 'JOURNAL',
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    fiscal_year_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    period: {
      type: DataTypes.STRING(7),
      comment: 'e.g., 2026-04 (YYYY-MM)',
    },

    // ─── Description ───────────────────────────────────────────────────────
    narration: {
      type: DataTypes.TEXT,
      comment: 'Full description of the transaction',
    },
    reference: {
      type: DataTypes.STRING(100),
      comment: 'External reference: invoice number, cheque number, etc.',
    },
    cheque_number: {
      type: DataTypes.STRING(50),
    },
    cheque_date: {
      type: DataTypes.DATEONLY,
    },

    // ─── Status Workflow ────────────────────────────────────────────────────
    status: {
      type: DataTypes.ENUM('DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REVERSED', 'CANCELLED'),
      defaultValue: 'DRAFT',
    },

    // ─── Workflow ───────────────────────────────────────────────────────────
    workflow_instance_id: {
      type: DataTypes.UUID,
    },
    approved_by: {
      type: DataTypes.UUID,
    },
    approved_at: {
      type: DataTypes.DATE,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
    },

    // ─── Posting ───────────────────────────────────────────────────────────
    posted_by: {
      type: DataTypes.UUID,
    },
    posted_at: {
      type: DataTypes.DATE,
    },
    total_debit: {
      type: DataTypes.DECIMAL(20, 4),
      defaultValue: 0,
    },
    total_credit: {
      type: DataTypes.DECIMAL(20, 4),
      defaultValue: 0,
    },

    // ─── Reversal ──────────────────────────────────────────────────────────
    is_reversal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reversal_of: {
      type: DataTypes.UUID,
      comment: 'If this is a reversal, the original journal entry ID',
    },
    is_reversed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reversed_by_id: {
      type: DataTypes.UUID,
      comment: 'ID of the reversal journal entry',
    },

    // ─── Dimensions ────────────────────────────────────────────────────────
    cost_center_id: { type: DataTypes.UUID },
    department_id: { type: DataTypes.UUID },
    branch_id: { type: DataTypes.UUID },

    // ─── Source Traceability ───────────────────────────────────────────────
    source_module: {
      type: DataTypes.STRING(50),
      comment: 'Which module generated this entry: patient-billing, payroll, etc.',
    },
    source_id: {
      type: DataTypes.UUID,
      comment: 'ID of the source document (invoice, payslip, etc.)',
    },
    source_reference: {
      type: DataTypes.STRING(100),
    },

    // ─── Recurring ─────────────────────────────────────────────────────────
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    recurrence_config: {
      type: DataTypes.JSONB,
      comment: '{ frequency: MONTHLY, endDate: 2027-03-31, nextRunDate: ... }',
    },
    parent_recurring_id: {
      type: DataTypes.UUID,
    },

    // ─── Metadata ──────────────────────────────────────────────────────────
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    attachments: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of { filename, url, uploadedAt, size }',
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_by: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: 'journal_entries',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tenant_id', 'entry_number'] },
      { fields: ['tenant_id', 'date'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'voucher_type'] },
      { fields: ['tenant_id', 'fiscal_year_id'] },
      { fields: ['source_module', 'source_id'] },
      { fields: ['tenant_id', 'period'] },
    ],
    hooks: {
      beforeCreate: (entry) => {
        if (entry.date) {
          const d = new Date(entry.date);
          entry.period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
      },
    },
  }
);

module.exports = JournalEntry;
