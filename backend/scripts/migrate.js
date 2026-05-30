'use strict';

/**
 * FACT Migration Runner
 *
 * Applies SQL migration files in filename order, tracking each in schema_migrations.
 * Idempotent — skips migrations that have already been applied.
 *
 * Usage:
 *   node scripts/migrate.js           # apply pending migrations
 *   node scripts/migrate.js --status  # show which migrations have been applied
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs   = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

// ─── DB Connection ────────────────────────────────────────────────────────────
const sequelize = new Sequelize(
  process.env.DB_NAME || 'fact_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432', 10),
    dialect:  'postgres',
    logging:  false,
    pool: { max: 2, min: 0, idle: 10000 },
  }
);

const MIGRATIONS_DIR = path.join(__dirname, '../migrations');

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function ensureMigrationTable() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  try {
    const rows = await sequelize.query(
      'SELECT name FROM schema_migrations ORDER BY applied_at',
      { type: Sequelize.QueryTypes.SELECT }
    );
    return new Set(rows.map((r) => r.name));
  } catch {
    return new Set();
  }
}

function getMigrationFiles() {
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort(); // alphabetical = numeric order for 001_, 002_...
}

async function applyMigration(name, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const t = await sequelize.transaction();
  try {
    // Split on semicolons (naïve but works for our migration style)
    // Postgres is fine with multi-statement execution inside a transaction
    await sequelize.query(sql, { transaction: t });
    await sequelize.query(
      'INSERT INTO schema_migrations (name) VALUES (:name) ON CONFLICT DO NOTHING',
      { replacements: { name }, transaction: t }
    );
    await t.commit();
    console.log(`  ✓ Applied: ${name}`);
  } catch (err) {
    await t.rollback();
    throw Object.assign(err, { migrationName: name });
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function runMigrations() {
  const showStatus = process.argv.includes('--status');

  try {
    await sequelize.authenticate();
    await ensureMigrationTable();

    const applied  = await getAppliedMigrations();
    const files    = getMigrationFiles();
    const pending  = files.filter((f) => !applied.has(f));

    if (showStatus) {
      console.log('\n📋 Migration Status:\n');
      for (const f of files) {
        const status = applied.has(f) ? '✓ applied' : '○ pending';
        console.log(`  ${status}  ${f}`);
      }
      console.log(`\n  Total: ${files.length} | Applied: ${applied.size} | Pending: ${pending.length}\n`);
      return;
    }

    if (pending.length === 0) {
      console.log('\n✅ All migrations are up to date.\n');
      return;
    }

    console.log(`\n🔄 Running ${pending.length} pending migration(s)...\n`);

    for (const file of pending) {
      await applyMigration(file, path.join(MIGRATIONS_DIR, file));
    }

    console.log(`\n✅ ${pending.length} migration(s) applied successfully.\n`);
  } catch (err) {
    console.error(`\n❌ Migration failed${err.migrationName ? ` [${err.migrationName}]` : ''}:`, err.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

/**
 * Programmatic API for use in server.js startup.
 * Returns { applied: string[], pending: string[] }.
 */
async function runPendingMigrations(existingSequelize) {
  const db = existingSequelize || sequelize;

  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         SERIAL PRIMARY KEY,
      name       VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `);

  const appliedRows = await db.query(
    'SELECT name FROM schema_migrations ORDER BY applied_at',
    { type: db.QueryTypes.SELECT }
  ).catch(() => []);

  const applied = new Set(appliedRows.map((r) => r.name));
  const files   = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  const pending = files.filter((f) => !applied.has(f));

  for (const file of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    const t   = await db.transaction();
    try {
      await db.query(sql, { transaction: t });
      await db.query(
        'INSERT INTO schema_migrations (name) VALUES (:name) ON CONFLICT DO NOTHING',
        { replacements: { name: file }, transaction: t }
      );
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw Object.assign(err, { migrationFile: file });
    }
  }

  return { applied: [...applied], pending };
}

module.exports = { runPendingMigrations };

if (require.main === module) runMigrations();
