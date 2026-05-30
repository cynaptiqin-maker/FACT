'use strict';

const { v4: uuidv4 } = require('uuid');
const Decimal = require('decimal.js');
const { sequelize } = require('../../../config/database');
const accountingEngine = require('../../../shared/accounting-engine');
const { calculateGSTSummary } = require('../../../shared/utils/taxCalculator');
const { logEvent, AUDIT_ACTIONS } = require('../../../shared/audit/auditLogger');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');
const { tenantCache, invalidateTag } = require('../../../shared/cache/cacheService');
const logger = require('../../../shared/utils/logger');

/**
 * Patient Billing Service
 *
 * On invoice finalization, automatically creates double-entry journal:
 *
 * FINALIZE OP INVOICE (Patient pays):
 *   DR  Accounts Receivable - Patients     5,900
 *       CR  Revenue - OP Consultation          5,000
 *       CR  Output GST - CGST (9%)               450
 *       CR  Output GST - SGST (9%)               450
 *
 * RECEIVE PAYMENT:
 *   DR  Cash / Bank                        5,900
 *       CR  Accounts Receivable - Patients  5,900
 */

// ─── Account codes for auto-posting (configured per tenant) ──────────────────
const DEFAULT_ACCOUNTS = {
  AR_PATIENT: '1100',         // Accounts Receivable - Patients
  AR_INSURANCE: '1101',       // Accounts Receivable - Insurance
  CASH: '1001',               // Cash in Hand
  BANK: '1010',               // Bank Account
  OUTPUT_CGST: '2201',        // Output GST - CGST
  OUTPUT_SGST: '2202',        // Output GST - SGST
  OUTPUT_IGST: '2203',        // Output GST - IGST
  REVENUE_OP: '4001',         // Revenue - OP Consultation
  REVENUE_IP: '4002',         // Revenue - IP Services
  REVENUE_ICU: '4003',        // Revenue - ICU
  REVENUE_OT: '4004',         // Revenue - OT
  REVENUE_PHARMACY: '4005',   // Revenue - Pharmacy
  REVENUE_LAB: '4006',        // Revenue - Lab
  REVENUE_RADIOLOGY: '4007',  // Revenue - Radiology
  DISCOUNT: '5100',           // Discount Allowed
  ADVANCE_RECEIVED: '2100',   // Patient Deposits/Advances
};

/**
 * Generate invoice number.
 */
async function generateInvoiceNumber(tenantId, transaction) {
  const year = new Date().getFullYear();
  const [result] = await sequelize.query(
    `INSERT INTO voucher_sequences (tenant_id, voucher_type, fiscal_year, last_number, created_at, updated_at)
     VALUES (:tenantId, 'PATIENT_INVOICE', :year, 1, NOW(), NOW())
     ON CONFLICT (tenant_id, voucher_type, fiscal_year)
     DO UPDATE SET last_number = voucher_sequences.last_number + 1, updated_at = NOW()
     RETURNING last_number`,
    { replacements: { tenantId, year }, type: sequelize.QueryTypes.INSERT, transaction }
  );

  return `INV-${year}-${String(result[0].last_number).padStart(6, '0')}`;
}

/**
 * Create a patient invoice (DRAFT/PROVISIONAL).
 */
async function createInvoice(data, userId) {
  const {
    tenantId, patientId, patientName, patientUhid,
    billingType = 'OP', invoiceDate, items,
    discountPercent = 0, discountAmount: manualDiscount, discountReason,
    isInsurance = false, insuranceId, tpaId, policyNumber,
    insuranceShare = 0, notes, fiscalYearId, branchId,
    isCreditBill = false, admissionId, visitId,
    treatDoctorId, treatDoctorName, department,
  } = data;

  const id = uuidv4();

  return sequelize.transaction(async (t) => {
    // Calculate invoice totals
    const { gross, taxSummary, netAmount, discountAmt } = calculateInvoiceTotals(
      items, discountPercent, manualDiscount
    );

    const invoiceNumber = await generateInvoiceNumber(tenantId, t);
    const balanceAmount = new Decimal(netAmount).minus(insuranceShare);
    const patientShare = balanceAmount.toFixed(2);

    // Insert header
    await sequelize.query(
      `INSERT INTO patient_invoices (
        id, tenant_id, invoice_number, patient_id, patient_name, patient_uhid,
        billing_type, invoice_date, status,
        visit_id, admission_id, admission_date,
        treating_doctor_id, treating_doctor_name, department,
        gross_amount, discount_amount, discount_percent, discount_reason,
        taxable_amount, cgst_amount, sgst_amount, igst_amount, total_tax,
        net_amount, rounded_amount, paid_amount, balance_amount,
        patient_share, insurance_share,
        is_credit_bill,
        insurance_id, tpa_id, policy_number,
        notes, fiscal_year_id, branch_id, created_by, created_at, updated_at
      ) VALUES (
        :id, :tenantId, :invoiceNumber, :patientId, :patientName, :patientUhid,
        :billingType, :invoiceDate, 'DRAFT',
        :visitId, :admissionId, NOW()::date,
        :doctorId, :doctorName, :department,
        :gross, :discountAmt, :discountPercent, :discountReason,
        :taxable, :cgst, :sgst, :igst, :totalTax,
        :netAmount, :netAmount, 0, :netAmount,
        :patientShare, :insuranceShare,
        :isCreditBill,
        :insuranceId, :tpaId, :policyNumber,
        :notes, :fiscalYearId, :branchId, :createdBy, NOW(), NOW()
      )`,
      {
        replacements: {
          id, tenantId, invoiceNumber, patientId, patientName, patientUhid,
          billingType, invoiceDate,
          visitId: visitId || null, admissionId: admissionId || null,
          doctorId: treatDoctorId || null, doctorName: treatDoctorName || null,
          department: department || null,
          gross: new Decimal(gross).toFixed(2),
          discountAmt: new Decimal(discountAmt).toFixed(2),
          discountPercent,
          discountReason: discountReason || null,
          taxable: new Decimal(taxSummary.totalBase).toFixed(2),
          cgst: taxSummary.totalCGST,
          sgst: taxSummary.totalSGST,
          igst: taxSummary.totalIGST,
          totalTax: taxSummary.totalGST,
          netAmount,
          patientShare,
          insuranceShare,
          isCreditBill,
          insuranceId: insuranceId || null, tpaId: tpaId || null, policyNumber: policyNumber || null,
          notes: notes || null, fiscalYearId: fiscalYearId || null, branchId: branchId || null,
          createdBy: userId,
        },
        transaction: t,
      }
    );

    // Insert line items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await sequelize.query(
        `INSERT INTO invoice_line_items (
          id, invoice_id, tenant_id, line_number, service_code, service_name,
          quantity, unit_price, gross_amount, discount_amount, discount_percent,
          taxable_amount, gst_rate, cgst_amount, sgst_amount, igst_amount,
          net_amount, account_code, department, created_at, updated_at
        ) VALUES (
          :id, :invoiceId, :tenantId, :lineNumber, :serviceCode, :serviceName,
          :quantity, :unitPrice, :grossAmount, :discountAmount, :discountPercent,
          :taxableAmount, :gstRate, :cgstAmount, :sgstAmount, :igstAmount,
          :netAmount, :accountCode, :department, NOW(), NOW()
        )`,
        {
          replacements: {
            id: uuidv4(), invoiceId: id, tenantId,
            lineNumber: i + 1,
            serviceCode: item.serviceCode || null,
            serviceName: item.serviceName,
            quantity: item.quantity || 1,
            unitPrice: new Decimal(item.unitPrice).toFixed(2),
            grossAmount: new Decimal(item.quantity || 1).times(item.unitPrice).toFixed(2),
            discountAmount: item.discountAmount || 0,
            discountPercent: item.discountPercent || 0,
            taxableAmount: item.taxableAmount || new Decimal(item.quantity || 1).times(item.unitPrice).toFixed(2),
            gstRate: item.gstRate || 0,
            cgstAmount: item.cgstAmount || 0,
            sgstAmount: item.sgstAmount || 0,
            igstAmount: item.igstAmount || 0,
            netAmount: item.netAmount || item.taxableAmount,
            accountCode: item.accountCode || null,
            department: item.department || null,
          },
          transaction: t,
        }
      );
    }

    await logEvent({
      tenantId, userId, action: AUDIT_ACTIONS.INVOICE_CREATED,
      entity: 'PatientInvoice', entityId: id,
      after: { invoiceNumber, patientId, billingType, netAmount },
    });

    eventBus.publish(EVENT_TYPES.BILLING.INVOICE_CREATED, { invoiceId: id, invoiceNumber, tenantId, patientId, billingType, netAmount });

    return { id, invoiceNumber, status: 'DRAFT', netAmount };
  });
}

/**
 * Finalize invoice and post accounting entries.
 */
async function finalizeInvoice(invoiceId, tenantId, userId) {
  const result = await sequelize.transaction(async (t) => {
    const [invoice] = await sequelize.query(
      `SELECT * FROM patient_invoices WHERE id = :invoiceId AND tenant_id = :tenantId AND status = 'DRAFT'`,
      { replacements: { invoiceId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!invoice) throw Object.assign(new Error('Invoice not found or not in DRAFT status'), { statusCode: 404 });

    const fiscalYearId = invoice.fiscal_year_id;
    if (!fiscalYearId) throw Object.assign(new Error('Fiscal year not set on invoice'), { statusCode: 400 });

    // Get account IDs by code
    const getAccountId = async (code) => {
      const [acc] = await sequelize.query(
        `SELECT id FROM accounts WHERE code = :code AND tenant_id = :tenantId AND is_active = true`,
        { replacements: { code, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
      );
      return acc?.id;
    };

    // Determine revenue account based on billing type
    const revenueAccountCodeMap = {
      OP: DEFAULT_ACCOUNTS.REVENUE_OP,
      IP: DEFAULT_ACCOUNTS.REVENUE_IP,
      ICU: DEFAULT_ACCOUNTS.REVENUE_ICU,
      OT: DEFAULT_ACCOUNTS.REVENUE_OT,
      PHARMACY: DEFAULT_ACCOUNTS.REVENUE_PHARMACY,
      LAB: DEFAULT_ACCOUNTS.REVENUE_LAB,
      RADIOLOGY: DEFAULT_ACCOUNTS.REVENUE_RADIOLOGY,
    };

    const revenueCode = revenueAccountCodeMap[invoice.billing_type] || DEFAULT_ACCOUNTS.REVENUE_OP;
    const arCode = invoice.is_credit_bill ? DEFAULT_ACCOUNTS.AR_INSURANCE : DEFAULT_ACCOUNTS.AR_PATIENT;

    const [arAccountId, revenueAccountId, cgstAccountId, sgstAccountId] = await Promise.all([
      getAccountId(arCode),
      getAccountId(revenueCode),
      getAccountId(DEFAULT_ACCOUNTS.OUTPUT_CGST),
      getAccountId(DEFAULT_ACCOUNTS.OUTPUT_SGST),
    ]);

    if (!arAccountId || !revenueAccountId) {
      throw Object.assign(
        new Error('Required accounts not configured. Please set up Chart of Accounts.'),
        { statusCode: 422 }
      );
    }

    // Build journal lines
    // DR: Accounts Receivable for full net amount
    // CR: Revenue for taxable amount
    // CR: CGST/SGST for tax amounts
    // CR: Discount Allowed if any discount given
    const journalLines = [
      // Debit AR
      {
        accountId: arAccountId,
        debit: invoice.net_amount,
        credit: 0,
        narration: `AR: ${invoice.invoice_number} - ${invoice.patient_name}`,
      },
      // Credit Revenue
      {
        accountId: revenueAccountId,
        debit: 0,
        credit: invoice.taxable_amount,
        narration: `Revenue: ${invoice.billing_type} - ${invoice.invoice_number}`,
      },
    ];

    // Add GST lines
    if (parseFloat(invoice.cgst_amount) > 0) {
      journalLines.push({
        accountId: cgstAccountId,
        debit: 0,
        credit: invoice.cgst_amount,
        narration: `CGST: ${invoice.invoice_number}`,
        taxCode: 'CGST',
        taxAmount: invoice.cgst_amount,
      });
    }

    if (parseFloat(invoice.sgst_amount) > 0 && sgstAccountId) {
      journalLines.push({
        accountId: sgstAccountId,
        debit: 0,
        credit: invoice.sgst_amount,
        narration: `SGST: ${invoice.invoice_number}`,
        taxCode: 'SGST',
        taxAmount: invoice.sgst_amount,
      });
    }

    // Discount entry: DR Discount Expense, CR Revenue changes from taxable → gross to balance
    if (parseFloat(invoice.discount_amount) > 0) {
      const discountAccountId = await getAccountId(DEFAULT_ACCOUNTS.DISCOUNT);
      if (discountAccountId) {
        journalLines.push({
          accountId: discountAccountId,
          debit: invoice.discount_amount,
          credit: 0,
          narration: `Discount: ${invoice.discount_reason || 'Patient discount'}`,
        });
        // Revenue must be at gross so entry balances:
        // DR AR (net) + DR Discount = CR Revenue (gross) + CR GST
        journalLines[1].credit = new Decimal(invoice.gross_amount).toFixed(2);
      }
    }

    // Create and post journal entry via unified accounting engine
    const { journalEntryId, entryNumber } = await accountingEngine.postJournalEntry({
      tenantId,
      voucherType: 'SALES',
      date: new Date(),
      fiscalYearId,
      narration: `Patient Invoice: ${invoice.invoice_number} - ${invoice.patient_name}`,
      reference: invoice.invoice_number,
      sourceModule: 'patient-billing',
      sourceId: invoiceId,
      postedBy: userId,
      lines: journalLines,
      fundType: 'LOCAL',
      postingEvent: 'INVOICE_POSTED',
      postingExplanation: {
        rule: 'Patient invoice finalization: DR Accounts Receivable / CR Revenue + GST accounts',
        module: 'patient-billing',
      },
      transaction: t,
    });

    // Update invoice status
    await sequelize.query(
      `UPDATE patient_invoices SET status = 'FINALIZED', journal_entry_id = :journalEntryId,
       is_accounting_posted = true, updated_at = NOW()
       WHERE id = :invoiceId`,
      { replacements: { journalEntryId, invoiceId }, transaction: t }
    );

    await logEvent({
      tenantId, userId, action: AUDIT_ACTIONS.INVOICE_CREATED,
      entity: 'PatientInvoice', entityId: invoiceId,
      after: { status: 'FINALIZED', journalEntryId, entryNumber },
      module: 'patient-billing',
    });

    eventBus.publish(EVENT_TYPES.BILLING.INVOICE_FINALIZED, {
      invoiceId, invoiceNumber: invoice.invoice_number, tenantId,
      patientId: invoice.patient_id, netAmount: invoice.net_amount,
      journalEntryId,
    });

    return { invoiceId, status: 'FINALIZED', journalEntryId, entryNumber };
  });

  // Drop the reports cache after the transaction commits so P&L and balance
  // sheet reflect the new posting on the next request.
  try {
    await invalidateTag(`financial-reports:${tenantId}`);
  } catch (cacheErr) {
    logger.warn('Report cache invalidation failed; reports may be stale up to 5 min', {
      tenantId, error: cacheErr.message,
    });
  }

  return result;
}

/**
 * Calculate invoice totals from line items.
 */
function calculateInvoiceTotals(items, discountPercent = 0, manualDiscount = 0) {
  let gross = new Decimal(0);

  const taxItems = [];

  for (const item of items) {
    const qty = new Decimal(item.quantity || 1);
    const price = new Decimal(item.unitPrice || 0);
    const lineGross = qty.times(price);
    gross = gross.plus(lineGross);

    taxItems.push({
      amount: lineGross.toFixed(2),
      gstRate: item.gstRate || 0,
      treatment: item.isInterstate ? 'INTER_STATE' : 'INTRA_STATE',
    });
  }

  // Calculate discount first, then apply proportionally before GST
  const discountAmt = manualDiscount > 0
    ? new Decimal(manualDiscount)
    : gross.times(discountPercent).dividedBy(100);

  const afterDiscount = gross.minus(discountAmt);

  // Recalculate taxItems using post-discount amounts (proportional allocation)
  const discountRatio = gross.isZero() ? new Decimal(1) : afterDiscount.dividedBy(gross);
  const adjustedTaxItems = taxItems.map((item) => ({
    amount: new Decimal(item.amount).times(discountRatio).toFixed(2),
    gstRate: item.gstRate,
    treatment: item.treatment,
  }));

  const taxSummary = calculateGSTSummary(adjustedTaxItems);
  const netAmount = afterDiscount.plus(taxSummary.totalGST).toFixed(2);

  return {
    gross: gross.toFixed(2),
    discountAmt: discountAmt.toFixed(2),
    taxSummary,
    netAmount,
  };
}

/**
 * Receive payment against invoice.
 */
async function receivePayment({ invoiceId, tenantId, amount, paymentMode, referenceNumber, receivedBy }) {
  const result = await sequelize.transaction(async (t) => {
    const [invoice] = await sequelize.query(
      `SELECT * FROM patient_invoices WHERE id = :invoiceId AND tenant_id = :tenantId`,
      { replacements: { invoiceId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    if (!invoice) throw Object.assign(new Error('Invoice not found'), { statusCode: 404 });
    if (['CANCELLED', 'PAID'].includes(invoice.status)) {
      throw Object.assign(new Error(`Cannot receive payment on ${invoice.status} invoice`), { statusCode: 400 });
    }

    const paymentAmount = new Decimal(amount);
    const newPaidAmount = new Decimal(invoice.paid_amount).plus(paymentAmount);
    const newBalanceAmount = new Decimal(invoice.net_amount).minus(newPaidAmount);

    if (newBalanceAmount.isNegative()) {
      throw Object.assign(new Error(`Payment of ${amount} exceeds outstanding balance of ${invoice.balance_amount}`), { statusCode: 400 });
    }

    const newStatus = newBalanceAmount.lessThanOrEqualTo(0) ? 'PAID' : 'PARTIALLY_PAID';

    // Insert payment record
    const paymentId = uuidv4();
    await sequelize.query(
      `INSERT INTO payments (id, tenant_id, invoice_id, patient_id, amount, payment_mode,
       reference_number, received_by, payment_date, status, created_at, updated_at)
       VALUES (:id, :tenantId, :invoiceId, :patientId, :amount, :paymentMode,
       :referenceNumber, :receivedBy, NOW()::date, 'COMPLETED', NOW(), NOW())`,
      {
        replacements: {
          id: paymentId, tenantId, invoiceId, patientId: invoice.patient_id,
          amount: paymentAmount.toFixed(2), paymentMode, referenceNumber, receivedBy,
        },
        transaction: t,
      }
    );

    // Update invoice paid/balance amounts
    await sequelize.query(
      `UPDATE patient_invoices SET paid_amount = :newPaidAmount, balance_amount = :newBalanceAmount,
       status = :status, updated_at = NOW() WHERE id = :invoiceId`,
      {
        replacements: {
          newPaidAmount: newPaidAmount.toFixed(2),
          newBalanceAmount: newBalanceAmount.toFixed(2),
          status: newStatus, invoiceId,
        },
        transaction: t,
      }
    );

    // Post cash/bank to AR accounting entry
    if (invoice.journal_entry_id && invoice.fiscal_year_id) {
      const cashAccountCode = paymentMode === 'CASH' ? DEFAULT_ACCOUNTS.CASH : DEFAULT_ACCOUNTS.BANK;

      // Credit/insurance invoices are posted against AR_INSURANCE; self-pay against AR_PATIENT.
      // Using the wrong code here causes billing to show "paid" while GL/AR diverge.
      const arCode = invoice.is_credit_bill ? DEFAULT_ACCOUNTS.AR_INSURANCE : DEFAULT_ACCOUNTS.AR_PATIENT;

      const [arAccountId, cashAccountId] = await Promise.all([
        sequelize.query(`SELECT id FROM accounts WHERE code = :code AND tenant_id = :tenantId`,
          { replacements: { code: arCode, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t })
          .then(([r]) => r?.id),
        sequelize.query(`SELECT id FROM accounts WHERE code = :code AND tenant_id = :tenantId`,
          { replacements: { code: cashAccountCode, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t })
          .then(([r]) => r?.id),
      ]);

      if (!arAccountId) {
        throw Object.assign(
          new Error(`AR account '${arCode}' not found in Chart of Accounts. Configure it before receiving payments.`),
          { statusCode: 422 }
        );
      }
      if (!cashAccountId) {
        throw Object.assign(
          new Error(`${paymentMode === 'CASH' ? 'Cash' : 'Bank'} account '${cashAccountCode}' not found in Chart of Accounts.`),
          { statusCode: 422 }
        );
      }

      await accountingEngine.postJournalEntry({
        tenantId,
        voucherType: 'RECEIPT',
        date: new Date(),
        fiscalYearId: invoice.fiscal_year_id,
        narration: `Payment received: ${invoice.invoice_number} - ${invoice.patient_name}`,
        reference: referenceNumber || invoice.invoice_number,
        sourceModule: 'patient-billing',
        sourceId: paymentId,
        postedBy: receivedBy,
        lines: [
          { accountId: cashAccountId, debit: paymentAmount.toFixed(2), credit: 0 },
          { accountId: arAccountId,   debit: 0, credit: paymentAmount.toFixed(2) },
        ],
        fundType: 'LOCAL',
        postingEvent: 'RECEIPT_POSTED',
        postingExplanation: {
          rule: 'Patient payment receipt: DR Cash/Bank / CR Accounts Receivable',
          module: 'patient-billing',
        },
        transaction: t,
      });
    }

    eventBus.publish(EVENT_TYPES.BILLING.INVOICE_PAYMENT_RECEIVED, {
      invoiceId, paymentId, tenantId, amount, paymentMode, invoiceStatus: newStatus,
    });

    return { paymentId, invoiceStatus: newStatus, paidAmount: newPaidAmount.toFixed(2), balance: newBalanceAmount.toFixed(2) };
  });

  try {
    await invalidateTag(`financial-reports:${tenantId}`);
  } catch (cacheErr) {
    logger.warn('Report cache invalidation failed; reports may be stale up to 5 min', {
      tenantId, error: cacheErr.message,
    });
  }

  return result;
}

module.exports = {
  createInvoice,
  finalizeInvoice,
  receivePayment,
  calculateInvoiceTotals,
};
