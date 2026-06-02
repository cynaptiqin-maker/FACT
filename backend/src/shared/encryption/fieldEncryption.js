'use strict';

/**
 * Field-Level AES-256-GCM Encryption Service
 *
 * Encrypted format: "v1:<b64-iv>:<b64-ciphertext>:<b64-authtag>"
 *
 * Key source: FIELD_ENCRYPTION_KEY env var — must be a 64-char hex string (32 bytes).
 * Generate a real key with: openssl rand -hex 32
 */

const crypto = require('crypto');

const ALGO       = 'aes-256-gcm';
const IV_BYTES   = 16;
const TAG_BYTES  = 16;
const PREFIX     = 'v1:';
const DEV_DUMMY  = '0'.repeat(64);

function resolveKey() {
  const raw = process.env.FIELD_ENCRYPTION_KEY;
  if (!raw || raw.trim() === '') {
    const env = process.env.NODE_ENV;
    if (env && env !== 'development' && env !== 'test') {
      throw new Error(
        '[fieldEncryption] FATAL: FIELD_ENCRYPTION_KEY must be set in production. ' +
        'Generate one with: openssl rand -hex 32'
      );
    }
    console.warn(
      '[fieldEncryption] WARNING: FIELD_ENCRYPTION_KEY is not set. ' +
      'Using dev-only dummy key — DO NOT use in production. ' +
      'Generate a real key with: openssl rand -hex 32'
    );
    return Buffer.from(DEV_DUMMY, 'hex');
  }
  if (raw.trim().length !== 64) {
    throw new Error(
      '[fieldEncryption] FIELD_ENCRYPTION_KEY must be exactly 64 hex characters (32 bytes).'
    );
  }
  return Buffer.from(raw.trim(), 'hex');
}

// Resolved once at module load time.
const KEY = resolveKey();

/**
 * Encrypt a plaintext string.
 * @param {string} plaintext
 * @returns {string}  "v1:<b64-iv>:<b64-ciphertext>:<b64-authtag>"
 */
function encrypt(plaintext) {
  const iv     = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGO, KEY, iv, { authTagLength: TAG_BYTES });
  const ct     = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag    = cipher.getAuthTag();
  return `${PREFIX}${iv.toString('base64')}:${ct.toString('base64')}:${tag.toString('base64')}`;
}

/**
 * Decrypt a value produced by encrypt().
 * @param {string} ciphertext  "v1:<b64-iv>:<b64-ciphertext>:<b64-authtag>"
 * @returns {string}
 */
function decrypt(ciphertext) {
  const parts = String(ciphertext).split(':');
  // parts: [ 'v1', b64iv, b64ct, b64tag ]
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('[fieldEncryption] Invalid ciphertext format.');
  }
  const iv      = Buffer.from(parts[1], 'base64');
  const ct      = Buffer.from(parts[2], 'base64');
  const tag     = Buffer.from(parts[3], 'base64');
  const decipher = crypto.createDecipheriv(ALGO, KEY, iv, { authTagLength: TAG_BYTES });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

/** Returns true if value looks like a v1-encrypted blob. */
function isEncrypted(value) {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/** Encrypt only if value is truthy; returns null otherwise. */
function encryptIfPresent(value) {
  return value ? encrypt(value) : null;
}

/**
 * Decrypt if value is a v1 blob; return as-is if plaintext (migration path);
 * return null if falsy.
 */
function decryptIfPresent(value) {
  if (!value) return null;
  return isEncrypted(value) ? decrypt(value) : value;
}

module.exports = { encrypt, decrypt, isEncrypted, encryptIfPresent, decryptIfPresent };
