'use strict';

/**
 * FCRA Accounting Integration
 *
 * Routes all FCRA financial events through the Unified Fund & Posting Control Layer
 * (SharedPostingEngine), which adds fund-type enforcement, idempotency guards,
 * pre-post validations, and unified audit on top of the shared double-entry engine.
 *
 * This guarantees: DR=CR validation, proper entry numbering, running-balance
 * computation, account-type-aware signing, atomic PostgreSQL transactions,
 * fund-mixing prevention, and FCRA-specific audit trails.
 *
 * Posting rules:
 *   Receipt verify   → DR FC Designated Bank Account  / CR Restricted FC Fund
 *   Utilisation      → DR FCRA Expense (by category)  / CR FC Designated Bank Account
 *   Asset purchase   → DR FCRA Fixed Assets            / CR FC Designated Bank Account
 *   Asset disposal   → DR FC DBA + Accum Depr          / CR FCRA Fixed Assets ± Gain/Loss
 *   Asset income     → DR FC Designated Bank Account   / CR FCRA Asset Income
 */

const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../config/database');
const { SharedPostingEngine, FUND_TYPES, POSTING_EVENTS } = require('../../shared/posting-engine');
const logger = require('../../shared/utils/logger');

// Standard FCRA COA account definitions (auto-provisioned per tenant on first use)
const FCRA_ACCOUNTS = {
  DBA:             { code: 'FCRA-1001', name: 'FCRA Designated Bank Account',    type: 'ASSET',    isBankAccount: true },
  RESTRICTED_FUND: { code: 'FCRA-2001', name: 'Restricted Foreign Contribution', type: 'LIABILITY' },
  EXP_ADMIN:       { code: 'FCRA-5001', name: 'FCRA Administrative Expenses',    type: 'EXPENSE'   },
  EXP_PROGRAMME:   { code: 'FCRA-5002', name: 'FCRA Programme Expenses',         type: 'EXPENSE'   },
  EXP_CAPITAL:     { code: 'FCRA-5003', name: 'FCRA Capital Expenditure',        type: 'EXPENSE'   },
  EXP_OTHER:       { code: 'FCRA-5004', name: 'FCRA Other Expenses',             type: 'EXPENSE'   },
  FIXED_ASSETS:    { code: 'FCRA-1101', name: 'FCRA Fixed Assets',               type: 'ASSET'     },
  ACCUM_DEPR:      { code: 'FCRA-1102', name: 'FCRA Accumulated Depreciation',   type: 'ASSET'     },
  ASSET_INCOME:    { code: 'FCRA-4001', name: 'FCRA Asset Income',               type: 'INCOME'    },
  GAIN_DISPOSAL:   { code: 'FCRA-4002', name: 'Gain on FCRA Asset Disposal',     type: 'INCOME'    },
  LOSS_DISPOSAL:   { code: 'FCRA-5005', name: 'Loss on FCRA Asset Disposal',     type: 'EXPENSE'   },
};

const CATEGORY_EXPENSE_KEY = {
  administrative: 'EXP_ADMIN',
  programme:      'EXP_PROGRAMME',
  capital:        'EXP_CAPITAL',
};

// ─── Account Resolver ─────────────────────────────────────────────────────────

async function getOrCreateAccount(tenantId, key) {
  const def = FCRA_ACCOUNTS[key];
  if (!def) throw new Error(`Unknown FCRA account key: ${key}`);

  const [existing] = await sequelize.query(
    `SELECT id FROM accounts WHERE code = :code AND tenant_id = :tenantId LIMIT 1`,
    { replacements: { code: def.code, tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  if (existing) return existing.id;

  const id = uuidv4();
  await sequelize.query(
    `INSERT INTO accounts
      (id, tenant_id, code, name, type, is_group, is_active, currency,
       opening_balance, current_balance, is_cash_account, is_bank_account,
       tags, metadata, created_at, updated_at)
     VALUES
      (:id, :tenantId, :code, :name, :type, false, true, 'INR',
       0, 0, false, :isBank,
       :tags, '{}', NOW(), NOW())`,
    {
      replacements: {
        id, tenantId,
        code: def.code, name: def.name, type: def.type,
        isBank: def.isBankAccount || false,
        tags: JSON.stringify(['fcra', 'system']),
      },
    }
  );
  return id;
}

// ─── Fiscal Year Resolver ─────────────────────────────────────────────────────

async function getActiveFiscalYear(tenantId) {
  const [fy] = await sequelize.query(
    `SELECT id FROM fiscal_years
     WHERE tenant_id = :tenantId AND status = 'open'
     ORDER BY start_date DESC LIMIT 1`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  return fy?.id || null;
}

// ─── Core Posting Helper ──────────────────────────────────────────────────────

async function post({ tenantId, postedBy, date, narration, reference, sourceId, lines, postingEvent }) {
  const fiscalYearId = await getActiveFiscalYear(tenantId);
  if (!fiscalYearId) {
    logger.warn('FCRA journal skipped — no open fiscal year', { tenantId, sourceId });
    return null;
  }

  // Delegate to SharedPostingEngine, which wraps the double-entry engine with:
  //   - Structural contract validation
  //   - Idempotency guard (prevents duplicate postings)
  //   - Fiscal year & period-lock checks
  //   - Fund-type enforcement (all accounts must be FCRA-prefixed)
  //   - DR=CR validation, entry numbering, running balances (via accounting engine)
  //   - Unified audit logging (non-blocking)
  const result = await SharedPostingEngine.create().post({
    tenantId,
    fundType:        FUND_TYPES.FCRA,
    voucherType:     'JOURNAL',
    date,
    fiscalYearId,
    narration,
    reference,
    sourceModule:    'fcra',
    sourceId,
    postedBy,
    lines,
    postingEvent:    postingEvent || POSTING_EVENTS.JOURNAL_MANUAL,
    allowFundMixing: false,
  });

  logger.info('FCRA journal posted', { entryNumber: result.entryNumber, sourceId, narration, postingEvent: result.postingEvent });
  return result;
}

// ─── Public Event Handlers ────────────────────────────────────────────────────

/**
 * Receipt verified:
 *   DR FC Designated Bank Account (ASSET +)
 *   CR Restricted Foreign Contribution (LIABILITY +)
 */
async function postReceiptVerified(tenantId, receipt, postedBy) {
  try {
    const [dbaId, fundId] = await Promise.all([
      getOrCreateAccount(tenantId, 'DBA'),
      getOrCreateAccount(tenantId, 'RESTRICTED_FUND'),
    ]);
    const amount = parseFloat(receipt.amount_inr || 0);
    if (amount <= 0) return null;

    return await post({
      tenantId, postedBy,
      date:         receipt.receipt_date || new Date().toISOString().split('T')[0],
      narration:    `FC Receipt verified: ${receipt.receipt_number} — ${receipt.currency} ${receipt.amount}`,
      reference:    receipt.receipt_number,
      sourceId:     receipt.id,
      postingEvent: POSTING_EVENTS.FCRA_RECEIPT_VERIFIED,
      lines: [
        { accountId: dbaId,  debit: amount, credit: 0,      narration: 'FC received into Designated Bank Account' },
        { accountId: fundId, debit: 0,      credit: amount, narration: 'Restricted Foreign Contribution recognised' },
      ],
    });
  } catch (err) {
    logger.warn('FCRA receipt journal failed (non-fatal)', { error: err.message, receiptId: receipt.id });
    return null;
  }
}

/**
 * Utilisation approved:
 *   DR FCRA Expense account (by category) (EXPENSE +)
 *   CR FC Designated Bank Account (ASSET -)
 */
async function postUtilisationApproved(tenantId, utilisation, postedBy) {
  try {
    const expKey = CATEGORY_EXPENSE_KEY[utilisation.category] || 'EXP_OTHER';
    const [expId, dbaId] = await Promise.all([
      getOrCreateAccount(tenantId, expKey),
      getOrCreateAccount(tenantId, 'DBA'),
    ]);
    const amount = parseFloat(utilisation.amount || 0);
    if (amount <= 0) return null;

    return await post({
      tenantId, postedBy,
      date:         utilisation.utilization_date || new Date().toISOString().split('T')[0],
      narration:    `FCRA utilisation approved: ${utilisation.voucher_number} — ${utilisation.purpose || utilisation.category}`,
      reference:    utilisation.voucher_number,
      sourceId:     utilisation.id,
      postingEvent: POSTING_EVENTS.FCRA_UTILISATION_APPROVED,
      lines: [
        { accountId: expId, debit: amount, credit: 0,      narration: `FCRA ${utilisation.category} expense` },
        { accountId: dbaId, debit: 0,      credit: amount, narration: 'FC Designated Bank Account disbursed' },
      ],
    });
  } catch (err) {
    logger.warn('FCRA utilisation journal failed (non-fatal)', { error: err.message, utilisationId: utilisation.id });
    return null;
  }
}

/**
 * Asset purchased from FC funds:
 *   DR FCRA Fixed Assets (ASSET +)
 *   CR FC Designated Bank Account (ASSET -)
 */
async function postAssetPurchased(tenantId, asset, postedBy) {
  try {
    const [assetAccId, dbaId] = await Promise.all([
      getOrCreateAccount(tenantId, 'FIXED_ASSETS'),
      getOrCreateAccount(tenantId, 'DBA'),
    ]);
    const amount = parseFloat(asset.purchase_cost || 0);
    if (amount <= 0) return null;

    return await post({
      tenantId, postedBy,
      date:         asset.purchase_date || new Date().toISOString().split('T')[0],
      narration:    `FCRA asset purchased: ${asset.asset_code} — ${asset.asset_name}`,
      reference:    asset.asset_code,
      sourceId:     asset.id,
      postingEvent: POSTING_EVENTS.FCRA_ASSET_PURCHASED,
      lines: [
        { accountId: assetAccId, debit: amount, credit: 0,      narration: `FCRA fixed asset: ${asset.asset_name}` },
        { accountId: dbaId,      debit: 0,       credit: amount, narration: 'FC DBA — asset purchase payment' },
      ],
    });
  } catch (err) {
    logger.warn('FCRA asset journal failed (non-fatal)', { error: err.message, assetId: asset.id });
    return null;
  }
}

/**
 * Asset disposed:
 *   DR FC Designated Bank Account  (sale proceeds)
 *   DR FCRA Accumulated Depreciation (write off)
 *   DR/CR Loss or Gain on disposal
 *   CR FCRA Fixed Assets (gross book value)
 *
 * Net: total DR = total CR guaranteed by shared engine's DR=CR check.
 */
async function postAssetDisposal(tenantId, disposal, asset, postedBy) {
  try {
    const [dbaId, assetAccId, accumDeprId, gainId, lossId] = await Promise.all([
      getOrCreateAccount(tenantId, 'DBA'),
      getOrCreateAccount(tenantId, 'FIXED_ASSETS'),
      getOrCreateAccount(tenantId, 'ACCUM_DEPR'),
      getOrCreateAccount(tenantId, 'GAIN_DISPOSAL'),
      getOrCreateAccount(tenantId, 'LOSS_DISPOSAL'),
    ]);

    const saleProceeds = parseFloat(disposal.sale_proceeds || 0);
    const bookValue    = parseFloat(disposal.book_value || asset?.purchase_cost || 0);
    const accumDepr    = parseFloat(disposal.accumulated_depreciation || 0);
    const netBookValue = bookValue - accumDepr;
    const gainLoss     = saleProceeds - netBookValue;

    // Build balanced entry:
    // Total DR = saleProceeds + accumDepr + max(0, -gainLoss)  [loss side]
    // Total CR = bookValue    + max(0, gainLoss)               [gain side]
    // These are always equal by construction.
    const lines = [
      { accountId: dbaId,      debit: saleProceeds, credit: 0,         narration: 'FCRA asset disposal — sale proceeds to DBA' },
      { accountId: accumDeprId, debit: accumDepr,   credit: 0,         narration: 'FCRA accumulated depreciation written off' },
      { accountId: assetAccId, debit: 0,            credit: bookValue,  narration: `FCRA fixed asset disposed: ${asset?.asset_code || disposal.asset_id}` },
    ];

    if (gainLoss > 0) {
      lines.push({ accountId: gainId, debit: 0,               credit: gainLoss,       narration: 'Gain on FCRA asset disposal' });
    } else if (gainLoss < 0) {
      lines.push({ accountId: lossId, debit: Math.abs(gainLoss), credit: 0,           narration: 'Loss on FCRA asset disposal' });
    }
    // gainLoss === 0: total DR (proceeds + accum) = total CR (book value) exactly — no extra line needed

    return await post({
      tenantId, postedBy,
      date:         disposal.disposal_date || new Date().toISOString().split('T')[0],
      narration:    `FCRA asset disposed: ${disposal.disposal_code} — ${gainLoss >= 0 ? 'Gain' : 'Loss'} ₹${Math.abs(gainLoss).toLocaleString('en-IN')}`,
      reference:    disposal.disposal_code,
      sourceId:     disposal.id,
      postingEvent: POSTING_EVENTS.FCRA_ASSET_DISPOSED,
      lines,
    });
  } catch (err) {
    logger.warn('FCRA disposal journal failed (non-fatal)', { error: err.message, disposalId: disposal.id });
    return null;
  }
}

/**
 * Asset income received (rent, interest, etc.):
 *   DR FC Designated Bank Account (ASSET +)
 *   CR FCRA Asset Income (INCOME +)
 */
async function postAssetIncome(tenantId, income, postedBy) {
  try {
    const [dbaId, incomeId] = await Promise.all([
      getOrCreateAccount(tenantId, 'DBA'),
      getOrCreateAccount(tenantId, 'ASSET_INCOME'),
    ]);
    const amount = parseFloat(income.amount || 0);
    if (amount <= 0) return null;

    return await post({
      tenantId, postedBy,
      date:         income.income_date || new Date().toISOString().split('T')[0],
      narration:    `FCRA asset income: ${income.income_code} — ${income.income_type}`,
      reference:    income.income_code,
      sourceId:     income.id,
      postingEvent: POSTING_EVENTS.FCRA_ASSET_INCOME,
      lines: [
        { accountId: dbaId,    debit: amount, credit: 0,      narration: 'FCRA asset income received into DBA' },
        { accountId: incomeId, debit: 0,      credit: amount, narration: `FCRA ${income.income_type} income` },
      ],
    });
  } catch (err) {
    logger.warn('FCRA asset income journal failed (non-fatal)', { error: err.message, incomeId: income.id });
    return null;
  }
}

// ─── Drill-Down Query ─────────────────────────────────────────────────────────

/**
 * Return journal entries posted for an FCRA source record (for the explainable
 * accounting panel). Uses the correct column names from the shared engine schema.
 */
async function getJournalsForSource(tenantId, sourceId) {
  return sequelize.query(
    `SELECT je.id, je.entry_number, je.date, je.narration, je.total_debit, je.status,
            json_agg(json_build_object(
              'account_code', a.code,
              'account_name', a.name,
              'account_type', a.type,
              'debit',        jl.debit_amount,
              'credit',       jl.credit_amount,
              'narration',    jl.narration
            ) ORDER BY jl.line_number) AS lines
     FROM journal_entries je
     JOIN journal_lines jl ON jl.journal_entry_id = je.id
     JOIN accounts a ON a.id = jl.account_id
     WHERE je.tenant_id = :tenantId
       AND je.source_id  = :sourceId
       AND je.source_module = 'fcra'
     GROUP BY je.id
     ORDER BY je.date DESC`,
    { replacements: { tenantId, sourceId }, type: sequelize.QueryTypes.SELECT }
  );
}

module.exports = {
  postReceiptVerified,
  postUtilisationApproved,
  postAssetPurchased,
  postAssetDisposal,
  postAssetIncome,
  getJournalsForSource,
};
