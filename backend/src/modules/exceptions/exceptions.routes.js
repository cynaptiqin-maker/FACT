'use strict';

const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { getExceptionEngine, EXCEPTION_TYPES, SEVERITIES } = require('../../shared/exceptions/ExceptionEngine');

router.use(authenticate);

// ─── Stats ────────────────────────────────────────────────────────────────────

router.get('/stats', asyncHandler(async (req, res) => {
  const engine = getExceptionEngine();
  const stats = await engine.getStats(req.tenantId);
  res.json({ data: stats });
}));

// ─── List ─────────────────────────────────────────────────────────────────────

router.get('/', asyncHandler(async (req, res) => {
  const { status, type, severity, search, page = 1, limit = 20 } = req.query;
  const engine = getExceptionEngine();

  const [result, stats] = await Promise.all([
    engine.query(
      req.tenantId,
      { status, exceptionType: type, severity, search },
      { page: parseInt(page), limit: Math.min(parseInt(limit), 100) }
    ),
    engine.getStats(req.tenantId),
  ]);

  res.json({ ...result, stats });
}));

// ─── Acknowledge ──────────────────────────────────────────────────────────────

router.post('/:id/acknowledge', asyncHandler(async (req, res) => {
  const engine = getExceptionEngine();
  const result = await engine.acknowledge(req.params.id, req.tenantId, req.user.id);
  if (!result) {
    return res.status(404).json({ error: 'Exception not found or already actioned' });
  }
  res.json({ success: true, id: result.id });
}));

// ─── Resolve ──────────────────────────────────────────────────────────────────

router.post('/:id/resolve', asyncHandler(async (req, res) => {
  const { note, resolution } = req.body;
  const engine = getExceptionEngine();
  const result = await engine.resolve(req.params.id, req.tenantId, req.user.id, note || resolution);
  if (!result) {
    return res.status(404).json({ error: 'Exception not found or already resolved' });
  }
  res.json({ success: true, id: result.id });
}));

// ─── Dismiss ──────────────────────────────────────────────────────────────────

router.post('/:id/dismiss', asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const engine = getExceptionEngine();
  const result = await engine.dismiss(req.params.id, req.tenantId, req.user.id, reason);
  if (!result) {
    return res.status(404).json({ error: 'Exception not found or already dismissed' });
  }
  res.json({ success: true, id: result.id });
}));

// ─── Constants (for frontend dropdowns) ───────────────────────────────────────

router.get('/types', asyncHandler(async (req, res) => {
  res.json({ data: Object.values(EXCEPTION_TYPES), severities: Object.values(SEVERITIES) });
}));

module.exports = router;
