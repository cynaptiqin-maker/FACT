'use strict';

const Decimal = require('decimal.js');
const { toDecimal, percentage, round, add } = require('./currency');

/**
 * FACT Tax Calculator
 * Handles GST (CGST/SGST/IGST), TDS, TCS calculations.
 * All rates are configurable via the database (tax_rules table).
 */

// ─── GST Rate Slabs ──────────────────────────────────────────────────────────
const GST_RATES = {
  EXEMPT: 0,
  RATE_0: 0,
  RATE_5: 5,
  RATE_12: 12,
  RATE_18: 18,
  RATE_28: 28,
};

// GST Treatment types
const GST_TREATMENT = {
  INTRA_STATE: 'INTRA_STATE',   // CGST + SGST
  INTER_STATE: 'INTER_STATE',   // IGST
  EXEMPT: 'EXEMPT',
  ZERO_RATED: 'ZERO_RATED',
  COMPOSITION: 'COMPOSITION',
};

// TDS Sections (Indian IT Act)
const TDS_SECTIONS = {
  '192': { name: 'Salary', rate: null, threshold: 250000 }, // Slab-based
  '194A': { name: 'Interest (non-bank)', rate: 10, threshold: 40000 },
  '194B': { name: 'Lottery/Game', rate: 30, threshold: 10000 },
  '194C': { name: 'Contractor', rate: 1, rateCompany: 2, threshold: 30000, annualThreshold: 100000 },
  '194D': { name: 'Insurance Commission', rate: 5, threshold: 15000 },
  '194H': { name: 'Commission/Brokerage', rate: 5, threshold: 15000 },
  '194I': { name: 'Rent', rate: 10, rateOther: 2, threshold: 240000 },
  '194J': { name: 'Professional/Technical Services', rate: 10, rateTechnical: 2, threshold: 30000 },
  '194Q': { name: 'Purchase of goods', rate: 0.1, threshold: 5000000 },
};

/**
 * Calculate GST on an amount.
 *
 * @param {number|string|Decimal} amount - Base amount (exclusive of GST)
 * @param {number} gstRate - GST rate (5, 12, 18, 28)
 * @param {string} treatment - INTRA_STATE | INTER_STATE
 * @returns {Object} GST breakdown
 */
function calculateGST(amount, gstRate, treatment = GST_TREATMENT.INTRA_STATE) {
  const base = toDecimal(amount);
  const rate = toDecimal(gstRate);

  if (rate.isZero() || treatment === GST_TREATMENT.EXEMPT) {
    return {
      base: base.toFixed(2),
      gstRate: 0,
      cgst: '0.00',
      sgst: '0.00',
      igst: '0.00',
      totalGST: '0.00',
      totalWithGST: base.toFixed(2),
      treatment,
    };
  }

  const totalGST = percentage(base, rate);

  let cgst = new Decimal(0);
  let sgst = new Decimal(0);
  let igst = new Decimal(0);

  if (treatment === GST_TREATMENT.INTRA_STATE) {
    // CGST = SGST = GST Rate / 2
    cgst = percentage(base, rate.dividedBy(2));
    sgst = totalGST.minus(cgst); // Ensure CGST + SGST = totalGST (handle rounding)
  } else if (treatment === GST_TREATMENT.INTER_STATE) {
    igst = totalGST;
  }

  return {
    base: base.toFixed(2),
    gstRate: gstRate,
    cgst: cgst.toFixed(2),
    sgst: sgst.toFixed(2),
    igst: igst.toFixed(2),
    totalGST: totalGST.toFixed(2),
    totalWithGST: base.plus(totalGST).toFixed(2),
    treatment,
  };
}

/**
 * Calculate GST on an amount inclusive of GST (reverse calculation).
 */
function calculateGSTInclusive(totalAmount, gstRate, treatment = GST_TREATMENT.INTRA_STATE) {
  const total = toDecimal(totalAmount);
  const rate = toDecimal(gstRate);

  if (rate.isZero()) {
    return calculateGST(total, 0, treatment);
  }

  // Base = Total / (1 + rate/100)
  const divisor = new Decimal(1).plus(rate.dividedBy(100));
  const base = total.dividedBy(divisor);

  return calculateGST(base, gstRate, treatment);
}

/**
 * Calculate GST for multiple line items with different rates.
 *
 * @param {Array} items - [{ amount, gstRate, treatment, description }]
 * @returns {Object} Consolidated GST summary
 */
function calculateGSTSummary(items) {
  let totalBase = new Decimal(0);
  let totalCGST = new Decimal(0);
  let totalSGST = new Decimal(0);
  let totalIGST = new Decimal(0);

  const ratewiseBreakdown = {};

  for (const item of items) {
    const gst = calculateGST(item.amount, item.gstRate || 0, item.treatment);

    totalBase = totalBase.plus(toDecimal(gst.base));
    totalCGST = totalCGST.plus(toDecimal(gst.cgst));
    totalSGST = totalSGST.plus(toDecimal(gst.sgst));
    totalIGST = totalIGST.plus(toDecimal(gst.igst));

    // Group by rate
    const rateKey = `${item.gstRate || 0}%`;
    if (!ratewiseBreakdown[rateKey]) {
      ratewiseBreakdown[rateKey] = {
        rate: item.gstRate || 0,
        taxableAmount: new Decimal(0),
        cgst: new Decimal(0),
        sgst: new Decimal(0),
        igst: new Decimal(0),
      };
    }
    ratewiseBreakdown[rateKey].taxableAmount = ratewiseBreakdown[rateKey].taxableAmount.plus(toDecimal(gst.base));
    ratewiseBreakdown[rateKey].cgst = ratewiseBreakdown[rateKey].cgst.plus(toDecimal(gst.cgst));
    ratewiseBreakdown[rateKey].sgst = ratewiseBreakdown[rateKey].sgst.plus(toDecimal(gst.sgst));
    ratewiseBreakdown[rateKey].igst = ratewiseBreakdown[rateKey].igst.plus(toDecimal(gst.igst));
  }

  const totalGST = totalCGST.plus(totalSGST).plus(totalIGST);
  const totalWithGST = totalBase.plus(totalGST);

  return {
    totalBase: totalBase.toFixed(2),
    totalCGST: totalCGST.toFixed(2),
    totalSGST: totalSGST.toFixed(2),
    totalIGST: totalIGST.toFixed(2),
    totalGST: totalGST.toFixed(2),
    totalWithGST: totalWithGST.toFixed(2),
    ratewiseBreakdown: Object.values(ratewiseBreakdown).map((rb) => ({
      rate: rb.rate,
      taxableAmount: rb.taxableAmount.toFixed(2),
      cgst: rb.cgst.toFixed(2),
      sgst: rb.sgst.toFixed(2),
      igst: rb.igst.toFixed(2),
    })),
  };
}

/**
 * Calculate TDS on a payment.
 *
 * @param {Object} params
 * @param {string} params.section - TDS section (e.g., '194J')
 * @param {number|string} params.amount - Payment amount
 * @param {boolean} [params.isCompany=false] - Is payee a company?
 * @param {boolean} [params.hasPAN=true] - Does payee have PAN?
 * @param {number} [params.customRate] - Override rate
 * @returns {Object} TDS calculation
 */
function calculateTDS({ section, amount, isCompany = false, hasPAN = true, customRate }) {
  const paymentAmount = toDecimal(amount);
  const sectionConfig = TDS_SECTIONS[section];

  if (!sectionConfig) {
    return {
      section,
      amount: paymentAmount.toFixed(2),
      tdsRate: 0,
      tdsAmount: '0.00',
      netPayable: paymentAmount.toFixed(2),
      applicable: false,
      reason: `Unknown TDS section: ${section}`,
    };
  }

  // Determine applicable rate
  let rate = customRate !== undefined ? customRate : sectionConfig.rate;

  // Higher rate for company in some sections
  if (isCompany && sectionConfig.rateCompany !== undefined) {
    rate = sectionConfig.rateCompany;
  }

  // No PAN: 20% or double the rate (whichever is higher) - Section 206AA
  if (!hasPAN) {
    rate = Math.max(20, rate * 2);
  }

  const tdsRate = toDecimal(rate || 0);
  const tdsAmount = percentage(paymentAmount, tdsRate);
  const netPayable = paymentAmount.minus(tdsAmount);

  return {
    section,
    sectionName: sectionConfig.name,
    amount: paymentAmount.toFixed(2),
    tdsRate: tdsRate.toFixed(2),
    tdsAmount: tdsAmount.toFixed(2),
    netPayable: netPayable.toFixed(2),
    hasPAN,
    isCompany,
    applicable: true,
    threshold: sectionConfig.threshold,
    applicable_rate_note: hasPAN ? `Rate: ${rate}%` : `No PAN rate: ${rate}%`,
  };
}

/**
 * Calculate professional tax (PT) - state-specific slabs.
 * Default slabs for Karnataka.
 */
function calculateProfessionalTax(monthlySalary) {
  const salary = toDecimal(monthlySalary);

  // Karnataka PT slabs (monthly)
  const slabs = [
    { upTo: 14999, pt: 0 },
    { upTo: 29999, pt: 150 },
    { upTo: Infinity, pt: 200 },
  ];

  let ptAmount = new Decimal(0);
  for (const slab of slabs) {
    if (salary.lessThanOrEqualTo(slab.upTo)) {
      ptAmount = new Decimal(slab.pt);
      break;
    }
  }

  return {
    monthlySalary: salary.toFixed(2),
    ptAmount: ptAmount.toFixed(2),
    annualPT: ptAmount.times(12).toFixed(2),
  };
}

/**
 * Calculate PF (Provident Fund).
 */
function calculatePF(basicSalary, options = {}) {
  const {
    employeeRate = 12,    // 12% of basic
    employerRate = 12,   // 12% of basic (3.67% EPF + 8.33% EPS)
    ceiling = 15000,     // PF calculated on max ₹15,000 basic
  } = options;

  const basic = toDecimal(basicSalary);
  const pfBasic = basic.lessThan(ceiling) ? basic : toDecimal(ceiling);

  const employeeContribution = percentage(pfBasic, employeeRate).toDecimalPlaces(0);
  const employerEPF = percentage(pfBasic, 3.67).toDecimalPlaces(0);
  const employerEPS = percentage(pfBasic, 8.33).toDecimalPlaces(0);
  const totalEmployer = percentage(pfBasic, employerRate).toDecimalPlaces(0);

  return {
    basicSalary: basic.toFixed(2),
    pfBasic: pfBasic.toFixed(2),
    employeeContribution: employeeContribution.toFixed(2),
    employerContribution: {
      total: totalEmployer.toFixed(2),
      epf: employerEPF.toFixed(2),
      eps: employerEPS.toFixed(2),
    },
    totalPF: employeeContribution.plus(totalEmployer).toFixed(2),
  };
}

/**
 * Calculate ESI (Employee State Insurance).
 */
function calculateESI(grossSalary, options = {}) {
  const {
    employeeRate = 0.75,  // 0.75% of gross
    employerRate = 3.25,  // 3.25% of gross
    threshold = 21000,    // ESI applicable if gross <= 21,000
  } = options;

  const gross = toDecimal(grossSalary);

  if (gross.greaterThan(threshold)) {
    return {
      grossSalary: gross.toFixed(2),
      applicable: false,
      reason: `Gross salary exceeds ESI threshold of ₹${threshold}`,
      employeeContribution: '0.00',
      employerContribution: '0.00',
      total: '0.00',
    };
  }

  const employeeContribution = percentage(gross, employeeRate).toDecimalPlaces(2);
  const employerContribution = percentage(gross, employerRate).toDecimalPlaces(2);

  return {
    grossSalary: gross.toFixed(2),
    applicable: true,
    employeeRate: `${employeeRate}%`,
    employerRate: `${employerRate}%`,
    employeeContribution: employeeContribution.toFixed(2),
    employerContribution: employerContribution.toFixed(2),
    total: employeeContribution.plus(employerContribution).toFixed(2),
  };
}

module.exports = {
  calculateGST,
  calculateGSTInclusive,
  calculateGSTSummary,
  calculateTDS,
  calculateProfessionalTax,
  calculatePF,
  calculateESI,
  GST_RATES,
  GST_TREATMENT,
  TDS_SECTIONS,
};
