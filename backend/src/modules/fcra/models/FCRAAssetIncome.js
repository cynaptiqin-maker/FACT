'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAAssetIncome = sequelize.define(
  'FCRAAssetIncome',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    income_code: { type: DataTypes.STRING(20), comment: 'Auto: FCRI-0001' },
    asset_id: { type: DataTypes.UUID, allowNull: false },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    income_date: { type: DataTypes.DATEONLY, allowNull: false },
    income_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'rent',
    },
    amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
    paid_by: { type: DataTypes.STRING(200) },
    bank_account_id: { type: DataTypes.UUID },
    transaction_reference: { type: DataTypes.STRING(100) },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_asset_incomes',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'asset_id'] },
      { fields: ['tenant_id', 'income_date'] },
    ],
  }
);

module.exports = FCRAAssetIncome;
