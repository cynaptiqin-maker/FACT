'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAProject = sequelize.define(
  'FCRAProject',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    project_code: { type: DataTypes.STRING(20), comment: 'Auto: FCP-0001' },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    project_name: { type: DataTypes.STRING(200), allowNull: false },
    description: { type: DataTypes.TEXT },
    project_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'programme',
    },
    sector: {
      type: DataTypes.STRING(50),
      defaultValue: 'health',
    },
    start_date: { type: DataTypes.DATEONLY, allowNull: false },
    end_date: { type: DataTypes.DATEONLY },

    // Budget & Utilisation (kept updated by receipt/utilisation triggers)
    budgeted_amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    received_amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    utilized_amount: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    admin_utilized: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0, comment: 'Admin-category utilisations' },
    admin_cap_percent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 20, comment: 'Max admin expense % (FCRA limit = 20%)' },

    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
    },
    objectives: { type: DataTypes.TEXT },
    outcomes: { type: DataTypes.TEXT },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_projects',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'sector'] },
    ],
  }
);

module.exports = FCRAProject;
