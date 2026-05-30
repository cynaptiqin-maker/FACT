'use strict';

const Decimal = require('decimal.js');
const { sequelize } = require('../../../config/database');
const { calculateGSTSummary } = require('../../../shared/utils/taxCalculator');

/**
 * GST Service
 * GSTR-1 and GSTR-3B report generation for hospital.
 *
 * Hospital GST applicability:
 *   - Healthcare services: EXEMPT (Nil rated)
 *   - Pharmacy sales: 12% GST (medicines)
 *   - Implants/devices: 5-12% GST
 *   - Room charges (>5000/day): 18% GST
 *   - Cafeteria/canteen: 5% GST
 */

/**
 * Generate GSTR-1 report (Outward supplies).
 * Filed by 11th of following month.
 */
async function generateGSTR1(tenantId, { year, month, gstin }) {
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const toDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day

  // Get all finalized GST invoices
  const invoices = await sequelize.query(
    `SELECT pi.invoice_number, pi.invoice_date, pi.patient_name, pi.gstin_patient,
            pi.taxable_amount, pi.cgst_amount, pi.sgst_amount, pi.igst_amount, pi.total_tax,
            pi.net_amount, pi.is_interstate, pi.place_of_supply, pi.billing_type
     FROM patient_invoices pi
     WHERE pi.tenant_id = :tenantId
       AND pi.status IN ('FINALIZED', 'PAID', 'PARTIALLY_PAID')
       AND pi.invoice_date >= :fromDate AND pi.invoice_date <= :toDate
       AND (pi.cgst_amount > 0 OR pi.sgst_amount > 0 OR pi.igst_amount > 0)
     ORDER BY pi.invoice_date`,
    { replacements: { tenantId, fromDate, toDate }, type: sequelize.QueryTypes.SELECT }
  );

  // Categorize by HSN and rate
  const hsnSummary = {};
  let totalTaxableValue = new Decimal(0);
  let totalCGST = new Decimal(0);
  let totalSGST = new Decimal(0);
  let totalIGST = new Decimal(0);

  for (const inv of invoices) {
    totalTaxableValue = totalTaxableValue.plus(inv.taxable_amount || 0);
    totalCGST = totalCGST.plus(inv.cgst_amount || 0);
    totalSGST = totalSGST.plus(inv.sgst_amount || 0);
    totalIGST = totalIGST.plus(inv.igst_amount || 0);

    // HSN grouping by billing type (hospital specific)
    const hsnMap = {
      PHARMACY: { hsn: '3004', description: 'Medicaments' },
      LAB: { hsn: '9961', description: 'Lab services' },
      RADIOLOGY: { hsn: '9961', description: 'Radiology services' },
      IP: { hsn: '9993', description: 'Healthcare services' },
      OP: { hsn: '9993', description: 'Healthcare services' },
    };

    const hsnInfo = hsnMap[inv.billing_type] || { hsn: '9993', description: 'Healthcare services' };
    if (!hsnSummary[hsnInfo.hsn]) {
      hsnSummary[hsnInfo.hsn] = {
        hsn: hsnInfo.hsn,
        description: hsnInfo.description,
        taxableValue: new Decimal(0),
        cgst: new Decimal(0), sgst: new Decimal(0), igst: new Decimal(0),
        invoiceCount: 0,
      };
    }
    hsnSummary[hsnInfo.hsn].taxableValue = hsnSummary[hsnInfo.hsn].taxableValue.plus(inv.taxable_amount || 0);
    hsnSummary[hsnInfo.hsn].cgst = hsnSummary[hsnInfo.hsn].cgst.plus(inv.cgst_amount || 0);
    hsnSummary[hsnInfo.hsn].sgst = hsnSummary[hsnInfo.hsn].sgst.plus(inv.sgst_amount || 0);
    hsnSummary[hsnInfo.hsn].igst = hsnSummary[hsnInfo.hsn].igst.plus(inv.igst_amount || 0);
    hsnSummary[hsnInfo.hsn].invoiceCount++;
  }

  return {
    gstin,
    returnPeriod: `${year}${String(month).padStart(2, '0')}`,
    generatedAt: new Date().toISOString(),
    b2c: invoices.filter((i) => !i.gstin_patient).map((i) => ({
      invoiceNumber: i.invoice_number,
      invoiceDate: i.invoice_date,
      taxableValue: i.taxable_amount,
      cgst: i.cgst_amount,
      sgst: i.sgst_amount,
      igst: i.igst_amount,
      placeOfSupply: i.place_of_supply,
    })),
    b2b: invoices.filter((i) => i.gstin_patient).map((i) => ({
      receiverGstin: i.gstin_patient,
      receiverName: i.patient_name,
      invoiceNumber: i.invoice_number,
      invoiceDate: i.invoice_date,
      taxableValue: i.taxable_amount,
      cgst: i.cgst_amount,
      sgst: i.sgst_amount,
      igst: i.igst_amount,
    })),
    hsnSummary: Object.values(hsnSummary).map((h) => ({
      hsn: h.hsn,
      description: h.description,
      taxableValue: h.taxableValue.toFixed(2),
      cgst: h.cgst.toFixed(2),
      sgst: h.sgst.toFixed(2),
      igst: h.igst.toFixed(2),
      invoiceCount: h.invoiceCount,
    })),
    totals: {
      taxableValue: totalTaxableValue.toFixed(2),
      cgst: totalCGST.toFixed(2),
      sgst: totalSGST.toFixed(2),
      igst: totalIGST.toFixed(2),
      totalTax: totalCGST.plus(totalSGST).plus(totalIGST).toFixed(2),
      invoiceCount: invoices.length,
    },
  };
}

/**
 * Generate GSTR-3B (Monthly summary return).
 * Filed by 20th of following month.
 */
async function generateGSTR3B(tenantId, { year, month, gstin }) {
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const toDate = new Date(year, month, 0).toISOString().split('T')[0];

  // Outward supplies
  const [outward] = await sequelize.query(
    `SELECT
       SUM(taxable_amount) as taxable_value,
       SUM(cgst_amount) as cgst, SUM(sgst_amount) as sgst, SUM(igst_amount) as igst,
       SUM(CASE WHEN is_interstate = false THEN taxable_amount ELSE 0 END) as intra_taxable,
       SUM(CASE WHEN is_interstate = true THEN taxable_amount ELSE 0 END) as inter_taxable
     FROM patient_invoices
     WHERE tenant_id = :tenantId
       AND status IN ('FINALIZED', 'PAID', 'PARTIALLY_PAID')
       AND invoice_date >= :fromDate AND invoice_date <= :toDate`,
    { replacements: { tenantId, fromDate, toDate }, type: sequelize.QueryTypes.SELECT }
  );

  // Input tax credit (from vendor invoices)
  const [inputTax] = await sequelize.query(
    `SELECT
       SUM(cgst_amount) as cgst, SUM(sgst_amount) as sgst, SUM(igst_amount) as igst
     FROM vendor_invoices
     WHERE tenant_id = :tenantId
       AND status = 'APPROVED'
       AND invoice_date >= :fromDate AND invoice_date <= :toDate`,
    { replacements: { tenantId, fromDate, toDate }, type: sequelize.QueryTypes.SELECT }
  );

  const outputCGST = new Decimal(outward.cgst || 0);
  const outputSGST = new Decimal(outward.sgst || 0);
  const outputIGST = new Decimal(outward.igst || 0);
  const inputCGST = new Decimal(inputTax?.cgst || 0);
  const inputSGST = new Decimal(inputTax?.sgst || 0);
  const inputIGST = new Decimal(inputTax?.igst || 0);

  const netCGST = outputCGST.minus(inputCGST);
  const netSGST = outputSGST.minus(inputSGST);
  const netIGST = outputIGST.minus(inputIGST);
  const totalNetTax = netCGST.plus(netSGST).plus(netIGST);

  return {
    gstin,
    returnPeriod: `${year}${String(month).padStart(2, '0')}`,
    taxableOutward: {
      taxableValue: new Decimal(outward.taxable_value || 0).toFixed(2),
      cgst: outputCGST.toFixed(2),
      sgst: outputSGST.toFixed(2),
      igst: outputIGST.toFixed(2),
      totalTax: outputCGST.plus(outputSGST).plus(outputIGST).toFixed(2),
    },
    inputTaxCredit: {
      cgst: inputCGST.toFixed(2),
      sgst: inputSGST.toFixed(2),
      igst: inputIGST.toFixed(2),
      total: inputCGST.plus(inputSGST).plus(inputIGST).toFixed(2),
    },
    taxPayable: {
      cgst: netCGST.isNegative() ? '0.00' : netCGST.toFixed(2),
      sgst: netSGST.isNegative() ? '0.00' : netSGST.toFixed(2),
      igst: netIGST.isNegative() ? '0.00' : netIGST.toFixed(2),
      total: totalNetTax.isNegative() ? '0.00' : totalNetTax.toFixed(2),
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate TDS payable for a period.
 */
async function getTDSSummary(tenantId, { year, month }) {
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const toDate = new Date(year, month, 0).toISOString().split('T')[0];

  const sections = await sequelize.query(
    `SELECT
       tds_section,
       SUM(payment_amount) as total_payment,
       SUM(tds_amount) as total_tds,
       COUNT(*) as transaction_count
     FROM tds_deductions
     WHERE tenant_id = :tenantId
       AND deduction_date >= :fromDate AND deduction_date <= :toDate
     GROUP BY tds_section
     ORDER BY tds_section`,
    { replacements: { tenantId, fromDate, toDate }, type: sequelize.QueryTypes.SELECT }
  );

  const totalTDS = sections.reduce((sum, s) => sum.plus(new Decimal(s.total_tds || 0)), new Decimal(0));

  return {
    period: `${year}-${String(month).padStart(2, '0')}`,
    sections: sections.map((s) => ({
      section: s.tds_section,
      paymentAmount: parseFloat(s.total_payment || 0).toFixed(2),
      tdsAmount: parseFloat(s.total_tds || 0).toFixed(2),
      transactionCount: parseInt(s.transaction_count || 0),
    })),
    totalTDSPayable: totalTDS.toFixed(2),
    dueDate: `7th of ${new Date(year, month).toLocaleString('default', { month: 'long' })} ${month > 11 ? year + 1 : year}`,
    generatedAt: new Date().toISOString(),
  };
}

module.exports = {
  generateGSTR1,
  generateGSTR3B,
  getTDSSummary,
};
