'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

const FCRAAssetDisposal = sequelize.define(
  'FCRAAssetDisposal',
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    tenant_id: { type: DataTypes.UUID, allowNull: false },
    disposal_code: { type: DataTypes.STRING(20), comment: 'Auto: FCRD-0001' },
    asset_id: { type: DataTypes.UUID, allowNull: false },
    registration_id: { type: DataTypes.UUID, allowNull: false },
    disposal_date: { type: DataTypes.DATEONLY, allowNull: false },
    disposal_method: {
      type: DataTypes.STRING(50),
      defaultValue: 'sale',
    },
    sale_proceeds: { type: DataTypes.DECIMAL(20, 2), defaultValue: 0 },
    book_value: { type: DataTypes.DECIMAL(20, 2) },
    gain_loss: { type: DataTypes.DECIMAL(20, 2), comment: 'sale_proceeds - book_value' },
    buyer_name: { type: DataTypes.STRING(200) },
    approved_by: { type: DataTypes.UUID },
    mha_intimation_date: { type: DataTypes.DATEONLY },
    mha_acknowledgement: { type: DataTypes.STRING(100) },
    documents: { type: DataTypes.JSONB, defaultValue: [] },
    notes: { type: DataTypes.TEXT },
    created_by: { type: DataTypes.UUID },
  },
  {
    tableName: 'fcra_asset_disposals',
    timestamps: true,
    underscored: true,
    hooks: {
      beforeCreate: (d) => {
        if (d.book_value != null && d.sale_proceeds != null) {
          d.gain_loss = parseFloat(d.sale_proceeds) - parseFloat(d.book_value);
        }
      },
    },
    indexes: [
      { fields: ['tenant_id', 'registration_id'] },
      { fields: ['tenant_id', 'asset_id'] },
    ],
  }
);

module.exports = FCRAAssetDisposal;
