'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const revenueShareService = require('./services/revenueShare.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

// ─── Doctors ──────────────────────────────────────────────────────────────────
router.get('/doctors', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM doctors WHERE tenant_id = :tenantId ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/doctors/:id/formulas', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM revenue_share_formulas WHERE doctor_id = :doctorId AND tenant_id = :tenantId ORDER BY effective_from DESC',
    { replacements: { doctorId: req.params.id, tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.post('/doctors/:id/formulas', requirePermission('payroll:write'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { v4: uuidv4 } = require('uuid');
  const id = uuidv4();
  await sequelize.query(
    `INSERT INTO revenue_share_formulas
     (id, tenant_id, doctor_id, formula_type, percentage_rate, slab_rules, procedure_rates,
      minimum_guarantee, maximum_cap, effective_from, created_by)
     VALUES (:id, :tenantId, :doctorId, :formula_type, :percentage_rate, :slab_rules::jsonb,
      :procedure_rates::jsonb, :minimum_guarantee, :maximum_cap, :effective_from, :createdBy)`,
    {
      replacements: {
        id,
        tenantId: req.tenantId,
        doctorId: req.params.id,
        createdBy: req.user.id,
        formula_type: req.body.formula_type,
        percentage_rate: req.body.percentage_rate || null,
        slab_rules: JSON.stringify(req.body.slab_rules || []),
        procedure_rates: JSON.stringify(req.body.procedure_rates || {}),
        minimum_guarantee: req.body.minimum_guarantee || null,
        maximum_cap: req.body.maximum_cap || null,
        effective_from: req.body.effective_from,
      },
    }
  );
  res.status(201).json({ data: { id }, message: 'Formula created' });
}));

// ─── Payout Runs ──────────────────────────────────────────────────────────────
router.post('/run', requirePermission('payroll:run'), asyncHandler(async (req, res) => {
  const result = await revenueShareService.runDoctorPayouts(req.tenantId, req.body.period, req.user.id);
  res.json({ data: result, message: 'Doctor payouts processed' });
}));

router.get('/runs', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM payout_runs WHERE tenant_id = :tenantId ORDER BY period DESC LIMIT 24',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/runs/:id/details', requirePermission('payroll:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT pd.*, d.name as doctor_name FROM payout_details pd JOIN doctors d ON d.id = pd.doctor_id WHERE pd.payout_run_id = :runId AND pd.tenant_id = :tenantId',
    { replacements: { runId: req.params.id, tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

module.exports = router;
