'use strict';

/**
 * ExceptionEngine unit tests.
 *
 * All DB calls are mocked — this suite tests:
 *   - raise() idempotency (ON CONFLICT returns null for duplicates)
 *   - Default severity assignment per type
 *   - resolve(), dismiss(), acknowledge() state transitions
 *   - getStats() parsing
 *   - raisePostingFailed() + raiseFCRAAdminCap() + raiseReconMismatch() helpers
 */

const { ExceptionEngine, EXCEPTION_TYPES, SEVERITIES } = require('../../shared/exceptions/ExceptionEngine');

function makeMockSequelize(overrides = {}) {
  const defaultQuery = jest.fn().mockResolvedValue([[{ id: 'exc-001' }], 1]);
  return {
    query: overrides.query || defaultQuery,
    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },
  };
}

describe('ExceptionEngine', () => {
  describe('raise()', () => {
    it('returns the new exception id on first raise', async () => {
      const seq = makeMockSequelize({
        query: jest.fn().mockResolvedValue([[{ id: 'exc-001' }], 1]),
      });
      const engine = new ExceptionEngine(seq);

      const id = await engine.raise({
        tenantId: 't1',
        exceptionType: EXCEPTION_TYPES.POSTING_FAILED,
        title: 'GL posting failed',
        entityId: 'invoice-001',
        entityType: 'patient_invoice',
      });

      expect(id).toBe('exc-001');
      expect(seq.query).toHaveBeenCalledTimes(1);
    });

    it('returns null when duplicate OPEN exception exists (ON CONFLICT DO NOTHING)', async () => {
      const seq = makeMockSequelize({
        query: jest.fn().mockResolvedValue([[], 0]),  // empty RETURNING means no insert
      });
      const engine = new ExceptionEngine(seq);

      const id = await engine.raise({
        tenantId: 't1',
        exceptionType: EXCEPTION_TYPES.POSTING_FAILED,
        title: 'GL posting failed',
      });

      expect(id).toBeNull();
    });

    it('assigns CRITICAL severity to POSTING_FAILED by default', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[{ id: 'exc-002' }], 1]) });
      const engine = new ExceptionEngine(seq);

      await engine.raise({ tenantId: 't1', exceptionType: EXCEPTION_TYPES.POSTING_FAILED, title: 'X' });

      const callArg = seq.query.mock.calls[0][1].replacements;
      expect(callArg.severity).toBe(SEVERITIES.CRITICAL);
    });

    it('assigns HIGH severity to FCRA_ADMIN_CAP by default', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[{ id: 'e' }], 1]) });
      const engine = new ExceptionEngine(seq);

      await engine.raise({ tenantId: 't1', exceptionType: EXCEPTION_TYPES.FCRA_ADMIN_CAP, title: 'X' });

      expect(seq.query.mock.calls[0][1].replacements.severity).toBe(SEVERITIES.HIGH);
    });

    it('allows caller to override default severity', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[{ id: 'e' }], 1]) });
      const engine = new ExceptionEngine(seq);

      await engine.raise({
        tenantId: 't1',
        exceptionType: EXCEPTION_TYPES.POSTING_FAILED,
        severity: SEVERITIES.LOW,
        title: 'X',
      });

      expect(seq.query.mock.calls[0][1].replacements.severity).toBe(SEVERITIES.LOW);
    });

    it('is non-fatal on DB errors — returns null, does not throw', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockRejectedValue(new Error('DB down')) });
      const engine = new ExceptionEngine(seq);

      const id = await engine.raise({ tenantId: 't1', exceptionType: EXCEPTION_TYPES.BANK_UNMATCHED, title: 'X' });
      expect(id).toBeNull();
    });
  });

  describe('acknowledge()', () => {
    it('calls UPDATE with status ACKNOWLEDGED and returns the row', async () => {
      const seq = makeMockSequelize({
        query: jest.fn().mockResolvedValue([[{ id: 'exc-001' }], 1]),
      });
      const engine = new ExceptionEngine(seq);

      const result = await engine.acknowledge('exc-001', 't1', 'user-1');

      expect(result).toEqual({ id: 'exc-001' });
      const sql = seq.query.mock.calls[0][0];
      expect(sql).toContain("status = 'ACKNOWLEDGED'");
    });

    it('returns null when exception not found (already actioned)', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[], 0]) });
      const engine = new ExceptionEngine(seq);

      const result = await engine.acknowledge('nonexistent', 't1', 'user-1');
      expect(result).toBeNull();
    });
  });

  describe('resolve()', () => {
    it('sets status to RESOLVED with resolution note', async () => {
      const seq = makeMockSequelize({
        query: jest.fn().mockResolvedValue([[{ id: 'exc-001' }], 1]),
      });
      const engine = new ExceptionEngine(seq);

      const result = await engine.resolve('exc-001', 't1', 'user-1', 'Fixed the GL mapping');

      expect(result).toEqual({ id: 'exc-001' });
      const replacements = seq.query.mock.calls[0][1].replacements;
      expect(replacements.note).toBe('Fixed the GL mapping');
    });
  });

  describe('dismiss()', () => {
    it('sets status to DISMISSED with reason', async () => {
      const seq = makeMockSequelize({
        query: jest.fn().mockResolvedValue([[{ id: 'exc-001' }], 1]),
      });
      const engine = new ExceptionEngine(seq);

      await engine.dismiss('exc-001', 't1', 'user-1', 'Not applicable for this period');

      const sql = seq.query.mock.calls[0][0];
      expect(sql).toContain("status = 'DISMISSED'");
    });
  });

  describe('getStats()', () => {
    it('returns parsed stats object', async () => {
      const seq = makeMockSequelize({
        query: jest.fn().mockResolvedValue([[{
          open: '5', critical: '2', acknowledged: '1', resolved_today: '3',
          posting_failed: '1', fcra_cap: '0', recon_mismatch: '1',
        }]]),
      });
      const engine = new ExceptionEngine(seq);

      const stats = await engine.getStats('t1');
      expect(stats.open).toBe('5');
      expect(stats.critical).toBe('2');
    });
  });

  describe('helper raise methods', () => {
    it('raisePostingFailed sets correct type, entityType, and metadata', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[{ id: 'e' }], 1]) });
      const engine = new ExceptionEngine(seq);

      await engine.raisePostingFailed('t1', {
        sourceModule: 'patient-billing',
        sourceId: 'inv-001',
        error: 'Account not found',
      });

      const { replacements } = seq.query.mock.calls[0][1];
      expect(replacements.exceptionType).toBe(EXCEPTION_TYPES.POSTING_FAILED);
      expect(replacements.entityType).toBe('patient-billing');
      expect(replacements.severity).toBe(SEVERITIES.CRITICAL);
    });

    it('raiseFCRAAdminCap uses CRITICAL severity when breached (>=20%)', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[{ id: 'e' }], 1]) });
      const engine = new ExceptionEngine(seq);

      await engine.raiseFCRAAdminCap('t1', {
        registrationId: 'reg-001',
        currentPct: 21.5,
        threshold: 20,
      });

      const { replacements } = seq.query.mock.calls[0][1];
      expect(replacements.severity).toBe(SEVERITIES.CRITICAL);
      expect(replacements.title).toContain('BREACHED');
    });

    it('raiseFCRAAdminCap uses HIGH severity when warning (< 20%)', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[{ id: 'e' }], 1]) });
      const engine = new ExceptionEngine(seq);

      await engine.raiseFCRAAdminCap('t1', { registrationId: 'reg-001', currentPct: 18.5, threshold: 20 });

      const { replacements } = seq.query.mock.calls[0][1];
      expect(replacements.severity).toBe(SEVERITIES.HIGH);
      expect(replacements.title).not.toContain('BREACHED');
    });

    it('raiseReconMismatch sets correct type and metadata', async () => {
      const seq = makeMockSequelize({ query: jest.fn().mockResolvedValue([[{ id: 'e' }], 1]) });
      const engine = new ExceptionEngine(seq);

      await engine.raiseReconMismatch('t1', { reconType: 'AR_GL', variance: '1250.00', period: '2026-05' });

      const { replacements } = seq.query.mock.calls[0][1];
      expect(replacements.exceptionType).toBe(EXCEPTION_TYPES.RECON_MISMATCH);
      expect(replacements.title).toContain('AR_GL');
    });
  });
});
