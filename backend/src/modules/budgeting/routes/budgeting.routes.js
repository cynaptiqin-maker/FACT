'use strict';

const express = require('express');
const router  = express.Router();
const { authenticate, requirePermission } = require('../../../middleware/auth');
const { asyncHandler }                    = require('../../../middleware/errorHandler');
const svc                                 = require('../services/budgeting.service');

router.use(authenticate);

// ─── KPI summary ──────────────────────────────────────────────────────────────

router.get('/kpis', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { fiscalYearId } = req.query;
  const data = await svc.getKPIs(req.tenantId, { fiscalYearId });
  res.json({ data });
}));

// ─── Budget headers ───────────────────────────────────────────────────────────

router.get('/budgets', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { fiscalYearId, status } = req.query;
  const data = await svc.listBudgets(req.tenantId, { fiscalYearId, status });
  res.json({ data, total: data.length });
}));

router.post('/budgets', requirePermission('accounting:write'), asyncHandler(async (req, res) => {
  const data = await svc.createBudget(req.tenantId, req.user.id, req.body);
  res.status(201).json({ data });
}));

router.get('/budgets/:id', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const data = await svc.getBudget(req.params.id, req.tenantId);
  if (!data) return res.status(404).json({ error: 'Budget not found' });
  res.json({ data });
}));

router.put('/budgets/:id', requirePermission('accounting:write'), asyncHandler(async (req, res) => {
  const data = await svc.updateBudget(req.params.id, req.tenantId, req.user.id, req.body);
  res.json({ data });
}));

router.post('/budgets/:id/submit', requirePermission('accounting:write'), asyncHandler(async (req, res) => {
  const data = await svc.submitBudget(req.params.id, req.tenantId, req.user.id);
  res.json({ data });
}));

router.post('/budgets/:id/approve', requirePermission('accounting:admin'), asyncHandler(async (req, res) => {
  const data = await svc.approveBudget(req.params.id, req.tenantId, req.user.id);
  res.json({ data });
}));

// ─── Variance report ──────────────────────────────────────────────────────────

router.get('/variance', requirePermission('reports:read'), asyncHandler(async (req, res) => {
  const { fiscalYearId, period, budgetId } = req.query;
  const data = await svc.getVariance(req.tenantId, { fiscalYearId, period, budgetId });
  res.json({ data });
}));

module.exports = router;
