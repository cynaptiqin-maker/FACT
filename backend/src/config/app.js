'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
require('express-async-errors');

const { errorHandler, notFoundHandler } = require('../middleware/errorHandler');
const { requestId } = require('../middleware/requestId');
const { tenantMiddleware } = require('../middleware/tenant');
const logger = require('../shared/utils/logger');

/**
 * Create and configure the Express application.
 * All middleware is applied here; routes are mounted in server.js.
 */
function createApp() {
  const app = express();

  // ─── Trust Proxy (for nginx/load balancer) ──────────────────────────────
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  // ─── Security Headers ────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // ─── CORS ────────────────────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV !== 'production';

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow all localhost/127.0.0.1 origins in development
        if (!origin || isDev && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
          callback(null, true);
        } else if (origin === process.env.FRONTEND_URL) {
          callback(null, true);
        } else {
          callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Tenant-ID',
        'X-Request-ID',
        'X-Forwarded-For',
      ],
      exposedHeaders: ['X-Request-ID', 'X-Total-Count', 'X-Page', 'X-Per-Page'],
      maxAge: 86400,
    })
  );

  // ─── Compression ─────────────────────────────────────────────────────────
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6,
    })
  );

  // ─── Body Parsers ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ─── Request ID ───────────────────────────────────────────────────────────
  app.use(requestId);

  // ─── HTTP Logging ─────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'test') {
    app.use(
      morgan('combined', {
        stream: { write: (message) => logger.http(message.trim()) },
        skip: (req) => req.path === '/health' || req.path === '/metrics',
      })
    );
  }

  // ─── Global Rate Limiting ─────────────────────────────────────────────────
  const globalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip + ':' + (req.headers['x-tenant-id'] || 'default'),
    message: {
      success: false,
      error: 'Too many requests, please try again later.',
      retryAfter: Math.ceil(15 * 60),
    },
  });

  const speedLimiter = slowDown({
    windowMs: 60 * 1000,
    delayAfter: 100,
    delayMs: (hits) => hits * 100,
    maxDelayMs: 2000,
  });

  app.use('/api', globalLimiter);
  app.use('/api', speedLimiter);

  // ─── Tenant Middleware ────────────────────────────────────────────────────
  app.use('/api', tenantMiddleware);

  // ─── Health Check ─────────────────────────────────────────────────────────
  app.get('/health', async (req, res) => {
    const { sequelize } = require('./database');
    const { getRedisClient } = require('./redis');

    try {
      await sequelize.authenticate();
      await getRedisClient().ping();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: require('../../package.json').version,
        uptime: Math.floor(process.uptime()),
        services: {
          database: 'connected',
          redis: 'connected',
        },
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ─── API Info ─────────────────────────────────────────────────────────────
  app.get('/api', (req, res) => {
    res.json({
      name: 'FACT FinOS API',
      version: '1.0.0',
      description: 'Hospital Financial Operating System',
      documentation: '/api/docs',
    });
  });

  // ─── Static Files (uploads) ───────────────────────────────────────────────
  const { authenticate } = require('../middleware/auth');
  app.use('/uploads', authenticate, express.static(process.env.UPLOAD_DIR || './uploads'));

  return app;
}

/**
 * Attach 404 and error handlers AFTER all routes are mounted.
 * Called from server.js after mounting all module routes.
 */
function attachErrorHandlers(app) {
  app.use(notFoundHandler);
  app.use(errorHandler);
}

module.exports = { createApp, attachErrorHandlers };
