'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { asyncHandler } = require('../../../shared/utils/asyncHandler');

router.use(authenticate);

router.get('/dashboard', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const [result] = await sequelize.query(
    `SELECT
       COUNT(*) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID')) AS open_invoices,
       SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID')) AS total_outstanding,
       SUM(balance_amount) FILTER (WHERE status IN ('FINALIZED','PARTIALLY_PAID') AND invoice_date < NOW() - INTERVAL '30 days') AS overdue_30
     FROM patient_invoices WHERE tenant_id = :tenantId`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: result });
}));

router.get('/outstanding', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const [rows] = await sequelize.query(
    `SELECT * FROM patient_invoices WHERE tenant_id = :tenantId AND status IN ('FINALIZED','PARTIALLY_PAID')
     ORDER BY invoice_date ASC LIMIT 50`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/aging', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const [rows] = await sequelize.query(
    `SELECT
       billing_type,
       SUM(balance_amount) FILTER (WHERE invoice_date >= NOW() - INTERVAL '30 days') AS "0_30",
       SUM(balance_amount) FILTER (WHERE invoice_date < NOW() - INTERVAL '30 days' AND invoice_date >= NOW() - INTERVAL '60 days') AS "31_60",
       SUM(balance_amount) FILTER (WHERE invoice_date < NOW() - INTERVAL '60 days' AND invoice_date >= NOW() - INTERVAL '90 days') AS "61_90",
       SUM(balance_amount) FILTER (WHERE invoice_date < NOW() - INTERVAL '90 days') AS "90_plus"
     FROM patient_invoices WHERE tenant_id = :tenantId AND status IN ('FINALIZED','PARTIALLY_PAID')
     GROUP BY billing_type`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

module.exports = router;
