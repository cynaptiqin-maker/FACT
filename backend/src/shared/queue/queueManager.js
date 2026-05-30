'use strict';

const { getQueue, addJob, scheduleJob, addRepeatableJob, QUEUE_NAMES } = require('../../config/redis');

/**
 * FACT Queue Manager
 * Provides typed job submission methods for each queue.
 */

// ─── Accounting Queue ────────────────────────────────────────────────────────
const accountingQueue = {
  postJournal: (payload) => addJob(QUEUE_NAMES.ACCOUNTING, 'post-journal', payload),
  reverseJournal: (payload) => addJob(QUEUE_NAMES.ACCOUNTING, 'reverse-journal', payload),
  closeAccountingPeriod: (payload) => addJob(QUEUE_NAMES.ACCOUNTING, 'close-period', payload),
  recalculateBalances: (payload) => addJob(QUEUE_NAMES.ACCOUNTING, 'recalculate-balances', payload, { priority: 10 }),
};

// ─── Billing Queue ────────────────────────────────────────────────────────────
const billingQueue = {
  finalizeInvoice: (payload) => addJob(QUEUE_NAMES.BILLING, 'finalize-invoice', payload),
  processPayment: (payload) => addJob(QUEUE_NAMES.BILLING, 'process-payment', payload),
  generateReceipt: (payload) => addJob(QUEUE_NAMES.BILLING, 'generate-receipt', payload),
  sendInvoiceEmail: (payload, delay = 0) =>
    delay > 0
      ? scheduleJob(QUEUE_NAMES.BILLING, 'send-invoice-email', payload, delay)
      : addJob(QUEUE_NAMES.BILLING, 'send-invoice-email', payload),
};

// ─── Report Queue ─────────────────────────────────────────────────────────────
const reportQueue = {
  generatePL: (payload) => addJob(QUEUE_NAMES.REPORT, 'generate-pl', payload),
  generateBalanceSheet: (payload) => addJob(QUEUE_NAMES.REPORT, 'generate-balance-sheet', payload),
  generateCashFlow: (payload) => addJob(QUEUE_NAMES.REPORT, 'generate-cash-flow', payload),
  exportToExcel: (payload) => addJob(QUEUE_NAMES.REPORT, 'export-excel', payload),
  exportToPDF: (payload) => addJob(QUEUE_NAMES.REPORT, 'export-pdf', payload),
  generateGSTR1: (payload) => addJob(QUEUE_NAMES.REPORT, 'generate-gstr1', payload),
  generateGSTR3B: (payload) => addJob(QUEUE_NAMES.REPORT, 'generate-gstr3b', payload),
};

// ─── Notification Queue ───────────────────────────────────────────────────────
const notificationQueue = {
  sendEmail: (payload) => addJob(QUEUE_NAMES.NOTIFICATION, 'send-email', payload),
  sendSMS: (payload) => addJob(QUEUE_NAMES.NOTIFICATION, 'send-sms', payload),
  sendInApp: (payload) => addJob(QUEUE_NAMES.NOTIFICATION, 'send-in-app', payload),
  sendWorkflowAlert: (payload) => addJob(QUEUE_NAMES.NOTIFICATION, 'workflow-alert', payload),
  sendPaymentReminder: (payload) => addJob(QUEUE_NAMES.NOTIFICATION, 'payment-reminder', payload),
};

// ─── AI Queue ─────────────────────────────────────────────────────────────────
const aiQueue = {
  processQuery: (payload) => addJob(QUEUE_NAMES.AI, 'process-query', payload),
  detectAnomalies: (payload) => addJob(QUEUE_NAMES.AI, 'detect-anomalies', payload),
  categorizeExpenses: (payload) => addJob(QUEUE_NAMES.AI, 'categorize-expenses', payload),
  detectDuplicates: (payload) => addJob(QUEUE_NAMES.AI, 'detect-duplicates', payload),
};

// ─── Payroll Queue ────────────────────────────────────────────────────────────
const payrollQueue = {
  runPayroll: (payload) => addJob(QUEUE_NAMES.PAYROLL, 'run-payroll', payload, { priority: 5 }),
  generatePayslips: (payload) => addJob(QUEUE_NAMES.PAYROLL, 'generate-payslips', payload),
  sendPayslips: (payload) => addJob(QUEUE_NAMES.PAYROLL, 'send-payslips', payload),
  postPayrollToAccounting: (payload) =>
    addJob(QUEUE_NAMES.PAYROLL, 'post-payroll-accounting', payload),
};

// ─── Depreciation Queue ───────────────────────────────────────────────────────
const depreciationQueue = {
  runMonthlyDepreciation: (payload) =>
    addJob(QUEUE_NAMES.DEPRECIATION, 'run-monthly-depreciation', payload),
  postDepreciationEntries: (payload) =>
    addJob(QUEUE_NAMES.DEPRECIATION, 'post-depreciation-entries', payload),
};

// ─── Claim Queue ──────────────────────────────────────────────────────────────
const claimQueue = {
  submitClaim: (payload) => addJob(QUEUE_NAMES.CLAIM, 'submit-claim', payload),
  processSettlement: (payload) => addJob(QUEUE_NAMES.CLAIM, 'process-settlement', payload),
  reconcileClaim: (payload) => addJob(QUEUE_NAMES.CLAIM, 'reconcile-claim', payload),
};

// ─── Scheduled Report Queue ───────────────────────────────────────────────────
const scheduledReportQueue = {
  enqueueDailyCFOSummary: (tenantId) => addJob(QUEUE_NAMES.REPORT, 'scheduled-daily-cfo-summary', { tenantId }, { priority: 5 }),
  enqueueWeeklyCollections: (tenantId) => addJob(QUEUE_NAMES.REPORT, 'scheduled-weekly-collections', { tenantId }, { priority: 3 }),
  enqueueMonthlyBoardPack: (tenantId) => addJob(QUEUE_NAMES.REPORT, 'scheduled-monthly-board-pack', { tenantId }, { priority: 2 }),
};

// ─── Schedule Recurring Jobs ──────────────────────────────────────────────────
async function scheduleRecurringJobs() {
  // Monthly depreciation: 1st of each month at 1 AM
  await addRepeatableJob(QUEUE_NAMES.DEPRECIATION, 'run-monthly-depreciation', {}, '0 1 1 * *');

  // Daily AI anomaly detection: 2 AM
  await addRepeatableJob(QUEUE_NAMES.AI, 'detect-anomalies', {}, '0 2 * * *');

  // Weekly aging report: Monday 8 AM
  await addRepeatableJob(QUEUE_NAMES.REPORT, 'aging-summary', {}, '0 8 * * 1');

  // Daily payment reminders: 10 AM
  await addRepeatableJob(QUEUE_NAMES.NOTIFICATION, 'payment-reminder-batch', {}, '0 10 * * *');
}

module.exports = {
  accountingQueue,
  billingQueue,
  reportQueue,
  notificationQueue,
  aiQueue,
  payrollQueue,
  depreciationQueue,
  claimQueue,
  scheduledReportQueue,
  scheduleRecurringJobs,
};
