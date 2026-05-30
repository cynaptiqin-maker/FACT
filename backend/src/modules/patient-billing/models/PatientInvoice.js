'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * PatientInvoice — Hospital billing document.
 *
 * Supports:
 *   - OP (Outpatient) billing
 *   - IP (Inpatient) billing
 *   - ICU/OT billing
 *   - Package billing (fixed price bundles)
 *   - Credit billing (corporate, insurance empanelled)
 *   - Split billing (patient + insurance)
 */
const PatientInvoice = sequelize.define(
  'PatientInvoice',
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
    invoice_number: {
      type: DataTypes.STRING(30),
      comment: 'Auto-generated: INV-2026-000001',
    },

    // ─── Patient ───────────────────────────────────────────────────────────
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    patient_name: {
      type: DataTypes.STRING(200),
    },
    patient_uhid: {
      type: DataTypes.STRING(20),
    },
    patient_mobile: {
      type: DataTypes.STRING(15),
    },
    patient_email: {
      type: DataTypes.STRING(200),
    },

    // ─── Visit ─────────────────────────────────────────────────────────────
    visit_id: {
      type: DataTypes.UUID,
    },
    admission_id: {
      type: DataTypes.UUID,
      comment: 'For IP billing',
    },
    admission_date: {
      type: DataTypes.DATEONLY,
    },
    discharge_date: {
      type: DataTypes.DATEONLY,
    },
    ward: {
      type: DataTypes.STRING(50),
    },
    bed_number: {
      type: DataTypes.STRING(20),
    },

    // ─── Billing Type ──────────────────────────────────────────────────────
    billing_type: {
      type: DataTypes.ENUM('OP', 'IP', 'ICU', 'OT', 'DAYCARE', 'PACKAGE', 'PHARMACY', 'LAB', 'RADIOLOGY'),
      defaultValue: 'OP',
    },
    is_credit_bill: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Bill to insurance/corporate rather than patient',
    },
    is_package_bill: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    package_id: {
      type: DataTypes.UUID,
    },

    // ─── Doctor ───────────────────────────────────────────────────────────
    treating_doctor_id: {
      type: DataTypes.UUID,
    },
    treating_doctor_name: {
      type: DataTypes.STRING(200),
    },
    department: {
      type: DataTypes.STRING(100),
    },

    // ─── Status ────────────────────────────────────────────────────────────
    status: {
      type: DataTypes.ENUM('DRAFT', 'PROVISIONAL', 'FINALIZED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REFUNDED'),
      defaultValue: 'DRAFT',
    },
    invoice_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    due_date: {
      type: DataTypes.DATEONLY,
    },

    // ─── Amounts ───────────────────────────────────────────────────────────
    gross_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    discount_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    discount_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    discount_reason: {
      type: DataTypes.STRING(200),
    },
    discount_approved_by: {
      type: DataTypes.UUID,
    },
    taxable_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    cgst_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    sgst_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    igst_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    total_tax: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    net_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      comment: 'taxable_amount + total_tax - discount_amount',
    },
    rounded_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    rounding_adjustment: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },

    // ─── Payments ──────────────────────────────────────────────────────────
    paid_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    balance_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    deposit_adjusted: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },

    // ─── Insurance Split ───────────────────────────────────────────────────
    patient_share: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    insurance_share: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    insurance_id: {
      type: DataTypes.UUID,
    },
    tpa_id: {
      type: DataTypes.UUID,
    },
    policy_number: {
      type: DataTypes.STRING(100),
    },
    claim_id: {
      type: DataTypes.UUID,
    },

    // ─── GST ───────────────────────────────────────────────────────────────
    gstin_hospital: {
      type: DataTypes.STRING(15),
    },
    gstin_patient: {
      type: DataTypes.STRING(15),
    },
    place_of_supply: {
      type: DataTypes.STRING(5),
      comment: 'State code for GST: 29 for Karnataka',
    },
    is_interstate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ─── Accounting ────────────────────────────────────────────────────────
    journal_entry_id: {
      type: DataTypes.UUID,
      comment: 'Accounting entry created on finalization',
    },
    fiscal_year_id: {
      type: DataTypes.UUID,
    },
    is_accounting_posted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    // ─── Cancellation ──────────────────────────────────────────────────────
    cancellation_reason: {
      type: DataTypes.TEXT,
    },
    cancelled_by: {
      type: DataTypes.UUID,
    },
    cancelled_at: {
      type: DataTypes.DATE,
    },

    // ─── Metadata ──────────────────────────────────────────────────────────
    notes: {
      type: DataTypes.TEXT,
    },
    tags: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    created_by: {
      type: DataTypes.UUID,
    },
    branch_id: {
      type: DataTypes.UUID,
    },
  },
  {
    tableName: 'patient_invoices',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tenant_id', 'invoice_number'] },
      { fields: ['tenant_id', 'patient_id'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'invoice_date'] },
      { fields: ['tenant_id', 'billing_type'] },
      { fields: ['claim_id'] },
      { fields: ['insurance_id'] },
      { fields: ['admission_id'] },
    ],
  }
);

module.exports = PatientInvoice;
