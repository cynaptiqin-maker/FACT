'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAUtilisation = sequelize.define(
  'FCRAUtilisation',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    voucher_number: { type: DataTypes.STRING(30), comment: 'Auto: FUV-2026-00001' },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    project_id: { type: DataTypes.UUID, allowNull: true },
    bank_account_id: { type: DataTypes.UUID, allowNull: true },

    amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
    utilization_date: { type: DataTypes.DATEONLY, allowNull: false },

    category: {
      type: DataTypes.STRING(50),
      defaultValue: 'programme',
      comment: 'Administrative must not exceed 20% of total receipts',
    },
    purpose: { type: DataTypes.TEXT },
    payee_name: { type: DataTypes.STRING(200) },
    payee_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'vendor',
    },
    payment_mode: {
      type: DataTypes.STRING(50),
      defaultValue: 'bank_transfer',
    },
    transaction_reference: { type: DataTypes.STRING(100) },

    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'draft',
    },
    approved_by: { type: DataTypes.UUID },
    approved_at: { type: DataTypes.DATE },
    rejection_reason: { type: DataTypes.TEXT },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_utilisations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'project_id'] },
      { fields: ['tenant_id', 'utilization_date'] },
      { fields: ['tenant_id', 'category'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FCRAUtilisation;
