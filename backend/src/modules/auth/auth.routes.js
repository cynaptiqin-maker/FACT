'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { authLimiter } = require('../../middleware/rateLimit');
const {
  loginController,
  refreshController,
  logoutController,
  changePasswordController,
  meController,
  setupMFAController,
  verifyMFASetupController,
  disableMFAController,
  createUserController,
} = require('./auth.controller');

// ─── Public Routes ────────────────────────────────────────────────────────────
router.post('/login', authLimiter, loginController);
router.post('/refresh', refreshController);

// ─── Authenticated Routes ─────────────────────────────────────────────────────
router.use(authenticate);

router.get('/me', meController);
router.post('/logout', logoutController);
router.post('/change-password', changePasswordController);

// MFA routes
router.post('/mfa/setup', setupMFAController);
router.post('/mfa/verify-setup', verifyMFASetupController);
router.post('/mfa/disable', disableMFAController);

// User management (admin only)
router.post('/users', requireRole('admin'), createUserController);

module.exports = router;
