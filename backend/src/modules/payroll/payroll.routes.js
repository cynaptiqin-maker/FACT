'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const payrollService = require('./services/payroll.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

// ─── Employees ────────────────────────────────────────────────────────────────
router.get('/employees', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { page = 1, limit = 20, department_id } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = 'tenant_id = :tenantId AND is_active = true';
  const replacements = { tenantId: req.tenantId, limit: parseInt(limit), offset };
  if (department_id) { whereClause += ' AND department_id = :department_id'; replacements.department_id = department_id; }

  const [rows] = await sequelize.query(
    `SELECT * FROM employees WHERE ${whereClause} ORDER BY name LIMIT :limit OFFSET :offset`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );
  const [{ count }] = await sequelize.query(
    `SELECT COUNT(*) as count FROM employees WHERE ${whereClause}`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows, total: parseInt(count), page: parseInt(page) });
}));

router.get('/employees/:id', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM employees WHERE id = :id AND tenant_id = :tenantId',
    { replacements: { id: req.params.id, tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!rows.length) return res.status(404).json({ message: 'Employee not found' });
  res.json({ data: rows[0] });
}));

router.post('/employees', requirePermission('payroll:write'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  await sequelize.query(
    `INSERT INTO employees (id, tenant_id, employee_number, name, email, department_id,
      designation, date_of_joining, employment_type, is_active, created_by)
     VALUES (:id, :tenantId, :employee_number, :name, :email, :department_id,
      :designation, :date_of_joining, :employment_type, true, :createdBy)`,
    {
      replacements: {
        id, tenantId: req.tenantId, createdBy: req.user.id,
        employee_number: req.body.employee_number,
        name: req.body.name,
        email: req.body.email,
        department_id: req.body.department_id || null,
        designation: req.body.designation || null,
        date_of_joining: req.body.date_of_joining || null,
        employment_type: req.body.employment_type || null,
      },
    }
  );
  res.status(201).json({ data: { id }, message: 'Employee created' });
}));

// ─── Salary Structures ────────────────────────────────────────────────────────
router.get('/salary-structures', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM salary_structures WHERE tenant_id = :tenantId AND is_active = true ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

// ─── Payroll Runs ─────────────────────────────────────────────────────────────
router.post('/run', requirePermission('payroll:run'), asyncHandler(async (req, res) => {
  const { year, month, fiscalYearId } = req.body;
  const result = await payrollService.runPayroll({ tenantId: req.tenantId, year, month, fiscalYearId, initiatedBy: req.user.id });
  res.json({ data: result, message: 'Payroll processed' });
}));

router.get('/runs', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM payroll_runs WHERE tenant_id = :tenantId ORDER BY period DESC LIMIT 24',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.post('/runs/:id/post', requirePermission('payroll:post'), asyncHandler(async (req, res) => {
  const result = await payrollService.postPayrollToAccounting(req.params.id, req.tenantId, req.user.id);
  res.json({ data: result, message: 'Payroll posted to accounting' });
}));

// ─── Payslips ─────────────────────────────────────────────────────────────────
router.get('/payslips', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { run_id, employee_id } = req.query;
  let where = 'tenant_id = :tenantId';
  const replacements = { tenantId: req.tenantId };
  if (run_id) { where += ' AND payroll_run_id = :run_id'; replacements.run_id = run_id; }
  if (employee_id) { where += ' AND employee_id = :employee_id'; replacements.employee_id = employee_id; }
  const [rows] = await sequelize.query(
    `SELECT * FROM payslips WHERE ${where} ORDER BY created_at DESC`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/payslips/:id', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM payslips WHERE id = :id AND tenant_id = :tenantId',
    { replacements: { id: req.params.id, tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  if (!rows.length) return res.status(404).json({ message: 'Payslip not found' });
  res.json({ data: rows[0] });
}));

module.exports = router;
