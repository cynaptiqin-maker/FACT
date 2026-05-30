'use strict';

const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../../config/database');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');
const { logEvent, AUDIT_ACTIONS } = require('../../../shared/audit/auditLogger');

/**
 * Metadata-Driven Workflow Engine
 *
 * Workflow definitions are stored as JSON configurations.
 * Example workflow for Journal Voucher Approval:
 * {
 *   steps: [
 *     { order: 1, role: 'accountant', action: 'REVIEW', timeout_hours: 24 },
 *     { order: 2, role: 'cfo', action: 'APPROVE', amount_threshold: 100000 },
 *   ],
 *   conditions: { amount_gt: 50000 },
 *   escalation: { timeout_hours: 48, escalate_to: 'cfo' }
 * }
 */

/**
 * Start a workflow instance for a document.
 */
async function startWorkflow({ tenantId, workflowDefinitionId, entityType, entityId, entityData, initiatedBy }) {
  const [definition] = await sequelize.query(
    `SELECT * FROM workflow_definitions WHERE id = :id AND tenant_id = :tenantId AND is_active = true`,
    { replacements: { id: workflowDefinitionId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!definition) throw Object.assign(new Error('Workflow definition not found'), { statusCode: 404 });

  const config = typeof definition.config === 'string' ? JSON.parse(definition.config) : definition.config;

  // Check if workflow applies based on conditions
  if (!evaluateConditions(config.conditions, entityData)) {
    return { skipped: true, reason: 'Workflow conditions not met' };
  }

  const instanceId = uuidv4();
  const steps = config.steps || [];
  const firstStep = steps[0];

  await sequelize.query(
    `INSERT INTO workflow_instances (id, tenant_id, definition_id, entity_type, entity_id,
     current_step, total_steps, status, initiated_by, entity_data, created_at, updated_at)
     VALUES (:id, :tenantId, :definitionId, :entityType, :entityId,
     1, :totalSteps, 'IN_PROGRESS', :initiatedBy, :entityData, NOW(), NOW())`,
    {
      replacements: {
        id: instanceId, tenantId, definitionId: workflowDefinitionId,
        entityType, entityId, totalSteps: steps.length, initiatedBy,
        entityData: JSON.stringify(entityData),
      },
    }
  );

  // Create first task
  if (firstStep) {
    await createWorkflowTask({
      tenantId, instanceId, step: firstStep, stepNumber: 1,
      entityType, entityId, entityData,
    });
  }

  eventBus.publish(EVENT_TYPES.WORKFLOW.TASK_CREATED, {
    instanceId, tenantId, entityType, entityId, stepRole: firstStep?.role,
  });

  return { instanceId, status: 'IN_PROGRESS', currentStep: 1, totalSteps: steps.length };
}

/**
 * Create a workflow task for a step.
 */
async function createWorkflowTask({ tenantId, instanceId, step, stepNumber, entityType, entityId, entityData }) {
  const taskId = uuidv4();
  const dueDate = step.timeout_hours
    ? new Date(Date.now() + step.timeout_hours * 60 * 60 * 1000)
    : null;

  await sequelize.query(
    `INSERT INTO workflow_tasks (id, tenant_id, instance_id, step_number, step_config,
     assigned_role, assigned_user_id, entity_type, entity_id, status, due_date, created_at, updated_at)
     VALUES (:id, :tenantId, :instanceId, :stepNumber, :stepConfig,
     :assignedRole, :assignedUserId, :entityType, :entityId, 'PENDING', :dueDate, NOW(), NOW())`,
    {
      replacements: {
        id: taskId, tenantId, instanceId, stepNumber,
        stepConfig: JSON.stringify(step),
        assignedRole: step.role || null,
        assignedUserId: step.user_id || null,
        entityType, entityId, dueDate,
      },
    }
  );

  // Notify assignees
  if (step.role) {
    const assignees = await sequelize.query(
      `SELECT u.id, u.email, u.full_name AS name FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
       WHERE r.name = :role AND u.tenant_id = :tenantId AND u.is_active = true`,
      { replacements: { role: step.role, tenantId }, type: sequelize.QueryTypes.SELECT }
    );

    for (const user of assignees) {
      eventBus.publish(EVENT_TYPES.WORKFLOW.TASK_CREATED, {
        taskId, instanceId, tenantId,
        userId: user.id, userEmail: user.email,
        entityType, entityId, action: step.action,
        dueDate,
      });
    }
  }

  return taskId;
}

/**
 * Approve or reject a workflow task.
 */
async function processTaskAction({ taskId, tenantId, userId, action, comments }) {
  if (!['APPROVE', 'REJECT'].includes(action)) {
    throw Object.assign(new Error('Invalid action. Use APPROVE or REJECT'), { statusCode: 400 });
  }

  const [task] = await sequelize.query(
    `SELECT wt.*, wi.current_step, wi.total_steps, wi.definition_id, wi.entity_type, wi.entity_id, wi.entity_data
     FROM workflow_tasks wt
     JOIN workflow_instances wi ON wi.id = wt.instance_id
     WHERE wt.id = :taskId AND wt.tenant_id = :tenantId AND wt.status = 'PENDING'`,
    { replacements: { taskId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!task) throw Object.assign(new Error('Task not found or already processed'), { statusCode: 404 });

  // Check permission — user must have the required role or be directly assigned
  if (task.assigned_user_id && task.assigned_user_id !== userId) {
    throw Object.assign(new Error('Task not assigned to you'), { statusCode: 403 });
  }

  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

  await sequelize.query(
    `UPDATE workflow_tasks SET status = :status, action_taken = :action,
     acted_by = :userId, comments = :comments, acted_at = NOW(), updated_at = NOW()
     WHERE id = :taskId`,
    { replacements: { status: newStatus, action, userId, comments: comments || null, taskId } }
  );

  if (action === 'REJECT') {
    // Reject the entire workflow instance
    await sequelize.query(
      `UPDATE workflow_instances SET status = 'REJECTED', rejected_by = :userId, updated_at = NOW()
       WHERE id = :instanceId`,
      { replacements: { userId, instanceId: task.instance_id } }
    );

    eventBus.publish(EVENT_TYPES.WORKFLOW.TASK_REJECTED, {
      taskId, instanceId: task.instance_id, tenantId,
      entityType: task.entity_type, entityId: task.entity_id,
      rejectedBy: userId, comments,
    });

    return { instanceId: task.instance_id, status: 'REJECTED' };
  }

  // Advance to next step
  const nextStep = task.current_step + 1;

  if (nextStep > task.total_steps) {
    // Workflow complete
    await sequelize.query(
      `UPDATE workflow_instances SET status = 'COMPLETED', completed_at = NOW(), updated_at = NOW()
       WHERE id = :instanceId`,
      { replacements: { instanceId: task.instance_id } }
    );

    eventBus.publish(EVENT_TYPES.WORKFLOW.WORKFLOW_COMPLETED, {
      instanceId: task.instance_id, tenantId,
      entityType: task.entity_type, entityId: task.entity_id,
    });

    return { instanceId: task.instance_id, status: 'COMPLETED' };
  }

  // Create next task
  const [definition] = await sequelize.query(
    `SELECT config FROM workflow_definitions WHERE id = :id`,
    { replacements: { id: task.definition_id }, type: sequelize.QueryTypes.SELECT }
  );

  const config = typeof definition.config === 'string' ? JSON.parse(definition.config) : definition.config;
  const nextStepConfig = config.steps[nextStep - 1];

  await sequelize.query(
    `UPDATE workflow_instances SET current_step = :nextStep, updated_at = NOW()
     WHERE id = :instanceId`,
    { replacements: { nextStep, instanceId: task.instance_id } }
  );

  await createWorkflowTask({
    tenantId, instanceId: task.instance_id, step: nextStepConfig,
    stepNumber: nextStep, entityType: task.entity_type,
    entityId: task.entity_id,
    entityData: typeof task.entity_data === 'string' ? JSON.parse(task.entity_data) : task.entity_data,
  });

  eventBus.publish(EVENT_TYPES.WORKFLOW.TASK_APPROVED, {
    taskId, instanceId: task.instance_id, tenantId,
    nextStep, approvedBy: userId,
  });

  return { instanceId: task.instance_id, status: 'IN_PROGRESS', currentStep: nextStep };
}

/**
 * Evaluate workflow conditions against entity data.
 */
function evaluateConditions(conditions, entityData) {
  if (!conditions) return true;

  for (const [key, value] of Object.entries(conditions)) {
    if (key === 'amount_gt' && parseFloat(entityData?.amount || 0) <= value) return false;
    if (key === 'amount_lt' && parseFloat(entityData?.amount || 0) >= value) return false;
    if (key === 'type_is' && entityData?.type !== value) return false;
  }

  return true;
}

/**
 * Get pending tasks for a user.
 */
async function getPendingTasks(tenantId, userId, userRoles) {
  return sequelize.query(
    `SELECT wt.*, wi.entity_type, wi.entity_id, wi.entity_data
     FROM workflow_tasks wt
     JOIN workflow_instances wi ON wi.id = wt.instance_id
     WHERE wt.tenant_id = :tenantId
       AND wt.status = 'PENDING'
       AND (wt.assigned_user_id = :userId OR wt.assigned_role = ANY(:roles))
     ORDER BY wt.due_date ASC NULLS LAST, wt.created_at ASC`,
    { replacements: { tenantId, userId, roles: userRoles }, type: sequelize.QueryTypes.SELECT }
  );
}

module.exports = {
  startWorkflow,
  processTaskAction,
  getPendingTasks,
  evaluateConditions,
};
