'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRARegistration = sequelize.define(
  'FCRARegistration',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    fcra_number: { type: DataTypes.STRING(50), allowNull: false, comment: 'Govt-issued FCRA registration number' },
    organization_name: { type: DataTypes.STRING(200), allowNull: false },
    organization_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'trust',
    },
    pan_number: { type: DataTypes.STRING(10) },
    registration_date: { type: DataTypes.DATEONLY, allowNull: false },
    valid_upto: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
    },
    mha_reference_number: { type: DataTypes.STRING(50) },
    purpose_of_registration: { type: DataTypes.TEXT },
    address: { type: DataTypes.JSONB, defaultValue: {} },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(20) },
    last_renewal_date: { type: DataTypes.DATEONLY },
    next_renewal_date: { type: DataTypes.DATEONLY },
    designated_bank_count: { type: DataTypes.INTEGER, defaultValue: 0 },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_registrations',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tenant_id', 'fcra_number'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FCRARegistration;
