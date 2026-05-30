'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { asyncHandler } = require('../../../shared/utils/asyncHandler');

router.use(authenticate);

router.get('/accounts/:accountId', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { getLedgerStatement } = require('../../../shared/accounting-engine/ledger');
  const { from, to } = req.query;
  const result = await getLedgerStatement(req.params.accountId, req.tenantId, from, to, {});
  res.json({ data: result });
}));

router.get('/journals', requirePermission('accounting:read'), asyncHandler(async (req, res) => {
  const { listJournalEntries } = require('../../../shared/accounting-engine/journal');
  const { page = 1, limit = 20, status, from, to, search, voucherType } = req.query;
  const result = await listJournalEntries(
    req.tenantId,
    { status, from, to, search, voucherType },
    { page: parseInt(page), limit: parseInt(limit) }
  );
  res.json(result);
}));

module.exports = router;
