'use strict';

const { Sequelize } = require('sequelize');
const { createNamespace } = require('cls-hooked');
const winston = require('winston');

// CLS namespace for automatic transaction management
const namespace = createNamespace('fact-transactions');
Sequelize.useCLS(namespace);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// ─── Connection Pool Configuration ────────────────────────────────────────────
const poolConfig = {
  max: parseInt(process.env.DB_POOL_MAX, 10) || 20,
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  acquire: parseInt(process.env.DB_POOL_ACQUIRE, 10) || 30000,
  idle: parseInt(process.env.DB_POOL_IDLE, 10) || 10000,
  evict: 1000,
};

// ─── Dialect Options ─────────────────────────────────────────────────────────
const dialectOptions = {
  statement_timeout: 30000,
  idle_in_transaction_session_timeout: 60000,
};

if (process.env.DB_SSL === 'true') {
  dialectOptions.ssl = {
    require: true,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
  };
}

// ─── Main Sequelize Instance ──────────────────────────────────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME || 'fact_db',
  process.env.DB_USER || 'fact_user',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    dialect: 'postgres',
    pool: poolConfig,
    dialectOptions,
    logging: (sql, timing) => {
      if (process.env.NODE_ENV === 'development' && process.env.DB_LOG_QUERIES === 'true') {
        logger.debug('SQL Query', { sql, timing });
      }
    },
    benchmark: process.env.NODE_ENV === 'development',
    define: {
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      paranoid: false,
    },
    timezone: '+05:30', // IST for Indian hospitals
  }
);

// ─── Per-Tenant Connection Cache (for schema isolation) ───────────────────────
const tenantConnections = new Map();

/**
 * Get or create a tenant-specific connection.
 * In schema-based multi-tenancy, each tenant gets its own PostgreSQL schema.
 */
function getTenantConnection(tenantId) {
  if (!tenantId) return sequelize;

  if (tenantConnections.has(tenantId)) {
    return tenantConnections.get(tenantId);
  }

  const tenantSequelize = new Sequelize(
    process.env.DB_NAME || 'fact_db',
    process.env.DB_USER || 'fact_user',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      dialect: 'postgres',
      pool: { max: 5, min: 0, acquire: 15000, idle: 5000 },
      dialectOptions: {
        ...dialectOptions,
        options: `-c search_path=tenant_${tenantId.replace(/-/g, '_')},public`,
      },
      logging: false,
      define: {
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
      },
      timezone: '+05:30',
    }
  );

  tenantConnections.set(tenantId, tenantSequelize);
  return tenantSequelize;
}

/**
 * Test database connectivity and return version info.
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    const [result] = await sequelize.query('SELECT version()');
    logger.info('Database connected', {
      version: result[0].version,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
    });
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    throw error;
  }
}

/**
 * Sync all models (development only — use migrations in production).
 */
async function syncDatabase(options = {}) {
  if (process.env.NODE_ENV === 'production' && !options.force) {
    logger.warn('Auto-sync disabled in production. Use migrations.');
    return;
  }

  const syncOptions = {
    alter: process.env.NODE_ENV === 'development',
    force: options.force || false,
    ...options,
  };

  await sequelize.sync(syncOptions);
  logger.info('Database sync complete', { options: syncOptions });
}

/**
 * Initialize tenant schema in PostgreSQL.
 */
async function initTenantSchema(tenantId) {
  const schemaName = `tenant_${tenantId.replace(/-/g, '_')}`;
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  logger.info('Tenant schema initialized', { tenantId, schemaName });
  return schemaName;
}

/**
 * Close all connections gracefully.
 */
async function closeConnections() {
  const closePromises = [sequelize.close()];
  for (const [tenantId, conn] of tenantConnections.entries()) {
    closePromises.push(
      conn.close().then(() => tenantConnections.delete(tenantId))
    );
  }
  await Promise.allSettled(closePromises);
  logger.info('All database connections closed');
}

/**
 * Execute a function within a database transaction.
 * Uses CLS namespace for automatic propagation to nested calls.
 */
async function withTransaction(fn, options = {}) {
  return sequelize.transaction(
    { isolationLevel: Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED, ...options },
    fn
  );
}

module.exports = {
  sequelize,
  Sequelize,
  getTenantConnection,
  testConnection,
  syncDatabase,
  initTenantSchema,
  closeConnections,
  withTransaction,
  Op: Sequelize.Op,
};
