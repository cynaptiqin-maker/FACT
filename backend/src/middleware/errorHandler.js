'use strict';

const logger = require('../shared/utils/logger');

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.path}`,
    code: 'NOT_FOUND',
  });
}

function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('Request error', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    tenantId: req.tenantId,
    userId: req.user?.id,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    code: err.code,
    statusCode: err.statusCode,
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate entry',
      details: err.errors?.map((e) => ({ field: e.path, message: e.message })),
    });
  }

  // Sequelize foreign key
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      success: false,
      error: 'Referenced record does not exist',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: err.message });
  }

  // Joi validation
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: err.details?.map((d) => ({ field: d.path?.join('.'), message: d.message })),
    });
  }

  // Application errors with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
  }

  // Default 500
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    requestId: req.requestId,
    ...(isDev && { stack: err.stack }),
  });
}

/**
 * Create application error with status code.
 */
function createError(message, statusCode = 400, code = 'BAD_REQUEST') {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

/**
 * Wraps async route handlers to forward errors to Express error middleware.
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { notFoundHandler, errorHandler, createError, asyncHandler };
