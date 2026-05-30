/**
 * Response Transformer Middleware
 *
 * Enforces a consistent API response envelope across all endpoints:
 *
 *   Success (single):  { success: true, data: {...}, meta: {...} }
 *   Success (list):    { success: true, data: [...], meta: { total, page, limit, ... } }
 *   Error:             { success: false, code: '...', message: '...', errors?: [...] }
 *
 * Also injects:
 *   - X-Request-ID
 *   - X-Response-Time
 *   - X-API-Version
 */

const { version } = require('../../package.json');

function responseTransformer(req, res, next) {
  const startTime = process.hrtime.bigint();

  // ── Success helpers ────────────────────────────────────────────────────────

  res.success = function (data, meta = {}) {
    const ms = Number(process.hrtime.bigint() - startTime) / 1e6;
    return res
      .status(200)
      .set('X-Response-Time', `${ms.toFixed(2)}ms`)
      .set('X-API-Version', version || '1.0.0')
      .json({
        success: true,
        data,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          ...meta,
        },
      });
  };

  res.successList = function (data, pagination = {}) {
    const ms = Number(process.hrtime.bigint() - startTime) / 1e6;
    return res
      .status(200)
      .set('X-Response-Time', `${ms.toFixed(2)}ms`)
      .set('X-API-Version', version || '1.0.0')
      .json({
        success: true,
        data,
        meta: {
          requestId: req.id,
          timestamp: new Date().toISOString(),
          total: pagination.total ?? data.length,
          page: pagination.page ?? 1,
          limit: pagination.limit ?? data.length,
          totalPages: pagination.totalPages ?? 1,
          ...pagination,
        },
      });
  };

  res.created = function (data, meta = {}) {
    const ms = Number(process.hrtime.bigint() - startTime) / 1e6;
    return res
      .status(201)
      .set('X-Response-Time', `${ms.toFixed(2)}ms`)
      .json({
        success: true,
        data,
        meta: { requestId: req.id, timestamp: new Date().toISOString(), ...meta },
      });
  };

  res.noContent = function () {
    return res.status(204).end();
  };

  // ── Error helpers ──────────────────────────────────────────────────────────

  res.badRequest = function (message, errors = [], code = 'VALIDATION_ERROR') {
    return res.status(400).json({
      success: false,
      code,
      message,
      errors,
      meta: { requestId: req.id, timestamp: new Date().toISOString() },
    });
  };

  res.unauthorized = function (message = 'Authentication required') {
    return res.status(401).json({
      success: false,
      code: 'UNAUTHORIZED',
      message,
      meta: { requestId: req.id },
    });
  };

  res.forbidden = function (message = 'You do not have permission to perform this action') {
    return res.status(403).json({
      success: false,
      code: 'FORBIDDEN',
      message,
      meta: { requestId: req.id },
    });
  };

  res.notFound = function (resource = 'Resource') {
    return res.status(404).json({
      success: false,
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      meta: { requestId: req.id },
    });
  };

  res.conflict = function (message, code = 'CONFLICT') {
    return res.status(409).json({
      success: false,
      code,
      message,
      meta: { requestId: req.id },
    });
  };

  res.integrityError = function (err) {
    return res.status(422).json({
      success: false,
      code: err.code || 'FINANCIAL_INTEGRITY_VIOLATION',
      message: err.message,
      violations: err.violations || [],
      meta: { requestId: req.id },
    });
  };

  res.serverError = function (message = 'Internal server error', code = 'SERVER_ERROR') {
    return res.status(500).json({
      success: false,
      code,
      message,
      meta: { requestId: req.id },
    });
  };

  next();
}

module.exports = responseTransformer;
