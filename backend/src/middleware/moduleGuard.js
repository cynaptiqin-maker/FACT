'use strict';

const { sequelize } = require('../config/database');
const { tenantCache } = require('../shared/cache/cacheService');
const { MODULE_STATUS, getModule } = require('../config/modules.config');

/**
 * Module Guard Middleware
 * Checks if a module is enabled for the current tenant before routing.
 */
function moduleGuard(moduleId) {
  const moduleConfig = getModule(moduleId);

  return async (req, res, next) => {
    try {
      // Core modules always pass
      if (moduleConfig && moduleConfig.status === MODULE_STATUS.CORE) {
        return next();
      }

      const tenantId = req.tenantId;
      if (!tenantId) {
        return res.status(400).json({ success: false, error: 'Tenant context required.' });
      }

      // Check module status from cache or DB
      const cacheKey = `modules:${tenantId}`;
      let enabledModules = await tenantCache.get(tenantId, 'tenant', cacheKey);

      if (!enabledModules) {
        const rows = await sequelize.query(
          `SELECT module_id, is_enabled FROM tenant_modules WHERE tenant_id = :tenantId`,
          {
            replacements: { tenantId },
            type: sequelize.QueryTypes.SELECT,
          }
        );

        enabledModules = rows.reduce((acc, row) => {
          acc[row.module_id] = row.is_enabled;
          return acc;
        }, {});

        await tenantCache.set(tenantId, 'tenant', cacheKey, enabledModules, { ttl: 300 });
      }

      const isEnabled = enabledModules[moduleId];

      if (!isEnabled) {
        return res.status(402).json({
          success: false,
          error: `Module '${moduleConfig?.name || moduleId}' is not enabled for your subscription.`,
          moduleId,
          code: 'MODULE_NOT_ENABLED',
        });
      }

      // Check API key requirement
      if (moduleConfig?.requiresApiKey) {
        const apiKeyEnv = process.env[moduleConfig.requiresApiKey];
        if (!apiKeyEnv) {
          return res.status(503).json({
            success: false,
            error: `Module requires ${moduleConfig.requiresApiKey} to be configured.`,
            moduleId,
            code: 'MODULE_MISSING_CONFIG',
          });
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { moduleGuard };
