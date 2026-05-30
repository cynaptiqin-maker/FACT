'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRADonor = sequelize.define(
  'FCRADonor',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    donor_code: { type: DataTypes.STRING(20), comment: 'Auto: FD-00001' },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    donor_name: { type: DataTypes.STRING(200), allowNull: false },
    donor_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'organization',
    },
    country: { type: DataTypes.STRING(100), allowNull: false },
    country_code: { type: DataTypes.STRING(3) },
    address: { type: DataTypes.JSONB, defaultValue: {} },
    email: { type: DataTypes.STRING(100) },
    phone: { type: DataTypes.STRING(30) },
    pan_number: { type: DataTypes.STRING(10) },
    passport_number: { type: DataTypes.STRING(20) },
    org_registration_number: { type: DataTypes.STRING(50) },
    website: { type: DataTypes.STRING(200) },
    donor_since: { type: DataTypes.DATEONLY },
    total_contributions: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    last_contribution_date: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.STRING(50),
      defaultValue: 'active',
    },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_donors',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'country'] },
      { fields: ['tenant_id', 'status'] },
    ],
  }
);

module.exports = FCRADonor;
