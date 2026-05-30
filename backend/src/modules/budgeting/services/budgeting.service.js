'use strict';

const { sequelize } = require('../../../config/database');
const { QueryTypes } = require('sequelize');

// ─── Budget CRUD ──────────────────────────────────────────────────────────────

async function listBudgets(tenantId, { fiscalYearId, status } = {}) {
  const where = ['bh.tenant_id = :tenantId'];
  const replacements = { tenantId };

  if (fiscalYearId) { where.push('bh.fiscal_year_id = :fiscalYearId'); replacements.fiscalYearId = fiscalYearId; }
  if (status)       { where.push('bh.status = :status');               replacements.status = status; }

  return sequelize.query(
    `SELECT bh.id, bh.name, bh.description, bh.budget_type, bh.status, bh.version,
            bh.is_revised, bh.total_amount, bh.approved_at, bh.created_at, bh.updated_at,
            fy.name AS fiscal_year_name, fy.start_date, fy.end_date,
            (SELECT COUNT(*) FROM budget_lines bl WHERE bl.budget_id = bh.id) AS line_count
     FROM budget_headers bh
     LEFT JOIN fiscal_years fy ON fy.id = bh.fiscal_year_id
     WHERE ${where.join(' AND ')}
     ORDER BY bh.created_at DESC`,
    { replacements, type: QueryTypes.SELECT }
  );
}

async function getBudget(id, tenantId) {
  const [header] = await sequelize.query(
    `SELECT bh.*, fy.name AS fiscal_year_name, fy.start_date, fy.end_date
     FROM budget_headers bh
     LEFT JOIN fiscal_years fy ON fy.id = bh.fiscal_year_id
     WHERE bh.id = :id AND bh.tenant_id = :tenantId`,
    { replacements: { id, tenantId }, type: QueryTypes.SELECT }
  );

  if (!header) return null;

  const lines = await sequelize.query(
    `SELECT bl.*, a.code AS account_code, a.name AS account_name,
            d.name AS department_name, cc.name AS cost_center_name
     FROM budget_lines bl
     LEFT JOIN accounts a ON a.id = bl.account_id
     LEFT JOIN departments d ON d.id = bl.department_id
     LEFT JOIN cost_centers cc ON cc.id = bl.cost_center_id
     WHERE bl.budget_id = :id
     ORDER BY bl.category, bl.period_month NULLS FIRST, a.code`,
    { replacements: { id }, type: QueryTypes.SELECT }
  );

  return { ...header, lines };
}

async function createBudget(tenantId, userId, { name, description, fiscalYearId, budgetType = 'ANNUAL', notes, lines = [] }) {
  const t = await sequelize.transaction();
  try {
    const [header] = await sequelize.query(
      `INSERT INTO budget_headers (tenant_id, fiscal_year_id, name, description, budget_type, status, notes, created_by)
       VALUES (:tenantId, :fiscalYearId, :name, :description, :budgetType, 'DRAFT', :notes, :userId)
       RETURNING *`,
      { replacements: { tenantId, fiscalYearId, name, description: description || null, budgetType, notes: notes || null, userId },
        type: QueryTypes.SELECT, transaction: t }
    );

    if (lines.length > 0) {
      await _upsertLines(header.id, tenantId, lines, t);
    }

    const total = lines.reduce((s, l) => s + parseFloat(l.amount || 0), 0);
    await sequelize.query(
      `UPDATE budget_headers SET total_amount = :total WHERE id = :id`,
      { replacements: { total, id: header.id }, transaction: t }
    );

    await t.commit();
    return { ...header, total_amount: total, lines };
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function updateBudget(id, tenantId, userId, { name, description, notes, lines }) {
  const t = await sequelize.transaction();
  try {
    const existing = await getBudget(id, tenantId);
    if (!existing) throw Object.assign(new Error('Budget not found'), { status: 404 });
    if (existing.status === 'APPROVED') throw Object.assign(new Error('Cannot edit an approved budget'), { status: 400 });

    if (name || description !== undefined || notes !== undefined) {
      await sequelize.query(
        `UPDATE budget_headers SET name = COALESCE(:name, name), description = COALESCE(:desc, description),
         notes = COALESCE(:notes, notes), updated_at = NOW() WHERE id = :id AND tenant_id = :tenantId`,
        { replacements: { name: name || null, desc: description ?? null, notes: notes ?? null, id, tenantId }, transaction: t }
      );
    }

    if (Array.isArray(lines)) {
      await sequelize.query(`DELETE FROM budget_lines WHERE budget_id = :id`, { replacements: { id }, transaction: t });
      await _upsertLines(id, tenantId, lines, t);
      const total = lines.reduce((s, l) => s + parseFloat(l.amount || 0), 0);
      await sequelize.query(
        `UPDATE budget_headers SET total_amount = :total WHERE id = :id`,
        { replacements: { total, id }, transaction: t }
      );
    }

    await t.commit();
    return getBudget(id, tenantId);
  } catch (err) {
    await t.rollback();
    throw err;
  }
}

async function submitBudget(id, tenantId, userId) {
  const [result] = await sequelize.query(
    `UPDATE budget_headers SET status = 'PENDING_APPROVAL', submitted_by = :userId, submitted_at = NOW(), updated_at = NOW()
     WHERE id = :id AND tenant_id = :tenantId AND status = 'DRAFT' RETURNING id, status`,
    { replacements: { id, tenantId, userId }, type: QueryTypes.SELECT }
  );
  if (!result) throw Object.assign(new Error('Budget not found or not in DRAFT state'), { status: 400 });
  return result;
}

async function approveBudget(id, tenantId, userId) {
  const [result] = await sequelize.query(
    `UPDATE budget_headers SET status = 'APPROVED', approved_by = :userId, approved_at = NOW(), updated_at = NOW()
     WHERE id = :id AND tenant_id = :tenantId AND status = 'PENDING_APPROVAL' RETURNING id, status`,
    { replacements: { id, tenantId, userId }, type: QueryTypes.SELECT }
  );
  if (!result) throw Object.assign(new Error('Budget not found or not pending approval'), { status: 400 });
  return result;
}

// ─── Variance Report ──────────────────────────────────────────────────────────

async function getVariance(tenantId, { fiscalYearId, period, budgetId } = {}) {
  const where = ['bh.tenant_id = :tenantId', "bh.status = 'APPROVED'"];
  const replacements = { tenantId };

  if (fiscalYearId) { where.push('bh.fiscal_year_id = :fiscalYearId'); replacements.fiscalYearId = fiscalYearId; }
  if (budgetId)     { where.push('bh.id = :budgetId');                 replacements.budgetId = budgetId; }

  const budgets = await listBudgets(tenantId, { fiscalYearId, status: 'APPROVED' });
  if (budgets.length === 0) return { budgetId: null, lines: [], summary: { totalBudget: 0, totalActual: 0, variance: 0 } };

  const activeBudget = budgetId ? budgets.find(b => b.id === budgetId) : budgets[0];
  if (!activeBudget) return { budgetId: null, lines: [], summary: { totalBudget: 0, totalActual: 0, variance: 0 } };

  const startDate = activeBudget.start_date;
  const endDate   = period ? `${period}-31` : activeBudget.end_date;

  const lines = await sequelize.query(
    `SELECT
       bl.category,
       bl.department_id,
       d.name AS department_name,
       bl.account_id,
       a.code AS account_code,
       a.name AS account_name,
       SUM(bl.amount) AS budget_amount,
       COALESCE((
         SELECT SUM(CASE WHEN a2.type = 'EXPENSE' THEN jl.debit_amount - jl.credit_amount
                         ELSE jl.credit_amount - jl.debit_amount END)
         FROM journal_lines jl
         JOIN accounts a2 ON a2.id = jl.account_id
         JOIN journal_entries je ON je.id = jl.journal_entry_id
         WHERE jl.account_id = bl.account_id
           AND je.tenant_id = :tenantId
           AND je.status = 'POSTED'
           AND je.date BETWEEN :startDate AND :endDate
           AND (bl.department_id IS NULL OR je.department_id = bl.department_id)
       ), 0) AS actual_amount
     FROM budget_lines bl
     LEFT JOIN departments d ON d.id = bl.department_id
     LEFT JOIN accounts a ON a.id = bl.account_id
     WHERE bl.budget_id = :budgetId
     GROUP BY bl.category, bl.department_id, d.name, bl.account_id, a.code, a.name
     ORDER BY bl.category, a.code`,
    { replacements: { tenantId, budgetId: activeBudget.id, startDate, endDate }, type: QueryTypes.SELECT }
  );

  const totalBudget = lines.reduce((s, l) => s + parseFloat(l.budget_amount || 0), 0);
  const totalActual = lines.reduce((s, l) => s + parseFloat(l.actual_amount || 0), 0);

  return {
    budgetId: activeBudget.id,
    budgetName: activeBudget.name,
    fiscalYearName: activeBudget.fiscal_year_name,
    period,
    lines: lines.map(l => ({
      ...l,
      budget_amount: parseFloat(l.budget_amount),
      actual_amount: parseFloat(l.actual_amount),
      variance: parseFloat(l.actual_amount) - parseFloat(l.budget_amount),
      variance_pct: parseFloat(l.budget_amount) > 0
        ? ((parseFloat(l.actual_amount) - parseFloat(l.budget_amount)) / parseFloat(l.budget_amount)) * 100
        : 0,
    })),
    summary: {
      totalBudget,
      totalActual,
      variance: totalActual - totalBudget,
      variance_pct: totalBudget > 0 ? ((totalActual - totalBudget) / totalBudget) * 100 : 0,
    },
  };
}

// ─── KPI Summary ──────────────────────────────────────────────────────────────

async function getKPIs(tenantId, { fiscalYearId } = {}) {
  const budgets = await listBudgets(tenantId, { fiscalYearId, status: 'APPROVED' });
  const activeBudget = budgets[0];

  if (!activeBudget) {
    return {
      totalBudget: 0, ytdSpend: 0, variance: 0,
      deptOverBudget: 0, burnRate: 0, forecastAccuracy: null,
      activeBudgetId: null, activeBudgetName: null,
    };
  }

  const variance = await getVariance(tenantId, { budgetId: activeBudget.id });

  // Departments over budget
  const deptSummary = {};
  for (const l of variance.lines) {
    const dept = l.department_name || 'General';
    if (!deptSummary[dept]) deptSummary[dept] = { budget: 0, actual: 0 };
    deptSummary[dept].budget += parseFloat(l.budget_amount);
    deptSummary[dept].actual += parseFloat(l.actual_amount);
  }
  const deptOverBudget = Object.values(deptSummary).filter(d => d.actual > d.budget).length;

  // Burn rate: average monthly actual
  const [burnRow] = await sequelize.query(
    `SELECT COALESCE(AVG(monthly_total), 0) AS burn_rate
     FROM (
       SELECT DATE_TRUNC('month', je.date) AS month, SUM(jl.debit_amount) AS monthly_total
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.journal_entry_id
       JOIN accounts a ON a.id = jl.account_id
       WHERE je.tenant_id = :tenantId AND je.status = 'POSTED' AND a.type = 'EXPENSE'
         AND je.date >= NOW() - INTERVAL '3 months'
       GROUP BY DATE_TRUNC('month', je.date)
     ) t`,
    { replacements: { tenantId }, type: QueryTypes.SELECT }
  );

  return {
    totalBudget: parseFloat(activeBudget.total_amount),
    ytdSpend: variance.summary.totalActual,
    variance: variance.summary.variance,
    variance_pct: variance.summary.variance_pct,
    deptOverBudget,
    burnRate: parseFloat(burnRow?.burn_rate || 0),
    activeBudgetId: activeBudget.id,
    activeBudgetName: activeBudget.name,
    fiscalYearName: activeBudget.fiscal_year_name,
  };
}

// ─── Internal helpers ──────────────────────────────────────────────────────────

async function _upsertLines(budgetId, tenantId, lines, transaction) {
  for (const line of lines) {
    await sequelize.query(
      `INSERT INTO budget_lines (budget_id, tenant_id, account_id, department_id, cost_center_id, branch_id, category, description, period_month, amount, notes)
       VALUES (:budgetId, :tenantId, :accountId, :deptId, :ccId, :branchId, :category, :description, :periodMonth, :amount, :notes)`,
      {
        replacements: {
          budgetId, tenantId,
          accountId:   line.accountId   || null,
          deptId:      line.departmentId || null,
          ccId:        line.costCenterId || null,
          branchId:    line.branchId     || null,
          category:    line.category     || null,
          description: line.description  || null,
          periodMonth: line.periodMonth  ?? null,
          amount:      parseFloat(line.amount || 0),
          notes:       line.notes        || null,
        },
        transaction,
      }
    );
  }
}

module.exports = {
  listBudgets,
  getBudget,
  createBudget,
  updateBudget,
  submitBudget,
  approveBudget,
  getVariance,
  getKPIs,
};
