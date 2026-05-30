'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAAsset = sequelize.define(
  'FCRAAsset',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    asset_code: { type: DataTypes.STRING(20), comment: 'Auto: FCRA-A-0001' },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    project_id: { type: DataTypes.UUID },
    asset_name: { type: DataTypes.STRING(200), allowNull: false },
    asset_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'equipment',
    },
    description: { type: DataTypes.TEXT },
    purchase_date: { type: DataTypes.DATEONLY, allowNull: false },
    purchase_amount: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
    currency: { type: DataTypes.STRING(3), defaultValue: 'INR' },
    current_value: { type: DataTypes.DECIMAL(20, 2) },
    location: { type: DataTypes.STRING(200) },
    funded_by: {
      type: DataTypes.STRING(50),
      defaultValue: 'fcra',
    },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
    },
    mha_reported: { type: DataTypes.BOOLEAN, defaultValue: false },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_assets',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (asset) => {
        if (!asset.current_value) {
          asset.current_value = asset.purchase_amount;
        }
      },
    },
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'asset_type'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FCRAAsset;
