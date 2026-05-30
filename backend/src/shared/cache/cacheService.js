'use strict';

const { getRedisClient } = require('../../config/redis');
const logger = require('../utils/logger');

const DEFAULT_TTL = parseInt(process.env.REDIS_TTL_DEFAULT, 10) || 3600;
const KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'fact:';

/**
 * Redis Cache Service
 * Provides tag-based cache invalidation and structured key management.
 */

/**
 * Build a namespaced cache key.
 */
function buildKey(namespace, key) {
  return `${KEY_PREFIX}cache:${namespace}:${key}`;
}

/**
 * Build tag index key.
 */
function buildTagKey(tag) {
  return `${KEY_PREFIX}tag:${tag}`;
}

/**
 * Get a cached value.
 *
 * @param {string} namespace
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(namespace, key) {
  const client = getRedisClient();
  const cacheKey = buildKey(namespace, key);

  try {
    const value = await client.get(cacheKey);
    if (value === null) return null;
    return JSON.parse(value);
  } catch (err) {
    logger.warn('Cache get error', { namespace, key, error: err.message });
    return null;
  }
}

/**
 * Set a cached value with optional TTL and tags.
 *
 * @param {string} namespace
 * @param {string} key
 * @param {any} value
 * @param {Object} [options]
 * @param {number} [options.ttl=3600] - TTL in seconds
 * @param {string[]} [options.tags=[]] - Cache tags for group invalidation
 */
async function set(namespace, key, value, options = {}) {
  const { ttl = DEFAULT_TTL, tags = [] } = options;
  const client = getRedisClient();
  const cacheKey = buildKey(namespace, key);

  try {
    const serialized = JSON.stringify(value);
    await client.setex(cacheKey, ttl, serialized);

    // Register key under each tag for group invalidation
    if (tags.length > 0) {
      const pipeline = client.pipeline();
      for (const tag of tags) {
        pipeline.sadd(buildTagKey(tag), cacheKey);
        pipeline.expire(buildTagKey(tag), ttl + 60);
      }
      await pipeline.exec();
    }
  } catch (err) {
    logger.warn('Cache set error', { namespace, key, error: err.message });
  }
}

/**
 * Delete a specific cache key.
 */
async function del(namespace, key) {
  const client = getRedisClient();
  const cacheKey = buildKey(namespace, key);
  try {
    await client.del(cacheKey);
  } catch (err) {
    logger.warn('Cache delete error', { namespace, key, error: err.message });
  }
}

/**
 * Invalidate all keys associated with a tag.
 *
 * @param {string} tag
 */
async function invalidateTag(tag) {
  const client = getRedisClient();
  const tagKey = buildTagKey(tag);

  try {
    const keys = await client.smembers(tagKey);
    if (keys.length > 0) {
      const pipeline = client.pipeline();
      keys.forEach((k) => pipeline.del(k));
      pipeline.del(tagKey);
      await pipeline.exec();
      logger.debug('Cache tag invalidated', { tag, keysCleared: keys.length });
    }
  } catch (err) {
    logger.warn('Cache tag invalidation error', { tag, error: err.message });
  }
}

/**
 * Invalidate multiple tags at once.
 */
async function invalidateTags(tags) {
  await Promise.all(tags.map(invalidateTag));
}

/**
 * Cache-aside helper: get from cache or compute and store.
 *
 * @param {string} namespace
 * @param {string} key
 * @param {Function} fetchFn - async function that returns the value
 * @param {Object} [options]
 */
async function getOrSet(namespace, key, fetchFn, options = {}) {
  const cached = await get(namespace, key);
  if (cached !== null) return cached;

  const value = await fetchFn();
  if (value !== null && value !== undefined) {
    await set(namespace, key, value, options);
  }
  return value;
}

/**
 * Tenant-specific cache helpers.
 */
const tenantCache = {
  get: (tenantId, namespace, key) => get(`tenant:${tenantId}:${namespace}`, key),
  set: (tenantId, namespace, key, value, options = {}) =>
    set(`tenant:${tenantId}:${namespace}`, key, value, {
      ...options,
      tags: [...(options.tags || []), `tenant:${tenantId}`],
    }),
  del: (tenantId, namespace, key) => del(`tenant:${tenantId}:${namespace}`, key),
  invalidate: (tenantId) => invalidateTag(`tenant:${tenantId}`),
  getOrSet: (tenantId, namespace, key, fetchFn, options = {}) =>
    getOrSet(`tenant:${tenantId}:${namespace}`, key, fetchFn, {
      ...options,
      tags: [...(options.tags || []), `tenant:${tenantId}`],
    }),
};

/**
 * Rate limiting helper using Redis.
 */
async function rateCheck(identifier, limit, windowSeconds) {
  const client = getRedisClient();
  const key = `${KEY_PREFIX}rate:${identifier}`;

  const current = await client.incr(key);
  if (current === 1) {
    await client.expire(key, windowSeconds);
  }

  return {
    count: current,
    limit,
    remaining: Math.max(0, limit - current),
    exceeded: current > limit,
  };
}

module.exports = {
  get,
  set,
  del,
  invalidateTag,
  invalidateTags,
  getOrSet,
  tenantCache,
  rateCheck,
  buildKey,
};
