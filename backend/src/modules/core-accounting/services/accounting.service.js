'use strict';

const { sequelize } = require('../../../config/database');
const accountingEngine = require('../../../shared/accounting-engine');
const fieldEncryption = require('../../shared/encryption/fieldEncryption');
const { logEvent, AUDIT_ACTIONS } = require('../../../shared/audit/auditLogger');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');
const { tenantCache, invalidateTag } = require('../../../shared/cache/cacheService');
const logger = require('../../../shared/utils/logger');
const Decimal = require('decimal.js');

/**
 * Core Accounting Service
 * Business logic for chart of accounts, journal vouchers, fiscal years.
 */

// ─── Chart of Accounts ────────────────────────────────────────────────────────

/**
 * Create or update an account in the chart of accounts.
 */
async function createAccount(data, userId) {
  const { tenantId, code, name, type, parentId, isGroup, ...rest } = data;

  // Check code uniqueness
  const [existing] = await sequelize.query(
    `SELECT id FROM accounts WHERE code = :code AND tenant_id = :tenantId`,
    { replacements: { code, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (existing) {
    throw Object.assign(new Error(`Account code ${code} already exists`), { statusCode: 409 });
  }

  // Get parent level
  let level = 1;
  let path = `/${code}`;

  if (parentId) {
    const [parent] = await sequelize.query(
      `SELECT level, path, is_group FROM accounts WHERE id = :parentId AND tenant_id = :tenantId`,
      { replacements: { parentId, tenantId }, type: sequelize.QueryTypes.SELECT }
    );

    if (!parent) throw Object.assign(new Error('Parent account not found'), { statusCode: 404 });
    if (!parent.is_group) throw Object.assign(new Error('Parent must be a group account'), { statusCode: 400 });

    level = parent.level + 1;
    path = `${parent.path}/${code}`;
  }

  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();

  await sequelize.query(
    `INSERT INTO accounts (
      id, tenant_id, code, name, type, parent_id, level, path,
      is_group, is_active, currency, opening_balance, current_balance,
      is_cash_account, is_bank_account,
      cost_center_id, department_id, branch_id,
      gst_applicable, tds_applicable, default_tax_code,
      bank_name, bank_account_number, bank_ifsc,
      tags, metadata, created_by, created_at, updated_at
    ) VALUES (
      :id, :tenantId, :code, :name, :type, :parentId, :level, :path,
      :isGroup, true, :currency, :openingBalance, :openingBalance,
      :isCashAccount, :isBankAccount,
      :costCenterId, :departmentId, :branchId,
      :gstApplicable, :tdsApplicable, :defaultTaxCode,
      :bankName, :bankAccountNumber, :bankIfsc,
      :tags, :metadata, :createdBy, NOW(), NOW()
    )`,
    {
      replacements: {
        id, tenantId, code, name, type,
        parentId: parentId || null,
        level, path,
        isGroup: isGroup || false,
        currency: rest.currency || 'INR',
        openingBalance: rest.openingBalance || 0,
        isCashAccount: rest.isCashAccount || false,
        isBankAccount: rest.isBankAccount || false,
        costCenterId: rest.costCenterId || null,
        departmentId: rest.departmentId || null,
        branchId: rest.branchId || null,
        gstApplicable: rest.gstApplicable || false,
        tdsApplicable: rest.tdsApplicable || false,
        defaultTaxCode: rest.defaultTaxCode || null,
        bankName: rest.bankName || null,
        bankAccountNumber: rest.bankAccountNumber ? fieldEncryption.encryptIfPresent(rest.bankAccountNumber) : null,
        bankIfsc: rest.bankIfsc || null,
        tags: JSON.stringify(rest.tags || []),
        metadata: JSON.stringify(rest.metadata || {}),
        createdBy: userId,
      },
    }
  );

  await tenantCache.invalidate(tenantId);
  await logEvent({
    tenantId, userId, action: AUDIT_ACTIONS.CREATE,
    entity: 'Account', entityId: id,
    after: { code, name, type, parentId },
  });

  eventBus.publish(EVENT_TYPES.ACCOUNTING.ACCOUNT_CREATED, { accountId: id, tenantId, code, name });

  return { id, code, name, type, level, path };
}

/**
 * Get hierarchical chart of accounts.
 */
async function getChartOfAccounts(tenantId, filters = {}) {
  const { type, isActive = true, includeBalances = true } = filters;

  const conditions = ['a.tenant_id = :tenantId'];
  const replacements = { tenantId };

  if (type) { conditions.push('a.type = :type'); replacements.type = type; }
  if (isActive !== null) { conditions.push('a.is_active = :isActive'); replacements.isActive = isActive; }

  const accounts = await sequelize.query(
    `SELECT
       a.id, a.code, a.name, a.type, a.sub_type,
       a.parent_id, a.level, a.is_group, a.path,
       a.currency, a.is_active, a.normal_balance,
       a.cost_center_id, a.department_id, a.branch_id,
       a.gst_applicable, a.tds_applicable,
       a.is_bank_account, a.is_cash_account, a.is_control_account,
       ${includeBalances ? 'a.opening_balance, a.current_balance,' : ''}
       a.tags
     FROM accounts a
     WHERE ${conditions.join(' AND ')}
     ORDER BY a.code`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  return accounts;
}

// ─── Journal Vouchers ─────────────────────────────────────────────────────────

/**
 * Create a journal entry (in DRAFT status).
 */
async function createJournalEntry(data, userId) {
  const { tenantId, voucherType, date, fiscalYearId, narration, reference, lines, ...rest } = data;

  // Validate entries
  const validation = accountingEngine.validateEntries(lines);
  if (!validation.valid) {
    throw Object.assign(new Error(validation.error), { statusCode: 400 });
  }

  const entry = await accountingEngine.createJournalEntry({
    tenantId, voucherType, date, fiscalYearId, narration, reference,
    createdBy: userId,
    ...rest,
  });

  // Save draft lines (not posted yet)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const { v4: uuidv4 } = require('uuid');
    await sequelize.query(
      `INSERT INTO journal_lines (
        id, journal_entry_id, line_number, account_id, tenant_id,
        debit_amount, credit_amount, narration, tax_code, tax_amount,
        cost_center_id, department_id, branch_id, created_at, updated_at
      ) VALUES (
        :id, :journalEntryId, :lineNumber, :accountId, :tenantId,
        :debitAmount, :creditAmount, :narration, :taxCode, :taxAmount,
        :costCenterId, :departmentId, :branchId, NOW(), NOW()
      )`,
      {
        replacements: {
          id: uuidv4(),
          journalEntryId: entry.id,
          lineNumber: i + 1,
          accountId: line.accountId,
          tenantId,
          debitAmount: line.debit || 0,
          creditAmount: line.credit || 0,
          narration: line.narration || null,
          taxCode: line.taxCode || null,
          taxAmount: line.taxAmount || 0,
          costCenterId: line.costCenterId || null,
          departmentId: line.departmentId || null,
          branchId: line.branchId || null,
        },
      }
    );
  }

  return { ...entry, status: 'DRAFT', lineCount: lines.length };
}

/**
 * Post a journal entry — finalizes it and updates account balances.
 */
async function postJournalEntry(journalEntryId, tenantId, userId) {
  // Load the draft entry with lines
  const [entry] = await sequelize.query(
    `SELECT * FROM journal_entries WHERE id = :id AND tenant_id = :tenantId AND status = 'DRAFT'`,
    { replacements: { id: journalEntryId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!entry) {
    throw Object.assign(new Error('Journal entry not found or not in DRAFT status'), { statusCode: 404 });
  }

  const lines = await sequelize.query(
    `SELECT account_id        AS "accountId",
            debit_amount      AS debit,
            credit_amount     AS credit,
            narration,
            tax_code          AS "taxCode",
            tax_amount        AS "taxAmount",
            cost_center_id    AS "costCenterId",
            department_id     AS "departmentId",
            branch_id         AS "branchId"
     FROM journal_lines WHERE journal_entry_id = :journalEntryId ORDER BY line_number`,
    { replacements: { journalEntryId }, type: sequelize.QueryTypes.SELECT }
  );

  // Generate entry number before posting
  const entryNumber = await accountingEngine.generateEntryNumber(tenantId, entry.voucher_type);

  await sequelize.query(
    `UPDATE journal_entries SET entry_number = :entryNumber WHERE id = :id`,
    { replacements: { entryNumber, id: journalEntryId } }
  );

  // Post via double-entry engine (updates account balances atomically)
  const result = await accountingEngine.postTransaction({
    journalEntryId,
    tenantId,
    fiscalYearId: entry.fiscal_year_id,
    postedBy: userId,
    lines,
  });

  await logEvent({
    tenantId, userId, action: AUDIT_ACTIONS.JOURNAL_POSTED,
    entity: 'JournalEntry', entityId: journalEntryId,
    after: { entryNumber, totalDebit: result.totalDebit, totalCredit: result.totalCredit },
    module: 'core-accounting',
  });

  eventBus.publish(EVENT_TYPES.ACCOUNTING.JOURNAL_POSTED, {
    journalEntryId, entryNumber, tenantId, userId,
    totalDebit: result.totalDebit, totalCredit: result.totalCredit,
  });

  // Reports (P&L, balance sheet) are now stale — drop the cache so the next
  // request regenerates from the freshly updated journal_lines.
  try {
    await invalidateTag(`financial-reports:${tenantId}`);
  } catch (cacheErr) {
    logger.warn('Report cache invalidation failed after journal post; reports may be stale up to 5 min', {
      tenantId, error: cacheErr.message,
    });
  }

  return { ...result, entryNumber };
}

/**
 * Reverse a posted journal entry.
 */
async function reverseJournalEntry(journalEntryId, tenantId, userId, reason) {
  if (!reason) throw Object.assign(new Error('Reversal reason is required'), { statusCode: 400 });

  const result = await accountingEngine.reverseTransaction(journalEntryId, tenantId, userId, reason);

  await logEvent({
    tenantId, userId, action: AUDIT_ACTIONS.JOURNAL_REVERSED,
    entity: 'JournalEntry', entityId: journalEntryId,
    after: { reversalId: result.reversalEntryId, reason },
  });

  eventBus.publish(EVENT_TYPES.ACCOUNTING.JOURNAL_REVERSED, {
    originalId: journalEntryId, reversalId: result.reversalEntryId, tenantId, userId,
  });

  return result;
}

/**
 * Get trial balance.
 */
async function getTrialBalance(tenantId, periodStart, periodEnd, filters = {}) {
  return accountingEngine.getTrialBalance(tenantId, periodStart, periodEnd, filters);
}

/**
 * Get ledger statement for an account.
 */
async function getLedgerStatement(accountId, tenantId, from, to, options = {}) {
  const { getLedgerStatement: getLedger } = require('../../../shared/accounting-engine/ledger');
  return getLedger(accountId, tenantId, from, to, options);
}

// ─── Fiscal Year Management ───────────────────────────────────────────────────

/**
 * Create a new fiscal year.
 */
async function createFiscalYear({ tenantId, name, startDate, endDate, createdBy }) {
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();

  await sequelize.query(
    `INSERT INTO fiscal_years (id, tenant_id, name, start_date, end_date, status, is_current, created_by, created_at, updated_at)
     VALUES (:id, :tenantId, :name, :startDate, :endDate, 'ACTIVE', false, :createdBy, NOW(), NOW())`,
    { replacements: { id, tenantId, name, startDate, endDate, createdBy } }
  );

  // Create accounting periods (monthly)
  const start = new Date(startDate);
  const end = new Date(endDate);
  let current = new Date(start);

  while (current <= end) {
    const periodEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    await sequelize.query(
      `INSERT INTO accounting_periods (id, tenant_id, fiscal_year_id, period_number, period_start, period_end, status, created_at, updated_at)
       VALUES (:id, :tenantId, :fiscalYearId, :periodNumber, :periodStart, :periodEnd, 'OPEN', NOW(), NOW())`,
      {
        replacements: {
          id: uuidv4(),
          tenantId, fiscalYearId: id,
          periodNumber: current.getMonth() + 1 + (current.getFullYear() - start.getFullYear()) * 12,
          periodStart: current.toISOString().split('T')[0],
          periodEnd: periodEnd.toISOString().split('T')[0],
        },
      }
    );
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return { id, name, startDate, endDate };
}

/**
 * Close a fiscal year.
 */
async function closeFiscalYear(fiscalYearId, tenantId, userId) {
  const [fy] = await sequelize.query(
    `SELECT id, status FROM fiscal_years WHERE id = :fiscalYearId AND tenant_id = :tenantId`,
    { replacements: { fiscalYearId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!fy) throw Object.assign(new Error('Fiscal year not found'), { statusCode: 404 });
  if (fy.status === 'CLOSED') throw Object.assign(new Error('Fiscal year already closed'), { statusCode: 400 });

  // Check no draft/pending entries exist
  const [drafts] = await sequelize.query(
    `SELECT COUNT(*) as count FROM journal_entries
     WHERE fiscal_year_id = :fiscalYearId AND status IN ('DRAFT', 'PENDING_APPROVAL')`,
    { replacements: { fiscalYearId }, type: sequelize.QueryTypes.SELECT }
  );

  if (parseInt(drafts.count) > 0) {
    throw Object.assign(
      new Error(`Cannot close fiscal year: ${drafts.count} pending entries exist`),
      { statusCode: 400 }
    );
  }

  await sequelize.query(
    `UPDATE fiscal_years SET status = 'CLOSED', closed_at = NOW(), closed_by = :userId, updated_at = NOW()
     WHERE id = :fiscalYearId`,
    { replacements: { fiscalYearId, userId } }
  );

  await logEvent({
    tenantId, userId, action: AUDIT_ACTIONS.FISCAL_YEAR_CLOSED,
    entity: 'FiscalYear', entityId: fiscalYearId,
  });

  eventBus.publish(EVENT_TYPES.ACCOUNTING.FISCAL_YEAR_CLOSED, { fiscalYearId, tenantId, userId });

  return { fiscalYearId, status: 'CLOSED', closedAt: new Date().toISOString() };
}

module.exports = {
  createAccount,
  getChartOfAccounts,
  createJournalEntry,
  postJournalEntry,
  reverseJournalEntry,
  getTrialBalance,
  getLedgerStatement,
  createFiscalYear,
  closeFiscalYear,
};
