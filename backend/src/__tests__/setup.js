/**
 * Jest Global Test Setup
 *
 * Configures test environment for all backend integration and unit tests.
 * Uses an in-memory SQLite database for speed (or a test PostgreSQL schema).
 */

const { Sequelize } = require('sequelize');

// ─── Test database ─────────────────────────────────────────────────────────────

let testSequelize;

async function getTestDB() {
  if (!testSequelize) {
    testSequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
    });
  }
  return testSequelize;
}

// ─── Mock Redis client ─────────────────────────────────────────────────────────

const mockRedis = {
  _store: new Map(),
  get: jest.fn(async (k) => mockRedis._store.get(k) ?? null),
  set: jest.fn(async (k, v) => { mockRedis._store.set(k, v); return 'OK'; }),
  setex: jest.fn(async (k, _ttl, v) => { mockRedis._store.set(k, v); return 'OK'; }),
  del: jest.fn(async (k) => { mockRedis._store.delete(k); return 1; }),
  exists: jest.fn(async (k) => (mockRedis._store.has(k) ? 1 : 0)),
  ping: jest.fn(async () => 'PONG'),
  lrange: jest.fn(async () => []),
  lpush: jest.fn(async () => 1),
  ltrim: jest.fn(async () => 'OK'),
  zadd: jest.fn(async () => 1),
  zrangebyscore: jest.fn(async () => []),
  expire: jest.fn(async () => 1),
  flushall: jest.fn(async () => { mockRedis._store.clear(); return 'OK'; }),
};

// ─── Test JWT helpers ──────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');
const TEST_JWT_SECRET = 'test-secret-do-not-use-in-production';

function generateTestToken(payload = {}) {
  return jwt.sign(
    {
      id: payload.id || 'test-user-id',
      tenantId: payload.tenantId || 'test-tenant-id',
      email: payload.email || 'test@fact.in',
      roles: payload.roles || ['admin'],
      permissions: payload.permissions || ['*'],
      ...payload,
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// ─── Global test utilities ────────────────────────────────────────────────────

global.testHelpers = {
  getTestDB,
  mockRedis,
  generateTestToken,
  TEST_JWT_SECRET,
  TEST_TENANT_ID: 'test-tenant-id',

  // Supertest request builder with auth
  withAuth: (request, roles = ['admin']) => {
    const token = generateTestToken({ roles });
    return request.set('Authorization', `Bearer ${token}`).set('X-Tenant-ID', 'test-tenant-id');
  },
};

// ─── Global setup / teardown ──────────────────────────────────────────────────

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = TEST_JWT_SECRET;
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
});

afterEach(async () => {
  // Clear mock Redis between tests
  mockRedis._store.clear();
  jest.clearAllMocks();
});

afterAll(async () => {
  if (testSequelize) {
    await testSequelize.close();
  }
});

// ─── Silence expected console.error in tests ──────────────────────────────────

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    // Only silence expected test errors
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('[test]'))
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
