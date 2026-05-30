'use strict';

/**
 * PrePostValidator — business-level pre-posting checks.
 *
 * Checks performed (fail-fast, in order):
 *   1. Idempotency — reject duplicate source records unless allowReversal=true
 *   2. Fiscal year — must exist and be open
 *   3. Period lock  — the accounting period covering `date` must not be LOCKED
 *   4. Account validity — each account must exist, be active, and not be a group account
 *   5. Amount sanity — total debit > 0 AND total credit > 0
 *
 * @module posting-engine/PrePostValidator
 */

// ─── Error Classes ────────────────────────────────────────────────────────────

class DuplicatePostingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DuplicatePostingError';
    this.statusCode = 409;
  }
}

class FiscalYearClosedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FiscalYearClosedError';
    this.statusCode = 422;
  }
}

class PeriodLockedError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PeriodLockedError';
    this.statusCode = 422;
  }
}

class InvalidAccountError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidAccountError';
    this.statusCode = 422;
  }
}

class ZeroAmountError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ZeroAmountError';
    this.statusCode = 422;
  }
}

// ─── Validator ────────────────────────────────────────────────────────────────

class PrePostValidator {
  /**
   * @param {import('sequelize').Sequelize} sequelize
   */
  constructor(sequelize) {
    this.sequelize = sequelize;
  }

  /**
   * Run all pre-posting checks in order. Fail-fast on first violation.
   *
   * @param {Object} params
   * @param {string}  params.tenantId
   * @param {string}  params.fundType
   * @param {string}  params.fiscalYearId
   * @param {string}  params.date           - ISO date string (YYYY-MM-DD)
   * @param {string}  params.sourceModule
   * @param {string}  params.sourceId
   * @param {string}  params.idempotencyKey
   * @param {Array}   params.lines          - Array of { accountId, debit, credit }
   * @param {boolean} [params.allowReversal=false] - If true, existing REVERSED entries are allowed
   * @throws {DuplicatePostingError}
   * @throws {FiscalYearClosedError}
   * @throws {PeriodLockedError}
   * @throws {InvalidAccountError}
   * @throws {ZeroAmountError}
   */
  async validate({
    tenantId,
    fiscalYearId,
    date,
    sourceModule,
    sourceId,
    idempotencyKey,
    lines,
    allowReversal = false,
  }) {
    // ── 1. Idempotency check ──────────────────────────────────────────────────
    await this._checkIdempotency({ tenantId, sourceModule, sourceId, allowReversal });

    // ── 2. Fiscal year open check ─────────────────────────────────────────────
    await this._checkFiscalYear({ tenantId, fiscalYearId });

    // ── 3. Period lock check ──────────────────────────────────────────────────
    await this._checkPeriodLock({ tenantId, date });

    // ── 4. Account validity check ─────────────────────────────────────────────
    await this._checkAccounts({ tenantId, lines });

    // ── 5. Amount sanity check ────────────────────────────────────────────────
    this._checkAmounts(lines);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  async _checkIdempotency({ tenantId, sourceModule, sourceId, allowReversal }) {
    const [existing] = await this.sequelize.query(
      `SELECT entry_number FROM journal_entries
       WHERE source_module = :sourceModule
         AND source_id = :sourceId
         AND tenant_id = :tenantId
         AND status != 'REVERSED'
       LIMIT 1`,
      {
        replacements: { sourceModule, sourceId, tenantId },
        type: this.sequelize.QueryTypes.SELECT,
      }
    );

    if (existing && !allowReversal) {
      throw new DuplicatePostingError(
        `PrePostValidator: A journal entry (${existing.entry_number}) already exists for ` +
        `source ${sourceModule}:${sourceId}. Use allowReversal=true to post a reversal.`
      );
    }
  }

  async _checkFiscalYear({ tenantId, fiscalYearId }) {
    const [fy] = await this.sequelize.query(
      `SELECT id, status FROM fiscal_years
       WHERE id = :fiscalYearId AND tenant_id = :tenantId
       LIMIT 1`,
      {
        replacements: { fiscalYearId, tenantId },
        type: this.sequelize.QueryTypes.SELECT,
      }
    );

    if (!fy) {
      throw new FiscalYearClosedError(
        `PrePostValidator: Fiscal year '${fiscalYearId}' not found for tenant '${tenantId}'.`
      );
    }
    if (fy.status !== 'open') {
      throw new FiscalYearClosedError(
        `PrePostValidator: Fiscal year '${fiscalYearId}' is '${fy.status}', not 'open'. Cannot post to a closed fiscal year.`
      );
    }
  }

  async _checkPeriodLock({ tenantId, date }) {
    const [period] = await this.sequelize.query(
      `SELECT id, name, status FROM accounting_periods
       WHERE tenant_id = :tenantId
         AND start_date <= :date::date
         AND end_date >= :date::date
       LIMIT 1`,
      {
        replacements: { tenantId, date },
        type: this.sequelize.QueryTypes.SELECT,
      }
    );

    if (period && period.status === 'LOCKED') {
      throw new PeriodLockedError(
        `PrePostValidator: Accounting period '${period.name || period.id}' covering date '${date}' is LOCKED. ` +
        `Unlock the period before posting.`
      );
    }
  }

  async _checkAccounts({ tenantId, lines }) {
    const uniqueAccountIds = [...new Set(lines.map(l => l.accountId).filter(Boolean))];
    if (uniqueAccountIds.length === 0) return;

    const placeholders = uniqueAccountIds.map((_, i) => `:accountId${i}`).join(', ');
    const replacements = { tenantId };
    uniqueAccountIds.forEach((id, i) => {
      replacements[`accountId${i}`] = id;
    });

    const accounts = await this.sequelize.query(
      `SELECT id, code, name, is_active, is_group, tenant_id
       FROM accounts
       WHERE id IN (${placeholders}) AND tenant_id = :tenantId`,
      { replacements, type: this.sequelize.QueryTypes.SELECT }
    );

    const foundIds = new Set(accounts.map(a => a.id));

    for (const accountId of uniqueAccountIds) {
      if (!foundIds.has(accountId)) {
        throw new InvalidAccountError(
          `PrePostValidator: Account '${accountId}' not found for tenant '${tenantId}'.`
        );
      }

      const acc = accounts.find(a => a.id === accountId);

      if (!acc.is_active) {
        throw new InvalidAccountError(
          `PrePostValidator: Account '${acc.code}' (${acc.name}) is inactive. Only active accounts may be posted to.`
        );
      }

      if (acc.is_group) {
        throw new InvalidAccountError(
          `PrePostValidator: Account '${acc.code}' (${acc.name}) is a group/header account. Only leaf accounts may be posted to.`
        );
      }
    }
  }

  _checkAmounts(lines) {
    const totalDebit  = lines.reduce((sum, l) => sum + (Number(l.debit)  || 0), 0);
    const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    if (totalDebit <= 0) {
      throw new ZeroAmountError(
        `PrePostValidator: Total debit amount is ${totalDebit}. At least one line must have a positive debit.`
      );
    }

    if (totalCredit <= 0) {
      throw new ZeroAmountError(
        `PrePostValidator: Total credit amount is ${totalCredit}. At least one line must have a positive credit.`
      );
    }
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  PrePostValidator,
  DuplicatePostingError,
  FiscalYearClosedError,
  PeriodLockedError,
  InvalidAccountError,
  ZeroAmountError,
};
