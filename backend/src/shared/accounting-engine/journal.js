'use strict';

const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../config/database');
const logger = require('../utils/logger');

/**
 * Voucher type codes for auto-numbering.
 */
const VOUCHER_TYPES = {
  JOURNAL: 'JV',
  PAYMENT: 'PV',
  RECEIPT: 'RV',
  CONTRA: 'CV',
  DEBIT_NOTE: 'DN',
  CREDIT_NOTE: 'CN',
  PURCHASE: 'PI',
  SALES: 'SI',
  OPENING: 'OB',
};

/**
 * Generate a sequential entry number: JV-2026-000001
 *
 * Uses a PostgreSQL advisory lock per tenant+type to prevent duplicates.
 *
 * @param {string} tenantId
 * @param {string} voucherType
 * @param {Object} [transaction] - Sequelize transaction
 * @returns {Promise<string>} Entry number like JV-2026-000001
 */
async function generateEntryNumber(tenantId, voucherType, transaction) {
  const prefix = VOUCHER_TYPES[voucherType] || 'JV';
  const year = new Date().getFullYear();
  const sequenceKey = `${tenantId}:${voucherType}:${year}`;

  const execute = async (t) => {
    // Upsert sequence row and increment atomically
    const [result] = await sequelize.query(
      `INSERT INTO voucher_sequences (tenant_id, voucher_type, fiscal_year, last_number, created_at, updated_at)
       VALUES (:tenantId, :voucherType, :year, 1, NOW(), NOW())
       ON CONFLICT (tenant_id, voucher_type, fiscal_year)
       DO UPDATE SET last_number = voucher_sequences.last_number + 1, updated_at = NOW()
       RETURNING last_number`,
      {
        replacements: { tenantId, voucherType, year },
        type: sequelize.QueryTypes.INSERT,
        transaction: t,
      }
    );

    const nextNumber = result[0].last_number;
    return `${prefix}-${year}-${String(nextNumber).padStart(6, '0')}`;
  };

  if (transaction) {
    return execute(transaction);
  }
  return sequelize.transaction(execute);
}

/**
 * Create a journal entry header (DRAFT status).
 * Use postJournalEntry to finalize and post.
 *
 * @param {Object} params
 * @returns {Promise<Object>} Created journal entry
 */
async function createJournalEntry({
  tenantId,
  voucherType = 'JOURNAL',
  date,
  fiscalYearId,
  narration,
  reference,
  sourceModule,
  sourceId,
  costCenterId,
  departmentId,
  branchId,
  tags,
  isRecurring = false,
  recurrenceConfig,
  createdBy,
  transaction,
  // Fund & reconciliation enrichment
  fundType,
  postingEvent,
  postingExplanation,
  reconStatus,
}) {
  const id = uuidv4();

  // Validate fiscal year is open
  const [fiscalYear] = await sequelize.query(
    `SELECT id, status FROM fiscal_years WHERE id = :fiscalYearId AND tenant_id = :tenantId`,
    {
      replacements: { fiscalYearId, tenantId },
      type: sequelize.QueryTypes.SELECT,
      transaction,
    }
  );

  if (!fiscalYear) {
    throw new Error(`Fiscal year ${fiscalYearId} not found`);
  }

  if (['CLOSED', 'ARCHIVED'].includes(fiscalYear.status)) {
    throw new Error(`Cannot post to ${fiscalYear.status.toLowerCase()} fiscal year ${fiscalYearId}`);
  }

  // Check period lock
  const entryDate = new Date(date);
  const [period] = await sequelize.query(
    `SELECT id, status FROM accounting_periods
     WHERE fiscal_year_id = :fiscalYearId
       AND period_start <= :date AND period_end >= :date
       AND tenant_id = :tenantId`,
    {
      replacements: { fiscalYearId, date: entryDate, tenantId },
      type: sequelize.QueryTypes.SELECT,
      transaction,
    }
  );

  if (period && period.status === 'LOCKED') {
    throw new Error(`Accounting period is locked for date ${date}`);
  }

  const [entry] = await sequelize.query(
    `INSERT INTO journal_entries (
      id, tenant_id, voucher_type, date, fiscal_year_id,
      narration, reference, status,
      source_module, source_id,
      cost_center_id, department_id, branch_id,
      tags, is_recurring, recurrence_config,
      fund_type, posting_event, posting_explanation, recon_status,
      created_by, created_at, updated_at
    ) VALUES (
      :id, :tenantId, :voucherType, :date, :fiscalYearId,
      :narration, :reference, 'DRAFT',
      :sourceModule, :sourceId,
      :costCenterId, :departmentId, :branchId,
      :tags, :isRecurring, :recurrenceConfig,
      :fundType, :postingEvent, :postingExplanation, :reconStatus,
      :createdBy, NOW(), NOW()
    ) RETURNING *`,
    {
      replacements: {
        id,
        tenantId,
        voucherType,
        date: entryDate,
        fiscalYearId,
        narration: narration || '',
        reference: reference || null,
        sourceModule: sourceModule || null,
        sourceId: sourceId || null,
        costCenterId: costCenterId || null,
        departmentId: departmentId || null,
        branchId: branchId || null,
        tags: tags ? JSON.stringify(tags) : null,
        isRecurring,
        recurrenceConfig: recurrenceConfig ? JSON.stringify(recurrenceConfig) : null,
        fundType: fundType || 'LOCAL',
        postingEvent: postingEvent || null,
        postingExplanation: postingExplanation ? JSON.stringify(postingExplanation) : null,
        reconStatus: reconStatus || 'UNMATCHED',
        createdBy,
      },
      type: sequelize.QueryTypes.INSERT,
      transaction,
    }
  );

  logger.debug('Journal entry created', { id, voucherType, date, tenantId });
  return entry[0];
}

/**
 * Create and immediately post a journal entry.
 *
 * @param {Object} params - Includes header params + lines array
 * @returns {Promise<Object>} Posted journal entry
 */
async function postJournalEntry({ lines, postedBy, fundType, postingEvent, postingExplanation, reconStatus, transaction: outerTransaction, ...headerParams }) {
  const { postTransaction } = require('./doubleEntry');

  const execute = async (t) => {
    // 1. Create header
    const entry = await createJournalEntry({
      ...headerParams,
      createdBy: postedBy,
      transaction: t,
      fundType,
      postingEvent,
      postingExplanation,
      reconStatus,
    });

    // 2. Generate entry number
    const entryNumber = await generateEntryNumber(headerParams.tenantId, headerParams.voucherType || 'JOURNAL', t);

    // 3. Update entry number
    await sequelize.query(
      `UPDATE journal_entries SET entry_number = :entryNumber WHERE id = :id`,
      {
        replacements: { entryNumber, id: entry.id },
        transaction: t,
      }
    );

    // 4. Post via double-entry engine
    const result = await postTransaction({
      journalEntryId: entry.id,
      tenantId: headerParams.tenantId,
      fiscalYearId: headerParams.fiscalYearId,
      postedBy,
      lines,
      transaction: t,
    });

    return { ...result, entryNumber, journalEntryId: entry.id };
  };

  // If caller supplies an outer transaction, run inside it (same connection, same ACID scope).
  // Otherwise create a fresh transaction.
  return outerTransaction ? execute(outerTransaction) : sequelize.transaction(execute);
}

/**
 * Get journal entry with lines.
 */
async function getJournalEntry(id, tenantId) {
  const [entry] = await sequelize.query(
    `SELECT je.*,
       json_agg(
         json_build_object(
           'id', jl.id,
           'lineNumber', jl.line_number,
           'accountId', jl.account_id,
           'accountCode', a.code,
           'accountName', a.name,
           'debit', jl.debit_amount,
           'credit', jl.credit_amount,
           'narration', jl.narration,
           'runningBalance', jl.running_balance
         ) ORDER BY jl.line_number
       ) as lines
     FROM journal_entries je
     LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
     LEFT JOIN accounts a ON a.id = jl.account_id
     WHERE je.id = :id AND je.tenant_id = :tenantId
     GROUP BY je.id`,
    {
      replacements: { id, tenantId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  return entry || null;
}

/**
 * List journal entries with filters.
 */
async function listJournalEntries(tenantId, filters = {}, pagination = {}) {
  const { voucherType, status, dateFrom, dateTo, search, sourceModule } = filters;
  const { page = 1, limit = 25 } = pagination;
  const clampedLimit = Math.min(parseInt(limit) || 25, 200);
  const offset = (page - 1) * clampedLimit;

  const conditions = ['je.tenant_id = :tenantId'];
  const replacements = { tenantId, limit: clampedLimit, offset };

  if (voucherType) { conditions.push('je.voucher_type = :voucherType'); replacements.voucherType = voucherType; }
  if (status) { conditions.push('je.status = :status'); replacements.status = status; }
  if (dateFrom) { conditions.push('je.date >= :dateFrom'); replacements.dateFrom = new Date(dateFrom); }
  if (dateTo) { conditions.push('je.date <= :dateTo'); replacements.dateTo = new Date(dateTo); }
  if (sourceModule) { conditions.push('je.source_module = :sourceModule'); replacements.sourceModule = sourceModule; }
  if (search) {
    conditions.push('(je.entry_number ILIKE :search OR je.narration ILIKE :search OR je.reference ILIKE :search)');
    replacements.search = `%${search}%`;
  }

  const whereClause = conditions.join(' AND ');

  const [entries, countResult] = await Promise.all([
    sequelize.query(
      `SELECT je.*, u.full_name as created_by_name
       FROM journal_entries je
       LEFT JOIN users u ON u.id = je.created_by
       WHERE ${whereClause}
       ORDER BY je.date DESC, je.created_at DESC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COUNT(*) as total FROM journal_entries je WHERE ${whereClause}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  return {
    data: entries,
    total: parseInt(countResult[0].total, 10),
    page,
    limit: clampedLimit,
    pages: Math.ceil(countResult[0].total / clampedLimit),
  };
}

module.exports = {
  generateEntryNumber,
  createJournalEntry,
  postJournalEntry,
  getJournalEntry,
  listJournalEntries,
  VOUCHER_TYPES,
};
