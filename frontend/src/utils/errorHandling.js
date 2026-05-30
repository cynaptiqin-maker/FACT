/**
 * Shared Error Handling Utilities
 *
 * Provides consistent error classification, extraction, and display
 * patterns across all FACT frontend modules.
 */

import toast from 'react-hot-toast';

// ─── Error classification ──────────────────────────────────────────────────────

export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTH: 'AUTH',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTEGRITY: 'INTEGRITY',
  SERVER: 'SERVER',
  UNKNOWN: 'UNKNOWN',
};

export function classifyError(err) {
  if (!err?.response) return ERROR_TYPES.NETWORK;

  const status = err.response.status;
  const code = err.response?.data?.code;

  if (status === 400) return ERROR_TYPES.VALIDATION;
  if (status === 401) return ERROR_TYPES.AUTH;
  if (status === 403) return ERROR_TYPES.PERMISSION;
  if (status === 404) return ERROR_TYPES.NOT_FOUND;
  if (status === 409) return ERROR_TYPES.CONFLICT;
  if (status === 422) return ERROR_TYPES.INTEGRITY;
  if (status === 429) return ERROR_TYPES.RATE_LIMIT;
  if (status >= 500) return ERROR_TYPES.SERVER;

  if (code === 'FINANCIAL_INTEGRITY_VIOLATION') return ERROR_TYPES.INTEGRITY;

  return ERROR_TYPES.UNKNOWN;
}

// ─── Message extraction ────────────────────────────────────────────────────────

/**
 * Get the most user-readable message from any error shape.
 */
export function extractMessage(err, fallback = 'An unexpected error occurred') {
  if (!err) return fallback;

  // String errors
  if (typeof err === 'string') return err;

  // API response error
  if (err?.response?.data) {
    const { message, violations, errors } = err.response.data;

    // Financial integrity violations (most specific)
    if (violations?.length > 0) {
      return violations.map((v) => v.message).join('\n');
    }

    // Validation errors
    if (errors?.length > 0) {
      return errors
        .map((e) => (e.field ? `${e.field}: ${e.message}` : e.message || e))
        .join('\n');
    }

    if (message) return message;
  }

  return err?.message || fallback;
}

/**
 * Get field-level errors from a validation error response.
 * Returns: { fieldName: 'error message' }
 */
export function extractFieldErrors(err) {
  const errors = err?.response?.data?.errors || [];
  const fieldErrors = {};

  for (const e of errors) {
    if (e.field || e.path) {
      const field = e.field || e.path;
      fieldErrors[field] = e.message || 'Invalid value';
    }
  }

  return fieldErrors;
}

// ─── Toast helpers ─────────────────────────────────────────────────────────────

const TOAST_OPTIONS = {
  [ERROR_TYPES.NETWORK]: {
    icon: '🔌',
    duration: 6000,
    style: { background: '#1e293b', color: '#f8fafc' },
  },
  [ERROR_TYPES.VALIDATION]: {
    icon: '⚠️',
    duration: 5000,
  },
  [ERROR_TYPES.AUTH]: {
    icon: '🔐',
    duration: 4000,
  },
  [ERROR_TYPES.PERMISSION]: {
    icon: '🚫',
    duration: 4000,
  },
  [ERROR_TYPES.INTEGRITY]: {
    icon: '⚖️',
    duration: 7000,
  },
  [ERROR_TYPES.RATE_LIMIT]: {
    icon: '⏱',
    duration: 5000,
  },
  [ERROR_TYPES.SERVER]: {
    icon: '🛑',
    duration: 5000,
  },
};

export function showErrorToast(err, fallback) {
  const type = classifyError(err);
  const message = extractMessage(err, fallback);
  const options = TOAST_OPTIONS[type] || {};

  const networkMsg =
    type === ERROR_TYPES.NETWORK
      ? 'Connection error — please check your network and try again'
      : message;

  toast.error(networkMsg, options);
}

export function showSuccessToast(message, opts = {}) {
  toast.success(message, { duration: 3000, ...opts });
}

// ─── Async action wrapper ──────────────────────────────────────────────────────

/**
 * Wrap an async action with loading toast and automatic error display.
 * Returns: { data, error }
 */
export async function safeAction(fn, messages = {}) {
  const {
    loading = 'Processing…',
    success = 'Done',
    error: errorMsg = 'Operation failed',
  } = messages;

  const toastId = toast.loading(loading);

  try {
    const data = await fn();
    toast.success(success, { id: toastId });
    return { data, error: null };
  } catch (err) {
    const message = extractMessage(err, errorMsg);
    toast.error(message, { id: toastId, duration: 5000 });
    return { data: null, error: err };
  }
}

// ─── HTTP status messages ─────────────────────────────────────────────────────

export const HTTP_MESSAGES = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The record may already exist.',
  422: 'Financial integrity check failed.',
  429: 'Too many requests. Please wait a moment and try again.',
  500: 'Server error. Our team has been notified.',
  502: 'Service temporarily unavailable. Please try again shortly.',
  503: 'Service is under maintenance. Please try again later.',
};

export function getHttpMessage(status) {
  return HTTP_MESSAGES[status] || 'An unexpected error occurred';
}
