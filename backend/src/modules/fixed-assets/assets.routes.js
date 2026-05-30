'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const depreciationService = require('./services/depreciation.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

// ─── Assets ───────────────────────────────────────────────────────────────────
router.get('/', requirePermission('assets:read'), asyncHandler(async (req, res) => {
  const { Asset } = require('./models/Asset');
  const { page = 1, limit = 20, status, category_id } = req.query;
  const where = { tenant_id: req.tenantId };
  if (status) where.status = status;
  if (category_id) where.category_id = category_id;

  const { count, rows } = await Asset.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['acquisition_date', 'DESC']],
  });
  res.json({ data: rows, total: count, page: parseInt(page) });
}));

router.get('/:id', requirePermission('assets:read'), asyncHandler(async (req, res) => {
  const { Asset } = require('./models/Asset');
  const asset = await Asset.findOne({ where: { id: req.params.id, tenant_id: req.tenantId } });
  if (!asset) return res.status(404).json({ message: 'Asset not found' });
  res.json({ data: asset });
}));

router.post('/', requirePermission('assets:write'), asyncHandler(async (req, res) => {
  const { Asset } = require('./models/Asset');
  const { v4: uuidv4 } = require('uuid');
  const asset = await Asset.create({
    id: uuidv4(),
    tenant_id: req.tenantId,
    ...req.body,
    created_by: req.user.id,
  });
  res.status(201).json({ data: asset, message: 'Asset created' });
}));

router.put('/:id', requirePermission('assets:write'), asyncHandler(async (req, res) => {
  const { Asset } = require('./models/Asset');
  await Asset.update(req.body, { where: { id: req.params.id, tenant_id: req.tenantId } });
  const asset = await Asset.findByPk(req.params.id);
  res.json({ data: asset, message: 'Asset updated' });
}));

router.post('/:id/dispose', requirePermission('assets:write'), asyncHandler(async (req, res) => {
  const { Asset } = require('./models/Asset');
  await Asset.update(
    { status: 'DISPOSED', disposal_date: req.body.disposal_date, disposal_amount: req.body.disposal_amount },
    { where: { id: req.params.id, tenant_id: req.tenantId } }
  );
  res.json({ message: 'Asset disposed' });
}));

router.get('/categories', requirePermission('assets:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM asset_categories WHERE tenant_id = :tenantId ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

// ─── Depreciation ─────────────────────────────────────────────────────────────
router.post('/depreciation/run', requirePermission('assets:depreciate'), asyncHandler(async (req, res) => {
  const result = await depreciationService.runMonthlyDepreciation(req.tenantId, req.body.period, req.user.id);
  res.json({ data: result, message: 'Depreciation run completed' });
}));

router.get('/depreciation/runs', requirePermission('assets:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM depreciation_runs WHERE tenant_id = :tenantId ORDER BY period DESC LIMIT 24',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/:id/depreciation-schedule', requirePermission('assets:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM depreciation_schedules WHERE asset_id = :assetId AND tenant_id = :tenantId ORDER BY period',
    { replacements: { assetId: req.params.id, tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

module.exports = router;
