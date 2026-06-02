'use strict';

const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { sequelize } = require('../../config/database');
const fieldEncryption = require('../../shared/encryption/fieldEncryption');

const MFA_ISSUER = process.env.MFA_ISSUER || 'FACT FinOS';

/**
 * MFA Service — TOTP-based Two-Factor Authentication
 * Uses speakeasy library for RFC 6238 compliant TOTP generation.
 */

/**
 * Generate a new TOTP secret for a user.
 *
 * @param {string} userEmail
 * @returns {Object} { secret, otpauthUrl, qrCode }
 */
async function generateMFASecret(userEmail) {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `${MFA_ISSUER} (${userEmail})`,
    issuer: MFA_ISSUER,
  });

  // Generate QR code as data URL
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,       // Store this in DB (encrypted)
    otpauthUrl: secret.otpauth_url,
    qrCode,                       // Display to user for scanning
    backupCodes: generateBackupCodes(),
  };
}

/**
 * Decrypt a stored MFA secret (handles both encrypted and legacy plaintext values).
 *
 * @param {string} storedSecret
 * @returns {string}
 */
function decryptSecret(storedSecret) {
  return fieldEncryption.decryptIfPresent(storedSecret);
}

/**
 * Verify a TOTP token against stored secret.
 * Accepts both AES-256-GCM encrypted blobs (v1:…) and legacy plaintext secrets
 * (migration path — decryptIfPresent returns plaintext unchanged).
 *
 * @param {string} storedSecret - Encrypted or plaintext Base32 secret from DB
 * @param {string} token - 6-digit TOTP token from authenticator app
 * @returns {boolean}
 */
function verifyMFAToken(storedSecret, token) {
  const secret = decryptSecret(storedSecret);
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token).replace(/\s/g, ''),
    window: 1, // Allow 30 seconds before/after for clock drift
  });
}

/**
 * Generate 10 single-use backup codes.
 */
function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < 10; i++) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase() +
                 '-' +
                 Math.random().toString(36).substring(2, 8).toUpperCase();
    codes.push(code);
  }
  return codes;
}

/**
 * Enable MFA for a user.
 * Call after user has verified first TOTP token.
 */
async function enableMFA(userId, tenantId, secret, hashedBackupCodes) {
  const encryptedSecret = fieldEncryption.encrypt(secret);
  await sequelize.query(
    `UPDATE users
     SET mfa_enabled = true, mfa_secret = :secret, mfa_backup_codes = :backupCodes, updated_at = NOW()
     WHERE id = :userId AND tenant_id = :tenantId`,
    {
      replacements: {
        userId,
        tenantId,
        secret: encryptedSecret,
        backupCodes: JSON.stringify(hashedBackupCodes),
      },
    }
  );
}

/**
 * Disable MFA for a user.
 */
async function disableMFA(userId, tenantId) {
  await sequelize.query(
    `UPDATE users
     SET mfa_enabled = false, mfa_secret = NULL, mfa_backup_codes = NULL, updated_at = NOW()
     WHERE id = :userId AND tenant_id = :tenantId`,
    { replacements: { userId, tenantId } }
  );
}

/**
 * Verify backup code and mark as used.
 */
async function verifyBackupCode(userId, tenantId, code) {
  const [user] = await sequelize.query(
    `SELECT mfa_backup_codes FROM users WHERE id = :userId AND tenant_id = :tenantId`,
    { replacements: { userId, tenantId }, type: sequelize.QueryTypes.SELECT }
  );

  if (!user || !user.mfa_backup_codes) return false;

  const bcrypt = require('bcryptjs');
  const codes = JSON.parse(user.mfa_backup_codes);

  for (let i = 0; i < codes.length; i++) {
    if (!codes[i].used && await bcrypt.compare(code.toUpperCase(), codes[i].hash)) {
      codes[i].used = true;
      codes[i].usedAt = new Date().toISOString();

      await sequelize.query(
        `UPDATE users SET mfa_backup_codes = :codes WHERE id = :userId`,
        { replacements: { codes: JSON.stringify(codes), userId } }
      );

      return true;
    }
  }

  return false;
}

module.exports = {
  generateMFASecret,
  verifyMFAToken,
  decryptSecret,
  generateBackupCodes,
  enableMFA,
  disableMFA,
  verifyBackupCode,
};
