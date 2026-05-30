'use strict';

/**
 * FinancialHealthEngine tests
 *
 * Uses SQL-fragment-dispatched mocks. The engine calls sequelize.query with
 * `type: SELECT`, which real Sequelize resolves as [row, row, ...] (no outer
 * wrapper). Mocks must therefore resolve to [value] — NOT [[value]].
 *
 * SQL fragments used to dispatch (matched against actual engine SQL):
 *   Liquidity:         'sub_type'           → accounts with FILTER on sub_type
 *   Cash query 1:      'is_cash_account'    → accounts WHERE is_cash_account
 *   Cash query 2:      'DATE_TRUNC'         → journal_entries burn average
 *   AR:                'invoice_date'       → patient_invoices overdue 90d
 *   Vendor:            'due_date'           → vendor_invoices overdue
 *   Recon:             "recon_status = 'UNMATCHED'"
 *   Leakage invoices:  'draft_invoices'     → column alias in SELECT
 *   Leakage claims:    'draft_claims'       → column alias in SELECT
 *   FCRA:              'fcra_registrations' → JOIN query
 */

const { FinancialHealthEngine } = require('../../modules/reporting/services/FinancialHealthEngine');

function makeSeq(overrides = {}) {
  return {
    query: jest.fn().mockImplementation((sql) => {
      for (const [fragment, value] of Object.entries(overrides)) {
        if (sql.includes(fragment)) return Promise.resolve([value]);
      }
      return Promise.resolve([{}]);
    }),
    QueryTypes: { SELECT: 'SELECT' },
  };
}

// ─── Pre-computed grade A override set ───────────────────────────────────────
// All components should score 100 → overall 100 → grade A
const GRADE_A_OVERRIDES = {
  'sub_type':                   { ca: 200000, cl: 80000 },     // ratio 2.5 → 100
  'is_cash_account':            { cash: 500000 },              // 10mo runway → 100
  'DATE_TRUNC':                 { monthly_burn: 50000 },
  'invoice_date':               { total_ar: 100000, overdue_90: 2000 },  // 2% → 100
  'due_date':                   { total_ap: 50000, overdue_ap: 1000 },   // 2% → 100
  "recon_status = 'UNMATCHED'": { unmatched_count: 0, total_count: 100 }, // 0% → 100
  'draft_invoices':             { draft_invoices: 0, draft_amount: 0 },  // 0 draft → 100
  'draft_claims':               { draft_claims: 0 },
  'fcra_registrations':         { total_receipts: 0, admin_expenses: 0 }, // no FCRA → 100
};

// ─── Pre-computed grade F override set ───────────────────────────────────────
// liquidity=0, AR=0, runway=20, vendor=20, recon=25, leakage=15, fcra=0
// weighted: 0 + 0 + 3 + 3 + 2.5 + 1.5 + 0 = 10 → grade F
const GRADE_F_OVERRIDES = {
  'sub_type':                   { ca: 0, cl: 100000 },          // ratio 0 → 0
  'is_cash_account':            { cash: 0 },                    // 0 months → 20
  'DATE_TRUNC':                 { monthly_burn: 50000 },
  'invoice_date':               { total_ar: 100000, overdue_90: 80000 },  // 80% → 0
  'due_date':                   { total_ap: 100000, overdue_ap: 70000 },  // 70% → 20
  "recon_status = 'UNMATCHED'": { unmatched_count: 80, total_count: 100 }, // 80% → 25
  'draft_invoices':             { draft_invoices: 50, draft_amount: 2000000 }, // 2M → 15
  'draft_claims':               { draft_claims: 0 },
  'fcra_registrations':         { total_receipts: 1000000, admin_expenses: 250000 }, // 25% → 0
};

describe('FinancialHealthEngine', () => {
  describe('grade assignment', () => {
    it('returns grade A (score ≥ 85) for a financially healthy tenant', async () => {
      const seq = makeSeq(GRADE_A_OVERRIDES);
      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      expect(result.overallScore).toBeGreaterThanOrEqual(85);
      expect(result.grade).toBe('A');
      expect(result.recommendations).toHaveLength(0);
    });

    it('returns grade D or F (score < 55) when all components are worst-case', async () => {
      const seq = makeSeq(GRADE_F_OVERRIDES);
      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      expect(result.overallScore).toBeLessThan(55);
      expect(['D', 'F']).toContain(result.grade);
    });

    it('generates recommendations for components with score < 70', async () => {
      const seq = makeSeq({
        ...GRADE_A_OVERRIDES,
        'invoice_date': { total_ar: 100000, overdue_90: 60000 }, // 60% → score 0
      });

      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      const arRec = result.recommendations.find(r => r.area === 'AR Collection Health');
      expect(arRec).toBeDefined();
      expect(arRec.action).toContain('AR');
      expect(arRec.score).toBeLessThan(70);
    });

    it('does not generate recommendations for components scoring ≥ 70', async () => {
      const seq = makeSeq({
        ...GRADE_A_OVERRIDES,
        'invoice_date': { total_ar: 100000, overdue_90: 5000 }, // 5% → score 100
      });

      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      const arRec = result.recommendations.find(r => r.area === 'AR Collection Health');
      expect(arRec).toBeUndefined();
    });
  });

  describe('resilience', () => {
    it('never throws when all DB queries fail — returns partial score', async () => {
      const seq = {
        query: jest.fn().mockRejectedValue(new Error('DB unavailable')),
        QueryTypes: { SELECT: 'SELECT' },
      };

      const engine = new FinancialHealthEngine(seq);
      await expect(engine.computeHealthScore('t1')).resolves.toBeDefined();
    });

    it('returns a valid grade even when all queries fail with errors', async () => {
      const seq = {
        query: jest.fn().mockRejectedValue(new Error('connection lost')),
        QueryTypes: { SELECT: 'SELECT' },
      };

      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      expect(typeof result.overallScore).toBe('number');
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.grade);
      expect(Array.isArray(result.components)).toBe(true);
      expect(result.components).toHaveLength(7);
    });
  });

  describe('scoring invariants', () => {
    it('component weights sum to 1.0', async () => {
      const seq = makeSeq(GRADE_A_OVERRIDES);
      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      const totalWeight = result.components.reduce((s, c) => s + c.weight, 0);
      expect(totalWeight).toBeCloseTo(1.0, 5);
    });

    it('overall score is bounded between 0 and 100', async () => {
      const seq = makeSeq(GRADE_F_OVERRIDES);
      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('each component score is between 0 and 100', async () => {
      const seq = makeSeq(GRADE_F_OVERRIDES);
      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      for (const c of result.components) {
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
      }
    });

    it('result includes generatedAt ISO timestamp', async () => {
      const seq = makeSeq(GRADE_A_OVERRIDES);
      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      expect(result.generatedAt).toBeDefined();
      expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
    });
  });

  describe('FCRA component', () => {
    it('returns score 100 and hasFCRA=false when no FCRA receipts exist', async () => {
      const seq = makeSeq({
        ...GRADE_A_OVERRIDES,
        'fcra_registrations': { total_receipts: 0, admin_expenses: 0 },
      });

      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      const fcraComponent = result.components.find(c => c.id === 'fcra');
      expect(fcraComponent.score).toBe(100);
      expect(fcraComponent.detail.hasFCRA).toBe(false);
    });

    it('score is 0 and isBreached=true when admin cap >= 20%', async () => {
      const seq = makeSeq({
        ...GRADE_A_OVERRIDES,
        'fcra_registrations': { total_receipts: 1000000, admin_expenses: 210000 }, // 21%
      });

      const engine = new FinancialHealthEngine(seq);
      const result = await engine.computeHealthScore('t1');

      const fcraComponent = result.components.find(c => c.id === 'fcra');
      expect(fcraComponent.score).toBe(0);
      expect(fcraComponent.detail.isBreached).toBe(true);
    });
  });
});
