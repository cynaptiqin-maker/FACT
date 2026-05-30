'use strict';

const { sequelize } = require('../config/database');
const { tenantCache } = require('../shared/cache/cacheService');
const logger = require('../shared/utils/logger');

const DEFAULT_TENANT_ID = process.env.DEFAULT_TENANT_ID || '00000000-0000-0000-0000-000000000001';

/**
 * Multi-Tenant Middleware
 *
 * Extracts tenant context from:
 *   1. X-Tenant-ID header
 *   2. JWT token (decoded by auth middleware)
 *   3. Subdomain (e.g., hospital1.fact.com)
 *   4. Default tenant (for single-tenant deployments)
 *
 * Populates req.tenantId and req.tenant
 */
async function tenantMiddleware(req, res, next) {
  try {
    let tenantId =
      req.headers['x-tenant-id'] ||
      req.user?.tenantId ||
      extractSubdomainTenant(req) ||
      null;

    // Single-tenant mode
    if (!tenantId && process.env.MULTI_TENANT_MODE !== 'true') {
      tenantId = DEFAULT_TENANT_ID;
    }

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Tenant context required. Provide X-Tenant-ID header.',
      });
    }

    // Validate tenant ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      return res.status(400).json({ success: false, error: 'Invalid tenant ID format.' });
    }

    // Load tenant from cache or DB
    const cacheKey = `info:${tenantId}`;
    let tenant = await tenantCache.get(tenantId, 'tenant', cacheKey);

    if (!tenant) {
      const [dbTenant] = await sequelize.query(
        `SELECT id, name, code, plan AS subscription_plan, is_active, settings
         FROM tenants WHERE id = :tenantId`,
        {
          replacements: { tenantId },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!dbTenant) {
        return res.status(404).json({ success: false, error: 'Tenant not found.' });
      }

      tenant = dbTenant;
      await tenantCache.set(tenantId, 'tenant', cacheKey, tenant, { ttl: 600 });
    }

    if (!tenant.is_active) {
      return res.status(403).json({ success: false, error: 'Tenant account is suspended.' });
    }

    req.tenantId = tenantId;
    req.tenant = tenant;

    next();
  } catch (err) {
    logger.error('Tenant middleware error', { error: err.message });
    next(err);
  }
}

/**
 * Extract tenant from subdomain.
 * E.g., apollo.fact.com → look up tenant by code 'apollo'
 */
function extractSubdomainTenant(req) {
  const host = req.hostname;
  const baseDomain = process.env.BASE_DOMAIN;
  if (!baseDomain || !host.endsWith(baseDomain)) return null;

  const subdomain = host.replace(`.${baseDomain}`, '');
  if (!subdomain || subdomain === 'www' || subdomain === 'api') return null;

  // Return subdomain as code — actual tenant lookup happens in middleware
  return req._subdomainCode = subdomain;
}

module.exports = { tenantMiddleware };
