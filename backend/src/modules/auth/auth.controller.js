'use strict';

const Joi = require('joi');
const { login, refreshAccessToken, logout, changePassword, createUser } = require('./auth.service');
const { generateMFASecret, enableMFA, disableMFA } = require('./mfa.service');
const bcrypt = require('bcryptjs');

// ─── Validators ───────────────────────────────────────────────────────────────
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  mfaToken: Joi.string().length(6).pattern(/^\d+$/).optional(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required()
    .messages({ 'string.pattern.base': 'Password must contain uppercase, lowercase and number' }),
});

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  password: Joi.string().min(8).required(),
  roleIds: Joi.array().items(Joi.string().uuid()).required(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

async function loginController(req, res) {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const result = await login({
    ...value,
    tenantId: req.tenantId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });

  if (result.requiresMFA) {
    return res.status(200).json({ success: true, requiresMFA: true, message: result.message });
  }

  res.json({ success: true, data: result });
}

async function refreshController(req, res) {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, error: 'Refresh token required.' });

  const tokens = await refreshAccessToken(refreshToken, req.tenantId);
  res.json({ success: true, data: tokens });
}

async function logoutController(req, res) {
  const token = req.headers.authorization?.substring(7);
  await logout(req.user.id, req.tenantId, token);
  res.json({ success: true, message: 'Logged out successfully.' });
}

async function changePasswordController(req, res) {
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  await changePassword(req.user.id, req.tenantId, value.currentPassword, value.newPassword);
  res.json({ success: true, message: 'Password changed successfully.' });
}

async function meController(req, res) {
  res.json({ success: true, data: req.user });
}

async function setupMFAController(req, res) {
  const { secret, qrCode, backupCodes, otpauthUrl } = await generateMFASecret(req.user.email);

  // Store pending secret in session/cache temporarily
  const { getRedisClient } = require('../../config/redis');
  await getRedisClient().setex(
    `fact:mfa-pending:${req.user.id}`,
    300, // 5 minutes
    JSON.stringify({ secret, backupCodes })
  );

  res.json({
    success: true,
    data: {
      qrCode,
      otpauthUrl,
      backupCodes,
      message: 'Scan QR code with your authenticator app, then verify with a token.',
    },
  });
}

async function verifyMFASetupController(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Token required.' });

  const { getRedisClient } = require('../../config/redis');
  const pending = await getRedisClient().get(`fact:mfa-pending:${req.user.id}`);
  if (!pending) return res.status(400).json({ success: false, error: 'MFA setup session expired. Start again.' });

  const { secret, backupCodes } = JSON.parse(pending);
  const { verifyMFAToken } = require('./mfa.service');

  if (!verifyMFAToken(secret, token)) {
    return res.status(400).json({ success: false, error: 'Invalid token. Please try again.' });
  }

  // Hash backup codes for storage
  const hashedBackupCodes = await Promise.all(
    backupCodes.map(async (code) => ({
      hash: await bcrypt.hash(code, 8),
      used: false,
    }))
  );

  await enableMFA(req.user.id, req.tenantId, secret, hashedBackupCodes);
  await getRedisClient().del(`fact:mfa-pending:${req.user.id}`);

  res.json({ success: true, message: 'MFA enabled successfully.', data: { backupCodes } });
}

async function disableMFAController(req, res) {
  const { password, mfaToken } = req.body;
  if (!password) return res.status(400).json({ success: false, error: 'Password required to disable MFA.' });

  await disableMFA(req.user.id, req.tenantId);
  res.json({ success: true, message: 'MFA disabled.' });
}

async function createUserController(req, res) {
  const { error, value } = createUserSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: error.details[0].message });

  const user = await createUser({ ...value, tenantId: req.tenantId, createdBy: req.user.id });
  res.status(201).json({ success: true, data: user });
}

module.exports = {
  loginController,
  refreshController,
  logoutController,
  changePasswordController,
  meController,
  setupMFAController,
  verifyMFASetupController,
  disableMFAController,
  createUserController,
};
