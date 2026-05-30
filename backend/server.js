'use strict';

require('dotenv').config();
const http = require('http');
const path = require('path');

const { createApp, attachErrorHandlers } = require('./src/config/app');
const { testConnection, syncDatabase } = require('./src/config/database');
const { testRedisConnection, initQueues, closeRedisConnections, getRedisClient } = require('./src/config/redis');
const { MODULES, MODULE_STATUS } = require('./src/config/modules.config');
const logger = require('./src/shared/utils/logger');

const { runPendingMigrations } = require('./scripts/migrate');

// ─── Reliability Framework ────────────────────────────────────────────────────
const { monitoring } = require('./src/shared/monitoring/MonitoringService');
const { SelfHealingService } = require('./src/shared/self-healing/SelfHealingService');
const { getEventReliabilityEngine } = require('./src/shared/events/EventReliabilityEngine');
const responseTransformer = require('./src/middleware/responseTransformer');
const { idempotencyMiddleware } = require('./src/middleware/idempotency');
const { registry: circuitBreakers } = require('./src/shared/circuit-breaker/CircuitBreaker');

// ─── Worker imports (start background job processors) ─────────────────────────
// Workers are only started in non-test environments
let workers = [];

async function loadWorkers() {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const { startAllWorkers } = require('./src/shared/queue/workers');
    workers = await startAllWorkers();
    logger.info('Background workers started', { count: workers.length });
  } catch (err) {
    logger.warn('Workers failed to start (non-fatal)', { error: err.message });
  }
}

// ─── Mount Module Routes ──────────────────────────────────────────────────────
async function mountModuleRoutes(app) {
  const mountedModules = [];
  const failedModules = [];

  for (const module of MODULES) {
    try {
      // Core modules always load; others check if route file exists
      const routeFilePath = path.resolve(__dirname, 'src', module.routeFile.replace('./', ''));

      // Try to load the route file
      let router;
      try {
        router = require(routeFilePath);
      } catch (routeErr) {
        // Route file doesn't exist yet — skip gracefully
        if (routeErr.code === 'MODULE_NOT_FOUND') {
          logger.debug('Route file not found, skipping module', {
            module: module.id,
            path: routeFilePath,
          });
          continue;
        }
        throw routeErr;
      }

      // Apply module guard for non-core modules
      if (module.status !== MODULE_STATUS.CORE) {
        const { moduleGuard } = require('./src/middleware/moduleGuard');
        app.use(module.routePrefix, moduleGuard(module.id), router);
      } else {
        app.use(module.routePrefix, router);
      }

      mountedModules.push(module.id);
      logger.debug('Module mounted', { id: module.id, prefix: module.routePrefix });
    } catch (err) {
      failedModules.push({ id: module.id, error: err.message });
      logger.error('Module mount failed', { id: module.id, error: err.message });
    }
  }

  logger.info('Module routes mounted', {
    mounted: mountedModules.length,
    failed: failedModules.length,
    modules: mountedModules,
  });

  if (failedModules.length > 0) {
    logger.warn('Some modules failed to mount', { failedModules });
  }

  return { mountedModules, failedModules };
}

// ─── Bootstrap Application ────────────────────────────────────────────────────
async function bootstrap() {
  logger.info('Starting FACT FinOS...', {
    version: require('./package.json').version,
    nodeVersion: process.version,
    environment: process.env.NODE_ENV,
  });

  // 0. Run pending SQL migrations
  try {
    const { sequelize: db } = require('./src/config/database');
    const result = await runPendingMigrations(db);
    if (result.pending.length > 0) {
      logger.info('Database migrations applied', { count: result.pending.length, migrations: result.pending });
    } else {
      logger.debug('All migrations up to date');
    }
  } catch (migErr) {
    logger.error('Migration failed — aborting startup', { error: migErr.message, file: migErr.migrationFile });
    process.exit(1);
  }

  // 1. Test infrastructure connections
  logger.info('Testing infrastructure connections...');
  await testConnection();
  await testRedisConnection();

  // 2. Pre-load module models so Sequelize registers them before sync
  //    Modules that lazy-require models inside handlers won't get their tables
  //    created unless we touch them here first.
  try {
    require('./src/modules/fcra/models/FCRARegistration');
    require('./src/modules/fcra/models/FCRABankAccount');
    require('./src/modules/fcra/models/FCRADonor');
    require('./src/modules/fcra/models/FCRAReceipt');
    require('./src/modules/fcra/models/FCRAProject');
    require('./src/modules/fcra/models/FCRAUtilisation');
    require('./src/modules/fcra/models/FCRAAsset');
    require('./src/modules/fcra/models/FCRAAssetDisposal');
    require('./src/modules/fcra/models/FCRAAssetIncome');
    require('./src/modules/fcra/models/FCRACompliance');
    require('./src/modules/fcra/models/FCRAFC4');
    require('./src/modules/fcra/models/FCRAAuditLog');
  } catch (e) {
    logger.warn('FCRA model preload skipped', { error: e.message });
  }

  // 2c-associations. Wire Sequelize model associations after all models are loaded
  try {
    const { setupAssociations } = require('./src/config/associations');
    setupAssociations();
  } catch (e) {
    logger.warn('Model associations setup skipped', { error: e.message });
  }

  // 2b. Drop orphaned FCRA ENUM types (safe — only removes types not in use by tables)
  //     These are created by Sequelize's ENUM handling and can cause "syntax error at USING"
  //     when the same types already exist from a previous partial sync attempt.
  if (process.env.NODE_ENV === 'development') {
    try {
      const { sequelize: db } = require('./src/config/database');
      const orphanedEnums = await db.query(
        `SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
         WHERE t.typtype = 'e' AND n.nspname = 'public' AND typname LIKE 'enum_fcra_%'`,
        { type: db.QueryTypes.SELECT }
      );
      for (const { typname } of orphanedEnums) {
        await db.query(`DROP TYPE IF EXISTS "${typname}"`).catch(() => {});
      }
      if (orphanedEnums.length) logger.info('Cleaned up orphaned FCRA ENUM types', { count: orphanedEnums.length });
    } catch (_) {}
  }

  // 2c. Run fund_type schema migration (idempotent — adds columns if not present)
  try {
    const { ensureFundTypeColumn } = require('./src/shared/posting-engine');
    const { sequelize: db } = require('./src/config/database');
    await ensureFundTypeColumn(db);
  } catch (e) {
    logger.warn('fund_type migration skipped', { error: e.message });
  }

  // 2d. Ensure financial_exceptions and period_close_log tables exist
  try {
    const { sequelize: db } = require('./src/config/database');
    await db.query(`
      CREATE TABLE IF NOT EXISTS financial_exceptions (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL,
        exception_type  VARCHAR(50)  NOT NULL,
        severity        VARCHAR(20)  NOT NULL DEFAULT 'MEDIUM',
        status          VARCHAR(20)  NOT NULL DEFAULT 'OPEN',
        entity_type     VARCHAR(60),
        entity_id       UUID,
        source_module   VARCHAR(60),
        title           VARCHAR(200) NOT NULL,
        description     TEXT,
        metadata        JSONB,
        raised_by       VARCHAR(60)  DEFAULT 'SYSTEM',
        assigned_to     UUID,
        acknowledged_by UUID,
        acknowledged_at TIMESTAMPTZ,
        resolved_by     UUID,
        resolved_at     TIMESTAMPTZ,
        resolution_note TEXT,
        dismissed_by    UUID,
        dismissed_at    TIMESTAMPTZ,
        dismiss_reason  TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_fin_exceptions_dedup_open
        ON financial_exceptions (tenant_id, exception_type, COALESCE(entity_id::text, 'global'))
        WHERE status = 'OPEN'
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS period_close_log (
        id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id       UUID NOT NULL,
        fiscal_year_id  UUID NOT NULL,
        period          VARCHAR(7) NOT NULL,
        checklist       JSONB,
        action          VARCHAR(20) NOT NULL DEFAULT 'LOCK',
        performed_by    UUID,
        performed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        note            TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    logger.info('Exception + period-close tables ensured');
  } catch (e) {
    logger.warn('Exception table migration skipped', { error: e.message });
  }

  // 2d. Sync database models (dev only)
  if (process.env.NODE_ENV === 'development') {
    await syncDatabase({ alter: true });
  }

  // 3. Initialize queues
  initQueues();

  // 4. Create Express app
  const app = createApp();

  // 4a. Wire reliability middleware (before routes)
  const redis = getRedisClient ? getRedisClient() : null;
  app.use(monitoring.requestTracker());
  app.use(responseTransformer);
  app.use(idempotencyMiddleware(redis));

  // 4b. Expose health + metrics endpoints
  app.get('/api/health/detailed', (_req, res) => {
    res.json(monitoring.getHealthReport());
  });
  app.get('/metrics', (_req, res) => {
    res.set('Content-Type', 'text/plain').send(monitoring.getPrometheusMetrics());
  });
  app.get('/api/admin/circuit-breakers', (_req, res) => {
    res.json(circuitBreakers.getAll());
  });

  // 4c. Auto-provision new ENABLED modules for existing tenants
  //     Runs on every startup; safe because ON CONFLICT DO NOTHING skips already-provisioned rows.
  try {
    const { sequelize } = require('./src/config/database');
    const { MODULES: ALL_MODULES, MODULE_STATUS: MS } = require('./src/config/modules.config');
    const newModules = ALL_MODULES.filter(m => m.status === MS.ENABLED || m.status === MS.ADDON);
    const tenants = await sequelize.query('SELECT id FROM tenants', { type: sequelize.QueryTypes.SELECT });
    for (const tenant of tenants) {
      for (const mod of newModules) {
        await sequelize.query(
          `INSERT INTO tenant_modules (id, tenant_id, module_id, is_enabled, created_at, updated_at)
           VALUES (gen_random_uuid(), :tenantId, :moduleId, true, NOW(), NOW())
           ON CONFLICT (tenant_id, module_id) DO NOTHING`,
          { replacements: { tenantId: tenant.id, moduleId: mod.id } }
        ).catch(() => {}); // silently skip if table doesn't exist yet
      }
    }
    logger.info('Module provisioning complete', { tenants: tenants.length, modules: newModules.length });
  } catch (err) {
    logger.warn('Module auto-provisioning skipped', { error: err.message });
  }

  // 5. Mount all module routes
  await mountModuleRoutes(app);

  // 6. Attach error handlers (must be LAST)
  attachErrorHandlers(app);

  // 7. Start background workers
  await loadWorkers();

  // 7a. Start self-healing service
  const eventEngine = getEventReliabilityEngine(redis);
  const selfHealing = new SelfHealingService({
    sequelize: require('./src/config/database').sequelize,
    redis,
    eventEngine,
    monitoring,
  });
  selfHealing.start();

  // 8. Create HTTP server
  const PORT = parseInt(process.env.PORT, 10) || 5000;
  const server = http.createServer(app);

  server.listen(PORT, () => {
    logger.info('FACT FinOS server running', {
      port: PORT,
      environment: process.env.NODE_ENV,
      pid: process.pid,
    });
  });

  // ─── Graceful Shutdown ──────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Stop workers
        await Promise.allSettled(workers.map((w) => w.close()));
        logger.info('Workers stopped');

        // Close Redis connections
        await closeRedisConnections();
        logger.info('Redis connections closed');

        // Close database connections
        const { closeConnections } = require('./src/config/database');
        await closeConnections();
        logger.info('Database connections closed');

        logger.info('Graceful shutdown complete');
        process.exit(0);
      } catch (err) {
        logger.error('Error during shutdown', { error: err.message });
        process.exit(1);
      }
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ─── Unhandled Rejections ───────────────────────────────────────────────
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason?.message || String(reason),
      stack: reason?.stack,
    });
  });

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
    process.exit(1);
  });

  return { app, server };
}

// ─── Start Server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  bootstrap().catch((err) => {
    logger.error('Fatal startup error', { error: err.message, stack: err.stack });
    process.exit(1);
  });
}

module.exports = { bootstrap };
