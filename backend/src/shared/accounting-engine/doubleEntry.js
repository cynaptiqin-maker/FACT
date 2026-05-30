'use strict';

const Decimal = require('decimal.js');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../config/database');
const logger = require('../utils/logger');

// Configure Decimal.js for financial precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * FACT Double-Entry Accounting Engine
 *
 * Core principles:
 * 1. Every transaction must have equal debits and credits (DR = CR)
 * 2. Journal entries are IMMUTABLE — no deletes, only reversals
 * 3. All postings are atomic PostgreSQL transactions
 * 4. Running balances updated on every post
 *
 * Account Normal Balances:
 *   ASSET       → Debit increases, Credit decreases
 *   LIABILITY   → Credit increases, Debit decreases
 *   EQUITY      → Credit increases, Debit decreases
 *   INCOME      → Credit increases, Debit decreases
 *   EXPENSE     → Debit increases, Credit decreases
 */

const ACCOUNT_TYPES = {
  ASSET: 'ASSET',
  LIABILITY: 'LIABILITY',
  EQUITY: 'EQUITY',
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
};

// Normal balance direction per account type
const NORMAL_BALANCE = {
  [ACCOUNT_TYPES.ASSET]: 'DEBIT',
  [ACCOUNT_TYPES.LIABILITY]: 'CREDIT',
  [ACCOUNT_TYPES.EQUITY]: 'CREDIT',
  [ACCOUNT_TYPES.INCOME]: 'CREDIT',
  [ACCOUNT_TYPES.EXPENSE]: 'DEBIT',
};

/**
 * Validate that total debits equal total credits.
 *
 * @param {Array} entries - Array of { accountId, debit, credit, ... }
 * @returns {{ valid: boolean, totalDebit: Decimal, totalCredit: Decimal, difference: Decimal }}
 */
function validateEntries(entries) {
  if (!entries || entries.length === 0) {
    return { valid: false, error: 'No entries provided', totalDebit: new Decimal(0), totalCredit: new Decimal(0) };
  }

  if (entries.length < 2) {
    return { valid: false, error: 'Minimum 2 line items required for double-entry', totalDebit: new Decimal(0), totalCredit: new Decimal(0) };
  }

  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  for (const entry of entries) {
    const debit = new Decimal(entry.debit || 0);
    const credit = new Decimal(entry.credit || 0);

    if (debit.isNegative() || credit.isNegative()) {
      return { valid: false, error: 'Debit and credit amounts cannot be negative', totalDebit, totalCredit };
    }

    if (debit.isZero() && credit.isZero()) {
      return { valid: false, error: `Line ${entry.lineNumber || 'unknown'}: Both debit and credit cannot be zero` };
    }

    if (!debit.isZero() && !credit.isZero()) {
      return { valid: false, error: `Line ${entry.lineNumber || 'unknown'}: A line cannot have both debit and credit` };
    }

    totalDebit = totalDebit.plus(debit);
    totalCredit = totalCredit.plus(credit);
  }

  const difference = totalDebit.minus(totalCredit).abs();
  const TOLERANCE = new Decimal('0.01'); // Allow 1 paisa tolerance for rounding

  const valid = difference.lessThanOrEqualTo(TOLERANCE);

  return {
    valid,
    totalDebit,
    totalCredit,
    difference,
    error: valid ? null : `Imbalanced entry: DR ${totalDebit.toFixed(2)} ≠ CR ${totalCredit.toFixed(2)} (diff: ${difference.toFixed(2)})`,
  };
}

/**
 * Post a double-entry transaction atomically.
 *
 * @param {Object} params
 * @param {string} params.journalEntryId - UUID of journal entry header
 * @param {string} params.tenantId
 * @param {string} params.fiscalYearId
 * @param {string} params.postedBy - user ID
 * @param {Array} params.lines - Journal lines with account IDs and amounts
 * @param {Object} [params.transaction] - Existing Sequelize transaction (optional)
 * @returns {Promise<Object>} Posted journal entry with running balances
 */
async function postTransaction({
  journalEntryId,
  tenantId,
  fiscalYearId,
  postedBy,
  lines,
  transaction: existingTx,
}) {
  const validation = validateEntries(lines);
  if (!validation.valid) {
    throw new Error(`Double-entry validation failed: ${validation.error}`);
  }

  const executePost = async (t) => {
    const postedLines = [];

    // Check current status and lock the journal entry row
    const [currentEntry] = await sequelize.query(
      `SELECT status FROM journal_entries WHERE id = :journalEntryId AND tenant_id = :tenantId FOR UPDATE`,
      { replacements: { journalEntryId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!currentEntry) throw new Error(`Journal entry ${journalEntryId} not found`);
    if (!['DRAFT', 'PENDING_APPROVAL'].includes(currentEntry.status)) {
      throw new Error(`Cannot post journal entry with status: ${currentEntry.status}`);
    }

    // Lock accounts for update to prevent race conditions
    const accountIds = [...new Set(lines.map((l) => l.accountId))];

    await sequelize.query(
      `SELECT id FROM accounts WHERE id = ANY(:accountIds) AND tenant_id = :tenantId FOR UPDATE`,
      {
        replacements: { accountIds, tenantId },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    // Remove any pre-existing draft lines so postTransaction is the sole source of truth.
    // createJournalEntry inserts lines without running balances; we re-insert below with
    // accurate balances computed from current account state.
    await sequelize.query(
      `DELETE FROM journal_lines WHERE journal_entry_id = :journalEntryId`,
      { replacements: { journalEntryId }, transaction: t }
    );

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const debit = new Decimal(line.debit || 0);
      const credit = new Decimal(line.credit || 0);

      // Get current account balance
      const [accountRows] = await sequelize.query(
        `SELECT id, type, current_balance, currency, is_group, allow_direct_posting, is_active FROM accounts WHERE id = :accountId AND tenant_id = :tenantId`,
        {
          replacements: { accountId: line.accountId, tenantId },
          type: sequelize.QueryTypes.SELECT,
          transaction: t,
        }
      );

      if (!accountRows) {
        throw new Error(`Account not found: ${line.accountId}`);
      }
      if (accountRows.is_group) throw new Error(`Account ${line.accountId} is a group account — direct posting not allowed`);
      if (!accountRows.is_active) throw new Error(`Account ${line.accountId} is inactive`);
      if (accountRows.allow_direct_posting === false) throw new Error(`Account ${line.accountId} does not allow direct posting`);

      const currentBalance = new Decimal(accountRows.current_balance || 0);
      const accountType = accountRows.type;

      // Calculate new balance
      // For ASSET/EXPENSE (normal debit): balance += debit - credit
      // For LIABILITY/EQUITY/INCOME (normal credit): balance += credit - debit
      let balanceChange;
      if (NORMAL_BALANCE[accountType] === 'DEBIT') {
        balanceChange = debit.minus(credit);
      } else {
        balanceChange = credit.minus(debit);
      }

      const newBalance = currentBalance.plus(balanceChange);

      // Update account current balance
      await sequelize.query(
        `UPDATE accounts
         SET current_balance = :newBalance, updated_at = NOW()
         WHERE id = :accountId AND tenant_id = :tenantId`,
        {
          replacements: {
            newBalance: newBalance.toFixed(4),
            accountId: line.accountId,
            tenantId,
          },
          transaction: t,
        }
      );

      // Keep bank_accounts.current_balance in sync when this GL account is
      // linked via gl_account_id (set once when the bank account is configured)
      await sequelize.query(
        `UPDATE bank_accounts
         SET current_balance = :newBalance, updated_at = NOW()
         WHERE gl_account_id = :accountId AND tenant_id = :tenantId`,
        {
          replacements: {
            newBalance: newBalance.toFixed(4),
            accountId: line.accountId,
            tenantId,
          },
          transaction: t,
        }
      );

      // Insert journal line
      const lineId = uuidv4();
      await sequelize.query(
        `INSERT INTO journal_lines (
          id, journal_entry_id, line_number, account_id,
          debit_amount, credit_amount,
          cost_center_id, department_id, branch_id,
          narration, tax_code, tax_amount,
          running_balance, tenant_id, created_at, updated_at
        ) VALUES (
          :id, :journalEntryId, :lineNumber, :accountId,
          :debitAmount, :creditAmount,
          :costCenterId, :departmentId, :branchId,
          :narration, :taxCode, :taxAmount,
          :runningBalance, :tenantId, NOW(), NOW()
        )`,
        {
          replacements: {
            id: lineId,
            journalEntryId,
            lineNumber: i + 1,
            accountId: line.accountId,
            debitAmount: debit.toFixed(4),
            creditAmount: credit.toFixed(4),
            costCenterId: line.costCenterId || null,
            departmentId: line.departmentId || null,
            branchId: line.branchId || null,
            narration: line.narration || null,
            taxCode: line.taxCode || null,
            taxAmount: new Decimal(line.taxAmount || 0).toFixed(4),
            runningBalance: newBalance.toFixed(4),
            tenantId,
          },
          transaction: t,
        }
      );

      postedLines.push({
        id: lineId,
        lineNumber: i + 1,
        accountId: line.accountId,
        accountType,
        debit: debit.toFixed(2),
        credit: credit.toFixed(2),
        runningBalance: newBalance.toFixed(2),
      });
    }

    // Update journal entry status to POSTED
    await sequelize.query(
      `UPDATE journal_entries
       SET status = 'POSTED', posted_at = NOW(), posted_by = :postedBy,
           total_debit = :totalDebit, total_credit = :totalCredit, updated_at = NOW()
       WHERE id = :journalEntryId AND tenant_id = :tenantId`,
      {
        replacements: {
          postedBy,
          totalDebit: validation.totalDebit.toFixed(4),
          totalCredit: validation.totalCredit.toFixed(4),
          journalEntryId,
          tenantId,
        },
        transaction: t,
      }
    );

    logger.info('Transaction posted', {
      journalEntryId,
      totalDebit: validation.totalDebit.toFixed(2),
      totalCredit: validation.totalCredit.toFixed(2),
      lineCount: lines.length,
      postedBy,
    });

    return {
      journalEntryId,
      status: 'POSTED',
      totalDebit: validation.totalDebit.toFixed(2),
      totalCredit: validation.totalCredit.toFixed(2),
      lines: postedLines,
      postedAt: new Date().toISOString(),
    };
  };

  if (existingTx) {
    return executePost(existingTx);
  }
  return sequelize.transaction(executePost);
}

/**
 * Reverse a posted journal entry.
 * Creates a new journal entry with reversed DR/CR, marks original as REVERSED.
 *
 * @param {string} journalEntryId - Journal entry to reverse
 * @param {string} tenantId
 * @param {string} reversedBy - user ID
 * @param {string} reason - Narration for reversal
 * @returns {Promise<Object>} Reversal journal entry
 */
async function reverseTransaction(journalEntryId, tenantId, reversedBy, reason) {
  return sequelize.transaction(async (t) => {
    // Lock the row before reading to prevent reversal race conditions
    await sequelize.query(
      `SELECT id FROM journal_entries WHERE id = :journalEntryId AND tenant_id = :tenantId FOR UPDATE`,
      { replacements: { journalEntryId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    // Get original journal entry
    const [original] = await sequelize.query(
      `SELECT je.*, array_agg(
         json_build_object(
           'accountId', jl.account_id,
           'debit', jl.debit_amount,
           'credit', jl.credit_amount,
           'costCenterId', jl.cost_center_id,
           'departmentId', jl.department_id,
           'branchId', jl.branch_id,
           'narration', jl.narration
         ) ORDER BY jl.line_number
       ) as lines
       FROM journal_entries je
       JOIN journal_lines jl ON jl.journal_entry_id = je.id
       WHERE je.id = :journalEntryId AND je.tenant_id = :tenantId AND je.status = 'POSTED'
       GROUP BY je.id`,
      {
        replacements: { journalEntryId, tenantId },
        type: sequelize.QueryTypes.SELECT,
        transaction: t,
      }
    );

    if (!original) {
      throw new Error(`Journal entry ${journalEntryId} not found or not in POSTED status`);
    }

    // Check not already reversed
    if (original.is_reversed) {
      throw new Error(`Journal entry ${journalEntryId} has already been reversed`);
    }

    // Create reversal entry number
    const { generateEntryNumber } = require('./journal');
    const reversalNumber = await generateEntryNumber(tenantId, original.voucher_type, t);

    // Create reversal journal entry header
    const reversalId = uuidv4();
    await sequelize.query(
      `INSERT INTO journal_entries (
        id, tenant_id, entry_number, voucher_type, date, fiscal_year_id,
        narration, reference, status, posted_by, posted_at,
        total_debit, total_credit, is_reversal, reversal_of,
        source_module, source_id, created_at, updated_at
      ) VALUES (
        :id, :tenantId, :entryNumber, :voucherType, NOW(), :fiscalYearId,
        :narration, :reference, 'DRAFT', :postedBy, NOW(),
        :totalDebit, :totalCredit, true, :reversalOf,
        :sourceModule, :sourceId, NOW(), NOW()
      )`,
      {
        replacements: {
          id: reversalId,
          tenantId,
          entryNumber: reversalNumber,
          voucherType: original.voucher_type,
          fiscalYearId: original.fiscal_year_id,
          narration: `REVERSAL of ${original.entry_number}: ${reason}`,
          reference: original.entry_number,
          postedBy: reversedBy,
          totalDebit: original.total_debit,
          totalCredit: original.total_credit,
          reversalOf: journalEntryId,
          sourceModule: original.source_module,
          sourceId: original.source_id,
        },
        transaction: t,
      }
    );

    // Swap DR/CR for each line
    const reversalLines = original.lines.map((line) => ({
      accountId: line.accountId,
      debit: line.credit,  // Swap
      credit: line.debit,  // Swap
      costCenterId: line.costCenterId,
      departmentId: line.departmentId,
      branchId: line.branchId,
      narration: `REV: ${line.narration || ''}`,
    }));

    // Post reversal lines
    const result = await postTransaction({
      journalEntryId: reversalId,
      tenantId,
      fiscalYearId: original.fiscal_year_id,
      postedBy: reversedBy,
      lines: reversalLines,
      transaction: t,
    });

    // Mark original as REVERSED
    await sequelize.query(
      `UPDATE journal_entries
       SET status = 'REVERSED', is_reversed = true, reversed_by_id = :reversalId, updated_at = NOW()
       WHERE id = :journalEntryId AND tenant_id = :tenantId`,
      {
        replacements: { reversalId, journalEntryId, tenantId },
        transaction: t,
      }
    );

    logger.info('Transaction reversed', {
      originalId: journalEntryId,
      reversalId,
      reversedBy,
      reason,
    });

    return {
      originalEntryId: journalEntryId,
      reversalEntryId: reversalId,
      reversalNumber,
      ...result,
    };
  });
}

/**
 * Get trial balance for a period.
 *
 * @param {string} tenantId
 * @param {Date} periodStart
 * @param {Date} periodEnd
 * @param {string} [branchId]
 * @param {string} [departmentId]
 */
async function getTrialBalance(tenantId, periodStart, periodEnd, { branchId, departmentId } = {}) {
  const whereClause = branchId
    ? `AND jl.branch_id = :branchId`
    : departmentId
    ? `AND jl.department_id = :departmentId`
    : '';

  const rows = await sequelize.query(
    `SELECT
       a.id as account_id,
       a.code as account_code,
       a.name as account_name,
       a.type as account_type,
       a.parent_id,
       COALESCE(SUM(jl.debit_amount), 0) as period_debit,
       COALESCE(SUM(jl.credit_amount), 0) as period_credit,
       a.opening_balance,
       a.current_balance
     FROM accounts a
     LEFT JOIN (
       SELECT jl.*
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
         AND je.status = 'POSTED'
         AND je.date >= :periodStart
         AND je.date <= :periodEnd
         AND je.tenant_id = :tenantId
         ${whereClause}
     ) jl ON jl.account_id = a.id
     WHERE a.tenant_id = :tenantId
       AND a.is_group = false
       AND a.is_active = true
     GROUP BY a.id, a.code, a.name, a.type, a.parent_id, a.opening_balance, a.current_balance
     ORDER BY a.code`,
    {
      replacements: { tenantId, periodStart, periodEnd, branchId, departmentId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  let totalDebit = new Decimal(0);
  let totalCredit = new Decimal(0);

  const accounts = rows.map((row) => {
    const periodDebit = new Decimal(row.period_debit);
    const periodCredit = new Decimal(row.period_credit);
    const closingBalance = new Decimal(row.current_balance || 0);

    totalDebit = totalDebit.plus(periodDebit);
    totalCredit = totalCredit.plus(periodCredit);

    return {
      accountId: row.account_id,
      accountCode: row.account_code,
      accountName: row.account_name,
      accountType: row.account_type,
      parentId: row.parent_id,
      openingBalance: new Decimal(row.opening_balance || 0).toFixed(2),
      periodDebit: periodDebit.toFixed(2),
      periodCredit: periodCredit.toFixed(2),
      closingBalance: closingBalance.toFixed(2),
      normalBalance: NORMAL_BALANCE[row.account_type],
    };
  });

  const balanced = totalDebit.minus(totalCredit).abs().lessThanOrEqualTo(new Decimal('0.01'));

  return {
    periodStart,
    periodEnd,
    accounts,
    totals: {
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      balanced,
      difference: totalDebit.minus(totalCredit).abs().toFixed(2),
    },
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  validateEntries,
  postTransaction,
  reverseTransaction,
  getTrialBalance,
  ACCOUNT_TYPES,
  NORMAL_BALANCE,
};
