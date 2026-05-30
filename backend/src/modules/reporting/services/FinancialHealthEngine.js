'use strict';

/**
 * FinancialHealthEngine
 *
 * Computes 7 financial health components, each scored 0–100, with a weighted
 * overall score mapped to an A/B/C/D/F grade.
 *
 * Every individual DB query is wrapped with .catch(() => [{}]) so the engine
 * never throws — degraded data returns a conservative partial score instead.
 */

class FinancialHealthEngine {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Q = sequelize.QueryTypes;
  }

  // ─── Component 1: Liquidity Ratio ────────────────────────────────────────────
  async _computeLiquidity(tenantId) {
    const id = 'liquidity';
    const label = 'Liquidity Ratio';
    const weight = 0.20;

    const rows = await this.sequelize
      .query(
        `SELECT
           COALESCE(SUM(current_balance) FILTER (WHERE sub_type = 'CURRENT_ASSET'), 0)      AS ca,
           COALESCE(SUM(current_balance) FILTER (WHERE sub_type = 'CURRENT_LIABILITY'), 0)  AS cl
         FROM accounts
         WHERE tenant_id = :tenantId AND is_active = true`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const ca = parseFloat(rows[0]?.ca || 0);
    const cl = parseFloat(rows[0]?.cl || 0);
    const ratio = cl > 0 ? ca / cl : ca > 0 ? 2.5 : 1.0;

    let score;
    if (ratio >= 2.0) score = 100;
    else if (ratio >= 1.5) score = 80;
    else if (ratio >= 1.0) score = 60;
    else score = Math.round((ratio / 1.0) * 60);

    return {
      id, label, score, weight,
      detail: { ratio: parseFloat(ratio.toFixed(2)), currentAssets: ca, currentLiabilities: cl },
    };
  }

  // ─── Component 2: Cash Runway ─────────────────────────────────────────────────
  async _computeCashRunway(tenantId) {
    const id = 'cash_runway';
    const label = 'Cash Runway in Months';
    const weight = 0.15;

    const cashRows = await this.sequelize
      .query(
        `SELECT COALESCE(SUM(current_balance), 0) AS cash
         FROM accounts
         WHERE tenant_id = :tenantId
           AND is_active = true
           AND (is_cash_account = true OR is_bank_account = true)`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const burnRows = await this.sequelize
      .query(
        `SELECT COALESCE(AVG(monthly_total), 0) AS monthly_burn
         FROM (
           SELECT DATE_TRUNC('month', date) AS mo, SUM(total_debit) AS monthly_total
           FROM journal_entries
           WHERE tenant_id = :tenantId
             AND voucher_type = 'PAYMENT'
             AND date >= NOW() - INTERVAL '3 months'
           GROUP BY DATE_TRUNC('month', date)
         ) sub`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const cashBalance = parseFloat(cashRows[0]?.cash || 0);
    const monthlyBurn = parseFloat(burnRows[0]?.monthly_burn || 0);
    const runwayMonths = monthlyBurn > 0 ? cashBalance / monthlyBurn : cashBalance > 0 ? 12 : 0;

    let score;
    if (runwayMonths >= 6) score = 100;
    else if (runwayMonths >= 3) score = 75;
    else if (runwayMonths >= 1) score = 50;
    else score = 20;

    return {
      id, label, score, weight,
      detail: {
        runwayMonths: parseFloat(runwayMonths.toFixed(1)),
        cashBalance,
        monthlyBurn: parseFloat(monthlyBurn.toFixed(2)),
      },
    };
  }

  // ─── Component 3: AR Collection Health ───────────────────────────────────────
  async _computeOverdueAR(tenantId) {
    const id = 'overdue_ar';
    const label = 'AR Collection Health';
    const weight = 0.20;

    const rows = await this.sequelize
      .query(
        `SELECT
           COALESCE(SUM(balance_amount) FILTER (
             WHERE status IN ('FINALIZED', 'PARTIALLY_PAID')
           ), 0) AS total_ar,
           COALESCE(SUM(balance_amount) FILTER (
             WHERE status IN ('FINALIZED', 'PARTIALLY_PAID')
               AND invoice_date < CURRENT_DATE - 90
           ), 0) AS overdue_90
         FROM patient_invoices
         WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const totalAR = parseFloat(rows[0]?.total_ar || 0);
    const overdueAmount = parseFloat(rows[0]?.overdue_90 || 0);
    const overduePct = totalAR > 0 ? (overdueAmount / totalAR) * 100 : 0;

    let score;
    if (overduePct <= 5) score = 100;
    else if (overduePct <= 15) score = 80;
    else if (overduePct <= 30) score = 60;
    else if (overduePct <= 50) score = 30;
    else score = 0;

    return {
      id, label, score, weight,
      detail: {
        overduePct: parseFloat(overduePct.toFixed(1)),
        overdueAmount,
        totalAR,
      },
    };
  }

  // ─── Component 4: Vendor Payment Risk ────────────────────────────────────────
  async _computeVendorRisk(tenantId) {
    const id = 'vendor_risk';
    const label = 'Vendor Payment Risk';
    const weight = 0.15;

    const rows = await this.sequelize
      .query(
        `SELECT
           COALESCE(SUM(net_amount - COALESCE(paid_amount, 0)) FILTER (
             WHERE status NOT IN ('PAID', 'CANCELLED')
           ), 0) AS total_ap,
           COALESCE(SUM(net_amount - COALESCE(paid_amount, 0)) FILTER (
             WHERE status NOT IN ('PAID', 'CANCELLED')
               AND due_date < CURRENT_DATE
           ), 0) AS overdue_ap
         FROM vendor_invoices
         WHERE tenant_id = :tenantId`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const totalAP = parseFloat(rows[0]?.total_ap || 0);
    const overdueAmount = parseFloat(rows[0]?.overdue_ap || 0);
    const overduePct = totalAP > 0 ? (overdueAmount / totalAP) * 100 : 0;

    let score;
    if (overduePct <= 5) score = 100;
    else if (overduePct <= 15) score = 80;
    else if (overduePct <= 30) score = 50;
    else score = 20;

    return {
      id, label, score, weight,
      detail: {
        overduePct: parseFloat(overduePct.toFixed(1)),
        overdueAmount,
        totalAP,
      },
    };
  }

  // ─── Component 5: Reconciliation Currency ─────────────────────────────────────
  async _computeRecon(tenantId) {
    const id = 'recon';
    const label = 'Reconciliation Currency';
    const weight = 0.10;

    const rows = await this.sequelize
      .query(
        `SELECT
           COUNT(*) FILTER (WHERE recon_status = 'UNMATCHED') AS unmatched_count,
           COUNT(*) AS total_count
         FROM journal_entries
         WHERE tenant_id = :tenantId
           AND date >= CURRENT_DATE - INTERVAL '30 days'`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const unmatchedCount = parseInt(rows[0]?.unmatched_count || 0, 10);
    const totalCount = parseInt(rows[0]?.total_count || 0, 10);
    const unmatchedPct = totalCount > 0 ? (unmatchedCount / totalCount) * 100 : 0;

    let score;
    if (unmatchedPct <= 10) score = 100;
    else if (unmatchedPct <= 25) score = 75;
    else if (unmatchedPct <= 50) score = 50;
    else score = 25;

    return {
      id, label, score, weight,
      detail: {
        unmatchedCount,
        unmatchedPct: parseFloat(unmatchedPct.toFixed(1)),
      },
    };
  }

  // ─── Component 6: Revenue Leakage Control ─────────────────────────────────────
  async _computeLeakage(tenantId) {
    const id = 'leakage';
    const label = 'Revenue Leakage Control';
    const weight = 0.10;

    const invRows = await this.sequelize
      .query(
        `SELECT
           COUNT(*) AS draft_invoices,
           COALESCE(SUM(net_amount), 0) AS draft_amount
         FROM patient_invoices
         WHERE tenant_id = :tenantId AND status = 'DRAFT'`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const claimRows = await this.sequelize
      .query(
        `SELECT COALESCE(SUM(claimed_amount), 0) AS draft_claims
         FROM claims
         WHERE tenant_id = :tenantId AND status = 'DRAFT'`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const draftInvoices = parseInt(invRows[0]?.draft_invoices || 0, 10);
    const draftInvoiceAmount = parseFloat(invRows[0]?.draft_amount || 0);
    const draftClaimsAmount = parseFloat(claimRows[0]?.draft_claims || 0);
    const draftAmount = draftInvoiceAmount + draftClaimsAmount;
    const estimatedLeakage = draftAmount;

    let score;
    if (draftAmount === 0) score = 100;
    else if (draftAmount < 50000) score = 85;
    else if (draftAmount < 200000) score = 65;
    else if (draftAmount < 1000000) score = 40;
    else score = 15;

    return {
      id, label, score, weight,
      detail: { draftInvoices, draftAmount, estimatedLeakage },
    };
  }

  // ─── Component 7: FCRA Admin Cap Risk ─────────────────────────────────────────
  async _computeFCRA(tenantId) {
    const id = 'fcra';
    const label = 'FCRA Admin Cap Risk';
    const weight = 0.10;

    const rows = await this.sequelize
      .query(
        `SELECT
           COALESCE(SUM(fr.amount), 0)                                                                    AS total_receipts,
           COALESCE(SUM(fu.amount) FILTER (WHERE fu.utilisation_type = 'ADMIN'), 0)                       AS admin_expenses
         FROM fcra_registrations r
         JOIN fcra_receipts fr
           ON fr.registration_id = r.id AND fr.tenant_id = :tenantId
              AND EXTRACT(YEAR FROM fr.receipt_date) = EXTRACT(YEAR FROM CURRENT_DATE)
         LEFT JOIN fcra_utilisations fu
           ON fu.registration_id = r.id AND fu.tenant_id = :tenantId
              AND EXTRACT(YEAR FROM fu.utilisation_date) = EXTRACT(YEAR FROM CURRENT_DATE)
         WHERE r.tenant_id = :tenantId`,
        { replacements: { tenantId }, type: this.Q.SELECT }
      )
      .catch(() => [{}]);

    const totalReceipts = parseFloat(rows[0]?.total_receipts || 0);
    const adminExpenses = parseFloat(rows[0]?.admin_expenses || 0);
    const hasFCRA = totalReceipts > 0;

    if (!hasFCRA) {
      return {
        id, label, score: 100, weight,
        detail: { adminCapPct: 0, adminExpenses: 0, totalReceipts: 0, isAtRisk: false, isBreached: false, hasFCRA: false },
      };
    }

    const adminCapPct = (adminExpenses / totalReceipts) * 100;
    const isAtRisk = adminCapPct >= 18;
    const isBreached = adminCapPct >= 20;

    let score;
    if (adminCapPct <= 10) score = 100;
    else if (adminCapPct <= 15) score = 80;
    else if (adminCapPct <= 18) score = 50;
    else if (adminCapPct < 20) score = 20;
    else score = 0;

    return {
      id, label, score, weight,
      detail: {
        adminCapPct: parseFloat(adminCapPct.toFixed(1)),
        adminExpenses,
        totalReceipts,
        isAtRisk,
        isBreached,
        hasFCRA,
      },
    };
  }

  // ─── Recommendations Builder ───────────────────────────────────────────────────
  _buildRecommendations(components) {
    const recommendations = [];

    for (const c of components) {
      if (c.score >= 70) continue;

      let action;
      switch (c.id) {
        case 'liquidity':
          action =
            'Current ratio is below healthy threshold. Accelerate collection of outstanding AR, defer non-critical capex, or negotiate an overdraft facility to improve short-term liquidity.';
          break;
        case 'cash_runway':
          action =
            'Cash runway is critically short. Immediately review discretionary spend, enforce faster collections on 30-day outstanding invoices, and explore working capital financing.';
          break;
        case 'overdue_ar':
          action =
            'AR ageing over 90 days is elevated. Assign dedicated collectors to top-10 debtors, trigger automated payment reminders, and consider offering early-payment discounts.';
          break;
        case 'vendor_risk':
          action =
            'Overdue payables risk supplier relationship damage and penalty interest. Prioritise payment of critical vendors and negotiate extended terms with non-critical ones.';
          break;
        case 'recon':
          action =
            'High unmatched journal entries indicate posting or import failures. Run the reconciliation workbench daily and escalate any entries unmatched for more than 3 days.';
          break;
        case 'leakage':
          action =
            'Significant revenue is stuck in DRAFT status. Enforce a 24-hour SLA for billing staff to finalise invoices and set up daily leakage exception alerts.';
          break;
        case 'fcra':
          action =
            'FCRA admin expense ratio is approaching or has breached the 20% statutory cap. Reclassify eligible admin costs as programme expenses where permissible and freeze discretionary admin spend immediately.';
          break;
        default:
          action = `Review ${c.label} and take corrective action to improve the score.`;
      }

      recommendations.push({ area: c.label, score: c.score, action });
    }

    return recommendations;
  }

  // ─── Main Public Method ────────────────────────────────────────────────────────
  async computeHealthScore(tenantId) {
    const [liquidity, cashRunway, overdueAR, vendorRisk, recon, leakage, fcra] =
      await Promise.all([
        this._computeLiquidity(tenantId),
        this._computeCashRunway(tenantId),
        this._computeOverdueAR(tenantId),
        this._computeVendorRisk(tenantId),
        this._computeRecon(tenantId),
        this._computeLeakage(tenantId),
        this._computeFCRA(tenantId),
      ]);

    const components = [liquidity, cashRunway, overdueAR, vendorRisk, recon, leakage, fcra];

    const overallScore = Math.round(
      components.reduce((sum, c) => sum + c.score * c.weight, 0)
    );

    let grade;
    if (overallScore >= 85) grade = 'A';
    else if (overallScore >= 70) grade = 'B';
    else if (overallScore >= 55) grade = 'C';
    else if (overallScore >= 40) grade = 'D';
    else grade = 'F';

    const recommendations = this._buildRecommendations(components);

    return {
      overallScore,
      grade,
      components,
      recommendations,
      generatedAt: new Date().toISOString(),
    };
  }
}

// ─── Singleton Factory ─────────────────────────────────────────────────────────
let _instance = null;

function getFinancialHealthEngine(sequelize) {
  if (!_instance) {
    _instance = new FinancialHealthEngine(sequelize);
  }
  return _instance;
}

module.exports = { FinancialHealthEngine, getFinancialHealthEngine };
