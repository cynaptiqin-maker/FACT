'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

// ─── /api/command-center/summary ─────────────────────────────────────────────
// Master aggregation: financial pulse KPIs + task counts + recent activity
router.get('/summary', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const tenantId = req.tenantId;

  const [
    billingStats,
    arStats,
    apStats,
    claimStats,
    bankStats,
    payrollStats,
    journalStats,
    fcraStats,
  ] = await Promise.all([

    // Today's patient billing
    sequelize.query(
      `SELECT
         COALESCE(SUM(total_amount) FILTER (WHERE DATE(invoice_date) = CURRENT_DATE), 0) AS today_revenue,
         COALESCE(SUM(total_amount) FILTER (WHERE DATE(invoice_date) >= DATE_TRUNC('month', CURRENT_DATE)), 0) AS mtd_revenue,
         COUNT(*) FILTER (WHERE status = 'DRAFT') AS pending_finalize,
         COUNT(*) FILTER (WHERE DATE(invoice_date) = CURRENT_DATE) AS today_invoices
       FROM patient_invoices WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ),

    // AR outstanding
    sequelize.query(
      `SELECT
         COALESCE(SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID')), 0) AS total_outstanding,
         COALESCE(SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND invoice_date < CURRENT_DATE - INTERVAL '30 days'), 0) AS overdue_amount,
         COUNT(*) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND invoice_date < CURRENT_DATE - INTERVAL '30 days') AS overdue_count
       FROM patient_invoices WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ),

    // AP due this week
    sequelize.query(
      `SELECT
         COALESCE(SUM(net_amount) FILTER (WHERE status IN ('APPROVED','PARTIAL') AND due_date <= CURRENT_DATE + INTERVAL '7 days'), 0) AS due_this_week,
         COALESCE(SUM(net_amount) FILTER (WHERE status = 'PENDING'), 0) AS pending_approval_amount,
         COUNT(*) FILTER (WHERE status = 'PENDING') AS pending_approval_count
       FROM vendor_invoices WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ due_this_week: 0, pending_approval_amount: 0, pending_approval_count: 0 }]),

    // Insurance claims
    sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'SUBMITTED') AS submitted,
         COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW') AS under_review,
         COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected_this_month,
         COALESCE(SUM(claimed_amount) FILTER (WHERE status IN ('SUBMITTED','UNDER_REVIEW')), 0) AS pending_value
       FROM claims WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ submitted: 0, under_review: 0, rejected_this_month: 0, pending_value: 0 }]),

    // Bank cash position
    sequelize.query(
      `SELECT
         COALESCE(SUM(current_balance), 0) AS total_cash,
         COUNT(*) AS bank_accounts
       FROM bank_accounts WHERE tenant_id = :tenantId AND is_active = true`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ total_cash: 0, bank_accounts: 0 }]),

    // Payroll
    sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'DRAFT') AS runs_pending,
         COALESCE(SUM(total_net) FILTER (WHERE status = 'POSTED' AND DATE_TRUNC('month', posted_at) = DATE_TRUNC('month', CURRENT_DATE)), 0) AS mtd_payroll
       FROM payroll_runs WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ runs_pending: 0, mtd_payroll: 0 }]),

    // Journal entries pending post
    sequelize.query(
      `SELECT COUNT(*) AS pending_post
       FROM journal_entries WHERE tenant_id = :tenantId AND status = 'DRAFT'`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ pending_post: 0 }]),

    // FCRA: draft utilisations + overdue compliance + admin cap
    sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE u.status = 'draft') AS draft_utilisations,
         COUNT(*) FILTER (WHERE c.status = 'overdue') AS overdue_compliance,
         COALESCE(
           (SELECT COALESCE(SUM(amount_inr),0) FROM fcra_receipts
            WHERE tenant_id = :tenantId
              AND status IN ('verified','partially_utilized','fully_utilized')
              AND receipt_date >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '3 months')),
           0
         ) AS fy_receipts_inr,
         COALESCE(
           (SELECT COALESCE(SUM(amount),0) FROM fcra_utilisations
            WHERE tenant_id = :tenantId AND status = 'approved' AND category = 'administrative'
              AND utilization_date >= DATE_TRUNC('year', CURRENT_DATE - INTERVAL '3 months')),
           0
         ) AS admin_utilized
       FROM (SELECT id, status, tenant_id FROM fcra_utilisations WHERE tenant_id = :tenantId) u
       FULL OUTER JOIN (SELECT id, status, tenant_id FROM fcra_compliances WHERE tenant_id = :tenantId) c
         ON false`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ draft_utilisations: 0, overdue_compliance: 0, fy_receipts_inr: 0, admin_utilized: 0 }]),
  ]);

  const billing = billingStats[0] || {};
  const ar = arStats[0] || {};
  const ap = apStats[0] || {};
  const claims = claimStats[0] || {};
  const bank = bankStats[0] || {};
  const payroll = payrollStats[0] || {};
  const journals = journalStats[0] || {};
  const fcra = fcraStats[0] || {};

  const fcraFYReceipts = Number(fcra.fy_receipts_inr || 0);
  const fcraAdminUsed  = Number(fcra.admin_utilized || 0);
  const fcraAdminPct   = fcraFYReceipts > 0 ? (fcraAdminUsed / fcraFYReceipts) * 100 : 0;

  // Compute total pending tasks (FCRA draft utilisations count as tasks)
  const totalTasks =
    Number(billing.pending_finalize || 0) +
    Number(ap.pending_approval_count || 0) +
    Number(payroll.runs_pending || 0) +
    Number(journals.pending_post || 0) +
    Number(fcra.draft_utilisations || 0);

  res.json({
    data: {
      kpis: {
        todayRevenue: Number(billing.today_revenue || 0),
        mtdRevenue: Number(billing.mtd_revenue || 0),
        cashPosition: Number(bank.total_cash || 0),
        arOutstanding: Number(ar.total_outstanding || 0),
        arOverdue: Number(ar.overdue_amount || 0),
        apDueThisWeek: Number(ap.due_this_week || 0),
        claimsPendingValue: Number(claims.pending_value || 0),
        mtdPayroll: Number(payroll.mtd_payroll || 0),
      },
      taskCounts: {
        total: totalTasks,
        pendingInvoices: Number(billing.pending_finalize || 0),
        pendingApprovals: Number(ap.pending_approval_count || 0),
        payrollRuns: Number(payroll.runs_pending || 0),
        journalsDraft: Number(journals.pending_post || 0),
        claimsRejected: Number(claims.rejected_this_month || 0),
        arOverdueCount: Number(ar.overdue_count || 0),
        fcraUtilisationDraft: Number(fcra.draft_utilisations || 0),
        fcraComplianceOverdue: Number(fcra.overdue_compliance || 0),
        fcraAdminCapPct: parseFloat(fcraAdminPct.toFixed(1)),
        fcraAdminCapBreach: fcraAdminPct > 20,
      },
      claims: {
        submitted: Number(claims.submitted || 0),
        underReview: Number(claims.under_review || 0),
      },
    },
  });
}));

// ─── /api/command-center/tasks ────────────────────────────────────────────────
// Unified task inbox: all actionable items across modules
router.get('/tasks', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const tenantId = req.tenantId;
  const limit = Math.min(parseInt(req.query.limit) || 20, 50);

  const tasks = [];

  const [draftInvoices, pendingAP, draftJournals, draftPayroll, rejectedClaims, fcraUtilisations, fcraCompliances] = await Promise.all([
    // Draft patient invoices awaiting finalization
    sequelize.query(
      `SELECT id, invoice_number, patient_name, total_amount, invoice_date, billing_type
       FROM patient_invoices
       WHERE tenant_id = :tenantId AND status = 'DRAFT'
       ORDER BY invoice_date DESC LIMIT 10`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),

    // AP invoices pending approval
    sequelize.query(
      `SELECT id, invoice_number, vendor_name, net_amount AS amount, due_date, created_at
       FROM vendor_invoices
       WHERE tenant_id = :tenantId AND status = 'PENDING'
       ORDER BY due_date ASC LIMIT 10`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),

    // Draft journal entries
    sequelize.query(
      `SELECT id, reference_number, description, total_debit, created_at
       FROM journal_entries
       WHERE tenant_id = :tenantId AND status = 'DRAFT'
       ORDER BY created_at DESC LIMIT 10`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),

    // Draft payroll runs
    sequelize.query(
      `SELECT id, CONCAT(year, '-', LPAD(month::text, 2, '0')) AS period_name,
              total_employees AS employee_count, total_gross AS gross_pay, total_net AS net_pay, created_at
       FROM payroll_runs
       WHERE tenant_id = :tenantId AND status = 'DRAFT'
       ORDER BY created_at DESC LIMIT 5`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),

    // Rejected insurance claims
    sequelize.query(
      `SELECT c.id, c.claim_number, c.patient_name, c.claimed_amount, c.updated_at,
              COALESCE(i.name, 'Unknown Insurer') AS insurer_name
       FROM claims c
       LEFT JOIN insurers i ON i.id = c.insurer_id
       WHERE c.tenant_id = :tenantId AND c.status = 'REJECTED'
         AND c.updated_at >= CURRENT_DATE - INTERVAL '30 days'
       ORDER BY c.updated_at DESC LIMIT 10`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),

    // FCRA draft utilisation vouchers needing approval
    sequelize.query(
      `SELECT u.id, u.voucher_number, u.amount, u.category, u.utilization_date, u.purpose,
              r.organization_name AS org_name
       FROM fcra_utilisations u
       LEFT JOIN fcra_registrations r ON r.id = u.registration_id
       WHERE u.tenant_id = :tenantId AND u.status = 'draft'
       ORDER BY u.created_at ASC LIMIT 10`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),

    // FCRA overdue compliance items
    sequelize.query(
      `SELECT c.id, c.title, c.due_date, c.compliance_type, c.penalty_amount,
              r.organization_name AS org_name
       FROM fcra_compliances c
       LEFT JOIN fcra_registrations r ON r.id = c.registration_id
       WHERE c.tenant_id = :tenantId AND c.status = 'overdue'
       ORDER BY c.due_date ASC LIMIT 5`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),
  ]);

  // Normalize all into a unified task shape
  draftInvoices.forEach(inv => tasks.push({
    id: `inv-${inv.id}`,
    type: 'INVOICE_DRAFT',
    priority: 'medium',
    title: `Finalize Invoice ${inv.invoice_number}`,
    subtitle: `${inv.patient_name} · ${inv.billing_type}`,
    amount: Number(inv.total_amount),
    date: inv.invoice_date,
    action: 'Finalize',
    href: `/billing/invoices`,
    module: 'Patient Billing',
    icon: 'FileText',
  }));

  pendingAP.forEach(ap => tasks.push({
    id: `ap-${ap.id}`,
    type: 'AP_APPROVAL',
    priority: new Date(ap.due_date) < new Date() ? 'high' : 'medium',
    title: `Approve Vendor Invoice ${ap.invoice_number}`,
    subtitle: `${ap.vendor_name} · Due ${ap.due_date ? new Date(ap.due_date).toLocaleDateString('en-IN') : 'N/A'}`,
    amount: Number(ap.amount),
    date: ap.created_at,
    action: 'Approve',
    href: `/ap/vendor-invoices`,
    module: 'Accounts Payable',
    icon: 'CheckCircle',
  }));

  draftJournals.forEach(je => tasks.push({
    id: `je-${je.id}`,
    type: 'JOURNAL_DRAFT',
    priority: 'low',
    title: `Post Journal ${je.reference_number || je.id}`,
    subtitle: je.description || 'Manual journal entry',
    amount: Number(je.total_debit),
    date: je.created_at,
    action: 'Post',
    href: `/accounting/journal`,
    module: 'Core Accounting',
    icon: 'BookOpen',
  }));

  draftPayroll.forEach(pr => tasks.push({
    id: `pr-${pr.id}`,
    type: 'PAYROLL_PENDING',
    priority: 'high',
    title: `Process Payroll: ${pr.period_name}`,
    subtitle: `${pr.employee_count} employees · Net ₹${Number(pr.net_pay || 0).toLocaleString('en-IN')}`,
    amount: Number(pr.net_pay),
    date: pr.created_at,
    action: 'Process',
    href: `/payroll/run`,
    module: 'Payroll',
    icon: 'Users',
  }));

  rejectedClaims.forEach(c => tasks.push({
    id: `claim-${c.id}`,
    type: 'CLAIM_REJECTED',
    priority: 'high',
    title: `Resubmit Claim ${c.claim_number}`,
    subtitle: `${c.patient_name} · ${c.insurer_name}`,
    amount: Number(c.claimed_amount),
    date: c.updated_at,
    action: 'Resubmit',
    href: `/insurance`,
    module: 'Insurance / TPA',
    icon: 'ShieldAlert',
  }));

  fcraUtilisations.forEach(u => tasks.push({
    id: `fcra-util-${u.id}`,
    type: 'FCRA_UTILISATION',
    priority: 'medium',
    title: `Approve FC Voucher ${u.voucher_number}`,
    subtitle: `${u.org_name || 'FCRA'} · ${u.category} · ${u.purpose || ''}`.replace(/\s·\s$/, ''),
    amount: Number(u.amount),
    date: u.utilization_date,
    action: 'Approve',
    href: `/fcra/utilisation`,
    module: 'FCRA',
    icon: 'Globe',
  }));

  fcraCompliances.forEach(c => tasks.push({
    id: `fcra-comp-${c.id}`,
    type: 'FCRA_COMPLIANCE',
    priority: 'high',
    title: `Overdue: ${c.title}`,
    subtitle: `${c.org_name || 'FCRA'} · Due ${c.due_date}${c.penalty_amount > 0 ? ` · ₹${Number(c.penalty_amount).toLocaleString('en-IN')} penalty` : ''}`,
    amount: Number(c.penalty_amount || 0),
    date: c.due_date,
    action: 'Complete',
    href: `/fcra/compliance`,
    module: 'FCRA',
    icon: 'Calendar',
  }));

  // Sort: high priority first, then by date desc
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  tasks.sort((a, b) => {
    const pd = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pd !== 0) return pd;
    return new Date(b.date) - new Date(a.date);
  });

  res.json({ data: tasks.slice(0, limit), total: tasks.length });
}));

// ─── /api/command-center/alerts ──────────────────────────────────────────────
// Alert feed: anomalies + overdue items + system alerts
router.get('/alerts', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const tenantId = req.tenantId;

  const alerts = [];

  const [overdueAR, overdueAP, overdueClaimsResult, fcraAlerts] = await Promise.all([
    // AR overdue > 60 days
    sequelize.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(balance_amount), 0) AS amount
       FROM patient_invoices
       WHERE tenant_id = :tenantId
         AND status IN ('FINALIZED','PARTIALLY_PAID')
         AND invoice_date < CURRENT_DATE - INTERVAL '60 days'`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ count: 0, amount: 0 }]),

    // AP overdue (past due date, not paid)
    sequelize.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(net_amount), 0) AS amount
       FROM vendor_invoices
       WHERE tenant_id = :tenantId
         AND status IN ('APPROVED','PARTIAL')
         AND due_date < CURRENT_DATE`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ count: 0, amount: 0 }]),

    // Claims stuck > 45 days
    sequelize.query(
      `SELECT COUNT(*) AS count, COALESCE(SUM(claimed_amount), 0) AS amount
       FROM claims
       WHERE tenant_id = :tenantId
         AND status IN ('SUBMITTED','UNDER_REVIEW')
         AND created_at < CURRENT_DATE - INTERVAL '45 days'`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ count: 0, amount: 0 }]),

    // FCRA: admin cap status + overdue compliance + FC-4 due
    sequelize.query(
      `SELECT
         COALESCE((
           SELECT SUM(amount_inr) FROM fcra_receipts
           WHERE tenant_id = :tenantId
             AND status IN ('verified','partially_utilized','fully_utilized')
             AND receipt_date >= (DATE_TRUNC('year', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '3 months')
         ), 0) AS fy_receipts,
         COALESCE((
           SELECT SUM(amount) FROM fcra_utilisations
           WHERE tenant_id = :tenantId AND status = 'approved' AND category = 'administrative'
             AND utilization_date >= (DATE_TRUNC('year', CURRENT_DATE - INTERVAL '3 months') + INTERVAL '3 months')
         ), 0) AS admin_utilized,
         (SELECT COUNT(*) FROM fcra_compliances WHERE tenant_id = :tenantId AND status = 'overdue') AS overdue_compliance,
         (SELECT COUNT(*) FROM fcra_fc4_filings
          WHERE tenant_id = :tenantId AND status = 'draft'
            AND CAST(SPLIT_PART(financial_year, '-', 1) AS INTEGER) = EXTRACT(YEAR FROM CURRENT_DATE - INTERVAL '3 months')
         ) AS fc4_drafts`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ fy_receipts: 0, admin_utilized: 0, overdue_compliance: 0, fc4_drafts: 0 }]),
  ]);

  if (Number(overdueAR[0]?.count) > 0) {
    alerts.push({
      id: 'ar-overdue-60',
      severity: 'high',
      type: 'AR_OVERDUE',
      title: `${overdueAR[0].count} invoices overdue > 60 days`,
      description: `₹${Number(overdueAR[0].amount).toLocaleString('en-IN')} in receivables at risk of write-off.`,
      action: 'View AR Aging',
      href: '/ar/aging',
      icon: 'AlertTriangle',
      ts: new Date().toISOString(),
    });
  }

  if (Number(overdueAP[0]?.count) > 0) {
    alerts.push({
      id: 'ap-overdue',
      severity: 'medium',
      type: 'AP_OVERDUE',
      title: `${overdueAP[0].count} vendor invoices past due`,
      description: `₹${Number(overdueAP[0].amount).toLocaleString('en-IN')} payable overdue — vendor relationships at risk.`,
      action: 'View AP',
      href: '/ap',
      icon: 'Clock',
      ts: new Date().toISOString(),
    });
  }

  if (Number(overdueClaimsResult[0]?.count) > 0) {
    alerts.push({
      id: 'claims-stale',
      severity: 'medium',
      type: 'CLAIM_STALE',
      title: `${overdueClaimsResult[0].count} claims pending > 45 days`,
      description: `₹${Number(overdueClaimsResult[0].amount).toLocaleString('en-IN')} in claims without response — follow-up required.`,
      action: 'View Claims',
      href: '/insurance',
      icon: 'ShieldAlert',
      ts: new Date().toISOString(),
    });
  }

  // FCRA alerts
  const fcra = fcraAlerts[0] || {};
  const fcraReceipts = Number(fcra.fy_receipts || 0);
  const fcraAdmin = Number(fcra.admin_utilized || 0);
  const fcraAdminPct = fcraReceipts > 0 ? (fcraAdmin / fcraReceipts) * 100 : 0;

  if (fcraAdminPct > 20) {
    alerts.push({
      id: 'fcra-admin-cap-breach',
      severity: 'high',
      type: 'FCRA_ADMIN_CAP',
      title: `FCRA Admin Cap Breached (${fcraAdminPct.toFixed(1)}%)`,
      description: `Administrative expenses have exceeded the 20% FCRA limit. Immediate corrective action required before FC-4 filing.`,
      action: 'View FCRA Reports',
      href: '/fcra/reports',
      icon: 'Globe',
      ts: new Date().toISOString(),
    });
  } else if (fcraAdminPct > 15) {
    alerts.push({
      id: 'fcra-admin-cap-warning',
      severity: 'medium',
      type: 'FCRA_ADMIN_CAP',
      title: `FCRA Admin Cap Warning (${fcraAdminPct.toFixed(1)}%)`,
      description: `Admin expenses approaching 20% FCRA limit. Only ${(20 - fcraAdminPct).toFixed(1)}% headroom remaining.`,
      action: 'View Dashboard',
      href: '/fcra',
      icon: 'Globe',
      ts: new Date().toISOString(),
    });
  }

  if (Number(fcra.overdue_compliance) > 0) {
    alerts.push({
      id: 'fcra-compliance-overdue',
      severity: 'high',
      type: 'FCRA_COMPLIANCE_OVERDUE',
      title: `${fcra.overdue_compliance} FCRA Compliance Items Overdue`,
      description: `Overdue FCRA filings may attract penalties. Review compliance calendar immediately.`,
      action: 'View Calendar',
      href: '/fcra/compliance',
      icon: 'Calendar',
      ts: new Date().toISOString(),
    });
  }

  // FC-4 due by 31 December — warn in Q3 (Oct–Dec)
  const now = new Date();
  if (now.getMonth() >= 9 && Number(fcra.fc4_drafts) === 0) {
    alerts.push({
      id: 'fcra-fc4-due',
      severity: 'medium',
      type: 'FCRA_FC4_DUE',
      title: 'FCRA FC-4 Filing Due 31 December',
      description: 'Annual FC-4 return must be filed with MHA by 31 December. No draft found for current year.',
      action: 'Start FC-4',
      href: '/fcra/fc4',
      icon: 'Calendar',
      ts: new Date().toISOString(),
    });
  }

  // Add static operational guidance if no alerts
  if (alerts.length === 0) {
    alerts.push({
      id: 'all-clear',
      severity: 'info',
      type: 'ALL_CLEAR',
      title: 'All systems healthy',
      description: 'No critical financial alerts detected. Continue monitoring.',
      action: null,
      href: null,
      icon: 'CheckCircle',
      ts: new Date().toISOString(),
    });
  }

  res.json({ data: alerts });
}));

// ─── /api/command-center/activity ─────────────────────────────────────────────
// Recent activity feed across modules
router.get('/activity', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const tenantId = req.tenantId;

  const [recent] = await Promise.all([
    sequelize.query(
      `(SELECT 'invoice' AS type, invoice_number AS ref, patient_name AS entity,
               total_amount AS amount, status, updated_at AS ts
        FROM patient_invoices WHERE tenant_id = :tenantId ORDER BY updated_at DESC LIMIT 6)
       UNION ALL
       (SELECT 'journal' AS type, COALESCE(reference_number, id::text) AS ref,
               COALESCE(description, 'Journal entry') AS entity,
               total_debit AS amount, status, updated_at AS ts
        FROM journal_entries WHERE tenant_id = :tenantId ORDER BY updated_at DESC LIMIT 4)
       UNION ALL
       (SELECT 'claim' AS type, claim_number AS ref, patient_name AS entity,
               claimed_amount AS amount, status, updated_at AS ts
        FROM claims WHERE tenant_id = :tenantId ORDER BY updated_at DESC LIMIT 4)
       UNION ALL
       (SELECT 'fcra_receipt' AS type, receipt_number AS ref,
               CONCAT('FC Receipt · ', currency) AS entity,
               amount_inr AS amount, status, updated_at AS ts
        FROM fcra_receipts WHERE tenant_id = :tenantId ORDER BY updated_at DESC LIMIT 3)
       UNION ALL
       (SELECT 'fcra_util' AS type, voucher_number AS ref,
               CONCAT('FC Voucher · ', category) AS entity,
               amount AS amount, status, updated_at AS ts
        FROM fcra_utilisations WHERE tenant_id = :tenantId ORDER BY updated_at DESC LIMIT 3)
       ORDER BY ts DESC LIMIT 15`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => []),
  ]);

  res.json({ data: recent });
}));

// ─── /api/command-center/health ───────────────────────────────────────────────
// Real-time financial health score
router.get('/health', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const tenantId = req.tenantId;

  const [ar, ap, cash, claims, fcraHealth] = await Promise.all([
    sequelize.query(
      `SELECT
         COALESCE(SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID')), 0) AS outstanding,
         COALESCE(SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND invoice_date < CURRENT_DATE - INTERVAL '90 days'), 0) AS overdue_90
       FROM patient_invoices WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ outstanding: 0, overdue_90: 0 }]),

    sequelize.query(
      `SELECT COALESCE(SUM(net_amount) FILTER (WHERE status IN ('APPROVED','PARTIAL') AND due_date < CURRENT_DATE), 0) AS overdue
       FROM vendor_invoices WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ overdue: 0 }]),

    sequelize.query(
      `SELECT COALESCE(SUM(current_balance), 0) AS total FROM bank_accounts WHERE tenant_id = :tenantId AND is_active = true`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ total: 0 }]),

    sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'REJECTED') AS rejected,
         COUNT(*) AS total
       FROM claims WHERE tenant_id = :tenantId AND created_at >= CURRENT_DATE - INTERVAL '30 days'`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ rejected: 0, total: 1 }]),

    // FCRA compliance health
    sequelize.query(
      `SELECT
         COUNT(*) FILTER (WHERE status IN ('pending','in_progress')) AS pending,
         COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
         COUNT(*) AS total,
         COALESCE((
           SELECT SUM(amount_inr) FROM fcra_receipts
           WHERE tenant_id = :tenantId
             AND status IN ('verified','partially_utilized','fully_utilized')
         ), 0) AS fy_receipts,
         COALESCE((
           SELECT SUM(amount) FROM fcra_utilisations
           WHERE tenant_id = :tenantId AND status = 'approved' AND category = 'administrative'
         ), 0) AS admin_utilized
       FROM fcra_compliances WHERE tenant_id = :tenantId`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    ).catch(() => [{ pending: 0, overdue: 0, total: 0, fy_receipts: 0, admin_utilized: 0 }]),
  ]);

  const arOutstanding = Number(ar[0]?.outstanding || 0);
  const arOverdue90 = Number(ar[0]?.overdue_90 || 0);
  const apOverdue = Number(ap[0]?.overdue || 0);
  const cashTotal = Number(cash[0]?.total || 0);
  const claimRejected = Number(claims[0]?.rejected || 0);
  const claimTotal = Math.max(Number(claims[0]?.total || 1), 1);

  const fcraOverdue  = Number(fcraHealth[0]?.overdue || 0);
  const fcraTotalComp = Math.max(Number(fcraHealth[0]?.total || 1), 1);
  const fcraFYRec    = Number(fcraHealth[0]?.fy_receipts || 0);
  const fcraAdminAmt = Number(fcraHealth[0]?.admin_utilized || 0);
  const fcraAdminPct = fcraFYRec > 0 ? (fcraAdminAmt / fcraFYRec) * 100 : 0;

  // Simple health scoring (0-100)
  const arHealthScore = arOutstanding > 0
    ? Math.max(0, 100 - Math.round((arOverdue90 / arOutstanding) * 100))
    : 100;
  const apHealthScore = apOverdue < 100000 ? 100 : apOverdue < 500000 ? 75 : 50;
  const cashHealthScore = cashTotal > 500000 ? 100 : cashTotal > 100000 ? 70 : 40;
  const claimHealthScore = Math.round(((claimTotal - claimRejected) / claimTotal) * 100);

  // FCRA health: penalise for overdue compliance and admin cap approach/breach
  const fcraComplianceScore = Math.max(0, 100 - Math.round((fcraOverdue / fcraTotalComp) * 100));
  const fcraCapPenalty = fcraAdminPct > 20 ? 40 : fcraAdminPct > 15 ? 20 : 0;
  const fcraHealthScore = Math.max(0, fcraComplianceScore - fcraCapPenalty);

  const overallScore = Math.round((arHealthScore + apHealthScore + cashHealthScore + claimHealthScore + fcraHealthScore) / 5);

  res.json({
    data: {
      overall: overallScore,
      indicators: [
        { label: 'AR Health',        score: arHealthScore,       detail: arOverdue90 > 0 ? `₹${(arOverdue90 / 100000).toFixed(1)}L overdue >90d` : 'Clean' },
        { label: 'AP Health',        score: apHealthScore,       detail: apOverdue > 0 ? `₹${(apOverdue / 100000).toFixed(1)}L overdue` : 'On time' },
        { label: 'Cash Position',    score: cashHealthScore,     detail: `₹${(cashTotal / 100000).toFixed(1)}L available` },
        { label: 'Claim Recovery',   score: claimHealthScore,    detail: `${claimRejected} rejected this month` },
        { label: 'FCRA Compliance',  score: fcraHealthScore,     detail: fcraAdminPct > 20 ? `Admin cap breached (${fcraAdminPct.toFixed(1)}%)` : fcraOverdue > 0 ? `${fcraOverdue} overdue items` : 'On track' },
      ],
    },
  });
}));

// ─── /api/command-center/trend ────────────────────────────────────────────────
// Last 7 days: daily revenue (invoiced) vs collections (cash received via deposits)
router.get('/trend', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const tenantId = req.tenantId;

  const rows = await sequelize.query(
    `WITH days AS (
       SELECT generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       )::date AS day
     ),
     rev AS (
       SELECT DATE(invoice_date) AS day, COALESCE(SUM(total_amount), 0) AS revenue
       FROM patient_invoices
       WHERE tenant_id = :tenantId
         AND DATE(invoice_date) >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY DATE(invoice_date)
     ),
     col AS (
       SELECT deposit_date AS day, COALESCE(SUM(amount), 0) AS collections
       FROM deposits
       WHERE tenant_id = :tenantId
         AND deposit_date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY deposit_date
     )
     SELECT
       CASE WHEN d.day = CURRENT_DATE THEN 'Today' ELSE TO_CHAR(d.day, 'Dy') END AS day,
       COALESCE(r.revenue, 0) AS revenue,
       COALESCE(c.collections, 0) AS collections
     FROM days d
     LEFT JOIN rev r ON r.day = d.day
     LEFT JOIN col c ON c.day = d.day
     ORDER BY d.day`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  ).catch(() => []);

  res.json({
    data: rows.map(r => ({
      day: r.day,
      revenue: Number(r.revenue),
      collections: Number(r.collections),
    })),
  });
}));

module.exports = router;
