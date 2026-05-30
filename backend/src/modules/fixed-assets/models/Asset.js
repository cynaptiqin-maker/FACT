'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * Fixed Asset Register
 * Supports SLM (Straight Line Method) and WDV (Written Down Value) depreciation.
 */
const Asset = sequelize.define(
  'Asset',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    asset_code: { type: DataTypes.STRING(30), comment: 'Auto: FA-2026-000001' },
    asset_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    category_id: { type: DataTypes.UUID, allowNull: false },
    asset_tag: { type: DataTypes.STRING(100), comment: 'Physical barcode/RFID tag' },
    serial_number: { type: DataTypes.STRING(100) },
    model_number: { type: DataTypes.STRING(100) },
    manufacturer: { type: DataTypes.STRING(100) },
    vendor_id: { type: DataTypes.UUID },

    // Acquisition
    purchase_date: { type: DataTypes.DATEONLY, allowNull: false },
    capitalization_date: { type: DataTypes.DATEONLY },
    purchase_invoice: { type: DataTypes.STRING(100) },
    purchase_cost: { type: DataTypes.DECIMAL(20, 2), allowNull: false },
    installation_cost: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    total_cost: { type: DataTypes.DECIMAL(20, 2), comment: 'purchase_cost + installation_cost' },
    salvage_value: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    useful_life_years: { type: DataTypes.DECIMAL(5, 2), comment: 'Depreciation period in years' },

    // Depreciation
    depreciation_method: {
      type: DataTypes.ENUM('SLM', 'WDV', 'UNITS_OF_PRODUCTION', 'NONE'),
      defaultValue: 'SLM',
    },
    depreciation_rate: { type: DataTypes.DECIMAL(8, 4), comment: 'Annual % for WDV or per-unit for UOP' },
    accumulated_depreciation: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    current_book_value: { type: DataTypes.DECIMAL(20, 2) },
    last_depreciation_date: { type: DataTypes.DATEONLY },

    // Location
    location: { type: DataTypes.STRING(200) },
    department_id: { type: DataTypes.UUID },
    branch_id: { type: DataTypes.UUID },
    cost_center_id: { type: DataTypes.UUID },
    custodian_user_id: { type: DataTypes.UUID },

    // Accounting
    asset_account_id: { type: DataTypes.UUID },
    depreciation_account_id: { type: DataTypes.UUID },
    accumulated_dep_account_id: { type: DataTypes.UUID },

    // Status
    status: {
      type: DataTypes.ENUM('ACTIVE', 'UNDER_MAINTENANCE', 'DISPOSED', 'WRITTEN_OFF', 'TRANSFERRED', 'IDLE'),
      defaultValue: 'ACTIVE',
    },

    // Insurance
    insurance_policy: { type: DataTypes.STRING(100) },
    insurance_expiry: { type: DataTypes.DATEONLY },
    insurance_value: { type: DataTypes.DECIMAL(20, 2) },

    // Warranty
    warranty_expiry: { type: DataTypes.DATEONLY },
    amc_expiry: { type: DataTypes.DATEONLY },

    // Disposal
    disposal_date: { type: DataTypes.DATEONLY },
    disposal_amount: { type: DataTypes.DECIMAL(20, 2) },
    disposal_reason: { type: DataTypes.TEXT },
    disposal_journal_id: { type: DataTypes.UUID },

    tags: { type: DataTypes.JSONB, defaultValue: [] },
    metadata: { type: DataTypes.JSONB, defaultValue: {} },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'assets',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tenant_id', 'asset_code'] },
      { fields: ['tenant_id', 'category_id'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'department_id'] },
      { fields: ['asset_tag'] },
      { fields: ['serial_number'] },
    ],
    hooks: {
      beforeCreate: (asset) => {
        asset.total_cost = parseFloat(asset.purchase_cost || 0) + parseFloat(asset.installation_cost || 0);
        asset.current_book_value = asset.total_cost;
      },
    },
  }
);

module.exports = Asset;
