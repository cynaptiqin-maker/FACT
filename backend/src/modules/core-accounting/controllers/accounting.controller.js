'use strict';

const Joi = require('joi');
const service = require('../services/accounting.service');
const accountingEngine = require('../../../shared/accounting-engine');
const { ReconciliationService } = require('../../../shared/reconciliation/ReconciliationService');

// ─── Validators ───────────────────────────────────────────────────────────────
const createAccountSchema = Joi.object({
  code: Joi.string().max(20).required(),
  name: Joi.string().max(200).required(),
  type: Joi.string().valid('ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE').required(),
  subType: Joi.string().max(50).optional(),
  parentId: Joi.string().uuid().optional(),
  isGroup: Joi.boolean().default(false),
  currency: Joi.string().length(3).default('INR'),
  openingBalance: Joi.number().default(0),
  costCenterId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  gstApplicable: Joi.boolean().default(false),
  tdsApplicable: Joi.boolean().default(false),
  defaultTaxCode: Joi.string().optional(),
  bankName: Joi.string().optional(),
  bankAccountNumber: Joi.string().optional(),
  bankIfsc: Joi.string().optional(),
  description: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).default([]),
});

const journalLineSchema = Joi.object({
  accountId: Joi.string().uuid().required(),
  debit: Joi.number().min(0).default(0),
  credit: Joi.number().min(0).default(0),
  narration: Joi.string().max(500).optional(),
  taxCode: Joi.string().optional(),
  taxAmount: Joi.number().min(0).default(0),
  costCenterId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
});

const createJournalSchema = Joi.object({
  voucherType: Joi.string().valid('JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA', 'DEBIT_NOTE', 'CREDIT_NOTE').required(),
  date: Joi.date().iso().required(),
  fiscalYearId: Joi.string().uuid().required(),
  narration: Joi.string().max(1000).required(),
  reference: Joi.string().max(100).optional(),
  lines: Joi.array().items(journalLineSchema).min(2).required(),
  autoPost: Joi.boolean().default(false),
  costCenterId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional(),
  branchId: Joi.string().uuid().optional(),
  tags: Joi.array().items(Joi.string()).default([]),
});

// ─── Account Controllers ──────────────────────────────────────────────────────

async function createAccount(req, res) {
  const { error, value } = createAccountSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const account = await service.createAccount({ ...value, tenantId: req.tenantId }, req.user.id);
  res.status(201).json({ success: true, data: account });
}

async function getAccounts(req, res) {
  const { type, isActive, includeBalances } = req.query;

  const accounts = await service.getChartOfAccounts(req.tenantId, {
    type,
    isActive: isActive !== undefined ? isActive === 'true' : true,
    includeBalances: includeBalances !== 'false',
  });

  res.json({ success: true, data: accounts, total: accounts.length });
}

async function getAccount(req, res) {
  const { sequelize } = require('../../../config/database');
  const [account] = await sequelize.query(
    `SELECT * FROM accounts WHERE id = :id AND tenant_id = :tenantId`,
    { replacements: { id: req.params.id, tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!account) return res.status(404).json({ success: false, error: 'Account not found' });
  res.json({ success: true, data: account });
}

async function updateAccount(req, res) {
  const { sequelize } = require('../../../config/database');
  const { id } = req.params;
  const { name, description, isActive, tags, metadata, costCenterId, departmentId } = req.body;

  const [account] = await sequelize.query(
    `UPDATE accounts SET
       name = COALESCE(:name, name),
       description = COALESCE(:description, description),
       is_active = COALESCE(:isActive, is_active),
       tags = COALESCE(:tags, tags),
       cost_center_id = COALESCE(:costCenterId, cost_center_id),
       department_id = COALESCE(:departmentId, department_id),
       updated_by = :updatedBy, updated_at = NOW()
     WHERE id = :id AND tenant_id = :tenantId
     RETURNING *`,
    {
      replacements: {
        id, tenantId: req.tenantId, name, description,
        isActive: isActive !== undefined ? isActive : null,
        tags: tags ? JSON.stringify(tags) : null,
        costCenterId: costCenterId || null,
        departmentId: departmentId || null,
        updatedBy: req.user.id,
      },
      type: sequelize.QueryTypes.UPDATE,
    }
  );

  res.json({ success: true, data: account[0] });
}

// ─── Journal Controllers ──────────────────────────────────────────────────────

async function createJournal(req, res) {
  const { error, value } = createJournalSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const { autoPost, lines, ...headerData } = value;

  if (autoPost) {
    const result = await accountingEngine.postJournalEntry({
      ...headerData, tenantId: req.tenantId, lines, postedBy: req.user.id,
    });
    return res.status(201).json({ success: true, data: result, message: 'Journal entry created and posted' });
  }

  const result = await service.createJournalEntry(
    { ...headerData, tenantId: req.tenantId, lines },
    req.user.id
  );
  res.status(201).json({ success: true, data: result, message: 'Journal entry created as draft' });
}

async function listJournals(req, res) {
  const { voucherType, status, dateFrom, dateTo, search, page = 1, limit = 25 } = req.query;

  const result = await accountingEngine.listJournalEntries(
    req.tenantId,
    { voucherType, status, dateFrom, dateTo, search },
    { page: parseInt(page), limit: parseInt(limit) }
  );

  res.json({ success: true, ...result });
}

async function getJournal(req, res) {
  const entry = await accountingEngine.getJournalEntry(req.params.id, req.tenantId);
  if (!entry) return res.status(404).json({ success: false, error: 'Journal entry not found' });
  res.json({ success: true, data: entry });
}

async function getJournalsBySource(req, res) {
  const { module: sourceModule, sourceId } = req.params;
  const { sequelize } = require('../../../config/database');

  const entries = await sequelize.query(
    `SELECT
       je.id, je.entry_number, je.voucher_type, je.date, je.narration,
       je.reference, je.status, je.total_debit, je.total_credit,
       je.posted_at, je.created_at,
       json_agg(
         json_build_object(
           'id',           jl.id,
           'lineNumber',   jl.line_number,
           'accountId',    jl.account_id,
           'accountCode',  a.code,
           'accountName',  a.name,
           'debit',        jl.debit_amount,
           'credit',       jl.credit_amount,
           'narration',    jl.narration
         ) ORDER BY jl.line_number
       ) as lines
     FROM journal_entries je
     LEFT JOIN journal_lines jl ON jl.journal_entry_id = je.id
     LEFT JOIN accounts a ON a.id = jl.account_id
     WHERE je.tenant_id = :tenantId
       AND je.source_module = :sourceModule
       AND je.source_id = :sourceId
     GROUP BY je.id
     ORDER BY je.date ASC, je.created_at ASC`,
    {
      replacements: { tenantId: req.tenantId, sourceModule, sourceId },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  res.json({ success: true, data: entries });
}

async function postJournal(req, res) {
  const result = await service.postJournalEntry(req.params.id, req.tenantId, req.user.id);
  res.json({ success: true, data: result, message: 'Journal entry posted successfully' });
}

async function reverseJournal(req, res) {
  const { reason } = req.body;
  const result = await service.reverseJournalEntry(req.params.id, req.tenantId, req.user.id, reason);
  res.json({ success: true, data: result, message: 'Journal entry reversed successfully' });
}

// ─── Reports ─────────────────────────────────────────────────────────────────

async function getTrialBalance(req, res) {
  const { from, to, branchId, departmentId } = req.query;
  if (!from || !to) return res.status(400).json({ success: false, error: 'from and to dates are required' });

  const result = await service.getTrialBalance(req.tenantId, new Date(from), new Date(to), { branchId, departmentId });
  res.json({ success: true, data: result });
}

async function getLedger(req, res) {
  const { from, to, page, limit, search } = req.query;
  if (!from || !to) return res.status(400).json({ success: false, error: 'from and to dates are required' });

  const result = await service.getLedgerStatement(
    req.params.accountId, req.tenantId,
    new Date(from), new Date(to),
    { page: parseInt(page || 1), limit: parseInt(limit || 100), search }
  );

  res.json({ success: true, data: result });
}

// ─── Fiscal Year ──────────────────────────────────────────────────────────────

async function getFiscalYears(req, res) {
  const { sequelize } = require('../../../config/database');
  const years = await sequelize.query(
    `SELECT * FROM fiscal_years WHERE tenant_id = :tenantId ORDER BY start_date DESC`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ success: true, data: years });
}

async function createFiscalYear(req, res) {
  const { name, startDate, endDate } = req.body;
  const result = await service.createFiscalYear({ tenantId: req.tenantId, name, startDate, endDate, createdBy: req.user.id });
  res.status(201).json({ success: true, data: result });
}

async function closeFiscalYear(req, res) {
  const result = await service.closeFiscalYear(req.params.id, req.tenantId, req.user.id);
  res.json({ success: true, data: result });
}

// ─── Account Tree ─────────────────────────────────────────────────────────────
async function getAccountTree(req, res) {
  const { sequelize } = require('../../../config/database');
  const accounts = await sequelize.query(
    `SELECT id, code, name, type, parent_id, is_group, normal_balance, current_balance, is_active
     FROM accounts WHERE tenant_id = :tenantId AND is_active = true ORDER BY code`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  // Build tree
  const map = {};
  accounts.forEach((a) => { map[a.id] = { ...a, children: [] }; });
  const roots = [];
  accounts.forEach((a) => {
    if (a.parent_id && map[a.parent_id]) {
      map[a.parent_id].children.push(map[a.id]);
    } else {
      roots.push(map[a.id]);
    }
  });
  res.json({ success: true, data: roots });
}

async function runReconciliation(req, res) {
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ success: false, error: 'from and to dates are required' });

  const { sequelize } = require('../../../config/database');
  let redis = null;
  try { redis = require('../../../config/redis').getRedisClient(); } catch { /* redis optional */ }

  const svc = new ReconciliationService(sequelize, redis);
  const results = await svc.runAll(req.tenantId, { startDate: new Date(from), endDate: new Date(to) });

  res.json({ success: true, data: results, period: { from, to } });
}

// ─── Bulk import: Chart of Accounts ──────────────────────────────────────────
// Body: { rows: [{ code, name, type, isGroup?, parentCode?, description? }] }
async function importAccounts(req, res) {
  const { sequelize } = require('../../../config/database');
  const { rows } = req.body;
  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, error: 'rows array is required' });

  const VALID_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];
  const created = []; const skipped = []; const errors = [];

  // Pre-load all existing codes for this tenant
  const existing = await sequelize.query(
    `SELECT code, id FROM accounts WHERE tenant_id = :tenantId`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  const codeToId = Object.fromEntries(existing.map(r => [r.code, r.id]));

  for (const [idx, row] of rows.entries()) {
    const rowNum = idx + 2; // 1-based + header row
    const { code, name, type, isGroup = false, parentCode, description } = row;

    if (!code || !name || !type) {
      errors.push({ row: rowNum, code, error: 'code, name and type are required' }); continue;
    }
    if (!VALID_TYPES.includes(String(type).toUpperCase())) {
      errors.push({ row: rowNum, code, error: `type must be one of ${VALID_TYPES.join(', ')}` }); continue;
    }

    // Resolve parent
    let parentId = null;
    if (parentCode) {
      parentId = codeToId[parentCode] || null;
      if (!parentId) { errors.push({ row: rowNum, code, error: `parentCode "${parentCode}" not found` }); continue; }
    }

    if (codeToId[code]) {
      // Update name/description if account already exists
      await sequelize.query(
        `UPDATE accounts SET name = :name, description = :description, updated_at = NOW()
         WHERE code = :code AND tenant_id = :tenantId`,
        { replacements: { name, description: description || null, code, tenantId: req.tenantId }, type: sequelize.QueryTypes.UPDATE }
      );
      skipped.push(code);
    } else {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const level = parentId
        ? (existing.find(r => r.id === parentId)?.level ?? 0) + 1
        : 1;
      const path = parentId
        ? `${existing.find(r => r.id === parentId)?.path ?? ''}/${code}`
        : `/${code}`;

      await sequelize.query(
        `INSERT INTO accounts (id, tenant_id, code, name, type, parent_id, level, path, is_group, description, is_active, created_at, updated_at)
         VALUES (:id, :tenantId, :code, :name, :type, :parentId, :level, :path, :isGroup, :description, true, NOW(), NOW())`,
        {
          replacements: {
            id, tenantId: req.tenantId, code, name, type: type.toUpperCase(),
            parentId: parentId || null, level, path,
            isGroup: Boolean(isGroup), description: description || null,
          },
          type: sequelize.QueryTypes.INSERT,
        }
      );
      codeToId[code] = id;
      created.push(code);
    }
  }

  res.json({ success: true, data: { created: created.length, updated: skipped.length, errors } });
}

// ─── Bulk import: Journal Entries from CSV rows ───────────────────────────────
// Body: { rows: [{ date, reference, description, accountCode, debit, credit, voucherType? }] }
// Groups by reference → one journal entry per unique reference
async function importJournals(req, res) {
  const { sequelize } = require('../../../config/database');
  const { rows, fiscalYearId } = req.body;
  if (!Array.isArray(rows) || rows.length === 0)
    return res.status(400).json({ success: false, error: 'rows array is required' });
  if (!fiscalYearId)
    return res.status(400).json({ success: false, error: 'fiscalYearId is required' });

  // Build account code→id map
  const acctRows = await sequelize.query(
    `SELECT code, id FROM accounts WHERE tenant_id = :tenantId AND is_active = true`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  const codeToId = Object.fromEntries(acctRows.map(r => [r.code, r.id]));

  // Group by reference
  const groups = {};
  const parseErrors = [];
  rows.forEach((row, idx) => {
    const rowNum = idx + 2;
    const { date, reference, description, accountCode, debit, credit, voucherType } = row;
    if (!date || !reference || !accountCode) {
      parseErrors.push({ row: rowNum, error: 'date, reference and accountCode are required' }); return;
    }
    const acctId = codeToId[accountCode];
    if (!acctId) {
      parseErrors.push({ row: rowNum, error: `accountCode "${accountCode}" not found` }); return;
    }
    if (!groups[reference]) {
      groups[reference] = { date, description: description || reference, voucherType: voucherType || 'JOURNAL', lines: [] };
    }
    groups[reference].lines.push({ accountId: acctId, debit: Number(debit) || 0, credit: Number(credit) || 0 });
  });

  const created = []; const importErrors = [...parseErrors];

  for (const [ref, entry] of Object.entries(groups)) {
    const totalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      importErrors.push({ reference: ref, error: `Debit (${totalDebit}) ≠ Credit (${totalCredit}) — entry skipped` }); continue;
    }
    try {
      await service.createJournalEntry({
        tenantId: req.tenantId,
        voucherType: entry.voucherType,
        date: entry.date,
        fiscalYearId,
        narration: entry.description,
        reference: ref,
        lines: entry.lines.map((l, i) => ({ ...l, narration: '', lineNumber: i + 1 })),
        autoPost: false,
      }, req.user.id);
      created.push(ref);
    } catch (err) {
      importErrors.push({ reference: ref, error: err.message });
    }
  }

  res.json({ success: true, data: { created: created.length, errors: importErrors } });
}

module.exports = {
  createAccount, getAccounts, getAccount, updateAccount, getAccountTree,
  importAccounts, importJournals,
  createJournal, listJournals, getJournal, postJournal, reverseJournal,
  getJournalsBySource,
  getTrialBalance, getLedger, runReconciliation,
  getFiscalYears, createFiscalYear, closeFiscalYear,
};
