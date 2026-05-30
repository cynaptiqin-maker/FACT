'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Authentication rate limiter — strict limits on auth endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
    retryAfter: 900,
  },
});

/**
 * API rate limiter — general endpoints.
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.tenantId || 'default'}`,
  message: { success: false, error: 'Too many requests. Please slow down.' },
});

/**
 * Report generation rate limiter — expensive operations.
 */
const reportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many report requests. Max 10 per minute.' },
});

/**
 * AI query rate limiter.
 */
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'Too many AI queries. Max 20 per minute.' },
});

module.exports = { authLimiter, apiLimiter, reportLimiter, aiLimiter };
