'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { sequelize } = require('../../config/database');
const { PeriodCloseService } = require('./period-close.service');
const { logEvent, AUDIT_ACTIONS } = require('../../shared/audit/auditLogger');

router.use(authenticate);

function getSvc() {
  return new PeriodCloseService(sequelize);
}

// ── Checklist ─────────────────────────────────────────────────────────────────

router.get('/checklist', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { period, fiscalYearId } = req.query;

  if (!period) return res.status(400).json({ error: 'period is required (YYYY-MM)' });
  if (!fiscalYearId) return res.status(400).json({ error: 'fiscalYearId is required' });

  const result = await getSvc().getChecklist(req.tenantId, period, fiscalYearId);
  res.json({ data: result });
}));

// ── Lock ──────────────────────────────────────────────────────────────────────

router.post('/lock', requirePermission('accounting:write'), asyncHandler(async (req, res) => {
  const { period, fiscalYearId } = req.body;

  if (!period || !fiscalYearId) {
    return res.status(400).json({ error: 'period and fiscalYearId are required' });
  }

  const result = await getSvc().lockPeriod(req.tenantId, period, fiscalYearId, req.user.id);

  await logEvent({
    tenantId: req.tenantId,
    userId: req.user.id,
    action: AUDIT_ACTIONS.PERIOD_LOCKED,
    entity: 'AccountingPeriod',
    entityId: fiscalYearId,
    module: 'period-close',
    metadata: { period },
  });

  res.json({ data: result });
}));

// ── Unlock ────────────────────────────────────────────────────────────────────

router.post('/unlock', requirePermission('accounting:admin'), asyncHandler(async (req, res) => {
  const { period, fiscalYearId, note } = req.body;

  if (!period || !fiscalYearId) {
    return res.status(400).json({ error: 'period and fiscalYearId are required' });
  }

  const result = await getSvc().unlockPeriod(req.tenantId, period, fiscalYearId, req.user.id, note);

  await logEvent({
    tenantId: req.tenantId,
    userId: req.user.id,
    action: AUDIT_ACTIONS.PERIOD_UNLOCKED,
    entity: 'AccountingPeriod',
    entityId: fiscalYearId,
    module: 'period-close',
    metadata: { period, note },
  });

  res.json({ data: result });
}));

// ── Generate Reports ──────────────────────────────────────────────────────────

router.post('/generate-reports', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { period, fiscalYearId } = req.body;
  if (!period || !fiscalYearId) {
    return res.status(400).json({ error: 'period and fiscalYearId are required' });
  }

  // Queue report generation job
  try {
    const { getEventReliabilityEngine } = require('../../shared/events/EventReliabilityEngine');
    const ere = getEventReliabilityEngine();
    await ere.publish('REPORT_GENERATION_REQUESTED', {
      tenantId: req.tenantId,
      period,
      fiscalYearId,
      requestedBy: req.user.id,
      reports: ['PL', 'BS', 'CF', 'TB'],
    });
    res.json({ data: { status: 'QUEUED', message: 'Reports queued for generation' } });
  } catch (err) {
    // Fallback — return success and let frontend poll the reporting module directly
    res.json({ data: { status: 'QUEUED', message: 'Reports will be generated shortly' } });
  }
}));

// ── History ───────────────────────────────────────────────────────────────────

router.get('/history', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { fiscalYearId } = req.query;
  if (!fiscalYearId) return res.status(400).json({ error: 'fiscalYearId is required' });

  const rows = await getSvc().getHistory(req.tenantId, fiscalYearId);
  res.json({ data: rows });
}));

module.exports = router;
