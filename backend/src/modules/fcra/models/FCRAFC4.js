'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAFC4 = sequelize.define(
  'FCRAFC4',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    filing_code: { type: DataTypes.STRING(30), comment: 'Auto: FC4-0001' },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    financial_year: { type: DataTypes.STRING(10), allowNull: false, comment: 'e.g. 2024-25' },
    filing_date: { type: DataTypes.DATEONLY },
    due_date: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'draft',
    },

    // FC-4 financials
    opening_balance: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    total_receipts_fc: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    total_utilized_fc: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    closing_balance: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    admin_expenses: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    programme_expenses: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    capital_expenses: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    admin_cap_percent: { type: DataTypes.DECIMAL(5, 2), comment: 'admin_expenses / total_receipts_fc × 100' },

    // MHA submission
    mha_acknowledgement_number: { type: DataTypes.STRING(100) },
    mha_filing_reference: { type: DataTypes.STRING(100) },

    // Full FC-4 form data as JSON (all schedules)
    filing_data: { type: DataTypes.JSONB, defaultValue: {} },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_fc4_filings',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeSave: (f) => {
        if (f.total_receipts_fc > 0 && f.admin_expenses >= 0) {
          f.admin_cap_percent = parseFloat(
            ((parseFloat(f.admin_expenses) / parseFloat(f.total_receipts_fc)) * 100).toFixed(2)
          );
        }
        f.closing_balance =
          parseFloat(f.opening_balance || 0) +
          parseFloat(f.total_receipts_fc || 0) -
          parseFloat(f.total_utilized_fc || 0);
      },
    },
    indexes: [
      { unique: true, fields: ['tenant_id', 'registration_id', 'financial_year'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FCRAFC4;
