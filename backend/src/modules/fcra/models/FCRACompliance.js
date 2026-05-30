'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRACompliance = sequelize.define(
  'FCRACompliance',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    compliance_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'fc4_filing',
    },
    title: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    due_date: { type: DataTypes.DATEONLY, allowNull: false },
    completed_date: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'pending',
    },
    assigned_to: { type: DataTypes.UUID },
    reminder_days: { type: DataTypes.INTEGER, defaultValue: 30 },
    financial_year: { type: DataTypes.STRING(10), comment: 'e.g. 2024-25' },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_compliances',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'due_date'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'compliance_type'] },
    ],
  }
);

module.exports = FCRACompliance;
