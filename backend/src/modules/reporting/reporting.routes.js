'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const reportService = require('./services/report.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');
const { getFinancialHealthEngine } = require('./services/FinancialHealthEngine');
const { sequelize } = require('../../config/database');

router.use(authenticate);

router.get('/pl', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const { from, to, branch_id, department_id, compare_with_prior } = req.query;
  const result = await reportService.generatePL(
    req.tenantId, from, to,
    { branchId: branch_id, departmentId: department_id, compareWithPrior: compare_with_prior === 'true' }
  );
  res.json({ data: result });
}));

router.get('/balance-sheet', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const { as_of, branch_id } = req.query;
  const result = await reportService.generateBalanceSheet(req.tenantId, as_of, { branchId: branch_id });
  res.json({ data: result });
}));

router.get('/cash-flow', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const result = await reportService.generateCashFlow(req.tenantId, from, to);
  res.json({ data: result });
}));

router.get('/cfo-dashboard', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const result = await reportService.getCFODashboard(req.tenantId);
  res.json({ data: result });
}));

// ─── Route 1: GET /cfo-summary ────────────────────────────────────────────────
router.get('/cfo-summary', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;

  // Primary dashboard data + health score (run concurrently)
  const [cfoData, health] = await Promise.all([
    reportService.getCFODashboard(tenantId),
    getFinancialHealthEngine(sequelize).computeHealthScore(tenantId),
  ]);

  // Secondary queries — all non-fatal
  let exceptions = { open: 0, critical: 0 };
  try {
    const exRows = await sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'OPEN')                              AS open,
         COUNT(*) FILTER (WHERE status = 'OPEN' AND severity = 'CRITICAL')   AS critical
       FROM financial_exceptions
       WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    );
    exceptions = {
      open: parseInt(exRows[0]?.open || 0, 10),
      critical: parseInt(exRows[0]?.critical || 0, 10),
    };
  } catch (_) {}

  let periodClose = { lastLocked: null, currentPeriod: new Date().toISOString().slice(0, 7) };
  try {
    const pcRows = await sequelize.query(
      `SELECT period, action, performed_at
       FROM period_close_log
       WHERE tenant_id = :tenantId
       ORDER BY performed_at DESC
       LIMIT 1`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    );
    if (pcRows.length > 0) {
      periodClose.lastLocked = pcRows[0];
    }
  } catch (_) {}

  let payroll = { mtdTotal: '0', pendingRuns: 0 };
  try {
    const prRows = await sequelize.query(
      `SELECT COALESCE(SUM(total_net), 0) AS mtd
       FROM payroll_runs
       WHERE tenant_id = :tenantId
         AND status = 'POSTED'
         AND DATE_TRUNC('month', posted_at) = DATE_TRUNC('month', NOW())`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    );
    payroll.mtdTotal = String(prRows[0]?.mtd || '0');
  } catch (_) {}

  let fcra = { adminCapPct: '0.0', isAtRisk: false, isBreached: false };
  try {
    const fcraComp = health.components.find((c) => c.id === 'fcra');
    if (fcraComp) {
      fcra = {
        adminCapPct: String(fcraComp.detail.adminCapPct ?? '0.0'),
        isAtRisk: fcraComp.detail.isAtRisk,
        isBreached: fcraComp.detail.isBreached,
      };
    }
  } catch (_) {}

  res.json({
    data: {
      revenue: cfoData.revenue ?? {},
      cashPosition: cfoData.cashPosition ?? { total: '0', accounts: [] },
      accountsReceivable: cfoData.accountsReceivable ?? {},
      accountsPayable: cfoData.accountsPayable ?? {},
      insurance: cfoData.insurance ?? {},
      payroll,
      exceptions,
      periodClose,
      fcra,
      health,
      generatedAt: new Date().toISOString(),
    },
  });
}));

// ─── Route 2: GET /health-score ───────────────────────────────────────────────
router.get('/health-score', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const result = await getFinancialHealthEngine(sequelize).computeHealthScore(req.tenantId);
  res.json({ data: result });
}));

// ─── Route 3: GET /trial-balance ──────────────────────────────────────────────
router.get('/trial-balance', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const { as_of, from, to } = req.query;
  const tenantId = req.tenantId;

  const asOf = as_of || new Date().toISOString().slice(0, 10);

  // Build date filter depending on mode
  let dateFilter;
  let replacements;
  if (as_of) {
    dateFilter = 'je.date <= :asOf';
    replacements = { tenantId, asOf };
  } else if (from && to) {
    dateFilter = 'je.date BETWEEN :from AND :to';
    replacements = { tenantId, from, to, asOf: to };
  } else {
    dateFilter = 'je.date <= :asOf';
    replacements = { tenantId, asOf };
  }

  const accounts = await sequelize.query(
    `SELECT
       a.code, a.name, a.type, a.sub_type, a.is_group, a.level,
       a.opening_balance,
       COALESCE(SUM(jl.debit_amount)  FILTER (WHERE je.status = 'POSTED' AND ${dateFilter} AND je.tenant_id = :tenantId), 0) AS total_debit,
       COALESCE(SUM(jl.credit_amount) FILTER (WHERE je.status = 'POSTED' AND ${dateFilter} AND je.tenant_id = :tenantId), 0) AS total_credit
     FROM accounts a
     LEFT JOIN journal_lines jl ON jl.account_id = a.id
     LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE a.tenant_id = :tenantId AND a.is_active = true
     GROUP BY a.id, a.code, a.name, a.type, a.sub_type, a.is_group, a.level, a.opening_balance
     ORDER BY a.code`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  // Compute closing balance per account (opening + debit movements - credit movements)
  const rows = accounts.map((a) => {
    const opening = parseFloat(a.opening_balance || 0);
    const debit = parseFloat(a.total_debit || 0);
    const credit = parseFloat(a.total_credit || 0);
    // Normal balance: ASSET/EXPENSE → debit-normal; LIABILITY/EQUITY/INCOME → credit-normal
    const closingBalance = opening + debit - credit;
    return { ...a, opening_balance: opening, total_debit: debit, total_credit: credit, closing_balance: closingBalance };
  });

  const totalDebit = rows.reduce((s, r) => s + r.total_debit, 0);
  const totalCredit = rows.reduce((s, r) => s + r.total_credit, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  res.json({
    data: {
      reportType: 'TRIAL_BALANCE',
      asOf: as_of || asOf,
      from: from || null,
      to: to || null,
      accounts: rows,
      totalDebit,
      totalCredit,
      isBalanced,
      generatedAt: new Date().toISOString(),
    },
  });
}));

// ─── Route 4: GET /fcra-fund-statement ────────────────────────────────────────
router.get('/fcra-fund-statement', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const { from, to, registration_id } = req.query;
  const tenantId = req.tenantId;

  const regFilter = registration_id ? 'AND r.id = :registrationId' : '';
  const replacements = {
    tenantId,
    from: from || new Date(new Date().getFullYear(), 3, 1).toISOString().slice(0, 10),
    to: to || new Date().toISOString().slice(0, 10),
  };
  if (registration_id) replacements.registrationId = registration_id;

  const registrations = await sequelize.query(
    `SELECT
       r.id AS reg_id,
       r.fcra_number AS registration_number,
       r.organization_name AS organisation_name,
       COALESCE(SUM(fr.amount) FILTER (WHERE fr.receipt_date BETWEEN :from AND :to), 0)                                      AS receipts,
       COALESCE(SUM(fu.amount) FILTER (WHERE fu.utilization_date BETWEEN :from AND :to AND fu.category != 'administrative'), 0) AS programme_expenses,
       COALESCE(SUM(fu.amount) FILTER (WHERE fu.utilization_date BETWEEN :from AND :to AND fu.category = 'administrative'), 0)  AS admin_expenses,
       COALESCE(SUM(fa.current_value), 0)                                                                                      AS asset_value
     FROM fcra_registrations r
     LEFT JOIN fcra_receipts fr
       ON fr.registration_id = r.id AND fr.tenant_id = :tenantId
     LEFT JOIN fcra_utilisations fu
       ON fu.registration_id = r.id AND fu.tenant_id = :tenantId
     LEFT JOIN fcra_assets fa
       ON fa.registration_id = r.id AND fa.tenant_id = :tenantId
     WHERE r.tenant_id = :tenantId
       ${regFilter}
     GROUP BY r.id, r.fcra_number, r.organization_name`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  res.json({
    data: {
      reportType: 'FCRA_FUND_STATEMENT',
      period: { from: replacements.from, to: replacements.to },
      registrations,
      generatedAt: new Date().toISOString(),
    },
  });
}));

// ─── Route 5: GET /dept-pl ────────────────────────────────────────────────────
router.get('/dept-pl', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const tenantId = req.tenantId;

  const fromDate = from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  const toDate = to || new Date().toISOString().slice(0, 10);

  const departments = await sequelize.query(
    `SELECT
       billing_type AS department,
       SUM(CASE WHEN status IN ('FINALIZED', 'PAID', 'PARTIALLY_PAID') THEN net_amount ELSE 0 END) AS revenue,
       COUNT(CASE WHEN status IN ('FINALIZED', 'PAID', 'PARTIALLY_PAID') THEN 1 END)               AS invoice_count
     FROM patient_invoices
     WHERE tenant_id = :tenantId
       AND invoice_date BETWEEN :from AND :to
     GROUP BY billing_type
     ORDER BY revenue DESC`,
    { replacements: { tenantId, from: fromDate, to: toDate }, type: sequelize.QueryTypes.SELECT }
  );

  res.json({
    data: {
      reportType: 'DEPT_PL',
      period: { from: fromDate, to: toDate },
      departments,
      generatedAt: new Date().toISOString(),
    },
  });
}));

module.exports = router;
