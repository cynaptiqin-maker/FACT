'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { requirePermission } = require('../../../middleware/rbac');
const { asyncHandler } = require('../../../shared/utils/asyncHandler');
const ctrl = require('../controllers/accounting.controller');

router.use(authenticate);

// ─── Chart of Accounts ────────────────────────────────────────────────────────
router.get('/accounts',             requirePermission('accounting:read'),         asyncHandler(ctrl.getAccounts));
router.post('/accounts',            requirePermission('accounting:write'),        asyncHandler(ctrl.createAccount));
router.post('/accounts/import',     requirePermission('accounting:write'),        asyncHandler(ctrl.importAccounts));
router.get('/accounts/tree',        requirePermission('accounting:read'),         asyncHandler(ctrl.getAccountTree));
router.get('/accounts/:id',         requirePermission('accounting:read'),         asyncHandler(ctrl.getAccount));
router.put('/accounts/:id',         requirePermission('accounting:write'),        asyncHandler(ctrl.updateAccount));
router.get('/accounts/:accountId/ledger', requirePermission('accounting:read'),  asyncHandler(ctrl.getLedger));

// ─── Journal Entries ──────────────────────────────────────────────────────────
router.get('/journals',                          requirePermission('accounting:read'),    asyncHandler(ctrl.listJournals));
router.post('/journals',                         requirePermission('accounting:write'),   asyncHandler(ctrl.createJournal));
router.post('/journals/import',                  requirePermission('accounting:write'),   asyncHandler(ctrl.importJournals));
router.get('/journals/source/:module/:sourceId', requirePermission('accounting:read'),    asyncHandler(ctrl.getJournalsBySource));
router.get('/journals/:id',                      requirePermission('accounting:read'),    asyncHandler(ctrl.getJournal));
router.post('/journals/:id/post',                requirePermission('accounting:post'),    asyncHandler(ctrl.postJournal));
router.post('/journals/:id/reverse',             requirePermission('accounting:reverse'), asyncHandler(ctrl.reverseJournal));

// ─── Ledger ───────────────────────────────────────────────────────────────────
router.get('/ledger/:accountId',    requirePermission('accounting:read'),         asyncHandler(ctrl.getLedger));

// ─── Reports ─────────────────────────────────────────────────────────────────
router.get('/trial-balance',        requirePermission('reports:read'),            asyncHandler(ctrl.getTrialBalance));
router.get('/reconcile',            requirePermission('accounting:read'),         asyncHandler(ctrl.runReconciliation));

// ─── Fiscal Years ─────────────────────────────────────────────────────────────
router.get('/fiscal-years',         requirePermission('accounting:read'),         asyncHandler(ctrl.getFiscalYears));
router.post('/fiscal-years',        requirePermission('accounting:write'),        asyncHandler(ctrl.createFiscalYear));
router.post('/fiscal-years/:id/close', requirePermission('accounting:fiscal:close'), asyncHandler(ctrl.closeFiscalYear));

module.exports = router;
