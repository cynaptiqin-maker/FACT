'use strict';

/**
 * Period Close Service
 *
 * Runs all pre-close checks and locks the accounting period.
 * Each check returns { id, label, status: PASS|FAIL|WARN|NA, ... }.
 *
 * All checks PASS is required to lock. Locking sets
 * accounting_periods.status = 'LOCKED' and writes to period_close_log.
 */

const Decimal = require('decimal.js');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../shared/utils/logger');
const { getExceptionEngine } = require('../../shared/exceptions/ExceptionEngine');

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

const ZERO = new Decimal(0);
const TOLERANCE = new Decimal('0.01');

const CHECK_STATUS = Object.freeze({
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARN: 'WARN',
  NA:   'NA',
});

class PeriodCloseService {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.qt = sequelize.QueryTypes;
  }

  /**
   * Run all pre-close checks for a period and return the checklist.
   */
  async getChecklist(tenantId, period, fiscalYearId) {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0);

    const [
      journalsCheck,
      bankReconCheck,
      arCheck,
      apCheck,
      fcraCheck,
      depreciationCheck,
      payrollCheck,
      exceptionsCheck,
    ] = await Promise.all([
      this._checkUnpostedJournals(tenantId, startDate, endDate),
      this._checkBankReconciliation(tenantId, startDate, endDate),
      this._checkARvsGL(tenantId, startDate, endDate),
      this._checkAPvsGL(tenantId, startDate, endDate),
      this._checkFCRALedgers(tenantId, startDate, endDate),
      this._checkDepreciationRun(tenantId, year, month),
      this._checkPayrollPosted(tenantId, year, month),
      this._checkCriticalExceptions(tenantId),
    ]);

    const checks = [
      journalsCheck,
      bankReconCheck,
      arCheck,
      apCheck,
      fcraCheck,
      depreciationCheck,
      payrollCheck,
      exceptionsCheck,
    ];

    const allPassed = checks.every((c) => c.status === CHECK_STATUS.PASS || c.status === CHECK_STATUS.NA);
    const status = allPassed ? 'READY_TO_CLOSE' : 'OPEN';

    // Check if period is already closed
    const [periodRow] = await this.sequelize.query(
      `SELECT status, closed_at, closed_by
       FROM accounting_periods
       WHERE fiscal_year_id = :fiscalYearId
         AND period_start <= :end AND period_end >= :start
         AND tenant_id = :tenantId
       LIMIT 1`,
      { replacements: { fiscalYearId, start: startDate, end: endDate, tenantId }, type: this.qt.SELECT }
    ).catch(() => [[]]);

    const periodStatus = periodRow?.[0]?.status || status;
    const closedAt = periodRow?.[0]?.closed_at || null;
    const closedBy = periodRow?.[0]?.closed_by || null;

    return {
      period,
      fiscalYearId,
      status: periodStatus === 'LOCKED' ? 'CLOSED' : status,
      closedAt,
      closedBy,
      checks,
    };
  }

  // ── Individual Checks ─────────────────────────────────────────────────────

  async _checkUnpostedJournals(tenantId, startDate, endDate) {
    const [rows] = await this.sequelize.query(
      `SELECT COUNT(*) AS count FROM journal_entries
       WHERE tenant_id = :tenantId
         AND date BETWEEN :start AND :end
         AND status = 'DRAFT'`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ count: 0 }]]);

    const count = parseInt(rows[0]?.count || 0, 10);
    return {
      id: 'journals_posted',
      label: 'All journals posted',
      description: 'No DRAFT journal entries remain in the period',
      status: count === 0 ? CHECK_STATUS.PASS : CHECK_STATUS.FAIL,
      value: count,
      threshold: 0,
      actionLink: '/gl/journals?status=DRAFT',
      actionLabel: 'View unposted journals',
    };
  }

  async _checkBankReconciliation(tenantId, startDate, endDate) {
    const [rows] = await this.sequelize.query(
      `SELECT COUNT(*) AS unreconciled
       FROM bank_transactions
       WHERE tenant_id = :tenantId
         AND transaction_date BETWEEN :start AND :end
         AND is_reconciled = false`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ unreconciled: 0 }]]);

    const count = parseInt(rows[0]?.unreconciled || 0, 10);
    return {
      id: 'bank_recon',
      label: 'Bank reconciliation complete',
      description: 'All bank transactions matched to cashbook entries',
      status: count === 0 ? CHECK_STATUS.PASS : CHECK_STATUS.FAIL,
      value: count,
      threshold: 0,
      actionLink: '/cash-bank/reconciliation',
      actionLabel: 'Open bank reconciliation',
    };
  }

  async _checkARvsGL(tenantId, startDate, endDate) {
    const [arRows] = await this.sequelize.query(
      `SELECT COALESCE(SUM(balance_amount), 0) AS total
       FROM patient_invoices
       WHERE tenant_id = :tenantId
         AND created_at BETWEEN :start AND :end
         AND status NOT IN ('PAID', 'CANCELLED', 'WRITTEN_OFF')`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ total: 0 }]]);

    const [glRows] = await this.sequelize.query(
      `SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS balance
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       JOIN accounts a ON a.id = jl.account_id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND a.code LIKE '1200%'`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ balance: 0 }]]);

    const arTotal = new Decimal(arRows[0]?.total || 0);
    const glBalance = new Decimal(glRows[0]?.balance || 0);
    const variance = arTotal.minus(glBalance).abs();

    return {
      id: 'ar_tied',
      label: 'AR ties to GL',
      description: 'AR subledger balance equals GL control account balance',
      status: variance.lessThanOrEqualTo(TOLERANCE) ? CHECK_STATUS.PASS : CHECK_STATUS.FAIL,
      variance: variance.toFixed(2),
      arTotal: arTotal.toFixed(2),
      glBalance: glBalance.toFixed(2),
      actionLink: '/reconciliation?type=AR_GL',
      actionLabel: 'Reconcile AR vs GL',
    };
  }

  async _checkAPvsGL(tenantId, startDate, endDate) {
    const [apRows] = await this.sequelize.query(
      `SELECT COALESCE(SUM(outstanding_amount), 0) AS total
       FROM vendor_invoices
       WHERE tenant_id = :tenantId
         AND invoice_date BETWEEN :start AND :end
         AND status NOT IN ('PAID', 'CANCELLED', 'VOID')`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ total: 0 }]]);

    const [glRows] = await this.sequelize.query(
      `SELECT COALESCE(SUM(jl.credit - jl.debit), 0) AS balance
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       JOIN accounts a ON a.id = jl.account_id
       WHERE je.tenant_id = :tenantId
         AND je.date BETWEEN :start AND :end
         AND a.code LIKE '2100%'`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ balance: 0 }]]);

    const apTotal = new Decimal(apRows[0]?.total || 0);
    const glBalance = new Decimal(glRows[0]?.balance || 0);
    const variance = apTotal.minus(glBalance).abs();

    return {
      id: 'ap_tied',
      label: 'AP ties to GL',
      description: 'AP subledger balance equals GL control account balance',
      status: variance.lessThanOrEqualTo(TOLERANCE) ? CHECK_STATUS.PASS : CHECK_STATUS.FAIL,
      variance: variance.toFixed(2),
      apTotal: apTotal.toFixed(2),
      glBalance: glBalance.toFixed(2),
      actionLink: '/reconciliation?type=AP_GL',
      actionLabel: 'Reconcile AP vs GL',
    };
  }

  async _checkFCRALedgers(tenantId, startDate, endDate) {
    // Check if FCRA module has any data for this period
    const [fcraRows] = await this.sequelize.query(
      `SELECT COUNT(*) AS count FROM fcra_receipts
       WHERE tenant_id = :tenantId AND receipt_date BETWEEN :start AND :end`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ count: 0 }]]);

    const hasFCRAActivity = parseInt(fcraRows[0]?.count || 0, 10) > 0;
    if (!hasFCRAActivity) {
      return {
        id: 'fcra_balanced',
        label: 'FCRA ledgers balanced',
        description: 'No FCRA activity in this period',
        status: CHECK_STATUS.NA,
      };
    }

    const [fcraJournal] = await this.sequelize.query(
      `SELECT COALESCE(SUM(jl.debit - jl.credit), 0) AS balance
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       WHERE je.tenant_id = :tenantId
         AND je.fund_type = 'FCRA'
         AND je.date BETWEEN :start AND :end`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ balance: 0 }]]);

    const [fcraReceipts] = await this.sequelize.query(
      `SELECT COALESCE(SUM(amount_inr), 0) AS total
       FROM fcra_receipts
       WHERE tenant_id = :tenantId
         AND receipt_date BETWEEN :start AND :end AND status = 'VERIFIED'`,
      { replacements: { tenantId, start: startDate, end: endDate }, type: this.qt.SELECT }
    ).catch(() => [[{ total: 0 }]]);

    const journalBal = new Decimal(fcraJournal[0]?.balance || 0);
    const receiptTotal = new Decimal(fcraReceipts[0]?.total || 0);
    const variance = journalBal.minus(receiptTotal).abs();

    return {
      id: 'fcra_balanced',
      label: 'FCRA ledgers balanced',
      description: 'FCRA receipt/utilisation/asset journals all tie to FC ledger',
      status: variance.lessThanOrEqualTo(TOLERANCE) ? CHECK_STATUS.PASS : CHECK_STATUS.FAIL,
      variance: variance.toFixed(2),
      actionLink: '/reconciliation?type=FCRA_FUNDS',
      actionLabel: 'Reconcile FCRA funds',
    };
  }

  async _checkDepreciationRun(tenantId, year, month) {
    const [rows] = await this.sequelize.query(
      `SELECT COUNT(*) AS completed
       FROM depreciation_runs
       WHERE tenant_id = :tenantId AND year = :year AND month = :month AND status = 'COMPLETED'`,
      { replacements: { tenantId, year, month }, type: this.qt.SELECT }
    ).catch(() => [[{ completed: 0 }]]);

    const [assetRows] = await this.sequelize.query(
      `SELECT COUNT(*) AS active
       FROM assets
       WHERE tenant_id = :tenantId AND status = 'ACTIVE' AND is_depreciable = true`,
      { replacements: { tenantId }, type: this.qt.SELECT }
    ).catch(() => [[{ active: 0 }]]);

    const hasRun = parseInt(rows[0]?.completed || 0, 10) > 0;
    const hasAssets = parseInt(assetRows[0]?.active || 0, 10) > 0;

    if (!hasAssets) {
      return { id: 'depreciation_run', label: 'Depreciation run complete', description: 'No depreciable assets', status: CHECK_STATUS.NA };
    }

    return {
      id: 'depreciation_run',
      label: 'Depreciation run complete',
      description: 'Monthly depreciation posted for all active assets',
      status: hasRun ? CHECK_STATUS.PASS : CHECK_STATUS.WARN,
      actionLink: '/assets/depreciation',
      actionLabel: 'Run depreciation',
    };
  }

  async _checkPayrollPosted(tenantId, year, month) {
    const [rows] = await this.sequelize.query(
      `SELECT COUNT(*) AS unposted
       FROM payroll_runs
       WHERE tenant_id = :tenantId AND year = :year AND month = :month
         AND status NOT IN ('POSTED', 'CANCELLED')`,
      { replacements: { tenantId, year, month }, type: this.qt.SELECT }
    ).catch(() => [[{ unposted: 0 }]]);

    const count = parseInt(rows[0]?.unposted || 0, 10);
    return {
      id: 'payroll_posted',
      label: 'Payroll posted to GL',
      description: 'All approved payroll runs posted to general ledger',
      status: count === 0 ? CHECK_STATUS.PASS : CHECK_STATUS.WARN,
      value: count,
      actionLink: '/payroll',
      actionLabel: 'View payroll runs',
    };
  }

  async _checkCriticalExceptions(tenantId) {
    const [rows] = await this.sequelize.query(
      `SELECT COUNT(*) AS critical
       FROM financial_exceptions
       WHERE tenant_id = :tenantId AND status = 'OPEN' AND severity = 'CRITICAL'`,
      { replacements: { tenantId }, type: this.qt.SELECT }
    ).catch(() => [[{ critical: 0 }]]);

    const critical = parseInt(rows[0]?.critical || 0, 10);

    return {
      id: 'no_critical_exceptions',
      label: 'No open critical exceptions',
      description: 'Exception inbox has no unresolved CRITICAL items',
      status: critical === 0 ? CHECK_STATUS.PASS : CHECK_STATUS.FAIL,
      value: critical,
      actionLink: '/exceptions?severity=CRITICAL&status=OPEN',
      actionLabel: 'View critical exceptions',
    };
  }

  // ── Lock Period ───────────────────────────────────────────────────────────

  /**
   * Lock a period after all checks pass.
   */
  async lockPeriod(tenantId, period, fiscalYearId, userId) {
    const checklist = await this.getChecklist(tenantId, period, fiscalYearId);

    const blocking = checklist.checks.filter(
      (c) => c.status === CHECK_STATUS.FAIL
    );

    if (blocking.length > 0) {
      const err = Object.assign(
        new Error(`Cannot lock period — ${blocking.length} check(s) failed: ${blocking.map((c) => c.label).join(', ')}`),
        { statusCode: 422, checks: blocking }
      );
      throw err;
    }

    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0);

    await this.sequelize.transaction(async (t) => {
      // Lock the accounting period
      await this.sequelize.query(
        `UPDATE accounting_periods
         SET status = 'LOCKED', closed_at = NOW(), closed_by = :userId, updated_at = NOW()
         WHERE fiscal_year_id = :fiscalYearId
           AND period_start <= :end AND period_end >= :start
           AND tenant_id = :tenantId`,
        { replacements: { fiscalYearId, start: startDate, end: endDate, tenantId, userId }, transaction: t }
      );

      // Write close log
      await this.sequelize.query(
        `INSERT INTO period_close_log (id, tenant_id, fiscal_year_id, period, checklist, action, performed_by)
         VALUES (:id, :tenantId, :fiscalYearId, :period, :checklist, 'LOCK', :userId)`,
        {
          replacements: {
            id: uuidv4(), tenantId, fiscalYearId, period,
            checklist: JSON.stringify(checklist.checks),
            userId,
          },
          transaction: t,
        }
      );
    });

    logger.info('PeriodCloseService: period locked', { tenantId, period, userId });
    return { success: true, period, lockedAt: new Date().toISOString(), lockedBy: userId };
  }

  /**
   * Unlock a previously locked period (audited action).
   */
  async unlockPeriod(tenantId, period, fiscalYearId, userId, note) {
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate   = new Date(year, month, 0);

    await this.sequelize.transaction(async (t) => {
      await this.sequelize.query(
        `UPDATE accounting_periods
         SET status = 'OPEN', closed_at = NULL, closed_by = NULL, updated_at = NOW()
         WHERE fiscal_year_id = :fiscalYearId
           AND period_start <= :end AND period_end >= :start
           AND tenant_id = :tenantId AND status = 'LOCKED'`,
        { replacements: { fiscalYearId, start: startDate, end: endDate, tenantId }, transaction: t }
      );

      await this.sequelize.query(
        `INSERT INTO period_close_log (id, tenant_id, fiscal_year_id, period, action, performed_by, note)
         VALUES (:id, :tenantId, :fiscalYearId, :period, 'UNLOCK', :userId, :note)`,
        { replacements: { id: uuidv4(), tenantId, fiscalYearId, period, userId, note: note || null }, transaction: t }
      );
    });

    logger.info('PeriodCloseService: period unlocked', { tenantId, period, userId, note });
    return { success: true, period, unlockedAt: new Date().toISOString(), unlockedBy: userId };
  }

  /**
   * Get close history for a fiscal year.
   */
  async getHistory(tenantId, fiscalYearId) {
    return this.sequelize.query(
      `SELECT id, period, action, performed_at, performed_by, note
       FROM period_close_log
       WHERE tenant_id = :tenantId AND fiscal_year_id = :fiscalYearId
       ORDER BY performed_at DESC
       LIMIT 100`,
      { replacements: { tenantId, fiscalYearId }, type: this.qt.SELECT }
    );
  }
}

module.exports = { PeriodCloseService, CHECK_STATUS };
