'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAReceipt = sequelize.define(
  'FCRAReceipt',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    receipt_number: { type: DataTypes.STRING(30), comment: 'Auto: FCR-2026-00001' },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    donor_id: { type: DataTypes.UUID, allowNull: true },
    bank_account_id: { type: DataTypes.UUID, allowNull: true },
    project_id: { type: DataTypes.UUID },

    // Financials
    amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false, comment: 'In foreign currency' },
    currency: { type: DataTypes.STRING(3), defaultValue: 'USD' },
    exchange_rate: { type: DataTypes.DECIMAL(12, 4), defaultValue: 1 },
    amount_inr: { type: DataTypes.DECIMAL(20, 2), comment: 'amount × exchange_rate' },

    // Dates
    receipt_date: { type: DataTypes.DATEONLY, allowNull: false },
    bank_credit_date: { type: DataTypes.DATEONLY },

    // Classification
    purpose_code: {
      type: DataTypes.STRING(50),
      defaultValue: 'health',
    },
    purpose: { type: DataTypes.TEXT },
    receipt_mode: {
      type: DataTypes.STRING(50),
      defaultValue: 'wire_transfer',
    },
    transaction_type: {
      type: DataTypes.STRING(20),
      defaultValue: 'bank_transfer',
    },
    transaction_reference: { type: DataTypes.STRING(100) },

    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
    },
    verified_by: { type: DataTypes.UUID },
    verified_at: { type: DataTypes.DATE },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_receipts',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (receipt) => {
        if (!receipt.amount_inr && receipt.amount && receipt.exchange_rate) {
          receipt.amount_inr = parseFloat(receipt.amount) * parseFloat(receipt.exchange_rate);
        }
      },
      beforeUpdate: (receipt) => {
        if (receipt.changed('amount') || receipt.changed('exchange_rate')) {
          receipt.amount_inr = parseFloat(receipt.amount) * parseFloat(receipt.exchange_rate);
        }
      },
    },
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'donor_id'] },
      { fields: ['tenant_id', 'receipt_date'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FCRAReceipt;
