'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * FiscalYear — Financial year management.
 * Indian hospitals typically run April 1 to March 31.
 */
const FiscalYear = sequelize.define(
  'FiscalYear',
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
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g., FY 2025-26',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'CLOSED', 'ARCHIVED'),
      defaultValue: 'ACTIVE',
    },
    is_current: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    closed_at: {
      type: DataTypes.DATE,
    },
    closed_by: {
      type: DataTypes.UUID,
    },
    opening_entries_posted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    closing_entries_posted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_by: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: 'fiscal_years',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tenant_id', 'name'] },
      { fields: ['tenant_id', 'is_current'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FiscalYear;
