'use strict';

const Decimal = require('decimal.js');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../../config/database');
const accountingEngine = require('../../../shared/accounting-engine');
const { calculatePF, calculateESI, calculateProfessionalTax, calculateTDS } = require('../../../shared/utils/taxCalculator');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');

/**
 * Payroll Service
 *
 * Payroll Accounting on posting:
 *   DR  Salary Expense                        100,000
 *   DR  PF Expense (Employer)                  12,000
 *   DR  ESI Expense (Employer)                  3,250
 *       CR  Salary Payable                      84,750
 *       CR  PF Payable - Employee               12,000
 *       CR  PF Payable - Employer               12,000
 *       CR  ESI Payable - Employee               7,500  (0.75%)
 *       CR  ESI Payable - Employer               3,250  (3.25%)
 *       CR  PT Payable                           2,400
 *       CR  TDS Payable                         10,000
 */

const PAYROLL_ACCOUNTS = {
  SALARY_EXPENSE: '5001',
  PF_EXPENSE_EMPLOYER: '5010',
  ESI_EXPENSE_EMPLOYER: '5011',
  SALARY_PAYABLE: '2300',
  PF_PAYABLE_EMPLOYEE: '2310',
  PF_PAYABLE_EMPLOYER: '2311',
  ESI_PAYABLE_EMPLOYEE: '2312',
  ESI_PAYABLE_EMPLOYER: '2313',
  PT_PAYABLE: '2320',
  TDS_PAYABLE: '2330',
  ADVANCE_SALARY: '1200',
};

/**
 * Calculate salary components for an employee for a month.
 */
function calculateEmployeeSalary(employee, attendance, salaryStructure) {
  const { basic, hra, specialAllowance, lta, medicalAllowance, otherAllowances } =
    salaryStructure.components || {};

  const totalWorkingDays = attendance.totalWorkingDays || 26;
  const presentDays = attendance.presentDays || 26;

  // Pro-rata for attendance
  const attendanceRatio = new Decimal(presentDays).dividedBy(totalWorkingDays);

  const proRataBasic = new Decimal(basic || 0).times(attendanceRatio);
  const proRataHRA = new Decimal(hra || 0).times(attendanceRatio);
  const proRataSpecial = new Decimal(specialAllowance || 0).times(attendanceRatio);
  const proRataLTA = new Decimal(lta || 0).times(attendanceRatio);
  const proRataMedical = new Decimal(medicalAllowance || 0).times(attendanceRatio);
  const proRataOther = new Decimal(otherAllowances || 0).times(attendanceRatio);

  const grossEarnings = proRataBasic
    .plus(proRataHRA)
    .plus(proRataSpecial)
    .plus(proRataLTA)
    .plus(proRataMedical)
    .plus(proRataOther);

  // Calculate deductions
  const pfCalc = calculatePF(proRataBasic);
  const esiCalc = calculateESI(grossEarnings);
  const ptCalc = calculateProfessionalTax(grossEarnings);

  // TDS (simplified — actual requires annual projection)
  const annualGross = grossEarnings.times(12);
  const standardDeduction = new Decimal(50000);
  const annualTaxable = annualGross.minus(standardDeduction).minus(new Decimal(pfCalc.employeeContribution).times(12));
  const estimatedAnnualTDS = calculateAnnualTDS(annualTaxable);
  const monthlyTDS = estimatedAnnualTDS.dividedBy(12).toDecimalPlaces(0);

  const totalDeductions = new Decimal(pfCalc.employeeContribution)
    .plus(esiCalc.applicable ? esiCalc.employeeContribution : 0)
    .plus(ptCalc.ptAmount)
    .plus(monthlyTDS)
    .plus(attendance.loanDeduction || 0)
    .plus(attendance.advanceDeduction || 0);

  const netPayable = grossEarnings.minus(totalDeductions);

  return {
    components: {
      basic: proRataBasic.toFixed(2),
      hra: proRataHRA.toFixed(2),
      specialAllowance: proRataSpecial.toFixed(2),
      lta: proRataLTA.toFixed(2),
      medicalAllowance: proRataMedical.toFixed(2),
      otherAllowances: proRataOther.toFixed(2),
      grossEarnings: grossEarnings.toFixed(2),
    },
    deductions: {
      pfEmployee: pfCalc.employeeContribution,
      esiEmployee: esiCalc.applicable ? esiCalc.employeeContribution : '0.00',
      professionalTax: ptCalc.ptAmount,
      tds: monthlyTDS.toFixed(2),
      loanDeduction: new Decimal(attendance.loanDeduction || 0).toFixed(2),
      advanceDeduction: new Decimal(attendance.advanceDeduction || 0).toFixed(2),
      totalDeductions: totalDeductions.toFixed(2),
    },
    employerContributions: {
      pfEmployer: pfCalc.employerContribution.total,
      esiEmployer: esiCalc.applicable ? esiCalc.employerContribution : '0.00',
    },
    netPayable: netPayable.toFixed(2),
    attendance: { presentDays, totalWorkingDays, attendancePercent: attendanceRatio.times(100).toFixed(1) },
  };
}

/**
 * Simplified annual TDS calculation (Income Tax).
 * Actual implementation requires proper IT slab computation.
 */
function calculateAnnualTDS(annualTaxable) {
  const taxable = new Decimal(annualTaxable);

  if (taxable.lessThanOrEqualTo(250000)) return new Decimal(0);
  if (taxable.lessThanOrEqualTo(500000)) return taxable.minus(250000).times(0.05);
  if (taxable.lessThanOrEqualTo(1000000)) {
    return new Decimal(12500).plus(taxable.minus(500000).times(0.20));
  }
  return new Decimal(112500).plus(taxable.minus(1000000).times(0.30));
}

/**
 * Run payroll for a month.
 */
async function runPayroll({ tenantId, year, month, fiscalYearId, initiatedBy }) {
  // Check if already run
  const [existingRun] = await sequelize.query(
    `SELECT id FROM payroll_runs WHERE tenant_id = :tenantId AND year = :year AND month = :month`,
    { replacements: { tenantId, year, month }, type: sequelize.QueryTypes.SELECT }
  );

  if (existingRun) throw Object.assign(new Error(`Payroll already run for ${year}-${month}`), { statusCode: 409 });

  const runId = uuidv4();

  // Get all active employees with salary structures
  const employees = await sequelize.query(
    `SELECT e.*, ss.*
     FROM employees e
     LEFT JOIN salary_structures ss ON ss.employee_id = e.id AND ss.is_active = true
     WHERE e.tenant_id = :tenantId AND e.is_active = true`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  await sequelize.query(
    `INSERT INTO payroll_runs (id, tenant_id, year, month, status, total_employees,
     initiated_by, fiscal_year_id, created_at, updated_at)
     VALUES (:id, :tenantId, :year, :month, 'PROCESSING', :totalEmployees,
     :initiatedBy, :fiscalYearId, NOW(), NOW())`,
    { replacements: { id: runId, tenantId, year, month, totalEmployees: employees.length, initiatedBy, fiscalYearId } }
  );

  let totalGross = new Decimal(0);
  let totalDeductions = new Decimal(0);
  let totalNetPayable = new Decimal(0);
  let totalPFExpense = new Decimal(0);
  let totalESIExpense = new Decimal(0);

  const payslips = [];

  const defaultAttendance = { presentDays: 26, totalWorkingDays: 26, loanDeduction: 0, advanceDeduction: 0 };

  for (const emp of employees) {
    const calc = calculateEmployeeSalary(
      emp,
      defaultAttendance,
      emp
    );

    const payslipId = uuidv4();
    await sequelize.query(
      `INSERT INTO payslips (id, tenant_id, payroll_run_id, employee_id, year, month,
       gross_earnings, total_deductions, net_payable,
       pf_employee, esi_employee, professional_tax, tds,
       pf_employer, esi_employer, components, created_at, updated_at)
       VALUES (:id, :tenantId, :runId, :employeeId, :year, :month,
       :grossEarnings, :totalDeductions, :netPayable,
       :pfEmployee, :esiEmployee, :professionalTax, :tds,
       :pfEmployer, :esiEmployer, :components, NOW(), NOW())`,
      {
        replacements: {
          id: payslipId, tenantId, runId, employeeId: emp.id, year, month,
          grossEarnings: calc.components.grossEarnings,
          totalDeductions: calc.deductions.totalDeductions,
          netPayable: calc.netPayable,
          pfEmployee: calc.deductions.pfEmployee,
          esiEmployee: calc.deductions.esiEmployee,
          professionalTax: calc.deductions.professionalTax,
          tds: calc.deductions.tds,
          pfEmployer: calc.employerContributions.pfEmployer,
          esiEmployer: calc.employerContributions.esiEmployer,
          components: JSON.stringify(calc),
        },
      }
    );

    totalGross = totalGross.plus(calc.components.grossEarnings);
    totalDeductions = totalDeductions.plus(calc.deductions.totalDeductions);
    totalNetPayable = totalNetPayable.plus(calc.netPayable);
    totalPFExpense = totalPFExpense.plus(calc.employerContributions.pfEmployer);
    totalESIExpense = totalESIExpense.plus(calc.employerContributions.esiEmployer);
    payslips.push({ payslipId, employeeId: emp.id, netPayable: calc.netPayable });
  }

  // Update run totals
  await sequelize.query(
    `UPDATE payroll_runs SET
     total_gross = :totalGross, total_deductions = :totalDeductions, total_net = :totalNetPayable,
     total_pf_expense = :totalPFExpense, total_esi_expense = :totalESIExpense,
     status = 'CALCULATED', updated_at = NOW()
     WHERE id = :runId`,
    {
      replacements: {
        totalGross: totalGross.toFixed(2), totalDeductions: totalDeductions.toFixed(2),
        totalNetPayable: totalNetPayable.toFixed(2), totalPFExpense: totalPFExpense.toFixed(2),
        totalESIExpense: totalESIExpense.toFixed(2), runId,
      },
    }
  );

  eventBus.publish(EVENT_TYPES.PAYROLL.PAYROLL_CALCULATED, {
    runId, tenantId, year, month,
    totalGross: totalGross.toFixed(2), employeeCount: employees.length,
  });

  return {
    runId, year, month, employeeCount: employees.length,
    totalGross: totalGross.toFixed(2),
    totalNetPayable: totalNetPayable.toFixed(2),
    totalDeductions: totalDeductions.toFixed(2),
    payslips,
  };
}

/**
 * Post payroll to accounting after approval.
 */
async function postPayrollToAccounting(runId, tenantId, fiscalYearId, postedBy) {
  const [run] = await sequelize.query(
    `SELECT * FROM payroll_runs WHERE id = :runId AND tenant_id = :tenantId AND status = 'APPROVED'`,
    { replacements: { runId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!run) throw Object.assign(new Error('Payroll run not found or not approved'), { statusCode: 404 });

  return sequelize.transaction(async (t) => {
    // Get account IDs
    const getAccountId = async (code) => {
      const [acc] = await sequelize.query(
        `SELECT id FROM accounts WHERE code = :code AND tenant_id = :tenantId`,
        { replacements: { code, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
      );
      return acc?.id;
    };

    const accountIds = {};
    for (const [key, code] of Object.entries(PAYROLL_ACCOUNTS)) {
      accountIds[key] = await getAccountId(code);
    }

    const runDate = new Date(run.year, run.month - 1, 28);

    // Aggregate deductions from payslips for balanced double-entry
    const [payslipTotals] = await sequelize.query(
      `SELECT COALESCE(SUM(pf_employee),0)       AS total_pf_employee,
              COALESCE(SUM(esi_employee),0)      AS total_esi_employee,
              COALESCE(SUM(professional_tax),0)  AS total_pt,
              COALESCE(SUM(tds),0)               AS total_tds,
              COALESCE(SUM(pf_employer),0)       AS total_pf_employer,
              COALESCE(SUM(esi_employer),0)      AS total_esi_employer
       FROM payslips WHERE payroll_run_id = :runId AND tenant_id = :tenantId`,
      { replacements: { runId, tenantId }, type: sequelize.QueryTypes.SELECT, transaction: t }
    );

    const lines = [
      { accountId: accountIds.SALARY_EXPENSE,       debit: run.total_gross,                      credit: 0,                                  narration: 'Gross Salary' },
      { accountId: accountIds.PF_EXPENSE_EMPLOYER,  debit: run.total_pf_expense,                 credit: 0,                                  narration: 'PF Expense - Employer' },
      { accountId: accountIds.ESI_EXPENSE_EMPLOYER, debit: run.total_esi_expense,                credit: 0,                                  narration: 'ESI Expense - Employer' },
      { accountId: accountIds.SALARY_PAYABLE,        debit: 0, credit: run.total_net,             narration: 'Net Salary Payable' },
      { accountId: accountIds.PF_PAYABLE_EMPLOYEE,   debit: 0, credit: payslipTotals.total_pf_employee,  narration: 'PF - Employee Contribution' },
      { accountId: accountIds.PF_PAYABLE_EMPLOYER,   debit: 0, credit: payslipTotals.total_pf_employer,  narration: 'PF - Employer Contribution' },
      { accountId: accountIds.ESI_PAYABLE_EMPLOYEE,  debit: 0, credit: payslipTotals.total_esi_employee, narration: 'ESI - Employee Contribution' },
      { accountId: accountIds.ESI_PAYABLE_EMPLOYER,  debit: 0, credit: payslipTotals.total_esi_employer, narration: 'ESI - Employer Contribution' },
      { accountId: accountIds.PT_PAYABLE,             debit: 0, credit: payslipTotals.total_pt,           narration: 'Professional Tax Payable' },
      { accountId: accountIds.TDS_PAYABLE,            debit: 0, credit: payslipTotals.total_tds,          narration: 'TDS Payable' },
    ].filter((l) => l.accountId && (parseFloat(l.debit || 0) > 0 || parseFloat(l.credit || 0) > 0));

    const { journalEntryId, entryNumber } = await accountingEngine.postJournalEntry({
      tenantId,
      voucherType: 'JOURNAL',
      date: runDate,
      fiscalYearId,
      narration: `Payroll: ${run.year}-${String(run.month).padStart(2, '0')}`,
      reference: `PAYROLL-${run.year}-${String(run.month).padStart(2, '0')}`,
      sourceModule: 'payroll',
      sourceId: runId,
      postedBy,
      lines,
      fundType: 'LOCAL',
      postingEvent: 'PAYROLL_POSTED',
      postingExplanation: {
        rule: 'Payroll journal: DR Salary+PF+ESI Expense / CR Salary Payable+Statutory Payables',
        module: 'payroll',
      },
      transaction: t,
    });

    await sequelize.query(
      `UPDATE payroll_runs SET status = 'POSTED', journal_entry_id = :journalEntryId,
       posted_at = NOW(), updated_at = NOW() WHERE id = :runId`,
      { replacements: { journalEntryId, runId }, transaction: t }
    );

    eventBus.publish(EVENT_TYPES.PAYROLL.PAYROLL_POSTED, { runId, tenantId, journalEntryId });

    return { runId, journalEntryId, entryNumber, status: 'POSTED' };
  });
}

module.exports = {
  calculateEmployeeSalary,
  runPayroll,
  postPayrollToAccounting,
  PAYROLL_ACCOUNTS,
};
