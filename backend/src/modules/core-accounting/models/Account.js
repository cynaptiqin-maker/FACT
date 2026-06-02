'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const fieldEncryption = require('../../../shared/encryption/fieldEncryption');

function decryptRow(instance) {
  if (!instance) return;
  if (instance.dataValues.bank_account_number != null)
    instance.dataValues.bank_account_number = fieldEncryption.decryptIfPresent(instance.dataValues.bank_account_number);
}

/**
 * Account — Chart of Accounts
 *
 * Hierarchical account structure supporting multi-level groups.
 * Self-referential parent_id for tree structure.
 *
 * Account Types:
 *   ASSET       → Dr increases balance (Cash, Receivables, Equipment)
 *   LIABILITY   → Cr increases balance (Payables, Loans)
 *   EQUITY      → Cr increases balance (Capital, Retained Earnings)
 *   INCOME      → Cr increases balance (Revenue, Fees)
 *   EXPENSE     → Dr increases balance (Salaries, Rent, Supplies)
 */
const Account = sequelize.define(
  'Account',
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
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'Account code like 1001, 2001, etc.',
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },

    // ─── Account Classification ─────────────────────────────────────────────
    type: {
      type: DataTypes.ENUM('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'),
      allowNull: false,
    },
    sub_type: {
      type: DataTypes.STRING(50),
      comment: 'e.g., CURRENT_ASSET, FIXED_ASSET, CURRENT_LIABILITY, LONG_TERM_LIABILITY, etc.',
    },

    // ─── Hierarchy ─────────────────────────────────────────────────────────
    parent_id: {
      type: DataTypes.UUID,
      references: { model: 'accounts', key: 'id' },
      comment: 'Self-referential for account groups',
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '1=root group, 2=sub-group, 3=leaf account',
    },
    is_group: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Group accounts cannot receive direct postings',
    },
    path: {
      type: DataTypes.STRING(500),
      comment: 'Materialized path: /1000/1100/1110 for fast tree queries',
    },

    // ─── Dimensions ────────────────────────────────────────────────────────
    cost_center_id: {
      type: DataTypes.UUID,
      comment: 'Default cost center for this account',
    },
    department_id: {
      type: DataTypes.UUID,
    },
    branch_id: {
      type: DataTypes.UUID,
    },

    // ─── Financial ─────────────────────────────────────────────────────────
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    opening_balance: {
      type: DataTypes.DECIMAL(20, 4),
      defaultValue: 0,
      comment: 'Opening balance for current fiscal year',
    },
    current_balance: {
      type: DataTypes.DECIMAL(20, 4),
      defaultValue: 0,
      comment: 'Running balance — updated on every journal posting',
    },
    normal_balance: {
      type: DataTypes.ENUM('DEBIT', 'CREDIT'),
      comment: 'Auto-set based on account type',
    },

    // ─── Settings ──────────────────────────────────────────────────────────
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    allow_direct_posting: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'If false, only sub-accounts can receive postings',
    },
    is_bank_account: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_cash_account: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_control_account: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Control accounts like Sundry Debtors/Creditors',
    },

    // ─── Tax ───────────────────────────────────────────────────────────────
    gst_applicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    tds_applicable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    default_tax_code: {
      type: DataTypes.STRING(20),
    },

    // ─── Bank Details (for bank accounts) ──────────────────────────────────
    bank_name: {
      type: DataTypes.STRING(100),
    },
    // NOTE: column widened to TEXT in migration 010
    bank_account_number: {
      type: DataTypes.STRING(50),
    },
    bank_ifsc: {
      type: DataTypes.STRING(20),
    },
    bank_branch: {
      type: DataTypes.STRING(100),
    },

    // ─── Metadata ──────────────────────────────────────────────────────────
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_by: {
      type: DataTypes.UUID,
    },
    updated_by: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: 'accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tenant_id', 'code'] },
      { fields: ['tenant_id', 'type'] },
      { fields: ['tenant_id', 'parent_id'] },
      { fields: ['tenant_id', 'is_active'] },
      { fields: ['tenant_id', 'is_group'] },
      { fields: ['path'] },
    ],
    hooks: {
      beforeCreate: (account) => {
        // Auto-set normal balance based on type
        const normalBalanceMap = {
          ASSET: 'DEBIT',
          EXPENSE: 'DEBIT',
          LIABILITY: 'CREDIT',
          EQUITY: 'CREDIT',
          INCOME: 'CREDIT',
        };
        account.normal_balance = normalBalanceMap[account.type] || 'DEBIT';
        account.bank_account_number = fieldEncryption.encryptIfPresent(account.bank_account_number);
      },
      beforeUpdate: (account) => {
        if (account.changed('bank_account_number'))
          account.bank_account_number = fieldEncryption.encryptIfPresent(account.bank_account_number);
      },
      afterFind: (result) => {
        if (Array.isArray(result)) result.forEach(decryptRow);
        else decryptRow(result);
      },
    },
  }
);

// ─── Associations ─────────────────────────────────────────────────────────────
Account.hasMany(Account, { foreignKey: 'parent_id', as: 'children' });
Account.belongsTo(Account, { foreignKey: 'parent_id', as: 'parent' });

module.exports = Account;
