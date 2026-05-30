/**
 * Central Financial Integrity Engine
 *
 * Enforces double-entry balancing, multi-currency reconciliation,
 * cost-center balancing, and cross-module financial consistency.
 * Every financial posting MUST pass through this engine before commit.
 */

const Decimal = require('decimal.js');
const { EventEmitter } = require('events');
const logger = require('../utils/logger');

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

// ─── Constants ────────────────────────────────────────────────────────────────

const ZERO = new Decimal(0);
const BALANCE_TOLERANCE = new Decimal('0.01'); // 1 paisa tolerance for FX rounding

const INTEGRITY_ERRORS = {
  UNBALANCED_ENTRY: 'FIE_001',
  NEGATIVE_BALANCE_VIOLATION: 'FIE_002',
  CLOSED_PERIOD_POSTING: 'FIE_003',
  DUPLICATE_TRANSACTION: 'FIE_004',
  INVALID_ACCOUNT: 'FIE_005',
  CURRENCY_MISMATCH: 'FIE_006',
  COST_CENTER_IMBALANCE: 'FIE_007',
  RECONCILIATION_MISMATCH: 'FIE_008',
  MISSING_COUNTERPART: 'FIE_009',
  EXCEEDS_CREDIT_LIMIT: 'FIE_010',
  ROLLBACK_FAILED: 'FIE_011',
  PARTIAL_COMMIT_DETECTED: 'FIE_012',
};

// ─── Main Engine ──────────────────────────────────────────────────────────────

class FinancialIntegrityEngine extends EventEmitter {
  constructor(sequelize, redisClient) {
    super();
    this.sequelize = sequelize;
    this.redis = redisClient;
    this.idempotencyTTL = 86400; // 24 hours
  }

  // ── Entry Validation ──────────────────────────────────────────────────────

  /**
   * Validate a journal entry before any persistence.
   * Throws a structured IntegrityError on any violation.
   */
  async validateJournalEntry(entry, options = {}) {
    const errors = [];

    // 1. Double-entry balance check
    const balanceError = this._checkDoubleEntryBalance(entry.lines);
    if (balanceError) errors.push(balanceError);

    // 2. No zero-amount lines
    for (const line of entry.lines) {
      const debit = new Decimal(line.debit_amount || 0);
      const credit = new Decimal(line.credit_amount || 0);
      if (debit.isZero() && credit.isZero()) {
        errors.push({
          code: INTEGRITY_ERRORS.INVALID_ACCOUNT,
          message: `Line for account ${line.account_id} has zero debit and zero credit`,
          field: 'lines',
        });
      }
    }

    // 3. Multi-currency balance (if applicable)
    if (options.checkCurrency && entry.currency !== 'INR') {
      const fxError = this._checkMultiCurrencyBalance(entry);
      if (fxError) errors.push(fxError);
    }

    // 4. Cost-center balance (if cost centers are assigned)
    if (options.checkCostCenter) {
      const ccErrors = this._checkCostCenterBalance(entry.lines);
      errors.push(...ccErrors);
    }

    // 5. Idempotency — prevent duplicate postings
    if (entry.idempotency_key) {
      const isDuplicate = await this._checkIdempotency(
        entry.idempotency_key,
        entry.tenant_id
      );
      if (isDuplicate) {
        errors.push({
          code: INTEGRITY_ERRORS.DUPLICATE_TRANSACTION,
          message: `Duplicate transaction detected for key: ${entry.idempotency_key}`,
          field: 'idempotency_key',
        });
      }
    }

    if (errors.length > 0) {
      throw new IntegrityError('Journal entry failed integrity checks', errors);
    }

    return true;
  }

  /**
   * Validate a financial posting chain (e.g., Invoice → AR → GL → Audit).
   * Each step is checked before the next proceeds.
   */
  async validatePostingChain(chain, transaction) {
    const steps = [];

    for (const step of chain) {
      try {
        await step.validate();
        steps.push({ step: step.name, status: 'VALID' });
      } catch (err) {
        steps.push({ step: step.name, status: 'FAILED', error: err.message });
        this.emit('posting-chain-failure', { chain, failedStep: step.name, err });
        throw new IntegrityError(
          `Posting chain broken at step: ${step.name}`,
          [{ code: INTEGRITY_ERRORS.MISSING_COUNTERPART, message: err.message }]
        );
      }
    }

    return steps;
  }

  // ── Reconciliation ────────────────────────────────────────────────────────

  /**
   * Reconcile two financial sets (e.g., AR subledger vs GL control account).
   * Returns { balanced: bool, variance: Decimal, items: [] }
   */
  async reconcile(setA, setB, label = 'Reconciliation') {
    const totalA = setA.reduce((sum, item) => sum.plus(new Decimal(item.amount || 0)), ZERO);
    const totalB = setB.reduce((sum, item) => sum.plus(new Decimal(item.amount || 0)), ZERO);
    const variance = totalA.minus(totalB).abs();
    const balanced = variance.lte(BALANCE_TOLERANCE);

    const result = {
      label,
      balanced,
      totalA: totalA.toFixed(2),
      totalB: totalB.toFixed(2),
      variance: variance.toFixed(2),
      checkedAt: new Date().toISOString(),
    };

    if (!balanced) {
      this.emit('reconciliation-mismatch', result);
      logger.warn('[FinancialIntegrity] Reconciliation mismatch', result);
    }

    return result;
  }

  /**
   * Verify that an invoice's GL postings match the invoice total.
   */
  async verifyInvoiceGLIntegrity(invoice, glLines) {
    const invoiceTotal = new Decimal(invoice.net_amount || 0);
    const glTotal = glLines.reduce(
      (sum, l) => sum.plus(new Decimal(l.debit_amount || 0)),
      ZERO
    );

    if (invoiceTotal.minus(glTotal).abs().gt(BALANCE_TOLERANCE)) {
      throw new IntegrityError('Invoice GL posting mismatch', [
        {
          code: INTEGRITY_ERRORS.RECONCILIATION_MISMATCH,
          message: `Invoice ${invoice.invoice_number}: expected ${invoiceTotal.toFixed(2)}, GL shows ${glTotal.toFixed(2)}`,
        },
      ]);
    }

    return true;
  }

  /**
   * Verify depreciation reconciliation: cost − accumulated_depreciation = net_book_value
   */
  verifyDepreciationIntegrity(asset) {
    const cost = new Decimal(asset.cost || 0);
    const accumulated = new Decimal(asset.depreciation_to_date || 0);
    const salvage = new Decimal(asset.salvage_value || 0);
    const nbv = new Decimal(asset.net_book_value || 0);

    const expected = cost.minus(accumulated);
    if (expected.minus(nbv).abs().gt(BALANCE_TOLERANCE)) {
      throw new IntegrityError('Depreciation reconciliation failed', [
        {
          code: INTEGRITY_ERRORS.RECONCILIATION_MISMATCH,
          message: `Asset ${asset.asset_code}: NBV should be ${expected.toFixed(2)}, got ${nbv.toFixed(2)}`,
        },
      ]);
    }

    return true;
  }

  // ── Idempotency ───────────────────────────────────────────────────────────

  async registerIdempotencyKey(key, tenantId, result) {
    if (!this.redis) return;
    const redisKey = `idempotency:${tenantId}:${key}`;
    await this.redis.setex(redisKey, this.idempotencyTTL, JSON.stringify(result));
  }

  async getIdempotencyResult(key, tenantId) {
    if (!this.redis) return null;
    const redisKey = `idempotency:${tenantId}:${key}`;
    const cached = await this.redis.get(redisKey);
    return cached ? JSON.parse(cached) : null;
  }

  async _checkIdempotency(key, tenantId) {
    if (!this.redis) return false;
    const redisKey = `idempotency:${tenantId}:${key}`;
    const exists = await this.redis.exists(redisKey);
    return exists === 1;
  }

  // ── Rollback Helpers ──────────────────────────────────────────────────────

  /**
   * Build a reversal entry for a previously posted journal.
   */
  buildReversalEntry(originalEntry, reversalDate, reversedBy) {
    return {
      ...originalEntry,
      id: undefined,
      reference_number: `REV-${originalEntry.reference_number}`,
      entry_date: reversalDate,
      posting_date: reversalDate,
      status: 'DRAFT',
      reversed_entry_id: originalEntry.id,
      reversed_by: reversedBy,
      notes: `Reversal of ${originalEntry.reference_number}: ${originalEntry.notes || ''}`,
      lines: originalEntry.lines.map((line) => ({
        ...line,
        id: undefined,
        debit_amount: line.credit_amount,
        credit_amount: line.debit_amount,
        description: `[REVERSAL] ${line.description || ''}`,
      })),
    };
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  _checkDoubleEntryBalance(lines) {
    if (!lines || lines.length === 0) {
      return {
        code: INTEGRITY_ERRORS.UNBALANCED_ENTRY,
        message: 'Journal entry has no lines',
        field: 'lines',
      };
    }

    let totalDebit = ZERO;
    let totalCredit = ZERO;

    for (const line of lines) {
      totalDebit = totalDebit.plus(new Decimal(line.debit_amount || 0));
      totalCredit = totalCredit.plus(new Decimal(line.credit_amount || 0));
    }

    if (totalDebit.minus(totalCredit).abs().gt(BALANCE_TOLERANCE)) {
      return {
        code: INTEGRITY_ERRORS.UNBALANCED_ENTRY,
        message: `Debits (${totalDebit.toFixed(2)}) ≠ Credits (${totalCredit.toFixed(2)}) — difference: ${totalDebit.minus(totalCredit).toFixed(2)}`,
        field: 'lines',
        meta: {
          totalDebit: totalDebit.toFixed(2),
          totalCredit: totalCredit.toFixed(2),
          variance: totalDebit.minus(totalCredit).abs().toFixed(2),
        },
      };
    }

    return null;
  }

  _checkMultiCurrencyBalance(entry) {
    if (!entry.exchange_rate || entry.exchange_rate <= 0) {
      return {
        code: INTEGRITY_ERRORS.CURRENCY_MISMATCH,
        message: `Entry in ${entry.currency} is missing a valid exchange rate`,
        field: 'exchange_rate',
      };
    }
    return null;
  }

  _checkCostCenterBalance(lines) {
    const errors = [];
    const ccMap = {};

    for (const line of lines) {
      if (!line.cost_center_id) continue;
      if (!ccMap[line.cost_center_id]) {
        ccMap[line.cost_center_id] = { debit: ZERO, credit: ZERO };
      }
      ccMap[line.cost_center_id].debit = ccMap[line.cost_center_id].debit.plus(
        new Decimal(line.debit_amount || 0)
      );
      ccMap[line.cost_center_id].credit = ccMap[line.cost_center_id].credit.plus(
        new Decimal(line.credit_amount || 0)
      );
    }

    for (const [ccId, totals] of Object.entries(ccMap)) {
      const variance = totals.debit.minus(totals.credit).abs();
      if (variance.gt(BALANCE_TOLERANCE)) {
        errors.push({
          code: INTEGRITY_ERRORS.COST_CENTER_IMBALANCE,
          message: `Cost center ${ccId}: debit ${totals.debit.toFixed(2)} ≠ credit ${totals.credit.toFixed(2)}`,
          field: `cost_center_${ccId}`,
        });
      }
    }

    return errors;
  }
}

// ─── IntegrityError ───────────────────────────────────────────────────────────

class IntegrityError extends Error {
  constructor(message, violations = []) {
    super(message);
    this.name = 'IntegrityError';
    this.statusCode = 422;
    this.code = 'FINANCIAL_INTEGRITY_VIOLATION';
    this.violations = violations;
  }

  toJSON() {
    return {
      error: this.name,
      code: this.code,
      message: this.message,
      violations: this.violations,
    };
  }
}

// ─── Singleton Factory ────────────────────────────────────────────────────────

let instance = null;

function getFinancialIntegrityEngine(sequelize, redis) {
  if (!instance) {
    instance = new FinancialIntegrityEngine(sequelize, redis);
    logger.info('[FinancialIntegrityEngine] Initialized');
  }
  return instance;
}

module.exports = {
  FinancialIntegrityEngine,
  IntegrityError,
  INTEGRITY_ERRORS,
  getFinancialIntegrityEngine,
};
