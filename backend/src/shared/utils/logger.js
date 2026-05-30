'use strict';

const winston = require('winston');
const path = require('path');

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

const transports = [];

// Console transport
transports.push(
  new winston.transports.Console({
    format:
      process.env.NODE_ENV === 'development'
        ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), devFormat)
        : combine(timestamp(), errors({ stack: true }), json()),
  })
);

// File transport (if enabled)
if (process.env.LOG_FILE_ENABLED === 'true') {
  const logDir = path.dirname(process.env.LOG_FILE_PATH || './logs/app.log');

  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || './logs/app.log',
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    })
  );

  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format: combine(timestamp(), errors({ stack: true }), json()),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    })
  );
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'fact-finos' },
  transports,
  exitOnError: false,
});

// Add http level for morgan
logger.http = (message) => logger.log('http', message);

module.exports = logger;
