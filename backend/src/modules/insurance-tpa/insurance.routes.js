'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const claimService = require('./services/claim.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

// ─── Claims ───────────────────────────────────────────────────────────────────
router.get('/claims', requirePermission('insurance:read'), asyncHandler(async (req, res) => {
  const Claim = require('./models/Claim');
  const { Op } = require('sequelize');
  const { page = 1, limit = 20, status, tpa_id, search } = req.query;

  const where = { tenant_id: req.tenantId };
  if (status) where.status = status;
  if (tpa_id) where.tpa_id = tpa_id;
  if (search) {
    where[Op.or] = [
      { claim_number: { [Op.iLike]: `%${search}%` } },
      { patient_name: { [Op.iLike]: `%${search}%` } },
    ];
  }

  const { count, rows } = await Claim.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['created_at', 'DESC']],
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/claims/:id', requirePermission('insurance:read'), asyncHandler(async (req, res) => {
  const Claim = require('./models/Claim');
  const claim = await Claim.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!claim) return res.status(404).json({ message: 'Claim not found' });
  res.json({ data: claim });
}));

router.post('/claims', requirePermission('insurance:write'), asyncHandler(async (req, res) => {
  const Claim = require('./models/Claim');
  const { v4: uuidv4 } = require('uuid');
  const claim = await Claim.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    ...req.body,
    created_by: req.user.id,
  });
  res.status(201).json({ data: claim, message: 'Claim created' });
}));

router.post('/claims/:id/advance', requirePermission('insurance:write'), asyncHandler(async (req, res) => {
  const claim = await claimService.advanceClaimStatus({
    claimId: req.params.id,
    tenantId: req.tenantId,
    ...req.body,
    actionBy: req.user.id,
  });
  res.json({ data: claim, message: 'Claim status updated' });
}));

// ─── Aging ────────────────────────────────────────────────────────────────────
router.get('/aging', requirePermission('insurance:read'), asyncHandler(async (req, res) => {
  const result = await claimService.getTPAAgingSummary(req.tenantId, req.query);
  res.json({ data: result });
}));

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', requirePermission('insurance:read'), asyncHandler(async (req, res) => {
  const result = await claimService.getClaimStats(req.tenantId);
  res.json({ data: result });
}));

// ─── TPAs & Insurers ──────────────────────────────────────────────────────────
router.get('/tpas', requirePermission('insurance:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM tpa_companies WHERE tenant_id = :tenantId AND is_active = true ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/insurers', requirePermission('insurance:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM insurers WHERE tenant_id = :tenantId AND is_active = true ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

module.exports = router;
