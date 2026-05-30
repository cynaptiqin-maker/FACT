'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const aiService = require('./services/aiAssistant.service');
const reportService = require('../reporting/services/report.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

router.post('/query', requirePermission('ai:query'), asyncHandler(async (req, res) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ message: 'Question is required' });
  const result = await aiService.processNaturalLanguageQuery(question, req.tenantId, req.user);
  res.json({ data: result });
}));

router.post('/anomalies', requirePermission('ai:anomalies'), asyncHandler(async (req, res) => {
  const result = await aiService.detectAnomalies(req.tenantId);
  res.json({ data: result });
}));

router.get('/cfo-insights', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const dashboardData = await reportService.getCFODashboard(req.tenantId);
  const result = await aiService.generateCFOInsights(req.tenantId, dashboardData);
  res.json({ data: result });
}));

router.get('/history', requirePermission('ai:query'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const rows = await sequelize.query(
    'SELECT id, query, summary, created_at FROM ai_queries WHERE tenant_id = :tenantId ORDER BY created_at DESC LIMIT 20',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

// ─── GET /api/ai/context?module=MODULE_ID ─────────────────────────────────────
// Returns live, rule-based insights + KPIs for a specific module page.
// Works without OpenAI — insights are derived purely from DB data.
router.get('/context', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const tenantId = req.tenantId;
  const mod = (req.query.module || '').toLowerCase();

  let insights = [];
  let kpis = {};

  const fmt = (n) => {
    const v = Number(n || 0);
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000) return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  try {
    if (['ar', 'ar-invoices', 'ar-aging'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID')) AS open_count,
           COALESCE(SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID')), 0) AS total_outstanding,
           COALESCE(SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND invoice_date < CURRENT_DATE - INTERVAL '90 days'), 0) AS overdue_90,
           COALESCE(SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND invoice_date < CURRENT_DATE - INTERVAL '60 days'), 0) AS overdue_60,
           COUNT(*) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND invoice_date < CURRENT_DATE - INTERVAL '90 days') AS overdue_90_count
         FROM patient_invoices WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
      kpis = rows[0] || {};
      const o90 = Number(kpis.overdue_90 || 0), o60 = Number(kpis.overdue_60 || 0);
      const total = Number(kpis.total_outstanding || 0), cnt90 = Number(kpis.overdue_90_count || 0);
      if (o90 > 0) insights.push({ title: `${fmt(o90)} overdue >90 days`, detail: `${cnt90} accounts at high default risk. Immediate collections call recommended before write-off threshold.`, severity: 'critical', icon: 'AlertOctagon', action: 'View Aging Report' });
      if (o60 > o90 * 1.5 && o60 > 0) insights.push({ title: 'AR aging worsening', detail: `${fmt(o60 - o90)} moved into 60–90 day bucket. Act now to prevent further aging.`, severity: 'warning', icon: 'TrendingUp', action: 'View Collection Queue' });
      if (total > 0 && o90 / total > 0.25) insights.push({ title: 'Collection rate deteriorating', detail: `>${Math.round((o90 / total) * 100)}% of AR is >90 days. Consider early-payment incentives or collection agency escalation.`, severity: 'warning', icon: 'AlertTriangle', action: 'Run Analysis' });
      if (!insights.length) insights.push({ title: 'AR position healthy', detail: 'No significant aging risk detected. Continue monitoring and ensure timely follow-ups.', severity: 'info', icon: 'Shield', action: 'View Dashboard' });
    }

    else if (['ap', 'ap-invoices'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_approval,
           COALESCE(SUM(net_amount) FILTER (WHERE status = 'PENDING'), 0) AS pending_amount,
           COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('PAID','CANCELLED')) AS overdue_count,
           COALESCE(SUM(net_amount) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('PAID','CANCELLED')), 0) AS overdue_amount,
           COALESCE(SUM(net_amount) FILTER (WHERE due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + 7 AND status NOT IN ('PAID','CANCELLED')), 0) AS due_this_week
         FROM vendor_invoices WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
      kpis = rows[0] || {};
      const pa = Number(kpis.pending_amount || 0), oa = Number(kpis.overdue_amount || 0);
      if (Number(kpis.pending_approval || 0) > 0) insights.push({ title: `${kpis.pending_approval} invoices awaiting approval`, detail: `${fmt(pa)} on hold. Delayed approvals risk early-pay discounts and vendor relationships.`, severity: 'warning', icon: 'AlertTriangle', action: 'Review Pending' });
      if (oa > 0) insights.push({ title: `${fmt(oa)} past due to vendors`, detail: `${kpis.overdue_count} vendor invoices past due date. Risk of supply disruption and penalty interest.`, severity: 'critical', icon: 'AlertOctagon', action: 'Prioritise Payments' });
      if (Number(kpis.due_this_week || 0) > 0) insights.push({ title: `${fmt(kpis.due_this_week)} due in next 7 days`, detail: 'Plan cash outflow for upcoming AP obligations. Check bank balances before scheduling payments.', severity: 'info', icon: 'TrendingUp', action: 'Schedule Payments' });
      if (!insights.length) insights.push({ title: 'AP position healthy', detail: 'No overdue vendor invoices detected. All payables are on schedule.', severity: 'info', icon: 'Shield', action: 'View Dashboard' });
    }

    else if (['billing', 'billing-invoices', 'new-invoice'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_count,
           COALESCE(SUM(total_amount) FILTER (WHERE DATE(invoice_date) = CURRENT_DATE), 0) AS today_revenue,
           COALESCE(SUM(total_amount) FILTER (WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS mtd_revenue,
           COUNT(*) FILTER (WHERE billing_type = 'INSURANCE' AND DATE(invoice_date) = CURRENT_DATE) AS insurance_today
         FROM patient_invoices WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
      kpis = rows[0] || {};
      const draft = Number(kpis.draft_count || 0);
      if (draft > 3) insights.push({ title: `${draft} invoices in draft`, detail: 'Draft invoices are not posted to AR. Finalize to record revenue accurately.', severity: 'warning', icon: 'AlertTriangle', action: 'Finalize Invoices' });
      if (Number(kpis.today_revenue || 0) > 0) insights.push({ title: `${fmt(kpis.today_revenue)} billed today`, detail: 'Ensure all IP patients are billed before day-end to capture revenue completely.', severity: 'info', icon: 'TrendingUp', action: "View Today's Invoices" });
      if (Number(kpis.insurance_today || 0) > 0) insights.push({ title: `${kpis.insurance_today} insurance bills today`, detail: 'Insurance-linked invoices need claim submission within 24 hours to meet TPA TAT requirements.', severity: 'info', icon: 'Shield', action: 'Submit Claims' });
      if (!insights.length) insights.push({ title: 'Billing running normally', detail: 'No alerts in patient billing. Revenue capture looks complete.', severity: 'info', icon: 'Shield', action: 'View Dashboard' });
    }

    else if (['insurance', 'insurance-claims', 'insurance-aging'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
           COUNT(*) FILTER (WHERE status IN ('SUBMITTED','UNDER_REVIEW')) AS pending,
           COUNT(*) AS total,
           COALESCE(SUM(claimed_amount) FILTER (WHERE status IN ('SUBMITTED','UNDER_REVIEW')), 0) AS pending_value,
           COALESCE(SUM(claimed_amount) FILTER (WHERE status = 'REJECTED' AND updated_at >= CURRENT_DATE - INTERVAL '30 days'), 0) AS rejected_value,
           COUNT(*) FILTER (WHERE status IN ('SUBMITTED','UNDER_REVIEW') AND created_at < CURRENT_DATE - INTERVAL '45 days') AS stale_count
         FROM claims WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
      kpis = rows[0] || {};
      if (Number(kpis.rejected || 0) > 0) insights.push({ title: `${kpis.rejected} claims rejected`, detail: `${fmt(kpis.rejected_value)} rejected this month. Analyse denial reason codes for systemic issues.`, severity: 'critical', icon: 'AlertOctagon', action: 'Review Denials' });
      if (Number(kpis.stale_count || 0) > 0) insights.push({ title: `${kpis.stale_count} claims pending >45 days`, detail: 'Claims without response risk financial year write-off. Escalate to TPA relationship managers.', severity: 'warning', icon: 'AlertTriangle', action: 'Escalate Claims' });
      if (Number(kpis.pending || 0) > 0) insights.push({ title: `${fmt(kpis.pending_value)} in active claims`, detail: `${kpis.pending} claims under review. Track TAT by TPA to prioritise follow-up.`, severity: 'info', icon: 'TrendingUp', action: 'View Pipeline' });
      if (!insights.length) insights.push({ title: 'Claims processing healthy', detail: 'No high-risk claims detected. Continue monitoring settlement timelines.', severity: 'info', icon: 'Shield', action: 'View Dashboard' });
    }

    else if (['cash-bank', 'cash-book'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT COALESCE(SUM(current_balance), 0) AS total_cash, COUNT(*) AS bank_count,
                COUNT(*) FILTER (WHERE current_balance < 50000) AS low_balance_count
         FROM bank_accounts WHERE tenant_id = :tenantId AND is_active = true`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
      kpis = rows[0] || {};
      const cash = Number(kpis.total_cash || 0);
      if (cash < 200000) insights.push({ title: 'Low cash position', detail: `Only ${fmt(cash)} across all bank accounts. Plan collections or credit drawdown before payroll.`, severity: 'critical', icon: 'AlertOctagon', action: 'View Treasury' });
      else if (cash < 500000) insights.push({ title: 'Cash below comfort zone', detail: `${fmt(cash)} in bank. Monitor outflows — AP and payroll obligations are upcoming.`, severity: 'warning', icon: 'AlertTriangle', action: 'View Cash Position' });
      if (Number(kpis.low_balance_count || 0) > 0) insights.push({ title: `${kpis.low_balance_count} accounts below ₹50K`, detail: 'Ensure minimum balance requirements are met to avoid penalty charges.', severity: 'warning', icon: 'AlertTriangle', action: 'Review Accounts' });
      if (!insights.length) insights.push({ title: 'Cash position healthy', detail: `${fmt(cash)} available across ${kpis.bank_count} bank accounts. No immediate liquidity concerns.`, severity: 'info', icon: 'Shield', action: 'View Dashboard' });
    }

    else if (['bank-reconciliation', 'reconciliation'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT COUNT(*) FILTER (WHERE reconciled = false OR reconciled IS NULL) AS unreconciled, COUNT(*) AS total
         FROM bank_transactions WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      ).catch(() => [{ unreconciled: 0, total: 0 }]);
      kpis = rows[0] || {};
      const unr = Number(kpis.unreconciled || 0);
      if (unr > 20) insights.push({ title: `${unr} unreconciled transactions`, detail: 'Large backlog. Old unmatched entries may indicate errors or fraud. Use AI auto-match to clear faster.', severity: 'critical', icon: 'AlertOctagon', action: 'Start Reconciliation' });
      else if (unr > 0) insights.push({ title: `${unr} transactions need matching`, detail: 'Use AI auto-match for routine entries. Focus manual review on high-value items.', severity: 'warning', icon: 'AlertTriangle', action: 'Auto-Match' });
      if (!insights.length) insights.push({ title: 'Reconciliation up to date', detail: 'No significant unreconciled items detected.', severity: 'info', icon: 'Shield', action: 'View Report' });
    }

    else if (['general-ledger', 'gl', 'journal-voucher', 'core-accounting', 'coa'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_count,
                COALESCE(SUM(total_debit) FILTER (WHERE status = 'DRAFT'), 0) AS draft_value
         FROM journal_entries WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      );
      kpis = rows[0] || {};
      const drafts = Number(kpis.draft_count || 0);
      if (drafts > 5) insights.push({ title: `${drafts} unposted journal entries`, detail: `${fmt(kpis.draft_value)} in draft entries not posted to ledger. Post before period close.`, severity: 'warning', icon: 'AlertTriangle', action: 'Post Journals' });
      if (!insights.length) insights.push({ title: 'Ledger posting current', detail: 'All journal entries are posted. Ledger is up to date.', severity: 'info', icon: 'Shield', action: 'View Ledger' });
    }

    else if (['fixed-assets', 'depreciation'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT COUNT(*) AS total_assets, COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_assets,
                COUNT(*) FILTER (WHERE status = 'ACTIVE' AND last_depreciation_date < CURRENT_DATE - INTERVAL '35 days') AS overdue_depreciation
         FROM assets WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      ).catch(() => [{ total_assets: 0, active_assets: 0, overdue_depreciation: 0 }]);
      kpis = rows[0] || {};
      if (Number(kpis.overdue_depreciation || 0) > 0) insights.push({ title: `${kpis.overdue_depreciation} assets need depreciation`, detail: 'Run depreciation before period close to ensure accurate asset values and P&L.', severity: 'warning', icon: 'AlertTriangle', action: 'Run Depreciation' });
      if (!insights.length) insights.push({ title: 'Asset register healthy', detail: `${kpis.active_assets} active assets — depreciation appears current.`, severity: 'info', icon: 'Shield', action: 'View Register' });
    }

    else if (['payroll'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_runs,
                COALESCE(SUM(total_net) FILTER (WHERE status = 'POSTED' AND DATE_TRUNC('month', posted_at) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS mtd_payroll
         FROM payroll_runs WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      ).catch(() => [{ draft_runs: 0, mtd_payroll: 0 }]);
      kpis = rows[0] || {};
      if (Number(kpis.draft_runs || 0) > 0) insights.push({ title: `${kpis.draft_runs} payroll run(s) in draft`, detail: 'Process before statutory deadline to avoid PF/ESI penalties.', severity: 'warning', icon: 'AlertTriangle', action: 'Process Payroll' });
      if (!insights.length) insights.push({ title: 'Payroll current', detail: `MTD payroll ${fmt(kpis.mtd_payroll)} processed. No pending runs detected.`, severity: 'info', icon: 'Shield', action: 'View Payslips' });
    }

    else if (['doctor-payout', 'revenue-sharing'].includes(mod)) {
      const rows = await sequelize.query(
        `SELECT COUNT(*) AS open_payouts FROM payroll_runs WHERE tenant_id = :tenantId AND status = 'DRAFT'`,
        { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
      ).catch(() => [{ open_payouts: 0 }]);
      kpis = rows[0] || {};
      if (Number(kpis.open_payouts || 0) > 0) insights.push({ title: `${kpis.open_payouts} payout(s) pending`, detail: 'Doctor revenue share payouts not yet processed. Delayed payouts affect doctor retention.', severity: 'warning', icon: 'AlertTriangle', action: 'Process Payouts' });
      else insights.push({ title: 'Payout processing current', detail: 'Doctor payout runs are up to date. No pending payouts detected.', severity: 'info', icon: 'Shield', action: 'View Payouts' });
    }

    else {
      insights.push({ title: 'AI Copilot active', detail: 'Your AI finance assistant is ready. Ask any question about this module\'s data.', severity: 'info', icon: 'Sparkles', action: 'Start Chat' });
    }
  } catch (err) {
    insights.push({ title: 'AI analysis ready', detail: 'Connect to your database to see real-time insights for this module.', severity: 'info', icon: 'Sparkles', action: 'Start Chat' });
  }

  res.json({ data: { insights, kpis, module: mod } });
}));

// ─── POST /api/ai/context-query ───────────────────────────────────────────────
// Contextual NL query with module-specific fallback when OpenAI unavailable.
router.post('/context-query', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { question, module: mod, kpis = {} } = req.body;
  if (!question) return res.status(400).json({ message: 'question is required' });

  // Try GPT-4o with context if available
  if (process.env.OPENAI_API_KEY) {
    try {
      const result = await aiService.processNaturalLanguageQuery(question, req.tenantId, req.user);
      return res.json({ data: { response: result.summary || result.answer } });
    } catch {
      // fall through to rule-based
    }
  }

  const fmt = (n) => {
    const v = Number(n || 0);
    if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
    if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
    return `₹${v.toLocaleString('en-IN')}`;
  };

  const q = question.toLowerCase();
  let response;

  if (q.includes('overdue') || q.includes('aging') || q.includes('default')) {
    const o = fmt(kpis.overdue_90 || kpis.overdue_amount || 0);
    response = `Based on current data, ${o} is overdue >90 days. ${Number(kpis.overdue_90_count || kpis.overdue_count || 0)} accounts are at high risk. Recommended: immediate collection escalation for oldest accounts first.`;
  } else if (q.includes('cash') || q.includes('liquidity')) {
    response = `Current cash position: ${fmt(kpis.total_cash || 0)}. ${Number(kpis.due_this_week || 0) > 0 ? `${fmt(kpis.due_this_week)} is due to vendors this week.` : ''} Monitor outflows to maintain adequate liquidity for payroll and AP.`;
  } else if (q.includes('claim') || q.includes('reject') || q.includes('tpa')) {
    response = `${kpis.rejected || 0} claims rejected (${fmt(kpis.rejected_value || 0)}). ${kpis.stale_count || 0} claims pending >45 days. Review denial reason codes — most rejections are documentation gaps or ICD coding errors.`;
  } else if (q.includes('pending') || q.includes('approval') || q.includes('draft')) {
    response = `${kpis.pending_approval || kpis.draft_count || kpis.draft_runs || 0} items awaiting action. ${fmt(kpis.pending_amount || kpis.pending_value || 0)} is on hold. Address these to keep workflows and cash flow moving.`;
  } else if (q.includes('payroll') || q.includes('salary')) {
    response = `MTD payroll: ${fmt(kpis.mtd_payroll || 0)}. ${kpis.draft_runs || 0} payroll run(s) in draft. Ensure processing before statutory deadlines to avoid PF/ESI late filing penalties.`;
  } else {
    response = `I've analysed the ${mod || 'module'} data. ${Object.keys(kpis).length > 0 ? 'Actionable items are highlighted in the insights panel.' : 'No immediate critical alerts detected.'} Ask me a specific question for a detailed analysis.`;
  }

  res.json({ data: { response } });
}));

module.exports = router;
