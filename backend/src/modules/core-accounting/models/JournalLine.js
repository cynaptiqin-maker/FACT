'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * JournalLine — Individual DR/CR line in a journal entry.
 * Each line belongs to one account and has either debit OR credit amount (not both).
 */
const JournalLine = sequelize.define(
  'JournalLine',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    journal_entry_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'journal_entries', key: 'id' },
    },
    line_number: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    account_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'accounts', key: 'id' },
    },
    tenant_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },

    // ─── Amounts ───────────────────────────────────────────────────────────
    debit_amount: {
      type: DataTypes.DECIMAL(20, 4),
      defaultValue: 0,
      comment: 'Positive if this line is a debit',
    },
    credit_amount: {
      type: DataTypes.DECIMAL(20, 4),
      defaultValue: 0,
      comment: 'Positive if this line is a credit',
    },
    running_balance: {
      type: DataTypes.DECIMAL(20, 4),
      comment: 'Account running balance after this posting',
    },

    // ─── Dimensions ────────────────────────────────────────────────────────
    cost_center_id: { type: DataTypes.UUID },
    department_id: { type: DataTypes.UUID },
    branch_id: { type: DataTypes.UUID },
    project_id: { type: DataTypes.UUID },

    // ─── Description ───────────────────────────────────────────────────────
    narration: {
      type: DataTypes.TEXT,
    },

    // ─── Tax ───────────────────────────────────────────────────────────────
    tax_code: {
      type: DataTypes.STRING(20),
      comment: 'GST rate code: GST18, GST12, etc.',
    },
    tax_amount: {
      type: DataTypes.DECIMAL(20, 4),
      defaultValue: 0,
    },
    tax_type: {
      type: DataTypes.STRING(10),
      comment: 'CGST, SGST, IGST, TDS',
    },

    // ─── Party Details (for sub-ledger) ────────────────────────────────────
    party_type: {
      type: DataTypes.STRING(50),
      comment: 'Patient, Vendor, Doctor, Insurance, Employee',
    },
    party_id: {
      type: DataTypes.UUID,
    },

    // ─── Reconciliation ────────────────────────────────────────────────────
    is_reconciled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    reconciled_at: {
      type: DataTypes.DATE,
    },
    reconciliation_ref: {
      type: DataTypes.STRING(100),
    },
  },
  {
    tableName: 'journal_lines',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['journal_entry_id'] },
      { fields: ['account_id'] },
      { fields: ['tenant_id', 'account_id'] },
      { fields: ['party_type', 'party_id'] },
      { fields: ['is_reconciled'] },
    ],
    validate: {
      onlyDebitOrCredit() {
        const hasDebit = parseFloat(this.debit_amount) > 0;
        const hasCredit = parseFloat(this.credit_amount) > 0;
        if (hasDebit && hasCredit) {
          throw new Error('A journal line cannot have both debit and credit amounts.');
        }
        if (!hasDebit && !hasCredit) {
          throw new Error('A journal line must have either a debit or credit amount.');
        }
      },
    },
  }
);

module.exports = JournalLine;
