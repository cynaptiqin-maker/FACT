/**
 * Unit Tests: Accounting Engine + Financial Integrity Engine
 *
 * Tests double-entry balancing, integrity validation, reversal building,
 * and reconciliation logic without requiring a database.
 */

const {
  FinancialIntegrityEngine,
  IntegrityError,
  INTEGRITY_ERRORS,
} = require('../../shared/financial-integrity/FinancialIntegrityEngine');

describe('FinancialIntegrityEngine', () => {
  let engine;

  beforeEach(() => {
    engine = new FinancialIntegrityEngine(null, testHelpers.mockRedis);
  });

  // ── Double-entry balance ───────────────────────────────────────────────────

  describe('validateJournalEntry', () => {
    it('passes when debits equal credits', async () => {
      const entry = {
        entry_date: '2026-01-15',
        tenant_id: 'tenant-1',
        lines: [
          { account_id: 'acc-1', debit_amount: 10000, credit_amount: 0 },
          { account_id: 'acc-2', debit_amount: 0, credit_amount: 10000 },
        ],
      };

      await expect(engine.validateJournalEntry(entry)).resolves.toBe(true);
    });

    it('throws IntegrityError when debits ≠ credits', async () => {
      const entry = {
        tenant_id: 'tenant-1',
        lines: [
          { account_id: 'acc-1', debit_amount: 10000, credit_amount: 0 },
          { account_id: 'acc-2', debit_amount: 0, credit_amount: 9999 }, // off by 1
        ],
      };

      await expect(engine.validateJournalEntry(entry)).rejects.toThrow(IntegrityError);
    });

    it('includes violation details in the error', async () => {
      const entry = {
        tenant_id: 'tenant-1',
        lines: [
          { account_id: 'acc-1', debit_amount: 5000, credit_amount: 0 },
          { account_id: 'acc-2', debit_amount: 0, credit_amount: 3000 },
        ],
      };

      try {
        await engine.validateJournalEntry(entry);
        fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(IntegrityError);
        expect(err.violations).toHaveLength(1);
        expect(err.violations[0].code).toBe(INTEGRITY_ERRORS.UNBALANCED_ENTRY);
        expect(err.violations[0].meta.variance).toBe('2000.00');
      }
    });

    it('rejects entries with zero-amount lines', async () => {
      const entry = {
        tenant_id: 'tenant-1',
        lines: [
          { account_id: 'acc-1', debit_amount: 0, credit_amount: 0 },
          { account_id: 'acc-2', debit_amount: 0, credit_amount: 0 },
        ],
      };

      await expect(engine.validateJournalEntry(entry)).rejects.toThrow(IntegrityError);
    });

    it('rejects entries with no lines', async () => {
      const entry = { tenant_id: 'tenant-1', lines: [] };

      await expect(engine.validateJournalEntry(entry)).rejects.toThrow(IntegrityError);
    });

    it('handles floating point amounts correctly (uses Decimal)', async () => {
      // Classic floating point trap: 0.1 + 0.2 ≠ 0.3 in IEEE 754
      const entry = {
        tenant_id: 'tenant-1',
        lines: [
          { account_id: 'acc-1', debit_amount: 0.1, credit_amount: 0 },
          { account_id: 'acc-2', debit_amount: 0.2, credit_amount: 0 },
          { account_id: 'acc-3', debit_amount: 0, credit_amount: 0.3 },
        ],
      };

      await expect(engine.validateJournalEntry(entry)).resolves.toBe(true);
    });

    it('detects duplicate transaction via idempotency key', async () => {
      const key = 'unique-key-123';
      const tenantId = 'tenant-1';

      // Register the key as already processed
      await engine.registerIdempotencyKey(key, tenantId, { id: 'existing-journal' });

      const entry = {
        tenant_id: tenantId,
        idempotency_key: key,
        lines: [
          { account_id: 'acc-1', debit_amount: 1000, credit_amount: 0 },
          { account_id: 'acc-2', debit_amount: 0, credit_amount: 1000 },
        ],
      };

      const err = await engine.validateJournalEntry(entry).catch((e) => e);
      expect(err).toBeInstanceOf(IntegrityError);
      expect(err.violations[0].code).toBe(INTEGRITY_ERRORS.DUPLICATE_TRANSACTION);
    });
  });

  // ── Reconciliation ─────────────────────────────────────────────────────────

  describe('reconcile', () => {
    it('returns balanced=true when sets match within tolerance', async () => {
      const setA = [{ amount: 100000 }, { amount: 50000 }];
      const setB = [{ amount: 150000 }];

      const result = await engine.reconcile(setA, setB, 'AR vs GL');
      expect(result.balanced).toBe(true);
      expect(result.variance).toBe('0.00');
    });

    it('returns balanced=false when variance exceeds tolerance', async () => {
      const setA = [{ amount: 100000 }];
      const setB = [{ amount: 99990 }]; // 10 variance

      const result = await engine.reconcile(setA, setB, 'Test');
      expect(result.balanced).toBe(false);
      expect(parseFloat(result.variance)).toBe(10);
    });

    it('allows up to 0.01 tolerance for FX rounding', async () => {
      const setA = [{ amount: 1000.005 }];
      const setB = [{ amount: 1000.00 }];

      const result = await engine.reconcile(setA, setB, 'FX test');
      expect(result.balanced).toBe(true);
    });
  });

  // ── Depreciation integrity ─────────────────────────────────────────────────

  describe('verifyDepreciationIntegrity', () => {
    it('passes for valid NBV calculation', () => {
      const asset = {
        asset_code: 'AST-001',
        cost: 100000,
        depreciation_to_date: 30000,
        salvage_value: 10000,
        net_book_value: 70000, // cost - accumulated = 100000 - 30000 = 70000
      };

      expect(() => engine.verifyDepreciationIntegrity(asset)).not.toThrow();
    });

    it('throws when NBV does not match cost - accumulated', () => {
      const asset = {
        asset_code: 'AST-002',
        cost: 100000,
        depreciation_to_date: 30000,
        salvage_value: 10000,
        net_book_value: 60000, // Wrong — should be 70000
      };

      expect(() => engine.verifyDepreciationIntegrity(asset)).toThrow(IntegrityError);
    });
  });

  // ── Reversal builder ───────────────────────────────────────────────────────

  describe('buildReversalEntry', () => {
    it('swaps debit and credit for all lines', () => {
      const original = {
        id: 'je-001',
        reference_number: 'JE-2026-001',
        notes: 'Test entry',
        lines: [
          { account_id: 'acc-1', debit_amount: 5000, credit_amount: 0, description: 'DR' },
          { account_id: 'acc-2', debit_amount: 0, credit_amount: 5000, description: 'CR' },
        ],
      };

      const reversal = engine.buildReversalEntry(original, '2026-02-01', 'user-1');

      expect(reversal.reference_number).toBe('REV-JE-2026-001');
      expect(reversal.reversed_entry_id).toBe('je-001');
      expect(reversal.lines[0].debit_amount).toBe(0);
      expect(reversal.lines[0].credit_amount).toBe(5000);
      expect(reversal.lines[1].debit_amount).toBe(5000);
      expect(reversal.lines[1].credit_amount).toBe(0);
    });

    it('does not mutate the original entry', () => {
      const original = {
        id: 'je-002',
        reference_number: 'JE-002',
        lines: [
          { account_id: 'acc-1', debit_amount: 1000, credit_amount: 0 },
        ],
      };

      engine.buildReversalEntry(original, '2026-02-01', 'user-1');
      expect(original.lines[0].debit_amount).toBe(1000);
    });
  });
});
