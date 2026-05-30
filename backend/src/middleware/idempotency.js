/**
 * Idempotency Middleware
 *
 * Prevents duplicate financial submissions by caching responses keyed on
 * the Idempotency-Key header. Applies to POST/PATCH mutations only.
 *
 * Clients must send:   Idempotency-Key: <client-generated-uuid>
 * The server caches the response for 24 hours.
 * A second request with the same key returns the cached response immediately.
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../shared/utils/logger');

const IDEMPOTENCY_TTL = 86400; // 24 hours
const LOCK_TTL = 30;           // 30s processing lock (prevents race on concurrent identical requests)
const IDEMPOTENCY_METHODS = new Set(['POST', 'PATCH']);

/**
 * Routes that must always be idempotent (financial mutations).
 * If not listed, idempotency is opt-in via the Idempotency-Key header.
 */
const REQUIRED_IDEMPOTENCY_ROUTES = new Set([
  '/api/billing/invoices',
  '/api/billing/invoices/:id/payment',
  '/api/billing/invoices/:id/finalize',
  '/api/accounting/journals',
  '/api/accounting/journals/:id/post',
  '/api/accounting/journals/:id/reverse',
  '/api/ar/payments',
  '/api/ap/vendor-invoices/:id/pay',
  '/api/payroll/runs',
  '/api/doctor-payout/runs',
  '/api/assets/depreciation-runs',
  '/api/insurance/claims/:id/settle',
  '/api/cash-bank/transactions',
]);

function idempotencyMiddleware(redisClient) {
  return async function idempotency(req, res, next) {
    if (!IDEMPOTENCY_METHODS.has(req.method)) return next();

    const key = req.headers['idempotency-key'];

    // For required routes, enforce the header
    const isRequired = [...REQUIRED_IDEMPOTENCY_ROUTES].some((pattern) =>
      req.path.replace(/\/[0-9a-f-]{36}/gi, '/:id').startsWith(pattern.split('/:id')[0])
    );

    if (isRequired && !key) {
      return res.status(400).json({
        success: false,
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message:
          'Financial mutations require an Idempotency-Key header to prevent duplicate submissions.',
      });
    }

    if (!key) return next(); // Optional — not a financial mutation

    const tenantId = req.tenantId || 'default';
    const cacheKey = `idempotency:${tenantId}:${key}`;
    const lockKey = `idempotency-lock:${tenantId}:${key}`;

    try {
      // Check for a cached response
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const payload = JSON.parse(cached);
        logger.info('[Idempotency] Returning cached response', {
          key,
          tenantId,
          requestId: req.id,
          path: req.path,
        });
        return res
          .status(payload.status)
          .set('X-Idempotency-Replayed', 'true')
          .json(payload.body);
      }

      // Acquire processing lock to block concurrent duplicate requests
      const locked = await redisClient.set(lockKey, req.id, 'EX', LOCK_TTL, 'NX');
      if (!locked) {
        return res.status(409).json({
          success: false,
          code: 'IDEMPOTENCY_CONFLICT',
          message: 'A request with this Idempotency-Key is already being processed. Please wait.',
        });
      }

      // Intercept the response to cache it
      const originalJson = res.json.bind(res);
      res.json = async function (body) {
        try {
          // Only cache 2xx responses
          if (res.statusCode >= 200 && res.statusCode < 300) {
            await redisClient.setex(
              cacheKey,
              IDEMPOTENCY_TTL,
              JSON.stringify({ status: res.statusCode, body })
            );
          }
        } catch (err) {
          logger.warn('[Idempotency] Failed to cache response', { key, error: err.message });
        } finally {
          await redisClient.del(lockKey).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      // If Redis is unavailable, proceed without idempotency (degrade gracefully)
      logger.warn('[Idempotency] Redis unavailable — proceeding without idempotency check', {
        error: err.message,
        key,
      });
      next();
    }
  };
}

/**
 * Generate a client-side idempotency key suggestion.
 * Used in response headers so clients know the format expected.
 */
function generateIdempotencyKey() {
  return uuidv4();
}

module.exports = { idempotencyMiddleware, generateIdempotencyKey };
