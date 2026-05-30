'use strict';

const { logEvent } = require('./auditLogger');

/**
 * Express middleware factory that auto-logs write operations.
 * Wraps res.json to capture response body for after-state.
 */
function auditMiddleware(entity, action) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode < 400 && req.user) {
        const entityId =
          req.params.id || body?.data?.id || body?.id || null;

        logEvent({
          tenantId: req.tenantId,
          userId: req.user.id,
          userEmail: req.user.email,
          userRole: req.user.role,
          action,
          entity,
          entityId,
          before: req.auditBefore || null,
          after: body?.data || body || null,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          module: req.module,
        }).catch(() => {}); // Non-blocking
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = { auditMiddleware };
