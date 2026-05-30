'use strict';

const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/database');

/**
 * Insurance Claim Model
 *
 * Full claim lifecycle:
 * DRAFT → SUBMITTED → UNDER_REVIEW → PREAUTH_REQUESTED → PREAUTH_APPROVED
 *       → CLAIM_LODGED → PARTIAL_SETTLEMENT → SETTLED → REJECTED → RESUBMITTED
 */
const Claim = sequelize.define(
  'Claim',
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
    claim_number: {
      type: DataTypes.STRING(30),
      comment: 'Auto-generated: CLM-2026-000001',
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
    admission_id: {
      type: DataTypes.UUID,
    },
    invoice_id: {
      type: DataTypes.UUID,
    },

    // ─── Insurance/TPA ─────────────────────────────────────────────────────
    insurer_id: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'Insurance company',
    },
    tpa_id: {
      type: DataTypes.UUID,
      comment: 'Third Party Administrator (if applicable)',
    },
    policy_id: {
      type: DataTypes.UUID,
    },
    policy_number: {
      type: DataTypes.STRING(100),
    },
    member_id: {
      type: DataTypes.STRING(100),
    },
    employee_id: {
      type: DataTypes.STRING(100),
      comment: 'Corporate employee ID',
    },
    corporate_id: {
      type: DataTypes.UUID,
      comment: 'If corporate insurance',
    },

    // ─── Claim Status Workflow ─────────────────────────────────────────────
    status: {
      type: DataTypes.STRING(30),
      defaultValue: 'DRAFT',
    },
    status_history: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: 'Array of { status, date, remarks, updatedBy }',
    },

    // ─── Admission Details ─────────────────────────────────────────────────
    admission_date: {
      type: DataTypes.DATEONLY,
    },
    discharge_date: {
      type: DataTypes.DATEONLY,
    },
    diagnosis_code: {
      type: DataTypes.STRING(20),
      comment: 'ICD-10 code',
    },
    diagnosis_description: {
      type: DataTypes.TEXT,
    },
    procedure_code: {
      type: DataTypes.STRING(20),
    },
    procedure_description: {
      type: DataTypes.TEXT,
    },
    treating_doctor: {
      type: DataTypes.STRING(200),
    },
    ward_type: {
      type: DataTypes.STRING(50),
    },

    // ─── Pre-Authorization ─────────────────────────────────────────────────
    preauth_number: {
      type: DataTypes.STRING(100),
    },
    preauth_requested_at: {
      type: DataTypes.DATE,
    },
    preauth_approved_at: {
      type: DataTypes.DATE,
    },
    preauth_approved_amount: {
      type: DataTypes.DECIMAL(20, 2),
    },
    preauth_remarks: {
      type: DataTypes.TEXT,
    },

    // ─── Amounts ───────────────────────────────────────────────────────────
    claimed_amount: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: false,
    },
    admissible_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      comment: 'Amount TPA/insurer agrees to pay',
    },
    deduction_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      comment: 'Deductions: copay, non-medical, etc.',
    },
    settled_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    pending_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    patient_liability: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
      comment: 'Amount patient must pay (deductions + co-pay)',
    },

    // ─── Deductions Detail ─────────────────────────────────────────────────
    deductions: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: '[{ reason, amount, type: COPAY/NON_ADMISSIBLE/INVESTIGATION }]',
    },

    // ─── Submission ────────────────────────────────────────────────────────
    submitted_at: {
      type: DataTypes.DATE,
    },
    submitted_by: {
      type: DataTypes.UUID,
    },
    submission_method: {
      type: DataTypes.STRING(20),
      comment: 'PORTAL, EMAIL, MANUAL',
    },
    tpa_claim_number: {
      type: DataTypes.STRING(100),
      comment: 'Reference given by TPA upon submission',
    },
    tpa_reference: {
      type: DataTypes.STRING(200),
    },

    // ─── Settlement ────────────────────────────────────────────────────────
    settled_at: {
      type: DataTypes.DATE,
    },
    settlement_utr: {
      type: DataTypes.STRING(100),
      comment: 'UTR number for bank transfer',
    },
    settlement_date: {
      type: DataTypes.DATEONLY,
    },
    settlement_remarks: {
      type: DataTypes.TEXT,
    },
    journal_entry_id: {
      type: DataTypes.UUID,
      comment: 'Accounting entry on settlement',
    },

    // ─── Rejection ─────────────────────────────────────────────────────────
    rejection_reason: {
      type: DataTypes.TEXT,
    },
    rejection_date: {
      type: DataTypes.DATEONLY,
    },
    appeal_deadline: {
      type: DataTypes.DATEONLY,
    },

    // ─── Query ─────────────────────────────────────────────────────────────
    query_details: {
      type: DataTypes.TEXT,
    },
    query_date: {
      type: DataTypes.DATEONLY,
    },
    query_response: {
      type: DataTypes.TEXT,
    },
    query_response_date: {
      type: DataTypes.DATEONLY,
    },

    // ─── Documents ─────────────────────────────────────────────────────────
    documents: {
      type: DataTypes.JSONB,
      defaultValue: [],
      comment: '[{ name, type, url, uploadedAt }]',
    },

    // ─── Flags ─────────────────────────────────────────────────────────────
    is_resubmission: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    original_claim_id: {
      type: DataTypes.UUID,
    },
    is_written_off: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    written_off_amount: {
      type: DataTypes.DECIMAL(20, 2),
      defaultValue: 0,
    },
    written_off_reason: {
      type: DataTypes.TEXT,
    },

    // ─── SLA ───────────────────────────────────────────────────────────────
    sla_due_date: {
      type: DataTypes.DATEONLY,
    },
    days_outstanding: {
      type: DataTypes.VIRTUAL,
      get() {
        if (!this.submitted_at) return null;
        const days = Math.floor((Date.now() - new Date(this.submitted_at)) / (1000 * 60 * 60 * 24));
        return days;
      },
    },

    // ─── Metadata ──────────────────────────────────────────────────────────
    notes: { type: DataTypes.TEXT },
    tags: { type: DataTypes.JSONB, defaultValue: [] },
    created_by: { type: DataTypes.UUID },
    branch_id: { type: DataTypes.UUID },
    department_id: { type: DataTypes.UUID },
  },
  {
    tableName: 'claims',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['tenant_id', 'claim_number'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'insurer_id'] },
      { fields: ['tenant_id', 'tpa_id'] },
      { fields: ['patient_id'] },
      { fields: ['invoice_id'] },
      { fields: ['submitted_at'] },
    ],
  }
);

module.exports = Claim;
