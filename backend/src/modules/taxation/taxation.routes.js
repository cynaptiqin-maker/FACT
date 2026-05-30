'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const gstService = require('./services/gst.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

router.post('/gstr1', requirePermission('taxation:read'), asyncHandler(async (req, res) => {
  const result = await gstService.generateGSTR1(req.tenantId, req.body.period);
  res.json({ data: result });
}));

router.post('/gstr3b', requirePermission('taxation:read'), asyncHandler(async (req, res) => {
  const result = await gstService.generateGSTR3B(req.tenantId, req.body.period);
  res.json({ data: result });
}));

router.get('/tds-summary', requirePermission('taxation:read'), asyncHandler(async (req, res) => {
  const result = await gstService.getTDSSummary(req.tenantId, req.query);
  res.json({ data: result });
}));

router.get('/rules', requirePermission('taxation:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM tax_rules WHERE tenant_id = :tenantId AND is_active = true ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.post('/rules', requirePermission('taxation:write'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { v4: uuidv4 } = require('uuid');
  await sequelize.query(
    `INSERT INTO tax_rules (id, tenant_id, name, tax_type, rate)
     VALUES (:id, :tenantId, :name, :tax_type, :rate)`,
    {
      replacements: {
        id: uuidv4(), tenantId: req.tenantId,
        name: req.body.name, tax_type: req.body.tax_type, rate: req.body.rate,
      },
    }
  );
  res.status(201).json({ message: 'Tax rule created' });
}));

module.exports = router;
