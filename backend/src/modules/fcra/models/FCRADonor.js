'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');
const fieldEncryption = require('../../../shared/encryption/fieldEncryption');

function decryptRow(instance) {
  if (!instance) return;
  if (instance.dataValues.pan_number != null)
    instance.dataValues.pan_number = fieldEncryption.decryptIfPresent(instance.dataValues.pan_number);
  if (instance.dataValues.passport_number != null)
    instance.dataValues.passport_number = fieldEncryption.decryptIfPresent(instance.dataValues.passport_number);
}

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
    // NOTE: column widened to TEXT in migration 010
    pan_number: { type: DataTypes.STRING(10) },
    // NOTE: column widened to TEXT in migration 010
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
    hooks: {
      beforeCreate: (instance) => {
        instance.pan_number = fieldEncryption.encryptIfPresent(instance.pan_number);
        instance.passport_number = fieldEncryption.encryptIfPresent(instance.passport_number);
      },
      beforeUpdate: (instance) => {
        if (instance.changed('pan_number'))
          instance.pan_number = fieldEncryption.encryptIfPresent(instance.pan_number);
        if (instance.changed('passport_number'))
          instance.passport_number = fieldEncryption.encryptIfPresent(instance.passport_number);
      },
      afterFind: (result) => {
        if (Array.isArray(result)) result.forEach(decryptRow);
        else decryptRow(result);
      },
    },
  }
);

module.exports = FCRADonor;
