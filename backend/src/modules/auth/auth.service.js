'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken, blacklistToken } = require('../../middleware/auth');
const { verifyMFAToken, verifyBackupCode } = require('./mfa.service');
const { logEvent, AUDIT_ACTIONS } = require('../../shared/audit/auditLogger');
const { tenantCache } = require('../../shared/cache/cacheService');
const logger = require('../../shared/utils/logger');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MINUTES = 30;
const BCRYPT_ROUNDS = 12;

/**
 * Login a user with email/password and optional MFA.
 */
async function login({ email, password, mfaToken, tenantId, ipAddress, userAgent }) {
  // Find user
  const [user] = await sequelize.query(
    `SELECT u.*, array_agg(DISTINCT r.name) as roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.email = :email AND u.tenant_id = :tenantId
     GROUP BY u.id`,
    { replacements: { email: email.toLowerCase(), tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!user) {
    await logEvent({
      tenantId, action: AUDIT_ACTIONS.LOGIN_FAILED, entity: 'User',
      entityId: null, metadata: { email, reason: 'User not found' }, ipAddress,
    });
    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  // Check account lock
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw Object.assign(
      new Error(`Account locked until ${user.locked_until}. Too many failed attempts.`),
      { statusCode: 401 }
    );
  }

  if (!user.is_active) {
    throw Object.assign(new Error('Account is deactivated. Contact administrator.'), { statusCode: 401 });
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, user.password_hash);

  if (!passwordValid) {
    // Increment failed attempts
    const attempts = (user.failed_login_attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS
      ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
      : null;

    await sequelize.query(
      `UPDATE users SET failed_login_attempts = :attempts, locked_until = :lockedUntil WHERE id = :id`,
      { replacements: { attempts, lockedUntil, id: user.id } }
    );

    await logEvent({
      tenantId, userId: user.id, userEmail: email, action: AUDIT_ACTIONS.LOGIN_FAILED,
      entity: 'User', entityId: user.id, metadata: { attempts }, ipAddress,
    });

    if (lockedUntil) {
      throw Object.assign(
        new Error(`Too many failed attempts. Account locked for ${LOCK_DURATION_MINUTES} minutes.`),
        { statusCode: 401 }
      );
    }

    throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  }

  // Verify MFA if enabled
  if (user.mfa_enabled) {
    if (!mfaToken) {
      return { requiresMFA: true, message: 'MFA token required.', userId: user.id };
    }

    const mfaValid = verifyMFAToken(user.mfa_secret, mfaToken) ||
                     await verifyBackupCode(user.id, tenantId, mfaToken);

    if (!mfaValid) {
      await logEvent({
        tenantId, userId: user.id, userEmail: email, action: AUDIT_ACTIONS.LOGIN_FAILED,
        entity: 'User', entityId: user.id, metadata: { reason: 'Invalid MFA token' }, ipAddress,
      });
      throw Object.assign(new Error('Invalid MFA token.'), { statusCode: 401 });
    }
  }

  // Reset failed attempts on successful login
  await sequelize.query(
    `UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = :id`,
    { replacements: { id: user.id } }
  );

  // Generate tokens
  const tokenPayload = {
    sub: user.id,
    email: user.email,
    tenantId: user.tenant_id,
    roles: (user.roles || []).filter(Boolean),
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  // Store refresh token hash in DB
  const refreshHash = await bcrypt.hash(refreshToken.slice(-20), 8);
  await sequelize.query(
    `INSERT INTO refresh_tokens (id, user_id, tenant_id, token_hash, expires_at, ip_address, created_at)
     VALUES (:id, :userId, :tenantId, :tokenHash, :expiresAt, :ipAddress, NOW())`,
    {
      replacements: {
        id: uuidv4(),
        userId: user.id,
        tenantId,
        tokenHash: refreshHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        ipAddress,
      },
    }
  );

  // Invalidate user cache
  await tenantCache.del(tenantId, 'auth', `user:${user.id}`);

  await logEvent({
    tenantId, userId: user.id, userEmail: email, userRole: tokenPayload.roles[0],
    action: AUDIT_ACTIONS.LOGIN, entity: 'User', entityId: user.id, ipAddress, userAgent,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: tokenPayload.roles,
      tenantId: user.tenant_id,
      mfaEnabled: user.mfa_enabled,
    },
  };
}

/**
 * Refresh access token using refresh token.
 */
async function refreshAccessToken(refreshToken, tenantId) {
  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw Object.assign(new Error('Invalid or expired refresh token.'), { statusCode: 401 });
  }

  const [user] = await sequelize.query(
    `SELECT u.id, u.email, u.tenant_id, u.is_active, array_agg(DISTINCT r.name) as roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = :userId AND u.tenant_id = :tenantId AND u.is_active = true
     GROUP BY u.id`,
    { replacements: { userId: decoded.sub, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!user) {
    throw Object.assign(new Error('User not found or inactive.'), { statusCode: 401 });
  }

  const tokenPayload = {
    sub: user.id,
    email: user.email,
    tenantId: user.tenant_id,
    roles: (user.roles || []).filter(Boolean),
  };

  return {
    accessToken: generateAccessToken(tokenPayload),
    refreshToken: generateRefreshToken(tokenPayload),
  };
}

/**
 * Logout user — blacklist current access token.
 */
async function logout(userId, tenantId, accessToken) {
  await blacklistToken(accessToken);

  // Delete refresh tokens for this user
  await sequelize.query(
    `DELETE FROM refresh_tokens WHERE user_id = :userId AND tenant_id = :tenantId`,
    { replacements: { userId, tenantId } }
  );

  await tenantCache.del(tenantId, 'auth', `user:${userId}`);

  await logEvent({
    tenantId, userId, action: AUDIT_ACTIONS.LOGOUT, entity: 'User', entityId: userId,
  });
}

/**
 * Change user password.
 */
async function changePassword(userId, tenantId, currentPassword, newPassword) {
  const [user] = await sequelize.query(
    `SELECT id, password_hash FROM users WHERE id = :userId AND tenant_id = :tenantId`,
    { replacements: { userId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!user) throw Object.assign(new Error('User not found.'), { statusCode: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) throw Object.assign(new Error('Current password is incorrect.'), { statusCode: 400 });

  if (newPassword.length < 8) {
    throw Object.assign(new Error('Password must be at least 8 characters.'), { statusCode: 400 });
  }

  const hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await sequelize.query(
    `UPDATE users SET password_hash = :hash, password_changed_at = NOW(), updated_at = NOW() WHERE id = :userId`,
    { replacements: { hash, userId } }
  );

  await logEvent({
    tenantId, userId, action: AUDIT_ACTIONS.PASSWORD_CHANGED, entity: 'User', entityId: userId,
  });
}

/**
 * Create a new user.
 */
async function createUser({ tenantId, email, name, password, roleIds, createdBy }) {
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const id = uuidv4();

  await sequelize.transaction(async (t) => {
    await sequelize.query(
      `INSERT INTO users (id, tenant_id, email, name, password_hash, is_active, created_at, updated_at)
       VALUES (:id, :tenantId, :email, :name, :hash, true, NOW(), NOW())`,
      { replacements: { id, tenantId, email: email.toLowerCase(), name, hash }, transaction: t }
    );

    for (const roleId of (roleIds || [])) {
      await sequelize.query(
        `INSERT INTO user_roles (id, user_id, role_id, created_at) VALUES (:id, :userId, :roleId, NOW())`,
        { replacements: { id: uuidv4(), userId: id, roleId }, transaction: t }
      );
    }
  });

  await logEvent({
    tenantId, userId: createdBy, action: AUDIT_ACTIONS.USER_CREATED,
    entity: 'User', entityId: id, after: { email, name, roleIds },
  });

  return { id, email, name };
}

module.exports = { login, refreshAccessToken, logout, changePassword, createUser, BCRYPT_ROUNDS };
