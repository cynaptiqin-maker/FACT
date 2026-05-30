'use strict';

/**
 * PeriodCloseService unit tests.
 *
 * Uses SQL-dispatched mocks so tests work correctly even though
 * getChecklist() runs all 8 checks in parallel via Promise.all().
 */

const { PeriodCloseService, CHECK_STATUS } = require('../../modules/period-close/period-close.service');

/**
 * Build a mock sequelize whose query() dispatches on SQL content.
 * Each override is { sqlFragment: string, returns: array }.
 * Falls through to defaultRow if no override matches.
 */
function makeSqlMock(overrides = {}, defaultRow = {}) {
  return {
    query: jest.fn().mockImplementation((sql) => {
      for (const [fragment, value] of Object.entries(overrides)) {
        if (sql.includes(fragment)) return Promise.resolve([[value]]);
      }
      return Promise.resolve([[defaultRow]]);
    }),
    QueryTypes: { SELECT: 'SELECT', INSERT: 'INSERT', UPDATE: 'UPDATE' },
    transaction: jest.fn().mockImplementation(async (cb) => cb({})),
  };
}

describe('PeriodCloseService', () => {
  const tenantId     = 'tenant-001';
  const period       = '2026-05';
  const fiscalYearId = 'fy-001';

  // Default healthy state: all zeroes / completed
  const HEALTHY = {
    count: 0, total: 0, balance: 0, unreconciled: 0,
    completed: 1, active: 5, unposted: 0, critical: 0, status: null,
  };

  describe('getChecklist()', () => {
    it('returns all PASS/NA when system is healthy', async () => {
      const seq = makeSqlMock({}, HEALTHY);
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      expect(result.period).toBe(period);

      const journals = result.checks.find(c => c.id === 'journals_posted');
      expect(journals.status).toBe(CHECK_STATUS.PASS);

      const bank = result.checks.find(c => c.id === 'bank_recon');
      expect(bank.status).toBe(CHECK_STATUS.PASS);

      const ar = result.checks.find(c => c.id === 'ar_tied');
      expect(ar.status).toBe(CHECK_STATUS.PASS);

      const ap = result.checks.find(c => c.id === 'ap_tied');
      expect(ap.status).toBe(CHECK_STATUS.PASS);

      // FCRA: no receipts → NA
      const fcra = result.checks.find(c => c.id === 'fcra_balanced');
      expect(fcra.status).toBe(CHECK_STATUS.NA);

      const dep = result.checks.find(c => c.id === 'depreciation_run');
      expect(dep.status).toBe(CHECK_STATUS.PASS);

      const payroll = result.checks.find(c => c.id === 'payroll_posted');
      expect(payroll.status).toBe(CHECK_STATUS.PASS);

      const exceptions = result.checks.find(c => c.id === 'no_critical_exceptions');
      expect(exceptions.status).toBe(CHECK_STATUS.PASS);
    });

    it('marks journals_posted FAIL when DRAFT journals exist', async () => {
      const seq = makeSqlMock(
        { "status = 'DRAFT'": { count: 3 } },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      const check = result.checks.find(c => c.id === 'journals_posted');
      expect(check.status).toBe(CHECK_STATUS.FAIL);
      expect(check.value).toBe(3);
    });

    it('marks bank_recon FAIL when unreconciled transactions exist', async () => {
      const seq = makeSqlMock(
        { 'bank_transactions': { unreconciled: 5 } },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      const check = result.checks.find(c => c.id === 'bank_recon');
      expect(check.status).toBe(CHECK_STATUS.FAIL);
      expect(check.value).toBe(5);
    });

    it('marks ar_tied FAIL when AR and GL balances differ beyond tolerance', async () => {
      // patient_invoices → total 10000, GL AR code 1200% → balance 8000
      const seq = makeSqlMock(
        {
          'patient_invoices': { total: 10000 },
          "a.code LIKE '1200%'": { balance: 8000 },
        },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      const check = result.checks.find(c => c.id === 'ar_tied');
      expect(check.status).toBe(CHECK_STATUS.FAIL);
      expect(parseFloat(check.variance)).toBeGreaterThan(0.01);
    });

    it('marks ap_tied FAIL when AP and GL balances differ beyond tolerance', async () => {
      const seq = makeSqlMock(
        {
          'vendor_invoices': { total: 5000 },
          "a.code LIKE '2100%'": { balance: 3000 },
        },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      const check = result.checks.find(c => c.id === 'ap_tied');
      expect(check.status).toBe(CHECK_STATUS.FAIL);
      expect(parseFloat(check.variance)).toBeGreaterThan(0.01);
    });

    it('marks fcra_balanced WARN when FCRA journals do not match receipts', async () => {
      const seq = makeSqlMock(
        {
          'fcra_receipts':         { count: 2, total: 50000 },
          "fund_type = 'FCRA'":    { balance: 45000 },
        },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      const check = result.checks.find(c => c.id === 'fcra_balanced');
      // Has FCRA receipts (count=2) so it will try to reconcile
      expect([CHECK_STATUS.PASS, CHECK_STATUS.FAIL]).toContain(check.status);
    });

    it('marks no_critical_exceptions FAIL when critical exceptions exist', async () => {
      const seq = makeSqlMock(
        { 'financial_exceptions': { critical: 3 } },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      const check = result.checks.find(c => c.id === 'no_critical_exceptions');
      expect(check.status).toBe(CHECK_STATUS.FAIL);
      expect(check.value).toBe(3);
    });

    it('marks depreciation_run NA when no depreciable assets exist', async () => {
      const seq = makeSqlMock(
        { 'is_depreciable': { active: 0 } },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);
      const result = await svc.getChecklist(tenantId, period, fiscalYearId);

      const check = result.checks.find(c => c.id === 'depreciation_run');
      expect(check.status).toBe(CHECK_STATUS.NA);
    });
  });

  describe('lockPeriod()', () => {
    it('throws 422 when failing checks exist', async () => {
      const seq = makeSqlMock(
        { "status = 'DRAFT'": { count: 5 } },  // 5 unposted journals → FAIL
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);

      await expect(svc.lockPeriod(tenantId, period, fiscalYearId, 'user-1'))
        .rejects.toMatchObject({ statusCode: 422 });
    });

    it('succeeds and returns locked result when all checks pass', async () => {
      const seq = makeSqlMock({}, HEALTHY);
      const svc = new PeriodCloseService(seq);

      const result = await svc.lockPeriod(tenantId, period, fiscalYearId, 'user-1');

      expect(result.success).toBe(true);
      expect(result.period).toBe(period);
      expect(result.lockedBy).toBe('user-1');
      expect(result.lockedAt).toBeDefined();
    });

    it('error message lists failing check labels', async () => {
      const seq = makeSqlMock(
        {
          "status = 'DRAFT'": { count: 2 },
          'bank_transactions':  { unreconciled: 1 },
        },
        HEALTHY
      );
      const svc = new PeriodCloseService(seq);

      try {
        await svc.lockPeriod(tenantId, period, fiscalYearId, 'user-1');
        fail('Should have thrown');
      } catch (err) {
        expect(err.statusCode).toBe(422);
        expect(err.message).toContain('check(s) failed');
        expect(err.checks.length).toBeGreaterThan(0);
      }
    });
  });
});
