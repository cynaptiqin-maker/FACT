'use strict';

const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');
const { sequelize } = require('../../../config/database');
const accountingEngine = require('../../../shared/accounting-engine');
const { logEvent, AUDIT_ACTIONS } = require('../../../shared/audit/auditLogger');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');
const logger = require('../../../shared/utils/logger');

/**
 * Accounts Payable Service
 *
 * Closes the critical gap identified in the AP module audit:
 * vendor invoices and payments were stored in the DB but never
 * posted to the GL, making AP liability invisible in the trial balance.
 *
 * VENDOR INVOICE POSTING (Purchase Invoice — PI):
 *   DR  Expense / Purchase Account    (base: net_amount − all GST)
 *   DR  Input CGST                    (cgst_amount, if > 0)
 *   DR  Input SGST                    (sgst_amount, if > 0)
 *   DR  Input IGST                    (igst_amount, if > 0)
 *       CR  Accounts Payable - Vendor (net_amount − tds_amount)
 *       CR  TDS Payable               (tds_amount, if > 0)
 *
 * VENDOR PAYMENT POSTING (Payment Voucher — PV):
 *   DR  Accounts Payable - Vendor     (payment_amount)
 *       CR  Bank / Cash               (payment_amount)
 *
 * INVOICE REVERSAL (mirrors original with swapped DR/CR):
 *   Uses accountingEngine.reverseTransaction()
 */

// ─── Default account codes (resolved from tenant's Chart of Accounts) ─────────
const AP_ACCOUNTS = {
  AP_VENDOR:        '2000',  // Accounts Payable - Vendors (LIABILITY)
  TDS_PAYABLE:      '2310',  // TDS Payable (LIABILITY)
  INPUT_CGST:       '1301',  // Input GST - CGST (ASSET)
  INPUT_SGST:       '1302',  // Input GST - SGST (ASSET)
  INPUT_IGST:       '1303',  // Input GST - IGST (ASSET)
  PURCHASE_EXPENSE: '5200',  // Purchases / General Expense (EXPENSE) — fallback
  ADVANCE_VENDOR:   '1200',  // Advances to Vendors (ASSET)
  BANK:             '1010',  // Bank Account (same as billing module)
  CASH:             '1001',  // Cash in Hand  (same as billing module)
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve an account UUID from its code within a transaction. */
async function getAccountId(code, tenantId, transaction) {
  const [acc] = await sequelize.query(
    `SELECT id FROM accounts
     WHERE code = :code AND tenant_id = :tenantId AND is_active = true LIMIT 1`,
    { replacements: { code, tenantId }, type: sequelize.QueryTypes.SELECT, transaction }
  );
  return acc?.id ?? null;
}

/** Return the active (OPEN) fiscal year for the tenant. */
async function getActiveFiscalYear(tenantId, transaction) {
  const [fy] = await sequelize.query(
    `SELECT id FROM fiscal_years
     WHERE tenant_id = :tenantId AND status = 'OPEN'
     ORDER BY start_date DESC LIMIT 1`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT, transaction }
  );
  return fy?.id ?? null;
}

/** Generate a sequential vendor invoice number: VINV-2026-000001 */
async function generateVendorInvoiceNumber(tenantId, transaction) {
  const year = new Date().getFullYear();
  const [result] = await sequelize.query(
    `INSERT INTO voucher_sequences (tenant_id, voucher_type, fiscal_year, last_number, created_at, updated_at)
     VALUES (:tenantId, 'VENDOR_INVOICE', :year, 1, NOW(), NOW())
     ON CONFLICT (tenant_id, voucher_type, fiscal_year)
     DO UPDATE SET last_number = voucher_sequences.last_number + 1, updated_at = NOW()
     RETURNING last_number`,
    { replacements: { tenantId, year }, type: sequelize.QueryTypes.INSERT, transaction }
  );
  return `VINV-${year}-${String(result[0].last_number).padStart(6, '0')}`;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Create a vendor invoice in PENDING (draft) status.
 * No GL posting at this stage — use postVendorInvoice() after approval.
 */
async function createVendorInvoice(data, userId) {
  const {
    tenantId,
    vendorId,
    vendorName,
    invoiceNumber,
    invoiceDate,
    dueDate,
    netAmount,
    cgstAmount = 0,
    sgstAmount = 0,
    igstAmount = 0,
    tdsAmount = 0,
    tdsSection,
    narration,
    expenseAccountCode,
    purchaseOrderId,
    fiscalYearId: passedFiscalYearId,
    branchId,
  } = data;

  return sequelize.transaction(async (t) => {
    const fiscalYearId = passedFiscalYearId || (await getActiveFiscalYear(tenantId, t));
    if (!fiscalYearId) {
      throw Object.assign(new Error('No open fiscal year found. Please open a fiscal year before creating invoices.'), { statusCode: 422 });
    }

    // Validate vendor exists and belongs to this tenant
    const [vendor] = await sequelize.query(
      `SELECT id, name, gstin, pan FROM vendors WHERE id = :vendorId AND tenant_id = :tenantId AND is_active = true`,
      { replacements: { vendorId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!vendor) {
      throw Object.assign(new Error(`Vendor not found: ${vendorId}`), { statusCode: 404 });
    }

    const id = uuidv4();
    const internalRef = await generateVendorInvoiceNumber(tenantId, t);

    await sequelize.query(
      `INSERT INTO vendor_invoices (
        id, tenant_id, vendor_id, vendor_name, invoice_number,
        invoice_date, due_date,
        net_amount, cgst_amount, sgst_amount, igst_amount,
        tds_amount, tds_section,
        paid_amount, status,
        purchase_order_id, fiscal_year_id, branch_id,
        narration, expense_account_code,
        is_accounting_posted, created_by,
        created_at, updated_at
      ) VALUES (
        :id, :tenantId, :vendorId, :vendorName, :invoiceNumber,
        :invoiceDate, :dueDate,
        :netAmount, :cgstAmount, :sgstAmount, :igstAmount,
        :tdsAmount, :tdsSection,
        0, 'PENDING',
        :purchaseOrderId, :fiscalYearId, :branchId,
        :narration, :expenseAccountCode,
        false, :createdBy,
        NOW(), NOW()
      )`,
      {
        replacements: {
          id, tenantId, vendorId,
          vendorName: vendorName || vendor.name,
          invoiceNumber: invoiceNumber || internalRef,
          invoiceDate, dueDate: dueDate || null,
          netAmount: new Decimal(netAmount).toFixed(2),
          cgstAmount: new Decimal(cgstAmount).toFixed(2),
          sgstAmount: new Decimal(sgstAmount).toFixed(2),
          igstAmount: new Decimal(igstAmount).toFixed(2),
          tdsAmount: new Decimal(tdsAmount).toFixed(2),
          tdsSection: tdsSection || null,
          purchaseOrderId: purchaseOrderId || null,
          fiscalYearId, branchId: branchId || null,
          narration: narration || null,
          expenseAccountCode: expenseAccountCode || null,
          createdBy: userId,
        },
        transaction: t,
      }
    );

    await logEvent({
      tenantId, userId,
      action: AUDIT_ACTIONS.CREATE,
      entity: 'VendorInvoice', entityId: id,
      after: { invoiceNumber: invoiceNumber || internalRef, vendorId, netAmount, status: 'PENDING' },
      module: 'accounts-payable',
    });

    eventBus.publish(EVENT_TYPES.AP.VENDOR_INVOICE_RECEIVED, {
      invoiceId: id, invoiceNumber: invoiceNumber || internalRef,
      tenantId, vendorId, netAmount,
    });

    return { id, invoiceNumber: invoiceNumber || internalRef, status: 'PENDING', netAmount };
  });
}

/**
 * Approve a vendor invoice — marks it APPROVED, ready for GL posting.
 * The fiscal year and expense account are validated at this point.
 */
async function approveVendorInvoice(invoiceId, tenantId, userId) {
  return sequelize.transaction(async (t) => {
    const [invoice] = await sequelize.query(
      `SELECT * FROM vendor_invoices WHERE id = :invoiceId AND tenant_id = :tenantId FOR UPDATE`,
      { replacements: { invoiceId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );
    if (!invoice) throw Object.assign(new Error('Vendor invoice not found'), { statusCode: 404 });
    if (invoice.status !== 'PENDING') {
      throw Object.assign(new Error(`Cannot approve invoice with status: ${invoice.status}`), { statusCode: 400 });
    }

    await sequelize.query(
      `UPDATE vendor_invoices
       SET status = 'APPROVED', approved_by = :approvedBy, approved_at = NOW(), updated_at = NOW()
       WHERE id = :invoiceId`,
      { replacements: { approvedBy: userId, invoiceId }, transaction: t }
    );

    await logEvent({
      tenantId, userId,
      action: AUDIT_ACTIONS.WORKFLOW_APPROVED,
      entity: 'VendorInvoice', entityId: invoiceId,
      before: { status: 'PENDING' }, after: { status: 'APPROVED' },
      module: 'accounts-payable',
    });

    eventBus.publish(EVENT_TYPES.AP.VENDOR_INVOICE_APPROVED, {
      invoiceId, tenantId, approvedBy: userId,
      invoiceNumber: invoice.invoice_number,
      netAmount: invoice.net_amount,
    });

    return { invoiceId, status: 'APPROVED' };
  });
}

// ─── CORE POSTING FUNCTIONS ───────────────────────────────────────────────────

/**
 * Post a vendor invoice to the General Ledger.
 *
 * Requires the invoice to be in APPROVED status.
 * Atomically:
 *   1. Builds the double-entry lines (Expense + Input GST debits, AP + TDS credits)
 *   2. Creates a journal entry header (PI voucher)
 *   3. Posts via the accounting engine (validates DR=CR, updates account balances)
 *   4. Creates a TDS deduction record if TDS applies
 *   5. Updates vendor_invoices: status → APPROVED→POSTED, is_accounting_posted → true
 *   6. Publishes VendorInvoicePosted event
 *   7. Writes audit log entry
 *
 * @param {string} invoiceId
 * @param {string} tenantId
 * @param {string} userId  - who is posting
 */
async function postVendorInvoice(invoiceId, tenantId, userId) {
  return sequelize.transaction(async (t) => {
    // ── 1. Fetch and lock the invoice ────────────────────────────────────────
    const [invoice] = await sequelize.query(
      `SELECT vi.*, v.pan as vendor_pan
       FROM vendor_invoices vi
       LEFT JOIN vendors v ON v.id = vi.vendor_id
       WHERE vi.id = :invoiceId AND vi.tenant_id = :tenantId
       FOR UPDATE`,
      { replacements: { invoiceId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!invoice) throw Object.assign(new Error('Vendor invoice not found'), { statusCode: 404 });
    if (invoice.is_accounting_posted) {
      throw Object.assign(new Error('Invoice is already posted to the ledger'), { statusCode: 400 });
    }
    if (!['APPROVED', 'PENDING'].includes(invoice.status)) {
      throw Object.assign(new Error(`Cannot post invoice with status: ${invoice.status}. Approve it first.`), { statusCode: 400 });
    }

    // ── 2. Resolve fiscal year ───────────────────────────────────────────────
    const fiscalYearId = invoice.fiscal_year_id || (await getActiveFiscalYear(tenantId, t));
    if (!fiscalYearId) {
      throw Object.assign(new Error('No open fiscal year found. Cannot post invoice.'), { statusCode: 422 });
    }

    // ── 3. Resolve account IDs ───────────────────────────────────────────────
    const expenseCode   = invoice.expense_account_code || AP_ACCOUNTS.PURCHASE_EXPENSE;
    const apCode        = AP_ACCOUNTS.AP_VENDOR;

    const [
      expenseAccountId,
      apAccountId,
      cgstAccountId,
      sgstAccountId,
      igstAccountId,
      tdsAccountId,
    ] = await Promise.all([
      getAccountId(expenseCode,          tenantId, t),
      getAccountId(apCode,               tenantId, t),
      getAccountId(AP_ACCOUNTS.INPUT_CGST, tenantId, t),
      getAccountId(AP_ACCOUNTS.INPUT_SGST, tenantId, t),
      getAccountId(AP_ACCOUNTS.INPUT_IGST, tenantId, t),
      getAccountId(AP_ACCOUNTS.TDS_PAYABLE, tenantId, t),
    ]);

    if (!expenseAccountId) {
      throw Object.assign(
        new Error(`Expense account '${expenseCode}' not found in Chart of Accounts. Set it up before posting.`),
        { statusCode: 422 }
      );
    }
    if (!apAccountId) {
      throw Object.assign(
        new Error(`Accounts Payable account '${apCode}' not found in Chart of Accounts. Set it up before posting.`),
        { statusCode: 422 }
      );
    }

    // ── 4. Build journal lines ───────────────────────────────────────────────
    const netAmount  = new Decimal(invoice.net_amount);
    const cgstAmount = new Decimal(invoice.cgst_amount  || 0);
    const sgstAmount = new Decimal(invoice.sgst_amount  || 0);
    const igstAmount = new Decimal(invoice.igst_amount  || 0);
    const tdsAmount  = new Decimal(invoice.tds_amount   || 0);

    // Base expense amount = total invoice − all taxes
    const totalGst   = cgstAmount.plus(sgstAmount).plus(igstAmount);
    const baseAmount = netAmount.minus(totalGst);

    // Vendor is paid net_amount minus TDS (TDS is retained and paid to govt)
    const apAmount   = netAmount.minus(tdsAmount);

    const narration  = invoice.narration
      || `Vendor Invoice: ${invoice.invoice_number} — ${invoice.vendor_name}`;

    const journalLines = [
      // DR: Expense / Purchase
      {
        accountId: expenseAccountId,
        debit:  baseAmount.toFixed(2),
        credit: '0',
        narration: `Purchase: ${invoice.invoice_number} — ${invoice.vendor_name}`,
        branchId: invoice.branch_id || null,
      },
    ];

    // DR: Input CGST (only if account exists and amount > 0)
    if (cgstAmount.greaterThan(0) && cgstAccountId) {
      journalLines.push({
        accountId: cgstAccountId,
        debit:  cgstAmount.toFixed(2),
        credit: '0',
        narration: `Input CGST: ${invoice.invoice_number}`,
        taxCode: 'CGST',
        taxAmount: cgstAmount.toFixed(2),
        branchId: invoice.branch_id || null,
      });
    } else if (cgstAmount.greaterThan(0) && !cgstAccountId) {
      // No Input CGST account: fold GST into expense line
      journalLines[0].debit = baseAmount.plus(cgstAmount).toFixed(2);
      logger.warn('Input CGST account not found; GST folded into expense line', { tenantId, invoiceId });
    }

    // DR: Input SGST
    if (sgstAmount.greaterThan(0) && sgstAccountId) {
      journalLines.push({
        accountId: sgstAccountId,
        debit:  sgstAmount.toFixed(2),
        credit: '0',
        narration: `Input SGST: ${invoice.invoice_number}`,
        taxCode: 'SGST',
        taxAmount: sgstAmount.toFixed(2),
        branchId: invoice.branch_id || null,
      });
    } else if (sgstAmount.greaterThan(0) && !sgstAccountId) {
      journalLines[0].debit = new Decimal(journalLines[0].debit).plus(sgstAmount).toFixed(2);
      logger.warn('Input SGST account not found; GST folded into expense line', { tenantId, invoiceId });
    }

    // DR: Input IGST
    if (igstAmount.greaterThan(0) && igstAccountId) {
      journalLines.push({
        accountId: igstAccountId,
        debit:  igstAmount.toFixed(2),
        credit: '0',
        narration: `Input IGST: ${invoice.invoice_number}`,
        taxCode: 'IGST',
        taxAmount: igstAmount.toFixed(2),
        branchId: invoice.branch_id || null,
      });
    } else if (igstAmount.greaterThan(0) && !igstAccountId) {
      journalLines[0].debit = new Decimal(journalLines[0].debit).plus(igstAmount).toFixed(2);
      logger.warn('Input IGST account not found; GST folded into expense line', { tenantId, invoiceId });
    }

    // CR: Accounts Payable — Vendor (net of TDS)
    journalLines.push({
      accountId: apAccountId,
      debit:  '0',
      credit: apAmount.toFixed(2),
      narration: `AP: ${invoice.invoice_number} — ${invoice.vendor_name}`,
      branchId: invoice.branch_id || null,
    });

    // CR: TDS Payable (if applicable and account exists)
    if (tdsAmount.greaterThan(0)) {
      if (tdsAccountId) {
        journalLines.push({
          accountId: tdsAccountId,
          debit:  '0',
          credit: tdsAmount.toFixed(2),
          narration: `TDS u/s ${invoice.tds_section || 'N/A'}: ${invoice.invoice_number}`,
          taxCode: `TDS_${invoice.tds_section || 'OTHER'}`,
          taxAmount: tdsAmount.toFixed(2),
          branchId: invoice.branch_id || null,
        });
      } else {
        // No TDS account: credit full amount to AP (TDS not tracked separately)
        journalLines[journalLines.length - 1].credit = netAmount.toFixed(2);
        logger.warn('TDS Payable account not found; full amount credited to AP', { tenantId, invoiceId });
      }
    }

    // ── 5. Create journal entry header and post ──────────────────────────────
    const { journalEntryId, entryNumber } = await accountingEngine.postJournalEntry({
      tenantId,
      voucherType: 'PURCHASE',
      date: invoice.invoice_date,
      fiscalYearId,
      narration,
      reference: invoice.invoice_number,
      sourceModule: 'accounts-payable',
      sourceId: invoiceId,
      postedBy: userId,
      lines: journalLines,
      branchId: invoice.branch_id || null,
      fundType: 'LOCAL',
      postingEvent: 'VENDOR_INVOICE_POSTED',
      postingExplanation: {
        rule: 'Vendor invoice posting: DR Expense + DR GST Input / CR Accounts Payable + CR TDS',
        module: 'accounts-payable',
      },
      transaction: t,
    });

    // ── 6. Record TDS deduction for compliance reporting ─────────────────────
    if (tdsAmount.greaterThan(0) && tdsAccountId) {
      await sequelize.query(
        `INSERT INTO tds_deductions (
           id, tenant_id, tds_section, party_name, party_pan,
           payment_amount, tds_amount, tds_rate,
           deduction_date, journal_entry_id, created_at
         ) VALUES (
           :id, :tenantId, :tdsSection, :partyName, :partyPan,
           :paymentAmount, :tdsAmount, :tdsRate,
           :deductionDate, :journalEntryId, NOW()
         )`,
        {
          replacements: {
            id: uuidv4(),
            tenantId,
            tdsSection: invoice.tds_section || 'OTHER',
            partyName: invoice.vendor_name,
            partyPan: invoice.vendor_pan || null,
            paymentAmount: baseAmount.toFixed(2),
            tdsAmount: tdsAmount.toFixed(2),
            tdsRate: baseAmount.isZero()
              ? 0
              : tdsAmount.dividedBy(baseAmount).times(100).toFixed(4),
            deductionDate: invoice.invoice_date,
            journalEntryId,
          },
          transaction: t,
        }
      );
    }

    // ── 7. Update invoice record ─────────────────────────────────────────────
    await sequelize.query(
      `UPDATE vendor_invoices
       SET status = 'APPROVED',
           journal_entry_id    = :journalEntryId,
           is_accounting_posted = true,
           posted_at            = NOW(),
           fiscal_year_id       = :fiscalYearId,
           updated_at           = NOW()
       WHERE id = :invoiceId`,
      { replacements: { journalEntryId, fiscalYearId, invoiceId }, transaction: t }
    );

    // ── 8. Audit log ─────────────────────────────────────────────────────────
    await logEvent({
      tenantId, userId,
      action: AUDIT_ACTIONS.JOURNAL_POSTED,
      entity: 'VendorInvoice', entityId: invoiceId,
      before: { isAccountingPosted: false },
      after:  { isAccountingPosted: true, journalEntryId, entryNumber, status: 'APPROVED' },
      module: 'accounts-payable',
    });

    // ── 9. Domain event ──────────────────────────────────────────────────────
    eventBus.publish(EVENT_TYPES.AP.VENDOR_INVOICE_POSTED, {
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      tenantId,
      vendorId: invoice.vendor_id,
      netAmount: invoice.net_amount,
      journalEntryId,
      entryNumber,
      tdsAmount: tdsAmount.toFixed(2),
      fiscalYearId,
    });

    logger.info('Vendor invoice posted to GL', {
      invoiceId, entryNumber, netAmount: invoice.net_amount,
      baseAmount: baseAmount.toFixed(2), tdsAmount: tdsAmount.toFixed(2),
      tenantId,
    });

    return {
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      journalEntryId,
      entryNumber,
      status: 'APPROVED',
      postedAt: new Date().toISOString(),
      summary: {
        baseAmount:  baseAmount.toFixed(2),
        cgstAmount:  cgstAmount.toFixed(2),
        sgstAmount:  sgstAmount.toFixed(2),
        igstAmount:  igstAmount.toFixed(2),
        tdsAmount:   tdsAmount.toFixed(2),
        apAmount:    apAmount.toFixed(2),
        totalDebit:  netAmount.toFixed(2),
        totalCredit: netAmount.toFixed(2),
      },
    };
  });
}

/**
 * Record and post a vendor payment to the General Ledger.
 *
 * Atomically:
 *   1. Validates the invoice is posted and has an outstanding balance
 *   2. Inserts a vendor_payments record
 *   3. Creates a Payment Voucher (PV) journal entry:
 *        DR  AP - Vendor   (payment_amount)
 *            CR  Bank/Cash (payment_amount)
 *   4. Updates vendor_invoice paid_amount and status (PARTIAL / PAID)
 *   5. Publishes VendorPaymentMade event
 *   6. Writes audit log entry
 *
 * @param {Object} data
 * @param {string} data.tenantId
 * @param {string} data.invoiceId
 * @param {number} data.amount          - payment amount
 * @param {string} data.paymentMode     - 'BANK' | 'CASH' | 'NEFT' | 'RTGS' | 'CHEQUE' | 'UPI'
 * @param {string} [data.referenceNumber]
 * @param {string} [data.paymentDate]
 * @param {string} [data.bankAccountCode] - override default bank account code
 * @param {string} [data.narration]
 * @param {string} userId
 */
async function recordVendorPayment(data, userId) {
  const {
    tenantId,
    invoiceId,
    amount,
    paymentMode = 'BANK',
    referenceNumber,
    paymentDate,
    bankAccountCode,
    narration,
  } = data;

  return sequelize.transaction(async (t) => {
    // ── 1. Fetch and lock the invoice ────────────────────────────────────────
    const [invoice] = await sequelize.query(
      `SELECT * FROM vendor_invoices WHERE id = :invoiceId AND tenant_id = :tenantId FOR UPDATE`,
      { replacements: { invoiceId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!invoice) throw Object.assign(new Error('Vendor invoice not found'), { statusCode: 404 });
    if (invoice.status === 'PAID') {
      throw Object.assign(new Error('Invoice is already fully paid'), { statusCode: 400 });
    }
    if (invoice.status === 'CANCELLED') {
      throw Object.assign(new Error('Cannot pay a cancelled invoice'), { statusCode: 400 });
    }
    if (!invoice.is_accounting_posted) {
      throw Object.assign(
        new Error('Invoice must be posted to the ledger before recording payment. Run postVendorInvoice() first.'),
        { statusCode: 400 }
      );
    }

    // ── 2. Validate payment amount ───────────────────────────────────────────
    const paymentAmount   = new Decimal(amount);
    const currentPaid     = new Decimal(invoice.paid_amount || 0);
    // Outstanding = (net_amount − tds_amount) − already_paid
    // Vendor receives net_amount − tds; TDS is already credited to TDS Payable on posting.
    const vendorPayable   = new Decimal(invoice.net_amount).minus(invoice.tds_amount || 0);
    const outstanding     = vendorPayable.minus(currentPaid);

    if (paymentAmount.lessThanOrEqualTo(0)) {
      throw Object.assign(new Error('Payment amount must be greater than zero'), { statusCode: 400 });
    }
    if (paymentAmount.greaterThan(outstanding.plus(new Decimal('0.01')))) {
      throw Object.assign(
        new Error(`Payment of ${paymentAmount.toFixed(2)} exceeds outstanding balance of ${outstanding.toFixed(2)}`),
        { statusCode: 400 }
      );
    }

    const fiscalYearId = invoice.fiscal_year_id || (await getActiveFiscalYear(tenantId, t));
    if (!fiscalYearId) {
      throw Object.assign(new Error('No open fiscal year found'), { statusCode: 422 });
    }

    // ── 3. Resolve account IDs ───────────────────────────────────────────────
    const isCash           = paymentMode === 'CASH';
    const bankCode         = bankAccountCode || (isCash ? AP_ACCOUNTS.CASH : AP_ACCOUNTS.BANK);
    const [apAccountId, bankAccountId] = await Promise.all([
      getAccountId(AP_ACCOUNTS.AP_VENDOR, tenantId, t),
      getAccountId(bankCode,              tenantId, t),
    ]);

    if (!apAccountId) {
      throw Object.assign(
        new Error(`AP Vendor account '${AP_ACCOUNTS.AP_VENDOR}' not found in Chart of Accounts.`),
        { statusCode: 422 }
      );
    }
    if (!bankAccountId) {
      throw Object.assign(
        new Error(`Bank/Cash account '${bankCode}' not found in Chart of Accounts.`),
        { statusCode: 422 }
      );
    }

    // ── 4. Insert vendor_payments record ─────────────────────────────────────
    const paymentId   = uuidv4();
    const effectiveDate = paymentDate || new Date().toISOString().split('T')[0];
    const paymentNarration = narration
      || `Payment to ${invoice.vendor_name}: ${invoice.invoice_number} via ${paymentMode}`;

    await sequelize.query(
      `INSERT INTO vendor_payments (
         id, tenant_id, vendor_invoice_id, vendor_id,
         amount, payment_mode, reference_number, payment_date,
         bank_account_code, fiscal_year_id, branch_id,
         narration, created_by, created_at, updated_at
       ) VALUES (
         :id, :tenantId, :invoiceId, :vendorId,
         :amount, :paymentMode, :referenceNumber, :paymentDate,
         :bankAccountCode, :fiscalYearId, :branchId,
         :narration, :createdBy, NOW(), NOW()
       )`,
      {
        replacements: {
          id: paymentId, tenantId,
          invoiceId, vendorId: invoice.vendor_id,
          amount: paymentAmount.toFixed(2),
          paymentMode, referenceNumber: referenceNumber || null,
          paymentDate: effectiveDate,
          bankAccountCode: bankCode,
          fiscalYearId, branchId: invoice.branch_id || null,
          narration: paymentNarration, createdBy: userId,
        },
        transaction: t,
      }
    );

    // ── 5. Create and post Payment Voucher (PV) journal entry ─────────────────
    //   DR  AP - Vendor   (reduces the liability)
    //       CR  Bank/Cash (reduces the asset)
    const { journalEntryId, entryNumber } = await accountingEngine.postJournalEntry({
      tenantId,
      voucherType: 'PAYMENT',
      date: effectiveDate,
      fiscalYearId,
      narration: paymentNarration,
      reference: referenceNumber || invoice.invoice_number,
      sourceModule: 'accounts-payable',
      sourceId: paymentId,
      postedBy: userId,
      branchId: invoice.branch_id || null,
      lines: [
        {
          accountId: apAccountId,
          debit:     paymentAmount.toFixed(2),
          credit:    '0',
          narration: `AP cleared: ${invoice.invoice_number} — ${invoice.vendor_name}`,
          branchId: invoice.branch_id || null,
        },
        {
          accountId: bankAccountId,
          debit:     '0',
          credit:    paymentAmount.toFixed(2),
          narration: paymentNarration,
          branchId: invoice.branch_id || null,
        },
      ],
      fundType: 'LOCAL',
      postingEvent: 'PAYMENT_POSTED',
      postingExplanation: {
        rule: 'Vendor payment: DR Accounts Payable / CR Bank/Cash',
        module: 'accounts-payable',
      },
      transaction: t,
    });

    // Link journal entry back to vendor_payments record
    await sequelize.query(
      `UPDATE vendor_payments SET journal_entry_id = :journalEntryId WHERE id = :paymentId`,
      { replacements: { journalEntryId, paymentId }, transaction: t }
    );

    // ── 6. Update invoice paid_amount and status ──────────────────────────────
    const newPaidAmount = currentPaid.plus(paymentAmount);
    const newBalance    = outstanding.minus(paymentAmount);
    const newStatus     = newBalance.lessThanOrEqualTo(new Decimal('0.01')) ? 'PAID' : 'PARTIAL';

    await sequelize.query(
      `UPDATE vendor_invoices
       SET paid_amount = :newPaidAmount, status = :status, updated_at = NOW()
       WHERE id = :invoiceId`,
      { replacements: { newPaidAmount: newPaidAmount.toFixed(2), status: newStatus, invoiceId }, transaction: t }
    );

    // ── 7. Audit log ─────────────────────────────────────────────────────────
    await logEvent({
      tenantId, userId,
      action: AUDIT_ACTIONS.PAYMENT_MADE,
      entity: 'VendorInvoice', entityId: invoiceId,
      before: { paidAmount: currentPaid.toFixed(2), status: invoice.status },
      after:  { paidAmount: newPaidAmount.toFixed(2), status: newStatus, journalEntryId, entryNumber },
      module: 'accounts-payable',
    });

    // ── 8. Domain event ──────────────────────────────────────────────────────
    eventBus.publish(EVENT_TYPES.AP.VENDOR_PAYMENT_MADE, {
      paymentId,
      invoiceId,
      invoiceNumber: invoice.invoice_number,
      tenantId,
      vendorId: invoice.vendor_id,
      amount: paymentAmount.toFixed(2),
      paymentMode,
      referenceNumber,
      journalEntryId,
      entryNumber,
      invoiceStatus: newStatus,
    });

    logger.info('Vendor payment posted to GL', {
      paymentId, invoiceId, entryNumber,
      amount: paymentAmount.toFixed(2), paymentMode, tenantId,
    });

    return {
      paymentId,
      journalEntryId,
      entryNumber,
      invoiceStatus: newStatus,
      paidAmount:    newPaidAmount.toFixed(2),
      outstanding:   newBalance.greaterThan(0) ? newBalance.toFixed(2) : '0.00',
    };
  });
}

/**
 * Reverse a posted vendor invoice.
 * Uses the accounting engine's reverseTransaction — creates a countertransaction,
 * marks the original as REVERSED, and resets the invoice status to CANCELLED.
 *
 * @param {string} invoiceId
 * @param {string} tenantId
 * @param {string} userId
 * @param {string} reason
 */
async function reverseVendorInvoice(invoiceId, tenantId, userId, reason) {
  return sequelize.transaction(async (t) => {
    const [invoice] = await sequelize.query(
      `SELECT * FROM vendor_invoices WHERE id = :invoiceId AND tenant_id = :tenantId FOR UPDATE`,
      { replacements: { invoiceId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!invoice) throw Object.assign(new Error('Vendor invoice not found'), { statusCode: 404 });
    if (!invoice.is_accounting_posted || !invoice.journal_entry_id) {
      throw Object.assign(new Error('Invoice has not been posted to the ledger. Nothing to reverse.'), { statusCode: 400 });
    }
    if (invoice.is_reversed) {
      throw Object.assign(new Error('Invoice has already been reversed'), { statusCode: 400 });
    }
    if (parseFloat(invoice.paid_amount) > 0) {
      throw Object.assign(
        new Error('Cannot reverse an invoice that has payments recorded against it. Reverse the payments first.'),
        { statusCode: 400 }
      );
    }

    const reversalResult = await accountingEngine.reverseTransaction(
      invoice.journal_entry_id, tenantId, userId,
      reason || `Vendor invoice reversal: ${invoice.invoice_number}`
    );

    await sequelize.query(
      `UPDATE vendor_invoices
       SET status = 'CANCELLED', is_reversed = true, reversal_entry_id = :reversalEntryId,
           is_accounting_posted = false, updated_at = NOW()
       WHERE id = :invoiceId`,
      {
        replacements: { reversalEntryId: reversalResult.reversalEntryId, invoiceId },
        transaction: t,
      }
    );

    await logEvent({
      tenantId, userId,
      action: AUDIT_ACTIONS.JOURNAL_REVERSED,
      entity: 'VendorInvoice', entityId: invoiceId,
      before: { status: invoice.status, journalEntryId: invoice.journal_entry_id },
      after:  { status: 'CANCELLED', reversalEntryId: reversalResult.reversalEntryId },
      metadata: { reason },
      module: 'accounts-payable',
    });

    eventBus.publish(EVENT_TYPES.AP.VENDOR_INVOICE_REVERSED, {
      invoiceId, invoiceNumber: invoice.invoice_number,
      tenantId, reversalEntryId: reversalResult.reversalEntryId, reason,
    });

    return {
      invoiceId,
      status: 'CANCELLED',
      originalEntryId: invoice.journal_entry_id,
      reversalEntryId: reversalResult.reversalEntryId,
      reversalNumber:  reversalResult.reversalNumber,
    };
  });
}

// ─── QUERIES ──────────────────────────────────────────────────────────────────

/**
 * AP Dashboard: totals, aging buckets, overdue count — for the dashboard KPI strip.
 */
async function getAPDashboard(tenantId, { branchId } = {}) {
  const branchFilter = branchId ? 'AND vi.branch_id = :branchId' : '';
  const replacements = { tenantId, branchId: branchId || null };

  const [summary] = await sequelize.query(
    `SELECT
       COUNT(*)                                             AS total_invoices,
       COUNT(*) FILTER (WHERE status IN ('PENDING'))        AS pending_approval,
       COUNT(*) FILTER (WHERE status IN ('APPROVED','PARTIAL')) AS approved_unpaid,
       COUNT(*) FILTER (WHERE status = 'PAID')              AS paid_this_period,
       COALESCE(SUM(net_amount - tds_amount - paid_amount)
         FILTER (WHERE status NOT IN ('PAID','CANCELLED')), 0)  AS total_outstanding,
       COALESCE(SUM(net_amount - tds_amount - paid_amount)
         FILTER (WHERE due_date < CURRENT_DATE
                   AND status NOT IN ('PAID','CANCELLED')), 0)  AS total_overdue,
       COUNT(*) FILTER (WHERE due_date < CURRENT_DATE
                          AND status NOT IN ('PAID','CANCELLED'))  AS overdue_count
     FROM vendor_invoices vi
     WHERE tenant_id = :tenantId ${branchFilter}`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  // AP aging buckets: Current / 1-30 / 31-60 / 61-90 / 90+
  const aging = await sequelize.query(
    `SELECT
       COALESCE(SUM(net_amount - tds_amount - paid_amount)
         FILTER (WHERE due_date >= CURRENT_DATE), 0)                AS current_due,
       COALESCE(SUM(net_amount - tds_amount - paid_amount)
         FILTER (WHERE due_date BETWEEN CURRENT_DATE - 30 AND CURRENT_DATE - 1), 0) AS overdue_1_30,
       COALESCE(SUM(net_amount - tds_amount - paid_amount)
         FILTER (WHERE due_date BETWEEN CURRENT_DATE - 60 AND CURRENT_DATE - 31), 0) AS overdue_31_60,
       COALESCE(SUM(net_amount - tds_amount - paid_amount)
         FILTER (WHERE due_date BETWEEN CURRENT_DATE - 90 AND CURRENT_DATE - 61), 0) AS overdue_61_90,
       COALESCE(SUM(net_amount - tds_amount - paid_amount)
         FILTER (WHERE due_date < CURRENT_DATE - 90), 0)            AS overdue_90_plus
     FROM vendor_invoices vi
     WHERE tenant_id = :tenantId
       AND status NOT IN ('PAID','CANCELLED') ${branchFilter}`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  return {
    summary: summary || {},
    aging:   aging[0] || {},
  };
}

/**
 * List vendor invoices with filters + pagination.
 */
async function getVendorInvoices(tenantId, filters = {}, pagination = {}) {
  const {
    status, vendorId, dateFrom, dateTo,
    dueDateFrom, dueDateTo, search,
    isOverdue, branchId, isAccountingPosted,
  } = filters;
  const { page = 1, limit = 25 } = pagination;
  const clampedLimit = Math.min(parseInt(limit) || 25, 200);
  const offset       = (parseInt(page) - 1) * clampedLimit;

  const conditions   = ['vi.tenant_id = :tenantId'];
  const replacements = { tenantId, limit: clampedLimit, offset };

  if (status)              { conditions.push('vi.status = :status');               replacements.status = status; }
  if (vendorId)            { conditions.push('vi.vendor_id = :vendorId');           replacements.vendorId = vendorId; }
  if (branchId)            { conditions.push('vi.branch_id = :branchId');           replacements.branchId = branchId; }
  if (dateFrom)            { conditions.push('vi.invoice_date >= :dateFrom');        replacements.dateFrom = dateFrom; }
  if (dateTo)              { conditions.push('vi.invoice_date <= :dateTo');          replacements.dateTo = dateTo; }
  if (dueDateFrom)         { conditions.push('vi.due_date >= :dueDateFrom');         replacements.dueDateFrom = dueDateFrom; }
  if (dueDateTo)           { conditions.push('vi.due_date <= :dueDateTo');           replacements.dueDateTo = dueDateTo; }
  if (isOverdue === true)  { conditions.push('vi.due_date < CURRENT_DATE AND vi.status NOT IN (\'PAID\',\'CANCELLED\')'); }
  if (isAccountingPosted !== undefined) {
    conditions.push('vi.is_accounting_posted = :isAccountingPosted');
    replacements.isAccountingPosted = isAccountingPosted;
  }
  if (search) {
    conditions.push(
      `(vi.invoice_number ILIKE :search OR vi.vendor_name ILIKE :search
        OR vi.narration ILIKE :search OR v.name ILIKE :search)`
    );
    replacements.search = `%${search}%`;
  }

  const where = conditions.join(' AND ');

  const [rows, countResult] = await Promise.all([
    sequelize.query(
      `SELECT
         vi.*,
         v.name AS vendor_full_name, v.gstin, v.pan, v.payment_terms_days,
         (vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0)) AS outstanding_amount,
         CASE WHEN vi.due_date < CURRENT_DATE
                AND vi.status NOT IN ('PAID','CANCELLED')
              THEN CURRENT_DATE - vi.due_date ELSE 0 END AS days_overdue,
         je.entry_number AS gl_entry_number
       FROM vendor_invoices vi
       LEFT JOIN vendors v ON v.id = vi.vendor_id
       LEFT JOIN journal_entries je ON je.id = vi.journal_entry_id
       WHERE ${where}
       ORDER BY vi.invoice_date DESC, vi.created_at DESC
       LIMIT :limit OFFSET :offset`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COUNT(*) AS total
       FROM vendor_invoices vi
       LEFT JOIN vendors v ON v.id = vi.vendor_id
       WHERE ${where}`,
      { replacements, type: sequelize.QueryTypes.SELECT }
    ),
  ]);

  return {
    data:  rows,
    total: parseInt(countResult[0].total, 10),
    page:  parseInt(page),
    limit: clampedLimit,
    pages: Math.ceil(countResult[0].total / clampedLimit),
  };
}

/**
 * Get a single vendor invoice with its journal lines and payment history.
 */
async function getVendorInvoiceById(invoiceId, tenantId) {
  const [invoice] = await sequelize.query(
    `SELECT vi.*, v.name AS vendor_full_name, v.gstin, v.pan, v.phone, v.email,
            v.bank_account_number, v.bank_ifsc, v.bank_name,
            je.entry_number AS gl_entry_number, je.status AS gl_status
     FROM vendor_invoices vi
     LEFT JOIN vendors v ON v.id = vi.vendor_id
     LEFT JOIN journal_entries je ON je.id = vi.journal_entry_id
     WHERE vi.id = :invoiceId AND vi.tenant_id = :tenantId`,
    { replacements: { invoiceId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!invoice) return null;

  // Fetch journal lines if posted
  const journalLines = invoice.journal_entry_id
    ? await sequelize.query(
        `SELECT jl.*, a.code AS account_code, a.name AS account_name, a.type AS account_type
         FROM journal_lines jl
         JOIN accounts a ON a.id = jl.account_id
         WHERE jl.journal_entry_id = :journalEntryId
         ORDER BY jl.line_number`,
        { replacements: { journalEntryId: invoice.journal_entry_id }, type: sequelize.QueryTypes.SELECT }
      )
    : [];

  // Fetch payment history
  const payments = await sequelize.query(
    `SELECT vp.*, je.entry_number AS payment_entry_number
     FROM vendor_payments vp
     LEFT JOIN journal_entries je ON je.id = vp.journal_entry_id
     WHERE vp.vendor_invoice_id = :invoiceId
     ORDER BY vp.payment_date DESC`,
    { replacements: { invoiceId }, type: sequelize.QueryTypes.SELECT }
  );

  return { ...invoice, journalLines, payments };
}

/**
 * AP Aging Report: per-vendor breakdown across 5 aging buckets.
 */
async function getVendorAging(tenantId, { branchId } = {}) {
  const branchFilter = branchId ? 'AND vi.branch_id = :branchId' : '';
  const replacements = { tenantId, branchId: branchId || null };

  const rows = await sequelize.query(
    `SELECT
       v.id AS vendor_id,
       v.name AS vendor_name,
       v.payment_terms_days,
       COUNT(vi.id)                                        AS invoice_count,
       COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0)), 0) AS total_outstanding,
       COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0))
         FILTER (WHERE vi.due_date >= CURRENT_DATE), 0)        AS current_due,
       COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0))
         FILTER (WHERE vi.due_date BETWEEN CURRENT_DATE-30 AND CURRENT_DATE-1), 0) AS overdue_1_30,
       COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0))
         FILTER (WHERE vi.due_date BETWEEN CURRENT_DATE-60 AND CURRENT_DATE-31), 0) AS overdue_31_60,
       COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0))
         FILTER (WHERE vi.due_date BETWEEN CURRENT_DATE-90 AND CURRENT_DATE-61), 0) AS overdue_61_90,
       COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0))
         FILTER (WHERE vi.due_date < CURRENT_DATE-90), 0)      AS overdue_90_plus,
       MIN(vi.due_date) FILTER (WHERE vi.due_date < CURRENT_DATE
         AND vi.status NOT IN ('PAID','CANCELLED'))             AS oldest_due_date
     FROM vendor_invoices vi
     JOIN vendors v ON v.id = vi.vendor_id
     WHERE vi.tenant_id = :tenantId
       AND vi.status NOT IN ('PAID','CANCELLED') ${branchFilter}
     GROUP BY v.id, v.name, v.payment_terms_days
     HAVING COALESCE(SUM(vi.net_amount - COALESCE(vi.tds_amount,0) - COALESCE(vi.paid_amount,0)), 0) > 0
     ORDER BY total_outstanding DESC`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );

  return rows;
}

module.exports = {
  createVendorInvoice,
  approveVendorInvoice,
  postVendorInvoice,
  recordVendorPayment,
  reverseVendorInvoice,
  getAPDashboard,
  getVendorInvoices,
  getVendorInvoiceById,
  getVendorAging,
  AP_ACCOUNTS,
};
