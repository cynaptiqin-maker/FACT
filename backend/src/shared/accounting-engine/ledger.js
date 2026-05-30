'use strict';

const Decimal = require('decimal.js');
const { sequelize } = require('../../config/database');
const { NORMAL_BALANCE } = require('./doubleEntry');

/**
 * Ledger Service
 * Provides account balance queries, ledger statements with running balances.
 */

/**
 * Get current balance of an account as of a specific date.
 *
 * @param {string} accountId
 * @param {string} tenantId
 * @param {Date} [asOf] - If not provided, returns current balance
 * @returns {Promise<Object>} Balance details
 */
async function getLedgerBalance(accountId, tenantId, asOf = null) {
  const [account] = await sequelize.query(
    `SELECT id, code, name, type, opening_balance, current_balance, currency FROM accounts
     WHERE id = :accountId AND tenant_id = :tenantId AND is_active = true`,
    {
      replacements: { accountId, tenantId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  if (!asOf) {
    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.type,
      currency: account.currency,
      openingBalance: new Decimal(account.opening_balance || 0).toFixed(2),
      currentBalance: new Decimal(account.current_balance || 0).toFixed(2),
      normalBalance: NORMAL_BALANCE[account.type],
    };
  }

  // Calculate balance as of a specific date by summing transactions
  const [balanceRow] = await sequelize.query(
    `SELECT
       COALESCE(SUM(jl.debit_amount), 0) as total_debit,
       COALESCE(SUM(jl.credit_amount), 0) as total_credit
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE jl.account_id = :accountId
       AND je.tenant_id = :tenantId
       AND je.status = 'POSTED'
       AND je.date <= :asOf`,
    {
      replacements: { accountId, tenantId, asOf: new Date(asOf) },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const openingBal = new Decimal(account.opening_balance || 0);
  const totalDebit = new Decimal(balanceRow.total_debit);
  const totalCredit = new Decimal(balanceRow.total_credit);

  let balance;
  if (NORMAL_BALANCE[account.type] === 'DEBIT') {
    balance = openingBal.plus(totalDebit).minus(totalCredit);
  } else {
    balance = openingBal.plus(totalCredit).minus(totalDebit);
  }

  return {
    accountId: account.id,
    accountCode: account.code,
    accountName: account.name,
    accountType: account.type,
    currency: account.currency,
    openingBalance: openingBal.toFixed(2),
    totalDebit: totalDebit.toFixed(2),
    totalCredit: totalCredit.toFixed(2),
    closingBalance: balance.toFixed(2),
    asOf,
    normalBalance: NORMAL_BALANCE[account.type],
  };
}

/**
 * Get full ledger statement for an account over a date range.
 * Returns all transactions with running balance.
 *
 * @param {string} accountId
 * @param {string} tenantId
 * @param {Date} from
 * @param {Date} to
 * @param {Object} [options]
 * @returns {Promise<Object>} Ledger statement with running balances
 */
async function getLedgerStatement(accountId, tenantId, from, to, options = {}) {
  const { page = 1, limit = 100, search } = options;
  const clampedLimit = Math.min(parseInt(limit) || 100, 500);
  const offset = (page - 1) * clampedLimit;

  // Get account details
  const [account] = await sequelize.query(
    `SELECT * FROM accounts WHERE id = :accountId AND tenant_id = :tenantId`,
    {
      replacements: { accountId, tenantId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  if (!account) throw new Error(`Account ${accountId} not found`);

  // Calculate opening balance as of period start
  const [openingRow] = await sequelize.query(
    `SELECT
       COALESCE(SUM(jl.debit_amount), 0) as total_debit,
       COALESCE(SUM(jl.credit_amount), 0) as total_credit
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE jl.account_id = :accountId
       AND je.tenant_id = :tenantId
       AND je.status = 'POSTED'
       AND je.date < :from`,
    {
      replacements: { accountId, tenantId, from: new Date(from) },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const openingBase = new Decimal(account.opening_balance || 0);
  const priorDebit = new Decimal(openingRow.total_debit);
  const priorCredit = new Decimal(openingRow.total_credit);

  let openingBalance;
  if (NORMAL_BALANCE[account.type] === 'DEBIT') {
    openingBalance = openingBase.plus(priorDebit).minus(priorCredit);
  } else {
    openingBalance = openingBase.plus(priorCredit).minus(priorDebit);
  }

  // Search condition
  const searchCondition = search
    ? `AND (je.narration ILIKE :search OR je.entry_number ILIKE :search OR je.reference ILIKE :search)`
    : '';

  // Get period transactions
  const transactions = await sequelize.query(
    `SELECT
       jl.id as line_id,
       je.id as journal_entry_id,
       je.entry_number,
       je.voucher_type,
       je.date,
       je.narration as entry_narration,
       jl.narration as line_narration,
       jl.debit_amount,
       jl.credit_amount,
       je.reference,
       je.source_module,
       je.source_id
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE jl.account_id = :accountId
       AND je.tenant_id = :tenantId
       AND je.status = 'POSTED'
       AND je.date >= :from
       AND je.date <= :to
       ${searchCondition}
     ORDER BY je.date ASC, je.created_at ASC
     LIMIT :limit OFFSET :offset`,
    {
      replacements: {
        accountId,
        tenantId,
        from: new Date(from),
        to: new Date(to),
        limit: clampedLimit,
        offset,
        search: search ? `%${search}%` : undefined,
      },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  // Calculate running balance
  let runningBalance = openingBalance;
  let periodDebit = new Decimal(0);
  let periodCredit = new Decimal(0);

  const CREDIT_NORMAL_TYPES = ['LIABILITY', 'EQUITY', 'INCOME', 'REVENUE'];
  const isCreditNormal = CREDIT_NORMAL_TYPES.includes(account.type?.toUpperCase());

  const lines = transactions.map((tx) => {
    const debit = new Decimal(tx.debit_amount || 0);
    const credit = new Decimal(tx.credit_amount || 0);

    periodDebit = periodDebit.plus(debit);
    periodCredit = periodCredit.plus(credit);

    if (NORMAL_BALANCE[account.type] === 'DEBIT') {
      runningBalance = runningBalance.plus(debit).minus(credit);
    } else {
      runningBalance = runningBalance.plus(credit).minus(debit);
    }

    return {
      lineId: tx.line_id,
      journalEntryId: tx.journal_entry_id,
      entryNumber: tx.entry_number,
      voucherType: tx.voucher_type,
      date: tx.date,
      narration: tx.line_narration || tx.entry_narration,
      reference: tx.reference,
      debit: debit.toFixed(2),
      credit: credit.toFixed(2),
      balance: runningBalance.toFixed(2),
      balanceType: isCreditNormal
        ? (runningBalance.isNegative() ? 'DR' : 'CR')
        : (runningBalance.isNegative() ? 'CR' : 'DR'),
      sourceModule: tx.source_module,
      sourceId: tx.source_id,
    };
  });

  const closingBalance = runningBalance;

  return {
    account: {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      currency: account.currency,
    },
    period: { from, to },
    openingBalance: {
      amount: openingBalance.toFixed(2),
      type: isCreditNormal
        ? (openingBalance.isNegative() ? 'DR' : 'CR')
        : (openingBalance.isNegative() ? 'CR' : 'DR'),
    },
    lines,
    totals: {
      periodDebit: periodDebit.toFixed(2),
      periodCredit: periodCredit.toFixed(2),
    },
    closingBalance: {
      amount: closingBalance.toFixed(2),
      type: isCreditNormal
        ? (closingBalance.isNegative() ? 'DR' : 'CR')
        : (closingBalance.isNegative() ? 'CR' : 'DR'),
    },
    pagination: { page, limit: clampedLimit },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get sub-ledger summary (e.g., all party-wise balances under a control account).
 */
async function getSubLedgerSummary(controlAccountId, tenantId, asOf = new Date()) {
  const rows = await sequelize.query(
    `SELECT
       a.id, a.code, a.name, a.type,
       COALESCE(jl_agg.total_debit, 0)  as total_debit,
       COALESCE(jl_agg.total_credit, 0) as total_credit,
       a.opening_balance
     FROM accounts a
     LEFT JOIN (
       SELECT jl.account_id,
              SUM(jl.debit_amount)  as total_debit,
              SUM(jl.credit_amount) as total_credit
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       WHERE je.status = 'POSTED' AND je.date <= :asOf AND je.tenant_id = :tenantId
       GROUP BY jl.account_id
     ) jl_agg ON jl_agg.account_id = a.id
     WHERE a.parent_id = :controlAccountId AND a.tenant_id = :tenantId AND a.is_group = false
     ORDER BY a.code`,
    {
      replacements: { controlAccountId, tenantId, asOf: new Date(asOf) },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const CREDIT_NORMAL_TYPES = ['LIABILITY', 'EQUITY', 'INCOME', 'REVENUE'];

  return rows.map((row) => {
    const opening = new Decimal(row.opening_balance || 0);
    const debit = new Decimal(row.total_debit);
    const credit = new Decimal(row.total_credit);

    let balance;
    if (NORMAL_BALANCE[row.type] === 'DEBIT') {
      balance = opening.plus(debit).minus(credit);
    } else {
      balance = opening.plus(credit).minus(debit);
    }

    const isCreditNormal = CREDIT_NORMAL_TYPES.includes(row.type?.toUpperCase());

    return {
      accountId: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      totalDebit: debit.toFixed(2),
      totalCredit: credit.toFixed(2),
      balance: balance.toFixed(2),
      balanceType: isCreditNormal
        ? (balance.isNegative() ? 'DR' : 'CR')
        : (balance.isNegative() ? 'CR' : 'DR'),
    };
  });
}

module.exports = {
  getLedgerBalance,
  getLedgerStatement,
  getSubLedgerSummary,
};
