'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAAuditLog = sequelize.define(
  'FCRAAuditLog',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    registration_id: { type: DataTypes.UUID },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_id: { type: DataTypes.UUID },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    old_values: { type: DataTypes.JSONB },
    new_values: { type: DataTypes.JSONB },
    performed_by: { type: DataTypes.UUID },
    ip_address: { type: DataTypes.STRING(45) },
    notes: { type: DataTypes.TEXT },
  },
  {
    tableName: 'fcra_audit_logs',
    timestamps: true,
    underscored: true,
    updatedAt: false,
    indexes: [
      { fields: ['tenant_id', 'entity_type', 'entity_id'] },
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'performed_by'] },
    ],
  }
);

module.exports = FCRAAuditLog;
