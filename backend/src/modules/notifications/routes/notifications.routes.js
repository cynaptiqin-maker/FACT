'use strict';
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/auth');
const { asyncHandler } = require('../../../shared/utils/asyncHandler');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const [rows] = await sequelize.query(
    `SELECT * FROM notifications WHERE tenant_id = :tenantId
     AND (user_id = :userId OR user_id IS NULL)
     ORDER BY created_at DESC LIMIT 30`,
    { replacements: { tenantId: req.tenantId, userId: req.user.id }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.post('/:id/read', asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  await sequelize.query(
    'UPDATE notifications SET is_read = true WHERE id = :id AND tenant_id = :tenantId',
    { replacements: { id: req.params.id, tenantId: req.tenantId } }
  );
  res.json({ message: 'Marked as read' });
}));

router.post('/read-all', asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  await sequelize.query(
    'UPDATE notifications SET is_read = true WHERE tenant_id = :tenantId AND user_id = :userId',
    { replacements: { tenantId: req.tenantId, userId: req.user.id } }
  );
  res.json({ message: 'All marked as read' });
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  const { sequelize } = require('../../../config/database');
  const [{ count }] = await sequelize.query(
    `SELECT COUNT(*) as count FROM notifications
     WHERE tenant_id = :tenantId AND (user_id = :userId OR user_id IS NULL) AND is_read = false`,
    { replacements: { tenantId: req.tenantId, userId: req.user.id }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: { count: parseInt(count) } });
}));

module.exports = router;
