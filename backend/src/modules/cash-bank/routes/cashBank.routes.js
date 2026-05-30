'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { asyncHandler } = require('../../../shared/utils/asyncHandler');

router.use(authenticate);

router.get('/cashbook', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const { from, to } = req.query;
  const [rows] = await sequelize.query(
    `SELECT jl.*, je.date, je.narration, je.entry_number
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     JOIN accounts a ON a.id = jl.account_id
     WHERE je.tenant_id = :tenantId AND a.is_bank_account = true
     AND je.status = 'POSTED'
     ${from ? 'AND je.date >= :from' : ''}
     ${to ? 'AND je.date <= :to' : ''}
     ORDER BY je.date DESC LIMIT 100`,
    { replacements: { tenantId: req.tenantId, from, to }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/position', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const [rows] = await sequelize.query(
    `SELECT a.id, a.name, a.code, a.current_balance
     FROM accounts a WHERE a.tenant_id = :tenantId AND (a.is_bank_account = true OR a.is_cash_account = true)`,
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

module.exports = router;
