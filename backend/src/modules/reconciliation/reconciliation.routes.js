'use strict';

/**
 * Reconciliation Workbench API
 *
 * Exposes the existing ReconciliationService results plus item-level
 * matching actions for the workbench UI.
 *
 * Routes:
 *   GET  /api/recon/workbench/summary?period=    — 6-type pass/fail card
 *   GET  /api/recon/workbench?type=AR_GL&period= — unmatched items for one type
 *   POST /api/recon/match                        — match a GL entry to source
 *   POST /api/recon/unmatch                      — un-match a previously matched entry
 *   POST /api/recon/dispute                      — mark entry as disputed
 *   POST /api/recon/adjust                       — create adjusting journal entry
 */

const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { sequelize } = require('../../config/database');
const { getRedisClient } = require('../../config/redis');
const { ReconciliationService } = require('../../shared/reconciliation/ReconciliationService');
const { getExceptionEngine, EXCEPTION_TYPES } = require('../../shared/exceptions/ExceptionEngine');
const { logEvent, AUDIT_ACTIONS } = require('../../shared/audit/auditLogger');
const Decimal = require('decimal.js');

router.use(authenticate);

// ─── Helper ───────────────────────────────────────────────────────────────────

function getReconService() {
  return new ReconciliationService(sequelize, getRedisClient());
}

// ─── Summary — all 6 types ────────────────────────────────────────────────────

router.get('/workbench/summary', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { period } = req.query;
  const { tenantId } = req;

  if (!period) return res.status(400).json({ error: 'period is required (YYYY-MM)' });

  const svc = getReconService();
  const results = await svc.runAll(tenantId, period);

  // Extend with FCRA recon types (not in original runAll)
  const [fcraResult, payrollResult] = await Promise.allSettled([
    reconcileFCRAFunds(tenantId, period),
    reconcilePayrollGL(tenantId, period),
  ]);

  const extended = [
    ...results,
    {
      type: 'FCRA_FUNDS',
      label: 'FCRA DBA vs FC Ledger',
      status: fcraResult.status === 'fulfilled' ? (fcraResult.value.balanced ? 'PASSED' : 'FAILED') : 'ERROR',
      detail: fcraResult.status === 'fulfilled' ? fcraResult.value : { error: fcraResult.reason?.message },
    },
    {
      type: 'PAYROLL_GL',
      label: 'Payroll Payable vs GL',
      status: payrollResult.status === 'fulfilled' ? (payrollResult.value.balanced ? 'PASSED' : 'FAILED') : 'ERROR',
      detail: payrollResult.status === 'fulfilled' ? payrollResult.value : { error: payrollResult.reason?.message },
    },
  ];

  // Raise exceptions for failures
  const engine = getExceptionEngine();
  for (const r of extended) {
    if (r.status === 'FAILED') {
      await engine.raiseReconMismatch(tenantId, {
        reconType: r.type,
        variance: r.detail?.variance || '0',
        period,
      }).catch(() => {}); // non-fatal
    }
  }

  res.json({ period, data: extended });
}));

// ─── Unmatched items for one recon type ───────────────────────────────────────

router.get('/workbench', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { type, period, page = 1, limit = 50 } = req.query;
  const { tenantId } = req;

  if (!type || !period) return res.status(400).json({ error: 'type and period are required' });

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 0);  // last day of month

  let glItems = [], sourceItems = [], summary = {};

  switch (type) {
    case 'AR_GL': {
      [glItems, sourceItems, summary] = await fetchARvsGL(tenantId, startDate, endDate, offset, parseInt(limit));
      break;
    }
    case 'AP_GL': {
      [glItems, sourceItems, summary] = await fetchAPvsGL(tenantId, startDate, endDate, offset, parseInt(limit));
      break;
    }
    case 'BANK_CASHBOOK': {
      [glItems, sourceItems, summary] = await fetchBankVsCashbook(tenantId, startDate, endDate, offset, parseInt(limit));
      break;
    }
    case 'FCRA_FUNDS': {
      [glItems, sourceItems, summary] = await fetchFCRAFunds(tenantId, startDate, endDate, offset, parseInt(limit));
      break;
    }
    case 'PAYROLL_GL': {
      [glItems, sourceItems, summary] = await fetchPayrollGL(tenantId, startDate, endDate, offset, parseInt(limit));
      break;
    }
    case 'FCRA_UTILISATION_GL': {
      [glItems, sourceItems, summary] = await fetchFCRAUtilGL(tenantId, startDate, endDate, offset, parseInt(limit));
      break;
    }
    default:
      return res.status(400).json({ error: `Unknown recon type: ${type}` });
  }

  res.json({ type, period, glItems, sourceItems, summary });
}));

// ─── Match action ─────────────────────────────────────────────────────────────

router.post('/match', requirePermission('accounting:write'), asyncHandler(async (req, res) => {
  const { journalEntryId, sourceId, reconType } = req.body;
  const { tenantId } = req;

  if (!journalEntryId) return res.status(400).json({ error: 'journalEntryId required' });

  await sequelize.query(
    `UPDATE journal_entries
     SET recon_status = 'MATCHED', updated_at = NOW()
     WHERE id = :journalEntryId AND tenant_id = :tenantId`,
    { replacements: { journalEntryId, tenantId } }
  );

  await logEvent({
    tenantId,
    userId: req.user.id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.RECON_MATCHED,
    entity: 'JournalEntry',
    entityId: journalEntryId,
    module: 'reconciliation',
    metadata: { reconType, sourceId, priorStatus: 'UNMATCHED', newStatus: 'MATCHED' },
    critical: true,
  });

  res.json({ success: true, journalEntryId, reconStatus: 'MATCHED' });
}));

// ─── Unmatch action ───────────────────────────────────────────────────────────

router.post('/unmatch', requirePermission('accounting:write'), asyncHandler(async (req, res) => {
  const { journalEntryId } = req.body;
  const { tenantId } = req;

  await sequelize.query(
    `UPDATE journal_entries
     SET recon_status = 'UNMATCHED', updated_at = NOW()
     WHERE id = :journalEntryId AND tenant_id = :tenantId`,
    { replacements: { journalEntryId, tenantId } }
  );

  await logEvent({
    tenantId,
    userId: req.user.id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.RECON_UNMATCHED,
    entity: 'JournalEntry',
    entityId: journalEntryId,
    module: 'reconciliation',
    metadata: { priorStatus: 'MATCHED', newStatus: 'UNMATCHED' },
    critical: true,
  });

  res.json({ success: true, journalEntryId, reconStatus: 'UNMATCHED' });
}));

// ─── Dispute action ───────────────────────────────────────────────────────────

router.post('/dispute', requirePermission('accounting:write'), asyncHandler(async (req, res) => {
  const { journalEntryId, reason } = req.body;
  const { tenantId } = req;

  await sequelize.query(
    `UPDATE journal_entries
     SET recon_status = 'DISPUTED', updated_at = NOW()
     WHERE id = :journalEntryId AND tenant_id = :tenantId`,
    { replacements: { journalEntryId, tenantId } }
  );

  await logEvent({
    tenantId,
    userId: req.user.id,
    userEmail: req.user.email,
    action: AUDIT_ACTIONS.RECON_DISPUTED,
    entity: 'JournalEntry',
    entityId: journalEntryId,
    module: 'reconciliation',
    metadata: { reason, priorStatus: 'UNMATCHED', newStatus: 'DISPUTED' },
    critical: true,
  });

  // Raise exception for disputed items
  const engine = getExceptionEngine();
  await engine.raise({
    tenantId,
    exceptionType: EXCEPTION_TYPES.RECON_MISMATCH,
    entityType: 'journal_entry',
    entityId: journalEntryId,
    sourceModule: 'reconciliation',
    title: 'Reconciliation dispute raised',
    description: reason || 'Journal entry marked as disputed during reconciliation',
    metadata: { journalEntryId, reason },
  }).catch(() => {});

  res.json({ success: true, journalEntryId, reconStatus: 'DISPUTED' });
}));

// ─── Item fetchers ────────────────────────────────────────────────────────────

async function fetchARvsGL(tenantId, startDate, endDate, offset, limit) {
  const qt = sequelize.QueryTypes;

  const [glItems, sourceItems, summary] = await Promise.all([
    sequelize.query(
      `SELECT je.id, je.entry_number, je.date, je.narration, je.fund_type, je.recon_status,
              je.source_module, je.source_id,
              COALESCE(SUM(jl.credit), 0) AS amount
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       JOIN accounts a ON a.id = jl.account_id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND je.source_module = 'patient-billing'
         AND je.recon_status IN ('UNMATCHED', 'DISPUTED')
         AND a.code LIKE '1200%'
       GROUP BY je.id
       ORDER BY je.date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
    sequelize.query(
      `SELECT id, invoice_number, patient_name, net_amount AS amount,
              status, created_at, journal_entry_id
       FROM patient_invoices
       WHERE tenant_id = :tenantId
         AND created_at BETWEEN :start AND :end
         AND status NOT IN ('CANCELLED')
         AND (journal_entry_id IS NULL OR balance_amount > 0.01)
       ORDER BY created_at DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
    sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE recon_status = 'MATCHED')   AS matched,
         COUNT(*) FILTER (WHERE recon_status = 'UNMATCHED') AS unmatched,
         COUNT(*) FILTER (WHERE recon_status = 'DISPUTED')  AS disputed,
         COALESCE(SUM(CASE WHEN recon_status = 'UNMATCHED' THEN (
           SELECT COALESCE(SUM(jl.credit), 0) FROM journal_lines jl
           JOIN accounts a ON a.id = jl.account_id
           WHERE jl.journal_entry_id = je.id AND a.code LIKE '1200%'
         ) END), 0) AS variance
       FROM journal_entries je
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND je.source_module = 'patient-billing'`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: qt.SELECT }
    ),
  ]);

  return [glItems, sourceItems, summary[0] || {}];
}

async function fetchAPvsGL(tenantId, startDate, endDate, offset, limit) {
  const qt = sequelize.QueryTypes;

  const [glItems, sourceItems] = await Promise.all([
    sequelize.query(
      `SELECT je.id, je.entry_number, je.date, je.narration, je.fund_type, je.recon_status,
              je.source_module, je.source_id,
              COALESCE(SUM(jl.credit), 0) AS amount
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       JOIN accounts a ON a.id = jl.account_id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND je.source_module = 'accounts-payable'
         AND je.recon_status IN ('UNMATCHED', 'DISPUTED')
         AND a.code LIKE '2100%'
       GROUP BY je.id
       ORDER BY je.date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
    sequelize.query(
      `SELECT id, invoice_number, vendor_name, net_amount AS amount, status, invoice_date, journal_entry_id
       FROM vendor_invoices
       WHERE tenant_id = :tenantId
         AND invoice_date BETWEEN :start AND :end
         AND status NOT IN ('CANCELLED')
       ORDER BY invoice_date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
  ]);

  return [glItems, sourceItems, {}];
}

async function fetchBankVsCashbook(tenantId, startDate, endDate, offset, limit) {
  const qt = sequelize.QueryTypes;

  const [glItems, sourceItems] = await Promise.all([
    sequelize.query(
      `SELECT je.id, je.entry_number, je.date, je.narration, je.recon_status,
              COALESCE(SUM(jl.debit), 0) AS debit, COALESCE(SUM(jl.credit), 0) AS credit
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       JOIN accounts a ON a.id = jl.account_id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND je.recon_status IN ('UNMATCHED', 'DISPUTED')
         AND a.code LIKE '1110%'
       GROUP BY je.id
       ORDER BY je.date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
    sequelize.query(
      `SELECT id, transaction_date, description, amount, transaction_type, reference_number, is_reconciled
       FROM bank_transactions
       WHERE tenant_id = :tenantId
         AND transaction_date BETWEEN :start AND :end
         AND is_reconciled = false
       ORDER BY transaction_date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
  ]);

  return [glItems, sourceItems, {}];
}

async function fetchFCRAFunds(tenantId, startDate, endDate, offset, limit) {
  const qt = sequelize.QueryTypes;

  const [glItems, sourceItems] = await Promise.all([
    sequelize.query(
      `SELECT je.id, je.entry_number, je.date, je.narration, je.fund_type, je.recon_status,
              je.posting_event,
              COALESCE(SUM(jl.debit), 0) AS debit, COALESCE(SUM(jl.credit), 0) AS credit
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND je.fund_type = 'FCRA'
         AND je.recon_status IN ('UNMATCHED', 'DISPUTED')
       GROUP BY je.id
       ORDER BY je.date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
    sequelize.query(
      `SELECT r.id, r.receipt_date, r.amount_foreign, r.amount_inr, r.currency,
              d.name AS donor_name, r.status, r.bank_account_id, r.utilization_status
       FROM fcra_receipts r
       JOIN fcra_donors d ON d.id = r.donor_id
       WHERE r.tenant_id = :tenantId
         AND r.receipt_date BETWEEN :start AND :end
         AND r.status = 'VERIFIED'
       ORDER BY r.receipt_date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
  ]);

  return [glItems, sourceItems, {}];
}

async function fetchPayrollGL(tenantId, startDate, endDate, offset, limit) {
  const qt = sequelize.QueryTypes;

  const [glItems, sourceItems] = await Promise.all([
    sequelize.query(
      `SELECT je.id, je.entry_number, je.date, je.narration, je.recon_status, je.source_id,
              COALESCE(SUM(jl.debit), 0) AS debit
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND je.source_module = 'payroll'
         AND je.recon_status IN ('UNMATCHED', 'DISPUTED')
       GROUP BY je.id
       ORDER BY je.date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
    sequelize.query(
      `SELECT id, year, month, status, total_gross, total_net, total_pf_expense, total_esi_expense,
              journal_entry_id, posted_at
       FROM payroll_runs
       WHERE tenant_id = :tenantId
         AND year = :year AND month = :month
         AND status IN ('APPROVED', 'POSTED')
       ORDER BY created_at DESC
       LIMIT :limit OFFSET :offset`,
      {
        replacements: {
          tenantId, limit, offset,
          year: startDate.getFullYear(),
          month: startDate.getMonth() + 1,
        },
        type: qt.SELECT,
      }
    ),
  ]);

  return [glItems, sourceItems, {}];
}

async function fetchFCRAUtilGL(tenantId, startDate, endDate, offset, limit) {
  const qt = sequelize.QueryTypes;

  const [glItems, sourceItems] = await Promise.all([
    sequelize.query(
      `SELECT je.id, je.entry_number, je.date, je.narration, je.fund_type, je.recon_status,
              COALESCE(SUM(jl.debit), 0) AS amount
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND je.fund_type = 'FCRA'
         AND je.posting_event = 'FCRA_UTILISATION_APPROVED'
         AND je.recon_status IN ('UNMATCHED', 'DISPUTED')
       GROUP BY je.id
       ORDER BY je.date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
    sequelize.query(
      `SELECT u.id, u.voucher_number, u.utilization_date, u.amount, u.description,
              u.status, p.project_name, u.category
       FROM fcra_utilisations u
       LEFT JOIN fcra_projects p ON p.id = u.project_id
       WHERE u.tenant_id = :tenantId
         AND u.utilization_date BETWEEN :start AND :end
         AND u.status = 'APPROVED'
       ORDER BY u.utilization_date DESC
       LIMIT :limit OFFSET :offset`,
      { replacements: { tenantId, start: startDate, end: endDate, limit, offset }, type: qt.SELECT }
    ),
  ]);

  return [glItems, sourceItems, {}];
}

// ─── Helper reconciliation functions ──────────────────────────────────────────

async function reconcileFCRAFunds(tenantId, period) {
  const [year, month] = period.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate   = new Date(year, month, 0);
  const qt = sequelize.QueryTypes;

  const [fcraJournalTotal] = await sequelize.query(
    `SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS balance
     FROM journal_entries je
     JOIN journal_lines jl ON jl.journal_entry_id = je.id
     JOIN accounts a ON a.id = jl.account_id
     WHERE je.tenant_id = :tenantId
       AND je.fund_type = 'FCRA'
       AND je.date BETWEEN :start AND :end`,
    { replacements: { tenantId, start: startDate, end: endDate }, type: qt.SELECT }
  );

  const [fcraReceiptTotal] = await sequelize.query(
    `SELECT COALESCE(SUM(amount_inr), 0) AS total
     FROM fcra_receipts
     WHERE tenant_id = :tenantId
       AND receipt_date BETWEEN :start AND :end
       AND status = 'VERIFIED'`,
    { replacements: { tenantId, start: startDate, end: endDate }, type: qt.SELECT }
  );

  const glBal = new Decimal(fcraJournalTotal[0]?.balance || 0);
  const fcraTotal = new Decimal(fcraReceiptTotal[0]?.total || 0);
  const variance = glBal.minus(fcraTotal).abs();

  return {
    balanced: variance.lessThanOrEqualTo('0.01'),
    variance: variance.toFixed(2),
    glBalance: glBal.toFixed(2),
    fcraTotal: fcraTotal.toFixed(2),
  };
}

async function reconcilePayrollGL(tenantId, period) {
  const [year, month] = period.split('-').map(Number);
  const qt = sequelize.QueryTypes;

  const [payrollTotal] = await sequelize.query(
    `SELECT COALESCE(SUM(total_gross), 0) AS total
     FROM payroll_runs
     WHERE tenant_id = :tenantId AND year = :year AND month = :month AND status = 'POSTED'`,
    { replacements: { tenantId, year, month }, type: qt.SELECT }
  );

  const [glTotal] = await sequelize.query(
    `SELECT COALESCE(SUM(jl.debit), 0) AS total
     FROM journal_entries je
     JOIN journal_lines jl ON jl.journal_entry_id = je.id
     JOIN accounts a ON a.id = jl.account_id
     WHERE je.tenant_id = :tenantId
       AND je.source_module = 'payroll'
       AND EXTRACT(year FROM je.date) = :year
       AND EXTRACT(month FROM je.date) = :month
       AND a.code LIKE '5100%'`,
    { replacements: { tenantId, year, month }, type: qt.SELECT }
  );

  const payroll = new Decimal(payrollTotal[0]?.total || 0);
  const gl = new Decimal(glTotal[0]?.total || 0);
  const variance = payroll.minus(gl).abs();

  return {
    balanced: variance.lessThanOrEqualTo('0.01'),
    variance: variance.toFixed(2),
    payrollTotal: payroll.toFixed(2),
    glTotal: gl.toFixed(2),
  };
}

module.exports = router;
