/**
 * Reliable API Wrapper
 *
 * Wraps every API call with:
 *   - Automatic retry with exponential backoff (network errors / 5xx)
 *   - Idempotency key injection for financial mutations
 *   - Request deduplication for concurrent identical GET requests
 *   - Response normalization (unwrap .data from envelope)
 *   - Detailed error extraction
 *
 * Usage:
 *   import { reliableGet, reliablePost, reliablePatch } from './reliableApi'
 *   const invoice = await reliableGet('/api/billing/invoices/123')
 *   const result = await reliablePost('/api/billing/invoices', payload, { idempotencyKey })
 */

import api from './api';

// ─── Retry configuration ───────────────────────────────────────────────────────

const DEFAULT_RETRY_OPTIONS = {
  retries: 3,
  retryDelay: 1000,        // base delay in ms
  retryOn: (error) => {
    const status = error?.response?.status;
    // Retry on network errors and 5xx, never on 4xx except 429
    if (!status) return true;               // network error
    if (status === 429) return true;        // rate limited
    if (status >= 500) return true;         // server error
    return false;
  },
};

// ─── Pending request dedup map ────────────────────────────────────────────────

const pendingGets = new Map();

// ─── Core wrapper ─────────────────────────────────────────────────────────────

async function withRetry(fn, options = {}) {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError;

  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === opts.retries) break;
      if (!opts.retryOn(err)) break;

      const delay = opts.retryDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// ─── GET with deduplication ───────────────────────────────────────────────────

export async function reliableGet(url, params = {}, options = {}) {
  const dedupKey = `${url}:${JSON.stringify(params)}`;

  // Return the same promise if one is already in-flight
  if (pendingGets.has(dedupKey)) {
    return pendingGets.get(dedupKey);
  }

  const promise = withRetry(
    () => api.get(url, { params }).then((res) => res.data),
    options
  ).finally(() => {
    pendingGets.delete(dedupKey);
  });

  pendingGets.set(dedupKey, promise);
  return promise;
}

// ─── POST (financial mutations) ───────────────────────────────────────────────

export async function reliablePost(url, data, options = {}) {
  const headers = {};

  if (options.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey;
  }

  return withRetry(
    () =>
      api.post(url, data, { headers }).then((res) => res.data),
    {
      // Don't auto-retry POST unless it's explicitly safe (has idempotency key)
      retries: options.idempotencyKey ? 2 : 0,
      retryDelay: options.retryDelay || 2000,
      retryOn: options.retryOn || DEFAULT_RETRY_OPTIONS.retryOn,
    }
  );
}

// ─── PUT ──────────────────────────────────────────────────────────────────────

export async function reliablePut(url, data, options = {}) {
  const headers = {};
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  return withRetry(
    () => api.put(url, data, { headers }).then((res) => res.data),
    { retries: options.idempotencyKey ? 2 : 0, ...options }
  );
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function reliablePatch(url, data, options = {}) {
  const headers = {};
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  return withRetry(
    () => api.patch(url, data, { headers }).then((res) => res.data),
    { retries: options.idempotencyKey ? 2 : 0, ...options }
  );
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function reliableDelete(url, options = {}) {
  return withRetry(
    () => api.delete(url).then((res) => res.data),
    { retries: 0, ...options } // Never auto-retry deletes
  );
}

// ─── Error extraction ──────────────────────────────────────────────────────────

/**
 * Extract a user-readable error message from any API error shape.
 */
export function extractApiError(err) {
  if (err?.response?.data) {
    const { message, violations, errors } = err.response.data;
    if (violations?.length > 0) {
      return violations.map((v) => v.message).join('; ');
    }
    if (errors?.length > 0) {
      return errors.map((e) => e.message || e).join('; ');
    }
    return message || 'Request failed';
  }
  return err?.message || 'Network error — please check your connection';
}

export default {
  get: reliableGet,
  post: reliablePost,
  put: reliablePut,
  patch: reliablePatch,
  delete: reliableDelete,
  extractApiError,
};
