'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRABankAccount = sequelize.define(
  'FCRABankAccount',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    account_code: { type: DataTypes.STRING(20), comment: 'Auto: FCRABA-0001' },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    bank_name: { type: DataTypes.STRING(100), allowNull: false },
    branch_name: { type: DataTypes.STRING(100) },
    account_number: { type: DataTypes.STRING(30), allowNull: false },
    ifsc_code: { type: DataTypes.STRING(15) },
    account_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'designated',
      comment: 'Designated = receives FC; Utilisation = spends FC',
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
    },
    opening_date: { type: DataTypes.DATEONLY },
    closing_date: { type: DataTypes.DATEONLY },
    opening_balance: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    current_balance: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    last_transaction_date: { type: DataTypes.DATEONLY },
    is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active:  { type: DataTypes.BOOLEAN, defaultValue: true },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_bank_accounts',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'account_type'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FCRABankAccount;
