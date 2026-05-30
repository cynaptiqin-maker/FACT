'use strict';

/**
 * FACT Event Types
 * All domain events published through the event bus.
 * Format: MODULE.ENTITY.ACTION
 */

const EVENT_TYPES = {
  // ─── Auth Events ────────────────────────────────────────────────────────────
  AUTH: {
    USER_LOGGED_IN: 'auth.user.logged_in',
    USER_LOGGED_OUT: 'auth.user.logged_out',
    USER_LOGIN_FAILED: 'auth.user.login_failed',
    USER_PASSWORD_CHANGED: 'auth.user.password_changed',
    MFA_ENABLED: 'auth.mfa.enabled',
    TOKEN_REFRESHED: 'auth.token.refreshed',
  },

  // ─── Accounting Events ───────────────────────────────────────────────────────
  ACCOUNTING: {
    JOURNAL_CREATED: 'accounting.journal.created',
    JOURNAL_POSTED: 'accounting.journal.posted',
    JOURNAL_REVERSED: 'accounting.journal.reversed',
    JOURNAL_CANCELLED: 'accounting.journal.cancelled',
    PERIOD_LOCKED: 'accounting.period.locked',
    PERIOD_UNLOCKED: 'accounting.period.unlocked',
    FISCAL_YEAR_OPENED: 'accounting.fiscal_year.opened',
    FISCAL_YEAR_CLOSED: 'accounting.fiscal_year.closed',
    TRIAL_BALANCE_GENERATED: 'accounting.trial_balance.generated',
    ACCOUNT_CREATED: 'accounting.account.created',
    ACCOUNT_UPDATED: 'accounting.account.updated',
    ACCOUNT_DEACTIVATED: 'accounting.account.deactivated',
  },

  // ─── Billing Events ──────────────────────────────────────────────────────────
  BILLING: {
    INVOICE_CREATED: 'billing.invoice.created',
    INVOICE_FINALIZED: 'billing.invoice.finalized',
    INVOICE_CANCELLED: 'billing.invoice.cancelled',
    INVOICE_PAYMENT_RECEIVED: 'billing.invoice.payment_received',
    DEPOSIT_RECEIVED: 'billing.deposit.received',
    DEPOSIT_ADJUSTED: 'billing.deposit.adjusted',
    CREDIT_NOTE_ISSUED: 'billing.credit_note.issued',
    DEBIT_NOTE_ISSUED: 'billing.debit_note.issued',
    REFUND_ISSUED: 'billing.refund.issued',
  },

  // ─── Insurance/TPA Events ────────────────────────────────────────────────────
  INSURANCE: {
    CLAIM_CREATED: 'insurance.claim.created',
    CLAIM_SUBMITTED: 'insurance.claim.submitted',
    PREAUTH_REQUESTED: 'insurance.preauth.requested',
    PREAUTH_APPROVED: 'insurance.preauth.approved',
    PREAUTH_DENIED: 'insurance.preauth.denied',
    CLAIM_LODGED: 'insurance.claim.lodged',
    CLAIM_SETTLEMENT_RECEIVED: 'insurance.claim.settlement_received',
    CLAIM_REJECTED: 'insurance.claim.rejected',
    CLAIM_RESUBMITTED: 'insurance.claim.resubmitted',
    SETTLEMENT_POSTED: 'insurance.settlement.posted',
  },

  // ─── AR Events ──────────────────────────────────────────────────────────────
  AR: {
    PAYMENT_RECEIVED: 'ar.payment.received',
    PAYMENT_ALLOCATED: 'ar.payment.allocated',
    DUNNING_TRIGGERED: 'ar.dunning.triggered',
    WRITEOFF_CREATED: 'ar.writeoff.created',
  },

  // ─── AP Events ──────────────────────────────────────────────────────────────
  AP: {
    VENDOR_INVOICE_RECEIVED: 'ap.vendor_invoice.received',
    VENDOR_INVOICE_APPROVED: 'ap.vendor_invoice.approved',
    VENDOR_INVOICE_POSTED:   'ap.vendor_invoice.posted',
    VENDOR_INVOICE_REVERSED: 'ap.vendor_invoice.reversed',
    VENDOR_PAYMENT_MADE:     'ap.vendor_payment.made',
    PAYMENT_DUE_ALERT:       'ap.payment.due_alert',
    TDS_DEDUCTED:            'ap.tds.deducted',
  },

  // ─── Procurement Events ──────────────────────────────────────────────────────
  PROCUREMENT: {
    PR_CREATED: 'procurement.pr.created',
    PR_APPROVED: 'procurement.pr.approved',
    PO_CREATED: 'procurement.po.created',
    PO_APPROVED: 'procurement.po.approved',
    GRN_CREATED: 'procurement.grn.created',
    GRN_APPROVED: 'procurement.grn.approved',
  },

  // ─── Payroll Events ──────────────────────────────────────────────────────────
  PAYROLL: {
    PAYROLL_RUN_INITIATED: 'payroll.run.initiated',
    PAYROLL_CALCULATED: 'payroll.run.calculated',
    PAYROLL_APPROVED: 'payroll.run.approved',
    PAYROLL_POSTED: 'payroll.run.posted',
    PAYSLIP_GENERATED: 'payroll.payslip.generated',
    SALARY_PAID: 'payroll.salary.paid',
    TDS_CALCULATED: 'payroll.tds.calculated',
  },

  // ─── Doctor Payout Events ────────────────────────────────────────────────────
  DOCTOR_PAYOUT: {
    PAYOUT_RUN_CREATED: 'doctor_payout.run.created',
    PAYOUT_CALCULATED: 'doctor_payout.run.calculated',
    PAYOUT_APPROVED: 'doctor_payout.run.approved',
    PAYOUT_POSTED: 'doctor_payout.run.posted',
  },

  // ─── Fixed Assets Events ─────────────────────────────────────────────────────
  ASSETS: {
    ASSET_CREATED: 'assets.asset.created',
    ASSET_CAPITALIZED: 'assets.asset.capitalized',
    DEPRECIATION_RUN: 'assets.depreciation.run',
    ASSET_TRANSFERRED: 'assets.asset.transferred',
    ASSET_DISPOSED: 'assets.asset.disposed',
    ASSET_WRITTEN_OFF: 'assets.asset.written_off',
  },

  // ─── Taxation Events ─────────────────────────────────────────────────────────
  TAXATION: {
    GSTR1_GENERATED: 'taxation.gstr1.generated',
    GSTR3B_GENERATED: 'taxation.gstr3b.generated',
    TDS_DEDUCTED: 'taxation.tds.deducted',
    TDS_DEPOSITED: 'taxation.tds.deposited',
  },

  // ─── Workflow Events ─────────────────────────────────────────────────────────
  WORKFLOW: {
    TASK_CREATED: 'workflow.task.created',
    TASK_APPROVED: 'workflow.task.approved',
    TASK_REJECTED: 'workflow.task.rejected',
    TASK_ESCALATED: 'workflow.task.escalated',
    WORKFLOW_COMPLETED: 'workflow.instance.completed',
  },

  // ─── Reporting Events ────────────────────────────────────────────────────────
  REPORTING: {
    REPORT_REQUESTED: 'reporting.report.requested',
    REPORT_GENERATED: 'reporting.report.generated',
    REPORT_EXPORTED: 'reporting.report.exported',
    REPORT_FAILED: 'reporting.report.failed',
  },

  // ─── System Events ───────────────────────────────────────────────────────────
  SYSTEM: {
    MODULE_ENABLED: 'system.module.enabled',
    MODULE_DISABLED: 'system.module.disabled',
    TENANT_CREATED: 'system.tenant.created',
    BACKUP_COMPLETED: 'system.backup.completed',
  },
};

module.exports = { EVENT_TYPES };
