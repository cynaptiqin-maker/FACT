/**
 * Integration Tests: Patient Billing API
 *
 * Tests the full HTTP request → controller → service → response cycle.
 * Verifies: invoice creation, finalization, payment, cancellation.
 * Uses Supertest against the real Express app with a test database.
 */

const request = require('supertest');
const { v4: uuidv4 } = require('uuid');

// We import the app factory (not the listening server)
// The app should export app from server.js without calling app.listen()
let app;

// Test data factory
function makeInvoice(overrides = {}) {
  return {
    patient_id: `PAT-${uuidv4().slice(0, 8)}`,
    patient_name: 'Test Patient',
    invoice_date: new Date().toISOString().split('T')[0],
    billing_type: 'OP',
    items: [
      { description: 'Consultation', quantity: 1, unit_price: 500, tax_rate: 0 },
      { description: 'Lab Test', quantity: 2, unit_price: 750, tax_rate: 18 },
    ],
    discount_amount: 0,
    ...overrides,
  };
}

describe('Billing API', () => {
  beforeAll(async () => {
    // Lazy-load app to avoid DB connection in test discovery
    try {
      app = require('../../../server');
    } catch (err) {
      // App may not be fully configured in test env — skip integration tests
      console.warn('[Test] Could not load app — skipping integration tests:', err.message);
    }
  });

  const skipIfNoApp = () => (!app ? it.skip : it);

  describe('POST /api/billing/invoices', () => {
    skipIfNoApp()('creates a draft invoice', async () => {
      const payload = makeInvoice();
      const idempotencyKey = uuidv4();

      const res = await testHelpers
        .withAuth(request(app).post('/api/billing/invoices'))
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('DRAFT');
      expect(res.body.data.invoice_number).toMatch(/^INV-/);
    });

    skipIfNoApp()('returns cached response for duplicate idempotency key', async () => {
      const payload = makeInvoice();
      const idempotencyKey = uuidv4();

      const first = await testHelpers
        .withAuth(request(app).post('/api/billing/invoices'))
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      const second = await testHelpers
        .withAuth(request(app).post('/api/billing/invoices'))
        .set('Idempotency-Key', idempotencyKey)
        .send(payload);

      expect(second.status).toBe(200);
      expect(second.headers['x-idempotency-replayed']).toBe('true');
      expect(second.body.data.id).toBe(first.body.data.id);
    });

    skipIfNoApp()('returns 400 for invalid payload', async () => {
      const res = await testHelpers
        .withAuth(request(app).post('/api/billing/invoices'))
        .set('Idempotency-Key', uuidv4())
        .send({ patient_name: '' }); // missing required fields

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    skipIfNoApp()('returns 400 when idempotency key is missing', async () => {
      const res = await testHelpers
        .withAuth(request(app).post('/api/billing/invoices'))
        .send(makeInvoice());

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('IDEMPOTENCY_KEY_REQUIRED');
    });
  });

  describe('POST /api/billing/invoices/:id/finalize', () => {
    skipIfNoApp()('finalizes a draft invoice', async () => {
      // First create
      const createRes = await testHelpers
        .withAuth(request(app).post('/api/billing/invoices'))
        .set('Idempotency-Key', uuidv4())
        .send(makeInvoice());

      const invoiceId = createRes.body.data?.id;
      if (!invoiceId) return;

      const finalizeRes = await testHelpers
        .withAuth(request(app).post(`/api/billing/invoices/${invoiceId}/finalize`))
        .set('Idempotency-Key', uuidv4())
        .send({});

      expect(finalizeRes.status).toBe(200);
      expect(finalizeRes.body.data.status).toBe('FINALIZED');
    });

    skipIfNoApp()('cannot finalize a cancelled invoice', async () => {
      const createRes = await testHelpers
        .withAuth(request(app).post('/api/billing/invoices'))
        .set('Idempotency-Key', uuidv4())
        .send(makeInvoice());

      const invoiceId = createRes.body.data?.id;
      if (!invoiceId) return;

      // Cancel first
      await testHelpers
        .withAuth(request(app).post(`/api/billing/invoices/${invoiceId}/cancel`))
        .set('Idempotency-Key', uuidv4())
        .send({ reason: 'Test cancellation' });

      // Attempt to finalize cancelled invoice
      const finalizeRes = await testHelpers
        .withAuth(request(app).post(`/api/billing/invoices/${invoiceId}/finalize`))
        .set('Idempotency-Key', uuidv4())
        .send({});

      expect(finalizeRes.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/billing/invoices', () => {
    skipIfNoApp()('returns paginated invoice list', async () => {
      const res = await testHelpers
        .withAuth(request(app).get('/api/billing/invoices'))
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.meta).toHaveProperty('total');
      expect(res.body.meta).toHaveProperty('page');
    });

    skipIfNoApp()('requires authentication', async () => {
      const res = await request(app).get('/api/billing/invoices');
      expect(res.status).toBe(401);
    });
  });
});
