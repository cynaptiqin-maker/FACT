'use strict';

const { sequelize } = require('../../../config/database');
const { MODULES, checkDependencies, getDependents, MODULE_STATUS } = require('../../../config/modules.config');
const { tenantCache } = require('../../../shared/cache/cacheService');
const { logEvent, AUDIT_ACTIONS } = require('../../../shared/audit/auditLogger');
const { eventBus } = require('../../../shared/events/eventBus');
const { EVENT_TYPES } = require('../../../shared/events/eventTypes');

/**
 * Module Manager Service
 * Controls which modules are enabled per tenant.
 */

/**
 * Get module status for a tenant.
 */
async function getTenantModules(tenantId) {
  const rows = await sequelize.query(
    `SELECT module_id, is_enabled, enabled_at, enabled_by FROM tenant_modules WHERE tenant_id = :tenantId`,
    { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  const moduleStatusMap = rows.reduce((acc, row) => {
    acc[row.module_id] = row;
    return acc;
  }, {});

  return MODULES.map((mod) => ({
    ...mod,
    isEnabled: mod.status === MODULE_STATUS.CORE || (moduleStatusMap[mod.id]?.is_enabled === true),
    enabledAt: moduleStatusMap[mod.id]?.enabled_at || null,
    enabledBy: moduleStatusMap[mod.id]?.enabled_by || null,
  }));
}

/**
 * Enable a module for a tenant.
 */
async function enableModule(tenantId, moduleId, enabledBy) {
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod) throw Object.assign(new Error(`Module '${moduleId}' not found`), { statusCode: 404 });

  if (mod.status === MODULE_STATUS.CORE) {
    throw Object.assign(new Error('Core modules are always enabled and cannot be managed'), { statusCode: 400 });
  }

  // Check dependencies
  const currentModules = await getTenantModules(tenantId);
  const enabledIds = currentModules.filter((m) => m.isEnabled).map((m) => m.id);
  const { satisfied, missing } = checkDependencies(moduleId, enabledIds);

  if (!satisfied) {
    throw Object.assign(
      new Error(`Cannot enable '${mod.name}'. Required modules not enabled: ${missing.join(', ')}`),
      { statusCode: 400 }
    );
  }

  await sequelize.query(
    `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, enabled_at, enabled_by, created_at, updated_at)
     VALUES (gen_random_uuid(), :tenantId, :moduleId, true, NOW(), :enabledBy, NOW(), NOW())
     ON CONFLICT (tenant_id, module_id)
     DO UPDATE SET is_enabled = true, enabled_at = NOW(), enabled_by = :enabledBy, updated_at = NOW()`,
    { replacements: { tenantId, moduleId, enabledBy } }
  );

  // Invalidate cache
  await tenantCache.del(tenantId, 'tenant', `modules:${tenantId}`);

  await logEvent({
    tenantId, userId: enabledBy, action: AUDIT_ACTIONS.MODULE_ENABLED,
    entity: 'Module', entityId: moduleId, after: { moduleId, moduleName: mod.name },
  });

  eventBus.publish(EVENT_TYPES.SYSTEM.MODULE_ENABLED, { tenantId, moduleId, enabledBy });

  return { moduleId, moduleName: mod.name, isEnabled: true, enabledAt: new Date().toISOString() };
}

/**
 * Disable a module for a tenant.
 */
async function disableModule(tenantId, moduleId, disabledBy, force = false) {
  const mod = MODULES.find((m) => m.id === moduleId);
  if (!mod) throw Object.assign(new Error(`Module '${moduleId}' not found`), { statusCode: 404 });

  if (mod.status === MODULE_STATUS.CORE) {
    throw Object.assign(new Error('Core modules cannot be disabled'), { statusCode: 400 });
  }

  // Check if other enabled modules depend on this one
  if (!force) {
    const currentModules = await getTenantModules(tenantId);
    const enabledIds = currentModules.filter((m) => m.isEnabled).map((m) => m.id);
    const dependents = getDependents(moduleId).filter((d) => enabledIds.includes(d.id));

    if (dependents.length > 0) {
      throw Object.assign(
        new Error(`Cannot disable '${mod.name}'. These enabled modules depend on it: ${dependents.map((d) => d.name).join(', ')}`),
        { statusCode: 400 }
      );
    }
  }

  await sequelize.query(
    `UPDATE tenant_modules SET is_enabled = false, updated_at = NOW()
     WHERE tenant_id = :tenantId AND module_id = :moduleId`,
    { replacements: { tenantId, moduleId } }
  );

  await tenantCache.del(tenantId, 'tenant', `modules:${tenantId}`);

  await logEvent({
    tenantId, userId: disabledBy, action: AUDIT_ACTIONS.MODULE_DISABLED,
    entity: 'Module', entityId: moduleId,
  });

  eventBus.publish(EVENT_TYPES.SYSTEM.MODULE_DISABLED, { tenantId, moduleId, disabledBy });

  return { moduleId, moduleName: mod.name, isEnabled: false };
}

/**
 * Initialize default modules for a new tenant.
 */
async function initTenantModules(tenantId, plan = 'standard') {
  const defaultEnabled = MODULES.filter(
    (m) => m.status === MODULE_STATUS.ENABLED || m.status === MODULE_STATUS.CORE
  );

  for (const mod of defaultEnabled) {
    await sequelize.query(
      `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at, updated_at)
       VALUES (gen_random_uuid(), :tenantId, :moduleId, true, NOW(), NOW())
       ON CONFLICT (tenant_id, module_id) DO NOTHING`,
      { replacements: { tenantId, moduleId: mod.id } }
    );
  }

  return { tenantId, enabledModules: defaultEnabled.map((m) => m.id) };
}

/**
 * Get module usage statistics.
 */
async function getModuleStats(tenantId) {
  const modules = await getTenantModules(tenantId);
  const enabled = modules.filter((m) => m.isEnabled);
  const disabled = modules.filter((m) => !m.isEnabled);

  const { sequelize } = require('../../../config/database');
  let usageByModule = {};
  try {
    const rows = await sequelize.query(
      `SELECT source_module, COUNT(*) AS action_count
       FROM audit_logs
       WHERE tenant_id = :tenantId
         AND source_module IS NOT NULL
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY source_module`,
      { replacements: { tenantId }, type: sequelize.QueryTypes.SELECT }
    );
    rows.forEach(r => { usageByModule[r.source_module] = Number(r.action_count); });
  } catch (_) {
    // audit_logs may not exist in older schemas; return zero counts gracefully
  }

  return {
    total: modules.length,
    enabled: enabled.length,
    disabled: disabled.length,
    byCategory: modules.reduce((acc, m) => {
      if (!acc[m.category]) acc[m.category] = { total: 0, enabled: 0 };
      acc[m.category].total++;
      if (m.isEnabled) acc[m.category].enabled++;
      return acc;
    }, {}),
    usageLast30Days: usageByModule,
  };
}

module.exports = {
  getTenantModules,
  enableModule,
  disableModule,
  initTenantModules,
  getModuleStats,
};
