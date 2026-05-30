'use strict';

const Decimal = require('decimal.js');
const { sequelize } = require('../../../config/database');
const { tenantCache } = require('../../../shared/cache/cacheService');

/**
 * Financial Reporting Service
 * Generates P&L, Balance Sheet, Cash Flow, and custom reports.
 */

/**
 * Generate Profit & Loss Statement.
 *
 * @param {string} tenantId
 * @param {Date} fromDate
 * @param {Date} toDate
 * @param {Object} filters
 * @returns {Object} P&L report
 */
async function generatePL(tenantId, fromDate, toDate, filters = {}) {
  const { branchId, departmentId, compareWithPrior = false } = filters;

  const cacheKey = `pl:${fromDate}:${toDate}:${branchId || ''}:${departmentId || ''}`;
  const cached = await tenantCache.get(tenantId, 'reports', cacheKey);
  if (cached) return cached;

  const dimFilter = buildDimensionFilter(branchId, departmentId);

  // Income accounts
  const incomeRows = await sequelize.query(
    `SELECT
       a.id, a.code, a.name, a.parent_id, a.level, a.is_group,
       COALESCE(SUM(jl.credit_amount - jl.debit_amount), 0) as net_amount
     FROM accounts a
     LEFT JOIN (
       SELECT jl.*
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       WHERE je.status = 'POSTED'
         AND je.date >= :fromDate AND je.date <= :toDate
         AND je.tenant_id = :tenantId
         ${dimFilter}
     ) jl ON jl.account_id = a.id
     WHERE a.tenant_id = :tenantId AND a.type = 'INCOME' AND a.is_active = true
     GROUP BY a.id, a.code, a.name, a.parent_id, a.level, a.is_group
     ORDER BY a.code`,
    { replacements: { tenantId, fromDate, toDate, branchId, departmentId }, type: sequelize.QueryTypes.SELECT }
  );

  // Expense accounts
  const expenseRows = await sequelize.query(
    `SELECT
       a.id, a.code, a.name, a.parent_id, a.level, a.is_group,
       COALESCE(SUM(jl.debit_amount - jl.credit_amount), 0) as net_amount
     FROM accounts a
     LEFT JOIN (
       SELECT jl.*
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       WHERE je.status = 'POSTED'
         AND je.date >= :fromDate AND je.date <= :toDate
         AND je.tenant_id = :tenantId
         ${dimFilter}
     ) jl ON jl.account_id = a.id
     WHERE a.tenant_id = :tenantId AND a.type = 'EXPENSE' AND a.is_active = true
     GROUP BY a.id, a.code, a.name, a.parent_id, a.level, a.is_group
     ORDER BY a.code`,
    { replacements: { tenantId, fromDate, toDate, branchId, departmentId }, type: sequelize.QueryTypes.SELECT }
  );

  const totalIncome = incomeRows
    .filter((r) => !r.is_group)
    .reduce((sum, r) => sum.plus(new Decimal(r.net_amount || 0)), new Decimal(0));

  const totalExpense = expenseRows
    .filter((r) => !r.is_group)
    .reduce((sum, r) => sum.plus(new Decimal(r.net_amount || 0)), new Decimal(0));

  const netProfit = totalIncome.minus(totalExpense);

  const result = {
    reportType: 'PROFIT_AND_LOSS',
    period: { from: fromDate, to: toDate },
    income: {
      accounts: incomeRows,
      total: totalIncome.toFixed(2),
    },
    expense: {
      accounts: expenseRows,
      total: totalExpense.toFixed(2),
    },
    netProfit: netProfit.toFixed(2),
    isProfitable: netProfit.greaterThanOrEqualTo(0),
    profitMargin: totalIncome.isZero() ? '0.00' :
      netProfit.dividedBy(totalIncome).times(100).toFixed(2),
    generatedAt: new Date().toISOString(),
  };

  await tenantCache.set(tenantId, 'reports', cacheKey, result, { ttl: 300, tags: [`financial-reports:${tenantId}`] });
  return result;
}

/**
 * Generate Balance Sheet.
 */
async function generateBalanceSheet(tenantId, asOfDate, filters = {}) {
  const { branchId } = filters;

  const cacheKey = `bs:${asOfDate}:${branchId || ''}`;
  const cached = await tenantCache.get(tenantId, 'reports', cacheKey);
  if (cached) return cached;

  const getAccountBalances = async (accountType, normalBalance) => {
    const sign = normalBalance === 'DEBIT' ? 1 : -1;
    return sequelize.query(
      `SELECT
         a.id, a.code, a.name, a.parent_id, a.level, a.is_group, a.sub_type,
         (a.opening_balance + COALESCE(SUM(
           CASE WHEN je.date <= :asOfDate AND je.status = 'POSTED'
                THEN (jl.debit_amount - jl.credit_amount) * :sign
                ELSE 0 END
         ), 0)) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id AND je.tenant_id = :tenantId
       WHERE a.tenant_id = :tenantId AND a.type = :accountType AND a.is_active = true
       GROUP BY a.id, a.code, a.name, a.parent_id, a.level, a.is_group, a.sub_type, a.opening_balance
       ORDER BY a.code`,
      { replacements: { tenantId, asOfDate, accountType, sign }, type: sequelize.QueryTypes.SELECT }
    );
  };

  const [assets, liabilities, equity] = await Promise.all([
    getAccountBalances('ASSET', 'DEBIT'),
    getAccountBalances('LIABILITY', 'CREDIT'),
    getAccountBalances('EQUITY', 'CREDIT'),
  ]);

  const totalAssets = assets
    .filter((a) => !a.is_group)
    .reduce((sum, a) => sum.plus(new Decimal(a.balance || 0)), new Decimal(0));

  const totalLiabilities = liabilities
    .filter((a) => !a.is_group)
    .reduce((sum, a) => sum.plus(new Decimal(a.balance || 0)), new Decimal(0));

  const totalEquity = equity
    .filter((a) => !a.is_group)
    .reduce((sum, a) => sum.plus(new Decimal(a.balance || 0)), new Decimal(0));

  const result = {
    reportType: 'BALANCE_SHEET',
    asOfDate,
    assets: { accounts: assets, total: totalAssets.toFixed(2) },
    liabilities: { accounts: liabilities, total: totalLiabilities.toFixed(2) },
    equity: { accounts: equity, total: totalEquity.toFixed(2) },
    totalLiabilitiesAndEquity: totalLiabilities.plus(totalEquity).toFixed(2),
    isBalanced: totalAssets.minus(totalLiabilities.plus(totalEquity)).abs().lessThan(0.01),
    difference: totalAssets.minus(totalLiabilities.plus(totalEquity)).toFixed(2),
    generatedAt: new Date().toISOString(),
  };

  await tenantCache.set(tenantId, 'reports', cacheKey, result, { ttl: 300, tags: [`financial-reports:${tenantId}`] });
  return result;
}

/**
 * Generate Cash Flow Statement (Indirect Method).
 */
async function generateCashFlow(tenantId, fromDate, toDate) {
  // Opening cash position
  const [openingCash] = await sequelize.query(
    `SELECT COALESCE(SUM(a.current_balance), 0) as cash
     FROM accounts a
     WHERE a.tenant_id = :tenantId
       AND (a.is_cash_account = true OR a.is_bank_account = true)`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  // Cash inflows
  const [receipts] = await sequelize.query(
    `SELECT COALESCE(SUM(jl.debit_amount), 0) as total_receipts
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     JOIN accounts a ON a.id = jl.account_id
     WHERE je.tenant_id = :tenantId AND je.status = 'POSTED'
       AND je.date >= :fromDate AND je.date <= :toDate
       AND je.voucher_type = 'RECEIPT'
       AND (a.is_cash_account = true OR a.is_bank_account = true)`,
    { replacements: { tenantId, fromDate, toDate }, type: sequelize.QueryTypes.SELECT }
  );

  // Cash outflows
  const [payments] = await sequelize.query(
    `SELECT COALESCE(SUM(jl.credit_amount), 0) as total_payments
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     JOIN accounts a ON a.id = jl.account_id
     WHERE je.tenant_id = :tenantId AND je.status = 'POSTED'
       AND je.date >= :fromDate AND je.date <= :toDate
       AND je.voucher_type = 'PAYMENT'
       AND (a.is_cash_account = true OR a.is_bank_account = true)`,
    { replacements: { tenantId, fromDate, toDate }, type: sequelize.QueryTypes.SELECT }
  );

  const totalReceipts = new Decimal(receipts.total_receipts || 0);
  const totalPayments = new Decimal(payments.total_payments || 0);
  const netCashFlow = totalReceipts.minus(totalPayments);

  return {
    reportType: 'CASH_FLOW',
    period: { from: fromDate, to: toDate },
    openingCashBalance: parseFloat(openingCash.cash || 0).toFixed(2),
    operatingActivities: {
      receipts: totalReceipts.toFixed(2),
      payments: totalPayments.toFixed(2),
      netCashFromOperations: netCashFlow.toFixed(2),
    },
    netCashFlow: netCashFlow.toFixed(2),
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get CFO Dashboard KPIs.
 */
async function getCFODashboard(tenantId) {
  const logger = require('../../../shared/utils/logger');

  const safeQuery = async (label, sql, replacements) => {
    try {
      const rows = await sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
      const row = rows[0] || {};
      logger.info(`CFO safeQuery [${label}]`, { tenantId, row });
      return row;
    } catch (err) {
      logger.error(`CFO safeQuery [${label}] failed`, { tenantId, error: err.message });
      return {};
    }
  };

  const safeQueryAll = async (label, sql, replacements) => {
    try {
      return await sequelize.query(sql, { replacements, type: sequelize.QueryTypes.SELECT });
    } catch (err) {
      logger.error(`CFO safeQueryAll [${label}] failed`, { tenantId, error: err.message });
      return [];
    }
  };

  const BILLING_TYPE_LABEL = {
    OP: 'OPD', IP: 'IPD', ICU: 'ICU', OT: 'OT',
    DAYCARE: 'Day Care', PACKAGE: 'Package', PHARMACY: 'Pharmacy',
    LAB: 'Laboratory', RADIOLOGY: 'Radiology',
  };

  const [revenue, claims, cash, payables, revenueByDept] = await Promise.all([
    safeQuery('revenue',
      `SELECT
         SUM(CASE WHEN status IN ('FINALIZED', 'PAID', 'PARTIALLY_PAID') THEN net_amount ELSE 0 END) as total_revenue,
         SUM(CASE WHEN status IN ('FINALIZED', 'PAID', 'PARTIALLY_PAID') AND invoice_date >= DATE_TRUNC('month', NOW()) THEN net_amount ELSE 0 END) as this_month_revenue,
         SUM(CASE WHEN status IN ('FINALIZED', 'PARTIALLY_PAID') THEN balance_amount ELSE 0 END) as outstanding_ar,
         COUNT(CASE WHEN status = 'DRAFT' THEN 1 END) as draft_invoices
       FROM patient_invoices WHERE tenant_id = :tenantId`,
      { tenantId }
    ),
    safeQuery('claims',
      `SELECT
         SUM(CASE WHEN status NOT IN ('SETTLED', 'WRITTEN_OFF', 'DRAFT') THEN claimed_amount ELSE 0 END) as pending_claims,
         COUNT(CASE WHEN status NOT IN ('SETTLED', 'WRITTEN_OFF', 'DRAFT') THEN 1 END) as pending_claim_count
       FROM claims WHERE tenant_id = :tenantId`,
      { tenantId }
    ),
    safeQuery('cash',
      `SELECT SUM(current_balance) as total_cash
       FROM accounts
       WHERE tenant_id = :tenantId AND (is_cash_account = true OR is_bank_account = true)`,
      { tenantId }
    ),
    safeQuery('payables',
      `SELECT COALESCE(SUM(net_amount - paid_amount), 0) as total_payables
       FROM vendor_invoices WHERE tenant_id = :tenantId AND status NOT IN ('PAID', 'CANCELLED')`,
      { tenantId }
    ),
    safeQueryAll('revenueByDept',
      `SELECT
         billing_type,
         SUM(CASE WHEN status IN ('FINALIZED', 'PAID', 'PARTIALLY_PAID') THEN net_amount ELSE 0 END) as revenue
       FROM patient_invoices
       WHERE tenant_id = :tenantId
       GROUP BY billing_type
       ORDER BY revenue DESC`,
      { tenantId }
    ),
  ]);

  const ytd = parseFloat(revenue.total_revenue || 0);
  const revenueByDeptMapped = revenueByDept
    .map((r) => ({
      dept: BILLING_TYPE_LABEL[r.billing_type] || r.billing_type,
      billingType: r.billing_type,
      revenue: parseFloat(r.revenue || 0).toFixed(2),
      pct: ytd > 0 ? parseFloat(((parseFloat(r.revenue || 0) / ytd) * 100).toFixed(1)) : 0,
    }))
    .filter((r) => parseFloat(r.revenue) > 0);

  return {
    revenue: {
      ytd: ytd.toFixed(2),
      thisMonth: parseFloat(revenue.this_month_revenue || 0).toFixed(2),
      byDept: revenueByDeptMapped,
    },
    accountsReceivable: {
      outstanding: parseFloat(revenue.outstanding_ar || 0).toFixed(2),
      pendingInvoices: parseInt(revenue.draft_invoices || 0),
    },
    insurance: {
      pendingClaims: parseFloat(claims.pending_claims || 0).toFixed(2),
      pendingCount: parseInt(claims.pending_claim_count || 0),
    },
    cashPosition: parseFloat(cash.total_cash || 0).toFixed(2),
    accountsPayable: parseFloat(payables.total_payables || 0).toFixed(2),
    generatedAt: new Date().toISOString(),
  };
}

function buildDimensionFilter(branchId, departmentId) {
  const conditions = [];
  if (branchId) conditions.push('AND jl.branch_id = :branchId');
  if (departmentId) conditions.push('AND jl.department_id = :departmentId');
  return conditions.join(' ');
}

module.exports = {
  generatePL,
  generateBalanceSheet,
  generateCashFlow,
  getCFODashboard,
};
