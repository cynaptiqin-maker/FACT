'use strict';

/**
 * Unit Tests: SharedPostingEngine — Unified Fund & Posting Control Layer
 *
 * All tests use mocked Sequelize queries — no real DB required.
 *
 * Test groups:
 *   1. PrePostValidator
 *   2. FundTypeValidator
 *   3. PostingContract (validatePostingContract)
 *   4. SharedPostingEngine integration (all mocked)
 */

// ─── Module under test ───────────────────────────────────────────────────────

// We require directly from source files (not the barrel) so Jest can mock
// sequelize independently for each validator without coupling to singleton.

const { validatePostingContract, FUND_TYPES, POSTING_EVENTS, RECON_STATUSES } = require('../../shared/posting-engine/PostingContract');
const { PrePostValidator, DuplicatePostingError, FiscalYearClosedError, PeriodLockedError, InvalidAccountError, ZeroAmountError } = require('../../shared/posting-engine/PrePostValidator');
const { FundTypeValidator, FundMixingError } = require('../../shared/posting-engine/FundTypeValidator');
const { SharedPostingEngine } = require('../../shared/posting-engine/SharedPostingEngine');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TENANT_ID   = 'tenant-test-uuid-0001';
const USER_ID     = 'user-test-uuid-0001';
const FY_ID       = 'fy-test-uuid-0001';
const SOURCE_ID   = 'source-test-uuid-0001';
const ACCOUNT_A   = 'acc-uuid-aaaa-0001';
const ACCOUNT_B   = 'acc-uuid-bbbb-0002';
const ACCOUNT_FCRA_A = 'acc-uuid-fcra-0001';
const ACCOUNT_FCRA_B = 'acc-uuid-fcra-0002';

function makeLines(accountA = ACCOUNT_A, accountB = ACCOUNT_B, amount = 1000) {
  return [
    { accountId: accountA, debit: amount, credit: 0,      narration: 'Debit side' },
    { accountId: accountB, debit: 0,      credit: amount, narration: 'Credit side' },
  ];
}

function makeFcraLines(amount = 500) {
  return [
    { accountId: ACCOUNT_FCRA_A, debit: amount, credit: 0,      narration: 'FCRA debit' },
    { accountId: ACCOUNT_FCRA_B, debit: 0,      credit: amount, narration: 'FCRA credit' },
  ];
}

function makeBaseContract(overrides = {}) {
  return {
    tenantId:     TENANT_ID,
    fundType:     FUND_TYPES.LOCAL,
    voucherType:  'JOURNAL',
    date:         '2026-04-01',
    fiscalYearId: FY_ID,
    narration:    'Test posting',
    sourceModule: 'test-module',
    sourceId:     SOURCE_ID,
    postedBy:     USER_ID,
    lines:        makeLines(),
    ...overrides,
  };
}

/**
 * Build a mock Sequelize instance with a controllable query function.
 * `queryResponses` is a Map from a string key (matching substring of SQL) to
 * an array of rows to return. Unmatched queries return [].
 */
function buildMockSequelize(queryResponses = new Map()) {
  const mock = {
    QueryTypes: { SELECT: 'SELECT', UPDATE: 'UPDATE', INSERT: 'INSERT' },
    query: jest.fn(async (sql, options) => {
      // Find a matching response by checking if sql contains any registered key
      for (const [key, response] of queryResponses) {
        if (sql.includes(key)) {
          return response;
        }
      }
      return []; // default: empty result
    }),
  };
  return mock;
}

// ─── 1. PrePostValidator ─────────────────────────────────────────────────────

describe('PrePostValidator', () => {
  const baseParams = {
    tenantId:       TENANT_ID,
    fundType:       FUND_TYPES.LOCAL,
    fiscalYearId:   FY_ID,
    date:           '2026-04-01',
    sourceModule:   'test-module',
    sourceId:       SOURCE_ID,
    idempotencyKey: `test-module:${SOURCE_ID}`,
    lines:          makeLines(),
    allowReversal:  false,
  };

  // 1.1 Idempotency — duplicate blocked ─────────────────────────────────────
  it('idempotency check blocks duplicate posting when existing entry found', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries', [{ entry_number: 'JV-2026-000001' }]], // duplicate found
    ]));
    const validator = new PrePostValidator(seq);

    await expect(validator.validate(baseParams))
      .rejects.toThrow(DuplicatePostingError);
    await expect(validator.validate(baseParams))
      .rejects.toThrow(/JV-2026-000001/);
  });

  // 1.2 Idempotency — new source_id passes ──────────────────────────────────
  it('idempotency check passes for new source_id (no existing entry)', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries', []], // no duplicate
      ['fiscal_years',    [{ id: FY_ID, status: 'open' }]],
      ['accounting_periods', []],                               // no locked period
      ['accounts',        [
        { id: ACCOUNT_A, code: 'LOCAL-1001', name: 'Cash', is_active: true, is_group: false, tenant_id: TENANT_ID },
        { id: ACCOUNT_B, code: 'LOCAL-2001', name: 'Revenue', is_active: true, is_group: false, tenant_id: TENANT_ID },
      ]],
    ]));
    const validator = new PrePostValidator(seq);
    await expect(validator.validate(baseParams)).resolves.toBeUndefined();
  });

  // 1.3 allowReversal=true passes even when entry exists ────────────────────
  it('idempotency check passes when allowReversal=true even if entry exists', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries', [{ entry_number: 'JV-2026-000001' }]], // duplicate found
      ['fiscal_years',    [{ id: FY_ID, status: 'open' }]],
      ['accounting_periods', []],
      ['accounts',        [
        { id: ACCOUNT_A, code: 'LOCAL-1001', name: 'Cash', is_active: true, is_group: false, tenant_id: TENANT_ID },
        { id: ACCOUNT_B, code: 'LOCAL-2001', name: 'Revenue', is_active: true, is_group: false, tenant_id: TENANT_ID },
      ]],
    ]));
    const validator = new PrePostValidator(seq);
    await expect(validator.validate({ ...baseParams, allowReversal: true }))
      .resolves.toBeUndefined();
  });

  // 1.4 Fiscal year closed ───────────────────────────────────────────────────
  it('throws FiscalYearClosedError when fiscal year status is not open', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries',  []], // no duplicate
      ['fiscal_years',     [{ id: FY_ID, status: 'closed' }]],
    ]));
    const validator = new PrePostValidator(seq);

    await expect(validator.validate(baseParams))
      .rejects.toThrow(FiscalYearClosedError);
    await expect(validator.validate(baseParams))
      .rejects.toThrow(/closed/);
  });

  // 1.5 Fiscal year not found ────────────────────────────────────────────────
  it('throws FiscalYearClosedError when fiscal year is not found', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries', []],
      ['fiscal_years',    []], // not found
    ]));
    const validator = new PrePostValidator(seq);

    await expect(validator.validate(baseParams))
      .rejects.toThrow(FiscalYearClosedError);
  });

  // 1.6 Period locked ────────────────────────────────────────────────────────
  it('throws PeriodLockedError when accounting period is LOCKED', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries',    []],
      ['fiscal_years',       [{ id: FY_ID, status: 'open' }]],
      ['accounting_periods', [{ id: 'period-001', name: 'Apr 2026', status: 'LOCKED' }]],
    ]));
    const validator = new PrePostValidator(seq);

    await expect(validator.validate(baseParams))
      .rejects.toThrow(PeriodLockedError);
    await expect(validator.validate(baseParams))
      .rejects.toThrow(/LOCKED/);
  });

  // 1.7 Inactive account ────────────────────────────────────────────────────
  it('throws InvalidAccountError for inactive account', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries',    []],
      ['fiscal_years',       [{ id: FY_ID, status: 'open' }]],
      ['accounting_periods', []],
      ['accounts',           [
        { id: ACCOUNT_A, code: 'LOCAL-1001', name: 'Cash',    is_active: false, is_group: false, tenant_id: TENANT_ID },
        { id: ACCOUNT_B, code: 'LOCAL-2001', name: 'Revenue', is_active: true,  is_group: false, tenant_id: TENANT_ID },
      ]],
    ]));
    const validator = new PrePostValidator(seq);

    await expect(validator.validate(baseParams))
      .rejects.toThrow(InvalidAccountError);
    await expect(validator.validate(baseParams))
      .rejects.toThrow(/inactive/i);
  });

  // 1.8 Group account ───────────────────────────────────────────────────────
  it('throws InvalidAccountError for group/header account', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries',    []],
      ['fiscal_years',       [{ id: FY_ID, status: 'open' }]],
      ['accounting_periods', []],
      ['accounts',           [
        { id: ACCOUNT_A, code: 'LOCAL-1001', name: 'Assets Header', is_active: true, is_group: true, tenant_id: TENANT_ID },
        { id: ACCOUNT_B, code: 'LOCAL-2001', name: 'Revenue',       is_active: true, is_group: false, tenant_id: TENANT_ID },
      ]],
    ]));
    const validator = new PrePostValidator(seq);

    await expect(validator.validate(baseParams))
      .rejects.toThrow(InvalidAccountError);
    await expect(validator.validate(baseParams))
      .rejects.toThrow(/group/i);
  });

  // 1.9 Zero amount ─────────────────────────────────────────────────────────
  it('throws ZeroAmountError when all debits are zero', async () => {
    const seq = buildMockSequelize(new Map([
      ['journal_entries',    []],
      ['fiscal_years',       [{ id: FY_ID, status: 'open' }]],
      ['accounting_periods', []],
      ['accounts',           [
        { id: ACCOUNT_A, code: 'LOCAL-1001', name: 'Cash',    is_active: true, is_group: false, tenant_id: TENANT_ID },
        { id: ACCOUNT_B, code: 'LOCAL-2001', name: 'Revenue', is_active: true, is_group: false, tenant_id: TENANT_ID },
      ]],
    ]));
    const validator = new PrePostValidator(seq);

    const zeroLines = [
      { accountId: ACCOUNT_A, debit: 0, credit: 0 },
      { accountId: ACCOUNT_B, debit: 0, credit: 0 },
    ];
    await expect(validator.validate({ ...baseParams, lines: zeroLines }))
      .rejects.toThrow(ZeroAmountError);
  });
});

// ─── 2. FundTypeValidator ─────────────────────────────────────────────────────

describe('FundTypeValidator', () => {
  // 2.1 FCRA fund type passes with FCRA- prefix accounts ─────────────────────
  it('FCRA fund type passes when all accounts have FCRA- prefix', async () => {
    const seq = buildMockSequelize(new Map([
      ['accounts', [
        { id: ACCOUNT_FCRA_A, code: 'FCRA-1001', tags: JSON.stringify(['fcra', 'system']) },
        { id: ACCOUNT_FCRA_B, code: 'FCRA-2001', tags: JSON.stringify(['fcra', 'system']) },
      ]],
    ]));
    const validator = new FundTypeValidator(seq);

    await expect(validator.validate({
      tenantId: TENANT_ID,
      fundType: FUND_TYPES.FCRA,
      lines:    makeFcraLines(),
    })).resolves.toEqual({ valid: true });
  });

  // 2.2 FCRA fund type fails with LOCAL account code ─────────────────────────
  it('FCRA fund type throws FundMixingError when a non-FCRA account is used', async () => {
    const seq = buildMockSequelize(new Map([
      ['accounts', [
        { id: ACCOUNT_FCRA_A, code: 'FCRA-1001', tags: null },
        { id: ACCOUNT_B,      code: 'LOCAL-2001', tags: null }, // not FCRA
      ]],
    ]));
    const validator = new FundTypeValidator(seq);

    const mixedLines = [
      { accountId: ACCOUNT_FCRA_A, debit: 500, credit: 0 },
      { accountId: ACCOUNT_B,      debit: 0,   credit: 500 }, // LOCAL account in FCRA posting
    ];

    await expect(validator.validate({
      tenantId: TENANT_ID,
      fundType: FUND_TYPES.FCRA,
      lines:    mixedLines,
    })).rejects.toThrow(FundMixingError);

    await expect(validator.validate({
      tenantId: TENANT_ID,
      fundType: FUND_TYPES.FCRA,
      lines:    mixedLines,
    })).rejects.toThrow(/LOCAL-2001/);
  });

  // 2.3 LOCAL fund type fails if FCRA- account code is used ─────────────────
  it('LOCAL fund type throws FundMixingError when an FCRA account is used', async () => {
    const seq = buildMockSequelize(new Map([
      ['accounts', [
        { id: ACCOUNT_A,      code: 'LOCAL-1001', tags: null },
        { id: ACCOUNT_FCRA_A, code: 'FCRA-1001',  tags: null }, // FCRA account in LOCAL posting
      ]],
    ]));
    const validator = new FundTypeValidator(seq);

    const badLines = [
      { accountId: ACCOUNT_A,      debit: 500, credit: 0 },
      { accountId: ACCOUNT_FCRA_A, debit: 0,   credit: 500 },
    ];

    await expect(validator.validate({
      tenantId: TENANT_ID,
      fundType: FUND_TYPES.LOCAL,
      lines:    badLines,
    })).rejects.toThrow(FundMixingError);

    await expect(validator.validate({
      tenantId: TENANT_ID,
      fundType: FUND_TYPES.LOCAL,
      lines:    badLines,
    })).rejects.toThrow(/FCRA-1001/);
  });

  // 2.4 LOCAL fund type passes with non-FCRA accounts ────────────────────────
  it('LOCAL fund type passes when no FCRA accounts are used', async () => {
    const seq = buildMockSequelize(new Map([
      ['accounts', [
        { id: ACCOUNT_A, code: 'LOCAL-1001', tags: null },
        { id: ACCOUNT_B, code: 'LOCAL-2001', tags: null },
      ]],
    ]));
    const validator = new FundTypeValidator(seq);

    await expect(validator.validate({
      tenantId: TENANT_ID,
      fundType: FUND_TYPES.LOCAL,
      lines:    makeLines(),
    })).resolves.toEqual({ valid: true });
  });

  // 2.5 allowFundMixing=true bypasses all checks ────────────────────────────
  it('allowFundMixing=true bypasses all fund-type checks', async () => {
    // Sequelize should NOT be called at all
    const seq = buildMockSequelize();
    const validator = new FundTypeValidator(seq);

    const mixedLines = [
      { accountId: ACCOUNT_A,      debit: 500, credit: 0 },
      { accountId: ACCOUNT_FCRA_A, debit: 0,   credit: 500 },
    ];

    await expect(validator.validate({
      tenantId:        TENANT_ID,
      fundType:        FUND_TYPES.LOCAL,
      lines:           mixedLines,
      allowFundMixing: true,
    })).resolves.toEqual({ valid: true });

    // Query should not have been called
    expect(seq.query).not.toHaveBeenCalled();
  });

  // 2.6 cross-fund tagged account passes for FCRA fund type ─────────────────
  it('FCRA fund type passes for cross-fund tagged account without FCRA- prefix', async () => {
    const seq = buildMockSequelize(new Map([
      ['accounts', [
        { id: ACCOUNT_FCRA_A, code: 'FCRA-1001',  tags: JSON.stringify(['fcra']) },
        { id: ACCOUNT_A,      code: 'SHARED-9001', tags: JSON.stringify(['cross-fund', 'system']) },
      ]],
    ]));
    const validator = new FundTypeValidator(seq);

    const crossFundLines = [
      { accountId: ACCOUNT_FCRA_A, debit: 500, credit: 0 },
      { accountId: ACCOUNT_A,      debit: 0,   credit: 500 }, // tagged cross-fund
    ];

    await expect(validator.validate({
      tenantId: TENANT_ID,
      fundType: FUND_TYPES.FCRA,
      lines:    crossFundLines,
    })).resolves.toEqual({ valid: true });
  });
});

// ─── 3. PostingContract validation ───────────────────────────────────────────

describe('validatePostingContract', () => {
  // 3.1 missing tenantId ────────────────────────────────────────────────────
  it('throws when tenantId is missing', () => {
    expect(() => validatePostingContract(makeBaseContract({ tenantId: undefined })))
      .toThrow(/tenantId/);
  });

  // 3.2 missing fundType ────────────────────────────────────────────────────
  it('throws when fundType is missing', () => {
    expect(() => validatePostingContract(makeBaseContract({ fundType: undefined })))
      .toThrow(/fundType/);
  });

  // 3.3 invalid fundType value ──────────────────────────────────────────────
  it('throws when fundType is not a valid FUND_TYPES value', () => {
    expect(() => validatePostingContract(makeBaseContract({ fundType: 'UNKNOWN_FUND' })))
      .toThrow(/invalid fundType/i);
  });

  // 3.4 missing lines ───────────────────────────────────────────────────────
  it('throws when lines is missing', () => {
    expect(() => validatePostingContract(makeBaseContract({ lines: undefined })))
      .toThrow(/lines/);
  });

  // 3.5 empty lines array ───────────────────────────────────────────────────
  it('throws when lines is an empty array', () => {
    expect(() => validatePostingContract(makeBaseContract({ lines: [] })))
      .toThrow(/lines.*empty|empty.*lines/i);
  });

  // 3.6 missing sourceModule ────────────────────────────────────────────────
  it('throws when sourceModule is missing', () => {
    expect(() => validatePostingContract(makeBaseContract({ sourceModule: undefined })))
      .toThrow(/sourceModule/);
  });

  // 3.7 valid contract passes ───────────────────────────────────────────────
  it('does not throw for a fully valid contract', () => {
    expect(() => validatePostingContract(makeBaseContract())).not.toThrow();
  });
});

// ─── 4. SharedPostingEngine integration (all mocked) ─────────────────────────

describe('SharedPostingEngine', () => {
  function buildEngine({ seqQueryMap = new Map(), postResult, auditFails = false } = {}) {
    // Default sequence: everything passes
    if (!seqQueryMap.has('journal_entries')) {
      seqQueryMap.set('journal_entries', []); // no duplicate
    }
    if (!seqQueryMap.has('fiscal_years')) {
      seqQueryMap.set('fiscal_years', [{ id: FY_ID, status: 'open' }]);
    }
    if (!seqQueryMap.has('accounting_periods')) {
      seqQueryMap.set('accounting_periods', []);
    }
    if (!seqQueryMap.has('accounts')) {
      seqQueryMap.set('accounts', [
        { id: ACCOUNT_A, code: 'LOCAL-1001', name: 'Cash',    is_active: true, is_group: false, tenant_id: TENANT_ID, tags: null },
        { id: ACCOUNT_B, code: 'LOCAL-2001', name: 'Revenue', is_active: true, is_group: false, tenant_id: TENANT_ID, tags: null },
      ]);
    }

    const sequelize = buildMockSequelize(seqQueryMap);

    const mockEntry = postResult || {
      id:          'entry-uuid-001',
      entryNumber: 'JV-2026-000001',
      status:      'POSTED',
    };

    const accountingEngine = {
      postJournalEntry: jest.fn().mockResolvedValue(mockEntry),
    };

    const auditLogger = {
      logEvent: auditFails
        ? jest.fn().mockRejectedValue(new Error('Audit DB down'))
        : jest.fn().mockResolvedValue('audit-log-id-001'),
    };

    const logger = {
      warn:  jest.fn(),
      info:  jest.fn(),
      error: jest.fn(),
    };

    const engine = new SharedPostingEngine({ sequelize, accountingEngine, auditLogger, logger });

    return { engine, accountingEngine, auditLogger, logger };
  }

  // 4.1 successful post returns enriched result ─────────────────────────────
  it('successful post returns enriched result with fundType, reconStatus=UNMATCHED, idempotencyKey', async () => {
    const { engine } = buildEngine();
    const result = await engine.post(makeBaseContract());

    expect(result).toMatchObject({
      id:            'entry-uuid-001',
      entryNumber:   'JV-2026-000001',
      fundType:      FUND_TYPES.LOCAL,
      sourceModule:  'test-module',
      sourceId:      SOURCE_ID,
      reconStatus:   RECON_STATUSES.UNMATCHED,
      idempotencyKey: `test-module:${SOURCE_ID}`,
    });
  });

  // 4.2 audit failure is fail-closed — post is blocked when audit throws ────
  it('audit failure is fail-closed — post throws when audit write fails', async () => {
    const { engine } = buildEngine({ auditFails: true });
    await expect(engine.post(makeBaseContract())).rejects.toThrow('Audit DB down');
  });

  // 4.3 idempotencyKey defaults to `${sourceModule}:${sourceId}` ───────────
  it('idempotencyKey defaults to `sourceModule:sourceId` when not provided', async () => {
    const { engine } = buildEngine();
    const contract = makeBaseContract(); // no idempotencyKey
    const result = await engine.post(contract);

    expect(result.idempotencyKey).toBe(`${contract.sourceModule}:${contract.sourceId}`);
  });

  // 4.4 custom idempotencyKey is used when provided ─────────────────────────
  it('uses custom idempotencyKey when provided in contract', async () => {
    const { engine } = buildEngine();
    const customKey = 'custom:idempotency:key:xyz';
    const result = await engine.post(makeBaseContract({ idempotencyKey: customKey }));

    expect(result.idempotencyKey).toBe(customKey);
  });

  // 4.5 fund mixing error propagates ────────────────────────────────────────
  it('propagates FundMixingError when fund mixing is detected', async () => {
    // Use FCRA fund type but LOCAL account codes
    const seqMap = new Map([
      ['journal_entries',    []],
      ['fiscal_years',       [{ id: FY_ID, status: 'open' }]],
      ['accounting_periods', []],
      ['accounts',           [
        { id: ACCOUNT_A, code: 'LOCAL-1001', name: 'Cash',    is_active: true, is_group: false, tenant_id: TENANT_ID, tags: null },
        { id: ACCOUNT_B, code: 'LOCAL-2001', name: 'Revenue', is_active: true, is_group: false, tenant_id: TENANT_ID, tags: null },
      ]],
    ]);

    const { engine } = buildEngine({ seqQueryMap: seqMap });

    await expect(engine.post(makeBaseContract({ fundType: FUND_TYPES.FCRA })))
      .rejects.toThrow(FundMixingError);
  });

  // 4.6 pre-post validation error propagates ────────────────────────────────
  it('propagates DuplicatePostingError from PrePostValidator', async () => {
    const seqMap = new Map([
      ['journal_entries', [{ entry_number: 'JV-2026-EXISTING' }]], // duplicate
    ]);
    const { engine } = buildEngine({ seqQueryMap: seqMap });

    await expect(engine.post(makeBaseContract()))
      .rejects.toThrow(DuplicatePostingError);
  });

  // 4.7 postingEvent stored in result ───────────────────────────────────────
  it('stores postingEvent in the returned result', async () => {
    const { engine } = buildEngine();
    const result = await engine.post(makeBaseContract({ postingEvent: POSTING_EVENTS.RECEIPT_POSTED }));

    expect(result.postingEvent).toBe(POSTING_EVENTS.RECEIPT_POSTED);
  });

  // 4.8 postingExplanation stored in result ─────────────────────────────────
  it('stores postingExplanation in the returned result', async () => {
    const { engine } = buildEngine();
    const explanation = { trigger: 'auto', ruleApplied: 'receipt-posting', approvedBy: USER_ID };
    const result = await engine.post(makeBaseContract({ postingExplanation: explanation }));

    expect(result.postingExplanation).toEqual(explanation);
  });

  // 4.9 postingExplanation is null when not provided ────────────────────────
  it('postingExplanation is null in result when not provided', async () => {
    const { engine } = buildEngine();
    const result = await engine.post(makeBaseContract()); // no postingExplanation

    expect(result.postingExplanation).toBeNull();
  });

  // 4.10 structural validation error propagates before DB queries ────────────
  it('throws structural error before making any DB queries for invalid contract', async () => {
    const { engine, accountingEngine } = buildEngine();

    // Missing fundType — structural error should fire immediately
    await expect(engine.post(makeBaseContract({ fundType: undefined })))
      .rejects.toThrow(/fundType/);

    expect(accountingEngine.postJournalEntry).not.toHaveBeenCalled();
  });
});
