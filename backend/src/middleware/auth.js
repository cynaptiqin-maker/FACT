'use strict';

const jwt = require('jsonwebtoken');
const { sequelize } = require('../config/database');
const { tenantCache } = require('../shared/cache/cacheService');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not set');
}

/**
 * JWT Authentication Middleware
 * Validates Bearer token, loads user context into req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Provide a Bearer token.',
      });
    }

    const token = authHeader.substring(7);

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET, {
        algorithms: ['HS256'],
        issuer: 'fact-finos',
      });
    } catch (jwtErr) {
      const message =
        jwtErr.name === 'TokenExpiredError'
          ? 'Token expired. Please refresh your session.'
          : 'Invalid token. Please login again.';
      return res.status(401).json({ success: false, error: message });
    }

    // Check token blacklist (revoked tokens)
    const { getRedisClient } = require('../config/redis');
    const blacklisted = await getRedisClient().get(`fact:blacklist:${token.slice(-20)}`);
    if (blacklisted) {
      return res.status(401).json({ success: false, error: 'Token has been revoked.' });
    }

    // Load user from cache or DB
    const tenantId = decoded.tenantId || req.tenantId;
    const cacheKey = `user:${decoded.sub}`;
    let user = await tenantCache.get(tenantId, 'auth', cacheKey);

    if (!user) {
      const [dbUser] = await sequelize.query(
        `SELECT u.id, u.email, u.full_name AS name, u.is_active, u.mfa_enabled,
                u.tenant_id, u.failed_login_attempts, u.locked_until,
                array_agg(DISTINCT r.name) as roles,
                array_agg(DISTINCT p.code) as permissions
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE u.id = :userId AND u.tenant_id = :tenantId
         GROUP BY u.id`,
        {
          replacements: { userId: decoded.sub, tenantId },
          type: sequelize.QueryTypes.SELECT,
        }
      );

      if (!dbUser) {
        return res.status(401).json({ success: false, error: 'User not found.' });
      }

      user = dbUser;
      await tenantCache.set(tenantId, 'auth', cacheKey, user, { ttl: 300 });
    }

    if (!user.is_active) {
      return res.status(401).json({ success: false, error: 'Account is deactivated.' });
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(401).json({
        success: false,
        error: `Account locked until ${user.locked_until}. Too many failed login attempts.`,
      });
    }

    // Attach to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenant_id,
      roles: Array.isArray(user.roles) ? user.roles.filter(Boolean) : [],
      permissions: Array.isArray(user.permissions) ? user.permissions.filter(Boolean) : [],
      mfaEnabled: user.mfa_enabled,
    };

    req.tenantId = user.tenant_id;

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication — populates req.user if token present, doesn't fail if not.
 */
async function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
}

/**
 * Generate access token.
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    issuer: 'fact-finos',
  });
}

/**
 * Generate refresh token.
 */
function generateRefreshToken(payload) {
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
  return jwt.sign(payload, REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'fact-finos',
  });
}

/**
 * Verify refresh token.
 */
function verifyRefreshToken(token) {
  const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + '_refresh';
  return jwt.verify(token, REFRESH_SECRET, { algorithms: ['HS256'], issuer: 'fact-finos' });
}

/**
 * Blacklist a token (logout).
 */
async function blacklistToken(token) {
  const { getRedisClient } = require('../config/redis');
  const client = getRedisClient();
  // Store last 20 chars as key (tokens are long, this saves space)
  const key = `fact:blacklist:${token.slice(-20)}`;
  // Expire after JWT_EXPIRES_IN
  await client.setex(key, 15 * 60, '1'); // 15 minutes
}

/**
 * Role-based access control middleware.
 * Pass one or more allowed roles: requireRole('admin', 'manager')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient role.' });
    }
    next();
  };
}

/**
 * Permission-based access control middleware.
 * Checks req.user.permissions array for the required permission string.
 * Admins bypass all permission checks.
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (req.user.role === 'admin') return next();
    const perms = req.user.permissions || [];
    if (!perms.includes(permission)) {
      return res.status(403).json({ success: false, error: `Permission required: ${permission}` });
    }
    next();
  };
}

module.exports = {
  authenticate,
  optionalAuthenticate,
  requireRole,
  requirePermission,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  blacklistToken,
};
