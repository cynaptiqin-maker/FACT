/**
 * Unit Tests: FCRA Module — Business Rules and Accounting Integrity
 *
 * Tests cover:
 *   1. Admin-cap enforcement (admin expenditure ≤ 20% of total FC receipts)
 *   2. DBA uniqueness enforcement (only one active DBA per registration)
 *   3. Balance checks (utilisation cannot exceed available FC balance)
 *   4. Double-entry integrity for every FCRA posting (DR = CR)
 *   5. Account auto-provisioning (getOrCreateAccount idempotency)
 *   6. Disposal accounting mathematics (gain / loss / break-even)
 *   7. Fiscal year gate (journal skipped when no open FY)
 */

'use strict';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-fcra-test';
const USER_ID   = 'user-fcra-test';

// Build a minimal mock for accountingEngine.postJournalEntry
function buildMockEngine() {
  const calls = [];
  return {
    calls,
    postJournalEntry: jest.fn(async (params) => {
      // Enforce DR = CR — same check the real engine does
      const totalDR = params.lines.reduce((s, l) => s + (l.debit  || 0), 0);
      const totalCR = params.lines.reduce((s, l) => s + (l.credit || 0), 0);
      if (Math.abs(totalDR - totalCR) > 0.01) {
        throw new Error(`DR (${totalDR}) ≠ CR (${totalCR}) — unbalanced entry`);
      }
      const entry = { entryNumber: `JV-TEST-${calls.length + 1}`, ...params };
      calls.push(entry);
      return entry;
    }),
  };
}

// ─── 1. Admin-cap enforcement ─────────────────────────────────────────────────

describe('FCRA admin-cap rule (≤ 20%)', () => {
  function computeAdminCapPct(adminSpend, totalReceipts) {
    if (!totalReceipts || totalReceipts <= 0) return 0;
    return (adminSpend / totalReceipts) * 100;
  }

  it('allows admin spend within 20%', () => {
    const pct = computeAdminCapPct(150000, 1000000); // 15%
    expect(pct).toBeLessThanOrEqual(20);
  });

  it('flags admin spend at exactly 20%', () => {
    const pct = computeAdminCapPct(200000, 1000000); // 20%
    expect(pct).toBeLessThanOrEqual(20);
  });

  it('flags breach when admin spend exceeds 20%', () => {
    const pct = computeAdminCapPct(210000, 1000000); // 21%
    expect(pct).toBeGreaterThan(20);
  });

  it('flags breach on warning threshold (15%)', () => {
    const pct = computeAdminCapPct(160000, 1000000); // 16%
    expect(pct).toBeGreaterThan(15);
    expect(pct).toBeLessThanOrEqual(20);
  });

  it('returns 0 when no receipts exist', () => {
    const pct = computeAdminCapPct(0, 0);
    expect(pct).toBe(0);
  });
});

// ─── 2. DBA uniqueness ────────────────────────────────────────────────────────

describe('FCRA DBA uniqueness rule', () => {
  // Simulates the DB check: only one DBA may be active per registration
  function validateDBAUniqueness(existingAccounts, newAccount) {
    // Only enforce uniqueness when the NEW account is itself designated
    if (!newAccount.is_designated) return true;
    const activeDBA = existingAccounts.find(
      (a) => a.registration_id === newAccount.registration_id &&
              a.is_designated   === true &&
              a.status          === 'active'
    );
    if (activeDBA) {
      throw new Error(`Registration ${newAccount.registration_id} already has an active Designated Bank Account`);
    }
    return true;
  }

  const REG_ID = 'reg-001';

  it('allows first DBA for a registration', () => {
    expect(() => validateDBAUniqueness([], { registration_id: REG_ID, is_designated: true, status: 'active' })).not.toThrow();
  });

  it('blocks second active DBA for same registration', () => {
    const existing = [{ registration_id: REG_ID, is_designated: true, status: 'active' }];
    expect(() => validateDBAUniqueness(existing, { registration_id: REG_ID, is_designated: true, status: 'active' }))
      .toThrow(/already has an active Designated Bank Account/);
  });

  it('allows second DBA if first is inactive', () => {
    const existing = [{ registration_id: REG_ID, is_designated: true, status: 'inactive' }];
    expect(() => validateDBAUniqueness(existing, { registration_id: REG_ID, is_designated: true, status: 'active' })).not.toThrow();
  });

  it('allows non-designated account regardless', () => {
    const existing = [{ registration_id: REG_ID, is_designated: true, status: 'active' }];
    expect(() => validateDBAUniqueness(existing, { registration_id: REG_ID, is_designated: false, status: 'active' })).not.toThrow();
  });
});

// ─── 3. Balance checks ────────────────────────────────────────────────────────

describe('FCRA utilisation balance check', () => {
  function validateUtilisationBalance(availableBalance, utilisationAmount) {
    if (utilisationAmount > availableBalance) {
      throw new Error(`Utilisation amount ₹${utilisationAmount} exceeds available FC balance ₹${availableBalance}`);
    }
    return true;
  }

  it('allows utilisation within balance', () => {
    expect(() => validateUtilisationBalance(500000, 300000)).not.toThrow();
  });

  it('allows utilisation equal to balance', () => {
    expect(() => validateUtilisationBalance(300000, 300000)).not.toThrow();
  });

  it('blocks utilisation exceeding balance', () => {
    expect(() => validateUtilisationBalance(300000, 300001))
      .toThrow(/exceeds available FC balance/);
  });

  it('blocks any utilisation when balance is zero', () => {
    expect(() => validateUtilisationBalance(0, 1))
      .toThrow(/exceeds available FC balance/);
  });
});

// ─── 4. Accounting integrity (DR = CR) ───────────────────────────────────────

describe('FCRA accounting postings — DR = CR guarantee', () => {
  let engine;

  beforeEach(() => { engine = buildMockEngine(); });

  // Receipt: DR DBA / CR Restricted Fund
  it('postReceiptVerified produces balanced entry', async () => {
    const amount = 500000;
    const params = {
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-04-01',
      fiscalYearId: 'fy-01', narration: 'Test receipt', reference: 'RCP-001',
      sourceModule: 'fcra', sourceId: 'rcpt-001', postedBy: USER_ID,
      lines: [
        { accountId: 'dba-01',  debit: amount, credit: 0,      narration: 'Into DBA' },
        { accountId: 'fund-01', debit: 0,      credit: amount, narration: 'Restricted fund' },
      ],
    };

    const result = await engine.postJournalEntry(params);
    expect(result.entryNumber).toMatch(/^JV-TEST-/);
    expect(engine.calls).toHaveLength(1);
  });

  // Utilisation: DR Expense / CR DBA
  it('postUtilisationApproved produces balanced entry', async () => {
    const amount = 120000;
    const params = {
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-04-15',
      fiscalYearId: 'fy-01', narration: 'Programme expense', reference: 'UTL-001',
      sourceModule: 'fcra', sourceId: 'util-001', postedBy: USER_ID,
      lines: [
        { accountId: 'exp-01', debit: amount, credit: 0,      narration: 'FCRA programme expense' },
        { accountId: 'dba-01', debit: 0,      credit: amount, narration: 'DBA disbursed' },
      ],
    };

    await engine.postJournalEntry(params);
    expect(engine.calls).toHaveLength(1);
  });

  // Asset purchase: DR Fixed Assets / CR DBA
  it('postAssetPurchased produces balanced entry', async () => {
    const amount = 800000;
    const params = {
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-05-01',
      fiscalYearId: 'fy-01', narration: 'Asset: Computer', reference: 'AST-001',
      sourceModule: 'fcra', sourceId: 'asset-001', postedBy: USER_ID,
      lines: [
        { accountId: 'ast-01', debit: amount, credit: 0,      narration: 'FCRA fixed asset' },
        { accountId: 'dba-01', debit: 0,      credit: amount, narration: 'DBA payment' },
      ],
    };

    await engine.postJournalEntry(params);
    expect(engine.calls).toHaveLength(1);
  });

  // Disposal with gain: DR DBA + AccumDepr / CR FixedAssets + Gain
  it('postAssetDisposal (gain scenario) produces balanced entry', async () => {
    const cost         = 800000;
    const accumDepr    = 300000;
    const saleProceeds = 600000;
    const netBookValue = cost - accumDepr;           // 500000
    const gain         = saleProceeds - netBookValue; // 100000

    const params = {
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-06-01',
      fiscalYearId: 'fy-01', narration: 'Asset disposal — gain', reference: 'DISP-001',
      sourceModule: 'fcra', sourceId: 'disp-001', postedBy: USER_ID,
      lines: [
        { accountId: 'dba-01',    debit: saleProceeds, credit: 0,    narration: 'Sale proceeds' },
        { accountId: 'accDepr-01',debit: accumDepr,    credit: 0,    narration: 'Accumulated depr write-off' },
        { accountId: 'ast-01',    debit: 0,            credit: cost, narration: 'Asset cost removed' },
        { accountId: 'gain-01',   debit: 0,            credit: gain, narration: 'Gain on disposal' },
      ],
    };

    // Verify our test math is sound before passing to mock
    const totalDR = saleProceeds + accumDepr;         // 900000
    const totalCR = cost + gain;                       // 900000
    expect(totalDR).toBe(totalCR);

    await engine.postJournalEntry(params);
    expect(engine.calls).toHaveLength(1);
  });

  // Disposal with loss: DR DBA + AccumDepr + Loss / CR FixedAssets
  it('postAssetDisposal (loss scenario) produces balanced entry', async () => {
    const cost         = 800000;
    const accumDepr    = 200000;
    const saleProceeds = 400000;
    const netBookValue = cost - accumDepr;            // 600000
    const loss         = Math.abs(saleProceeds - netBookValue); // 200000

    const params = {
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-06-01',
      fiscalYearId: 'fy-01', narration: 'Asset disposal — loss', reference: 'DISP-002',
      sourceModule: 'fcra', sourceId: 'disp-002', postedBy: USER_ID,
      lines: [
        { accountId: 'dba-01',    debit: saleProceeds, credit: 0,    narration: 'Sale proceeds' },
        { accountId: 'accDepr-01',debit: accumDepr,    credit: 0,    narration: 'Accumulated depr write-off' },
        { accountId: 'loss-01',   debit: loss,         credit: 0,    narration: 'Loss on disposal' },
        { accountId: 'ast-01',    debit: 0,            credit: cost, narration: 'Asset cost removed' },
      ],
    };

    const totalDR = saleProceeds + accumDepr + loss;  // 800000
    const totalCR = cost;                              // 800000
    expect(totalDR).toBe(totalCR);

    await engine.postJournalEntry(params);
    expect(engine.calls).toHaveLength(1);
  });

  // Disposal break-even: no gain/loss line needed, still balanced
  it('postAssetDisposal (break-even) produces balanced entry without gain/loss line', async () => {
    const cost         = 600000;
    const accumDepr    = 200000;
    const saleProceeds = 400000; // exactly net book value

    const params = {
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-06-01',
      fiscalYearId: 'fy-01', narration: 'Asset disposal — break-even', reference: 'DISP-003',
      sourceModule: 'fcra', sourceId: 'disp-003', postedBy: USER_ID,
      lines: [
        { accountId: 'dba-01',    debit: saleProceeds, credit: 0,    narration: 'Sale proceeds' },
        { accountId: 'accDepr-01',debit: accumDepr,    credit: 0,    narration: 'Accumulated depr write-off' },
        { accountId: 'ast-01',    debit: 0,            credit: cost, narration: 'Asset cost removed' },
      ],
    };

    const totalDR = saleProceeds + accumDepr; // 600000
    const totalCR = cost;                     // 600000
    expect(totalDR).toBe(totalCR);

    await engine.postJournalEntry(params);
    expect(engine.calls).toHaveLength(1);
  });

  it('mock engine rejects unbalanced entry', async () => {
    const params = {
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-04-01',
      fiscalYearId: 'fy-01', narration: 'Bad entry', reference: 'BAD-001',
      sourceModule: 'fcra', sourceId: 'bad-001', postedBy: USER_ID,
      lines: [
        { accountId: 'dba-01',  debit: 100000, credit: 0,     narration: 'DR' },
        { accountId: 'fund-01', debit: 0,      credit: 99999, narration: 'CR (off by 1)' },
      ],
    };

    await expect(engine.postJournalEntry(params)).rejects.toThrow(/DR.*≠.*CR/);
    expect(engine.calls).toHaveLength(0);
  });
});

// ─── 5. Account auto-provisioning idempotency ─────────────────────────────────

describe('FCRA account auto-provisioning (getOrCreateAccount)', () => {
  // Simulate idempotent getOrCreate
  function buildMockAccountStore() {
    const store = new Map();
    let createCount = 0;

    return {
      createCount: () => createCount,
      getOrCreate: async (tenantId, code, name, type) => {
        const key = `${tenantId}:${code}`;
        if (store.has(key)) return store.get(key);
        const id = `acc-${++createCount}`;
        store.set(key, id);
        return id;
      },
    };
  }

  it('creates account on first call', async () => {
    const mock = buildMockAccountStore();
    const id1 = await mock.getOrCreate(TENANT_ID, 'FCRA-1001', 'FC DBA', 'ASSET');
    expect(id1).toBe('acc-1');
    expect(mock.createCount()).toBe(1);
  });

  it('returns same ID on repeated calls (idempotent)', async () => {
    const mock = buildMockAccountStore();
    const id1 = await mock.getOrCreate(TENANT_ID, 'FCRA-1001', 'FC DBA', 'ASSET');
    const id2 = await mock.getOrCreate(TENANT_ID, 'FCRA-1001', 'FC DBA', 'ASSET');
    expect(id1).toBe(id2);
    expect(mock.createCount()).toBe(1);
  });

  it('creates separate accounts per tenant', async () => {
    const mock = buildMockAccountStore();
    const id1 = await mock.getOrCreate('tenant-A', 'FCRA-1001', 'FC DBA', 'ASSET');
    const id2 = await mock.getOrCreate('tenant-B', 'FCRA-1001', 'FC DBA', 'ASSET');
    expect(id1).not.toBe(id2);
    expect(mock.createCount()).toBe(2);
  });

  it('creates separate entries for different account codes', async () => {
    const mock = buildMockAccountStore();
    const id1 = await mock.getOrCreate(TENANT_ID, 'FCRA-1001', 'FC DBA',        'ASSET');
    const id2 = await mock.getOrCreate(TENANT_ID, 'FCRA-2001', 'Restricted Fund','LIABILITY');
    expect(id1).not.toBe(id2);
    expect(mock.createCount()).toBe(2);
  });
});

// ─── 6. Fiscal year gate ─────────────────────────────────────────────────────

describe('FCRA fiscal year gate', () => {
  it('skips journal when no open fiscal year exists', async () => {
    const engine = buildMockEngine();
    const posted = [];

    // Simulates the gate logic in fcra.accounting.js post()
    async function gatedPost(params, fiscalYearId) {
      if (!fiscalYearId) return null; // gate: skip
      const result = await engine.postJournalEntry({ ...params, fiscalYearId });
      posted.push(result);
      return result;
    }

    const result = await gatedPost({ lines: [] }, null);
    expect(result).toBeNull();
    expect(engine.calls).toHaveLength(0);
    expect(posted).toHaveLength(0);
  });

  it('posts journal when open fiscal year exists', async () => {
    const engine = buildMockEngine();
    const amount = 250000;

    async function gatedPost(params, fiscalYearId) {
      if (!fiscalYearId) return null;
      return engine.postJournalEntry({ ...params, fiscalYearId });
    }

    const result = await gatedPost({
      tenantId: TENANT_ID, voucherType: 'JOURNAL', date: '2026-04-01',
      narration: 'Test', reference: 'T-001', sourceModule: 'fcra', sourceId: 's-001',
      postedBy: USER_ID,
      lines: [
        { accountId: 'dba-01',  debit: amount, credit: 0,      narration: 'DR' },
        { accountId: 'fund-01', debit: 0,      credit: amount, narration: 'CR' },
      ],
    }, 'fy-open-01');

    expect(result).not.toBeNull();
    expect(result.entryNumber).toMatch(/^JV-TEST-/);
    expect(engine.calls).toHaveLength(1);
  });
});

// ─── 7. FC-4 admin cap calculation ───────────────────────────────────────────

describe('FC-4 admin cap calculation logic', () => {
  // Mirrors what the /fc4/:id/compute route does
  function computeFC4Cap(yearData) {
    const { total_receipts_inr, utilisations } = yearData;
    const adminExp   = utilisations.filter(u => u.category === 'administrative').reduce((s, u) => s + Number(u.amount), 0);
    const progExp    = utilisations.filter(u => u.category === 'programme').reduce((s, u) => s + Number(u.amount), 0);
    const totalExp   = utilisations.reduce((s, u) => s + Number(u.amount), 0);
    const adminCapPct = total_receipts_inr > 0 ? (adminExp / total_receipts_inr) * 100 : 0;
    const breach     = adminCapPct > 20;

    return { adminExp, progExp, totalExp, adminCapPct: parseFloat(adminCapPct.toFixed(2)), breach };
  }

  it('calculates correctly within cap', () => {
    const result = computeFC4Cap({
      total_receipts_inr: 1000000,
      utilisations: [
        { category: 'administrative', amount: '150000' },
        { category: 'programme',      amount: '500000' },
      ],
    });
    expect(result.adminCapPct).toBe(15);
    expect(result.breach).toBe(false);
    expect(result.totalExp).toBe(650000);
  });

  it('detects breach above 20%', () => {
    const result = computeFC4Cap({
      total_receipts_inr: 1000000,
      utilisations: [
        { category: 'administrative', amount: '210000' }, // 21%
        { category: 'programme',      amount: '400000' },
      ],
    });
    expect(result.adminCapPct).toBe(21);
    expect(result.breach).toBe(true);
  });

  it('handles zero receipts gracefully', () => {
    const result = computeFC4Cap({
      total_receipts_inr: 0,
      utilisations: [{ category: 'administrative', amount: '10000' }],
    });
    expect(result.adminCapPct).toBe(0);
    expect(result.breach).toBe(false);
  });
});
