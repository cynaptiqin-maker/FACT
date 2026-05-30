'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission, requireRole } = require('../../middleware/rbac');
const moduleManagerService = require('./services/moduleManager.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');
const { auditLogger } = require('../../shared/audit/auditLogger');

router.use(authenticate);

// ─── Tenant ───────────────────────────────────────────────────────────────────
router.get('/tenant', requirePermission('admin:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM tenants WHERE id = :id',
    { replacements: { id: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows[0] || null });
}));

router.put('/tenant', requireRole('admin'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const allowed = ['name', 'address', 'gstin', 'phone', 'email', 'timezone', 'currency', 'logo_url'];
  const updates = {};
  allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
  if (!Object.keys(updates).length) return res.json({ message: 'Nothing to update' });

  const setClauses = Object.keys(updates).map((k) => `${k} = :${k}`).join(', ');
  await sequelize.query(
    `UPDATE tenants SET ${setClauses}, updated_at = NOW() WHERE id = :tenantId`,
    { replacements: { ...updates, tenantId: req.tenantId } }
  );
  res.json({ message: 'Tenant updated' });
}));

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', requirePermission('admin:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { page = 1, limit = 20, search } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);
  let where = 'u.tenant_id = :tenantId';
  const replacements = { tenantId: req.tenantId, limit: parseInt(limit), offset };
  if (search) { where += ' AND (u.email ILIKE :search OR u.full_name ILIKE :search)'; replacements.search = `%${search}%`; }

  const [rows] = await sequelize.query(
    `SELECT u.id, u.email, u.full_name AS name, u.is_active, u.mfa_enabled,
            u.last_login, u.created_at,
            array_agg(r.name) as roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE ${where}
     GROUP BY u.id ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );
  const [{ count }] = await sequelize.query(
    `SELECT COUNT(*) as count FROM users u WHERE ${where}`,
    { replacements, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows, total: parseInt(count), page: parseInt(page) });
}));

router.post('/users', requireRole('admin'), asyncHandler(async (req, res) => {
  const { createUser } = require('../auth/auth.service');
  const user = await createUser({ ...req.body, tenantId: req.tenantId, createdBy: req.user.id });
  res.status(201).json({ data: user, message: 'User created' });
}));

router.post('/users/:id/deactivate', requireRole('admin'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  await sequelize.query(
    'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = :id AND tenant_id = :tenantId',
    { replacements: { id: req.params.id, tenantId: req.tenantId } }
  );
  res.json({ message: 'User deactivated' });
}));

router.post('/users/:id/reset-mfa', requireRole('admin'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  await sequelize.query(
    'UPDATE users SET mfa_enabled = false, mfa_secret = NULL, mfa_backup_codes = NULL WHERE id = :id AND tenant_id = :tenantId',
    { replacements: { id: req.params.id, tenantId: req.tenantId } }
  );
  res.json({ message: 'MFA reset for user' });
}));

// ─── Roles & Permissions ──────────────────────────────────────────────────────
router.get('/roles', requirePermission('admin:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM roles WHERE tenant_id = :tenantId ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/permissions', requirePermission('admin:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM permissions ORDER BY module, action',
    { replacements: {}, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

// ─── Modules ──────────────────────────────────────────────────────────────────
router.get('/modules', requirePermission('admin:read'), asyncHandler(async (req, res) => {
  const modules = await moduleManagerService.getTenantModules(req.tenantId);
  res.json({ data: modules });
}));

router.post('/modules/:moduleId/enable', requireRole('admin'), asyncHandler(async (req, res) => {
  await moduleManagerService.enableModule(req.tenantId, req.params.moduleId, req.user.id);
  res.json({ message: `Module ${req.params.moduleId} enabled` });
}));

router.post('/modules/:moduleId/disable', requireRole('admin'), asyncHandler(async (req, res) => {
  await moduleManagerService.disableModule(req.tenantId, req.params.moduleId, req.user.id);
  res.json({ message: `Module ${req.params.moduleId} disabled` });
}));

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', requirePermission('admin:audit'), asyncHandler(async (req, res) => {
  const { queryAuditLogs } = require('../../shared/audit/auditLogger');
  const { page = 1, limit = 50, userId, action, entity, from, to, search } = req.query;
  const result = await queryAuditLogs(
    req.tenantId,
    { userId, action, entity, from, to, search },
    { page: parseInt(page), limit: parseInt(limit) }
  );
  res.json(result);
}));

// ─── Notifications ────────────────────────────────────────────────────────────
router.get('/notifications', authenticate, asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    `SELECT * FROM notifications WHERE tenant_id = :tenantId AND (user_id = :userId OR user_id IS NULL)
     ORDER BY created_at DESC LIMIT 30`,
    { replacements: { tenantId: req.tenantId, userId: req.user.id }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.get('/notifications/unread-count', asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [{ count }] = await sequelize.query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE tenant_id = :tenantId AND (user_id = :userId OR user_id IS NULL) AND is_read = false`,
    { replacements: { tenantId: req.tenantId, userId: req.user.id }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: { count: parseInt(count) } });
}));

module.exports = router;
