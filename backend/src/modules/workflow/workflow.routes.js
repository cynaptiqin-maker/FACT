'use strict';

const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth');
const { requirePermission } = require('../../middleware/rbac');
const workflowService = require('./services/workflow.service');
const { asyncHandler } = require('../../shared/utils/asyncHandler');

router.use(authenticate);

// ─── Definitions ──────────────────────────────────────────────────────────────
router.get('/definitions', requirePermission('admin:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM workflow_definitions WHERE tenant_id = :tenantId AND is_active = true ORDER BY name',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

router.post('/definitions', requirePermission('admin:write'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const { v4: uuidv4 } = require('uuid');
  await sequelize.query(
    `INSERT INTO workflow_definitions (id, tenant_id, name, entity_type, config, is_active, created_by)
     VALUES (:id, :tenantId, :name, :entity_type, :config::jsonb, true, :createdBy)`,
    {
      replacements: {
        id: uuidv4(), tenantId: req.tenantId, createdBy: req.user.id,
        name: req.body.name,
        entity_type: req.body.entity_type,
        config: JSON.stringify(req.body.config || {}),
      },
    }
  );
  res.status(201).json({ message: 'Workflow definition created' });
}));

// ─── Instances ────────────────────────────────────────────────────────────────
router.get('/instances', requirePermission('workflow:read'), asyncHandler(async (req, res) => {
  const { sequelize } = require('../../config/database');
  const [rows] = await sequelize.query(
    'SELECT * FROM workflow_instances WHERE tenant_id = :tenantId ORDER BY created_at DESC LIMIT 50',
    { replacements: { tenantId: req.tenantId }, type: sequelize.QueryTypes.SELECT }
  );
  res.json({ data: rows });
}));

// ─── Tasks ────────────────────────────────────────────────────────────────────
router.post('/tasks/:taskId/action', requirePermission('workflow:act'), asyncHandler(async (req, res) => {
  const result = await workflowService.processTaskAction({
    taskId: req.params.taskId,
    tenantId: req.tenantId,
    userId: req.user.id,
    ...req.body,
  });
  res.json({ data: result, message: 'Task action processed' });
}));

module.exports = router;
