# FACT FinOS — Zero-Error Stability, Functional Integrity & Cross-Module Reliability Framework

**Version:** 1.0  
**Date:** 2026-05-21  
**Scope:** All 22 modules of the Healthcare Financial Operating System  
**Audience:** Enterprise architects, frontend engineers, backend engineers, DevOps, QA, finance teams, audit/compliance, hospital IT leadership

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Financial Integrity Engine](#2-financial-integrity-engine)
3. [Saga Orchestrator (Distributed Workflows)](#3-saga-orchestrator)
4. [Idempotency Framework](#4-idempotency-framework)
5. [Circuit Breaker Registry](#5-circuit-breaker-registry)
6. [Event Reliability Engine](#6-event-reliability-engine)
7. [Reconciliation Service](#7-reconciliation-service)
8. [Self-Healing Service](#8-self-healing-service)
9. [Backend Response Transformer](#9-backend-response-transformer)
10. [Monitoring Service](#10-monitoring-service)
11. [Frontend Reliability Provider](#11-frontend-reliability-provider)
12. [Error Boundary System](#12-error-boundary-system)
13. [Enterprise Form Engine](#13-enterprise-form-engine)
14. [Financial Form Hook](#14-financial-form-hook)
15. [Optimistic Update Hook](#15-optimistic-update-hook)
16. [Workflow Action Hook](#16-workflow-action-hook)
17. [Reliable API Service](#17-reliable-api-service)
18. [Validation Schema Library](#18-validation-schema-library)
19. [Error Handling Utilities](#19-error-handling-utilities)
20. [Testing Architecture](#20-testing-architecture)
21. [Cross-Module Integration Map](#21-cross-module-integration-map)
22. [Production Hardening Checklist](#22-production-hardening-checklist)

---

## 1. Architecture Overview

### Framework Philosophy

Every system failure in a healthcare financial platform has a **cost**: duplicate invoices mean double billing patients, missed GL postings mean unbalanced books, failed claims mean lost revenue, broken workflows mean delayed care. This framework eliminates those failure modes through **layered defense**:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                               │
│  ReliabilityProvider → ErrorBoundary → FormEngine → useFinancialForm│
│  reliableApi (retry/dedup) → validationSchemas → errorHandling     │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTPS / Idempotency-Key header
┌─────────────────────────────▼───────────────────────────────────────┐
│                        API GATEWAY LAYER                            │
│  requestId → responseTransformer → idempotencyMiddleware → RBAC    │
│  rateLimiter → tenantMiddleware → moduleGuard → monitoring.tracker │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                          │
│  SagaOrchestrator → FinancialIntegrityEngine → Services             │
│  CircuitBreaker (DB/Redis/OpenAI) → EventReliabilityEngine          │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────┐
│                      PERSISTENCE LAYER                              │
│  PostgreSQL (ACID) → Redis (cache/queue) → BullMQ (async jobs)     │
│  ReconciliationService → AuditLogger → SelfHealingService           │
└─────────────────────────────────────────────────────────────────────┘
```

### New Files Created by This Framework

| File | Layer | Purpose |
|------|-------|---------|
| `backend/src/shared/financial-integrity/FinancialIntegrityEngine.js` | Backend | Double-entry validation, reconciliation, idempotency |
| `backend/src/shared/saga/SagaOrchestrator.js` | Backend | Multi-step workflow coordination with rollback |
| `backend/src/middleware/idempotency.js` | Backend | Duplicate submission prevention |
| `backend/src/shared/circuit-breaker/CircuitBreaker.js` | Backend | Cascade failure prevention |
| `backend/src/shared/events/EventReliabilityEngine.js` | Backend | Guaranteed event delivery + DLQ |
| `backend/src/shared/reconciliation/ReconciliationService.js` | Backend | AR/AP/Bank automated reconciliation |
| `backend/src/shared/monitoring/MonitoringService.js` | Backend | Metrics, health, Prometheus endpoint |
| `backend/src/shared/self-healing/SelfHealingService.js` | Backend | Automatic recovery of stuck processes |
| `backend/src/middleware/responseTransformer.js` | Backend | Consistent API response envelope |
| `frontend/src/providers/ReliabilityProvider.jsx` | Frontend | Root reliability wrapper |
| `frontend/src/components/shared/ErrorBoundary.jsx` | Frontend | 3-tier error boundary (page/module/inline) |
| `frontend/src/components/shared/FormEngine.jsx` | Frontend | Enterprise form with draft/retry/dedup |
| `frontend/src/hooks/useFinancialForm.js` | Frontend | Financial mutation hook with idempotency |
| `frontend/src/hooks/useOptimisticUpdate.js` | Frontend | Optimistic UI with automatic rollback |
| `frontend/src/hooks/useWorkflowAction.js` | Frontend | Workflow transition hook |
| `frontend/src/services/reliableApi.js` | Frontend | Retry + dedup API wrapper |
| `frontend/src/utils/validationSchemas.js` | Frontend | Zod schemas for all financial forms |
| `frontend/src/utils/errorHandling.js` | Frontend | Error classification and display |
| `backend/src/__tests__/setup.js` | Testing | Global Jest setup + mock Redis + test JWT |
| `backend/src/__tests__/unit/accounting-engine.test.js` | Testing | Financial integrity unit tests |
| `backend/src/__tests__/integration/billing.test.js` | Testing | Billing API integration tests |

---

## 2. Financial Integrity Engine

**File:** `backend/src/shared/financial-integrity/FinancialIntegrityEngine.js`

### Purpose
Every financial posting — journal entries, invoice finalizations, payments, depreciation, payroll — MUST pass through this engine before any database write. It is the last line of defense against financial inaccuracy.

### Validation Rules Enforced

| Rule | Code | Description |
|------|------|-------------|
| Double-entry balance | `FIE_001` | `Σ debits = Σ credits` within 0.01 tolerance |
| Zero-amount lines | `FIE_002` | Lines with both debit=0 and credit=0 are rejected |
| Multi-currency | `FIE_006` | FX entries require a valid exchange rate |
| Cost-center balance | `FIE_007` | Each cost center's lines must balance independently |
| Idempotency | `FIE_004` | Same idempotency key = same response, no re-processing |
| Depreciation NBV | `FIE_008` | `Cost − Accumulated = NBV` within tolerance |

### Usage in Services

```js
const { getFinancialIntegrityEngine } = require('../shared/financial-integrity/FinancialIntegrityEngine');

// In your service or controller:
const engine = getFinancialIntegrityEngine(sequelize, redis);

// Before ANY journal insert:
await engine.validateJournalEntry(entry, { checkCostCenter: true });

// Register idempotency key after successful commit:
await engine.registerIdempotencyKey(idempotencyKey, tenantId, { journalId: result.id });
```

### Reconciliation

```js
// Verify AR subledger vs GL control:
const result = await engine.reconcile(arBalances, glBalances, 'AR vs GL');
// result.balanced === false → triggers alert + audit log
```

---

## 3. Saga Orchestrator

**File:** `backend/src/shared/saga/SagaOrchestrator.js`

### Purpose
Any operation that touches more than one table/module is a distributed transaction. Sagas ensure that if step N fails, steps 1..N-1 are automatically compensated (rolled back).

### Built-in Saga Templates

| Template | Steps | Auto-Rollback |
|----------|-------|---------------|
| `buildInvoiceFinalizationSaga` | Finalize → AR → GL → Notify → Audit | All financial steps |
| `buildPaymentReceiptSaga` | Record → AR Allocation → GL → Treasury | All financial steps |
| `buildClaimSettlementSaga` | Settle → AR Update → GL → Notify | All financial steps |

### Custom Saga Example

```js
const saga = new Saga('DepreciationPosting', tenantId)
  .step('runDepreciation', 
    (ctx) => depreciationService.run(ctx.runId),
    (ctx, r) => depreciationService.reverse(r.runId)
  )
  .step('postToGL',
    (ctx) => accountingService.postJournal(ctx.runDepreciationResult.glLines),
    (ctx, r) => accountingService.reverseJournal(r.journalId, ctx.userId)
  )
  .step('updateAssetNBV',
    (ctx) => assetService.updateNBV(ctx.runId),
    (ctx) => assetService.revertNBV(ctx.runId),
    { critical: true }
  )
  .step('sendAlert', 
    (ctx) => notificationService.send({ type: 'DEPRECIATION_COMPLETE' }),
    null,
    { critical: false }  // notification failure never rolls back financial steps
  );

const result = await saga.execute({ runId, tenantId, userId });
```

### Guarantees

- If any `critical: true` step fails after exhausting retries, ALL completed steps are compensated in reverse order
- Non-critical steps (notifications, analytics) never trigger rollback
- Each step retries up to 3 times with exponential backoff before being considered failed
- Saga ID is logged throughout for full traceability

---

## 4. Idempotency Framework

**File:** `backend/src/middleware/idempotency.js`

### Required Routes (Idempotency-Key header is MANDATORY)

```
POST /api/billing/invoices
POST /api/billing/invoices/:id/payment
POST /api/billing/invoices/:id/finalize
POST /api/accounting/journals
POST /api/accounting/journals/:id/post
POST /api/accounting/journals/:id/reverse
POST /api/ar/payments
POST /api/ap/vendor-invoices/:id/pay
POST /api/payroll/runs
POST /api/doctor-payout/runs
POST /api/assets/depreciation-runs
POST /api/insurance/claims/:id/settle
POST /api/cash-bank/transactions
```

### How It Works

```
Client                          Server                         Redis
  │                               │                              │
  │── POST /api/billing/invoices ─►│                              │
  │   Idempotency-Key: uuid-1      │── GET idempotency:t1:uuid-1─►│
  │                               │◄── null (not seen before) ───│
  │                               │── SET lock:t1:uuid-1 ────────►│
  │                               │   (30s lock)                 │
  │                               │── [process request]          │
  │                               │── SET idempotency:t1:uuid-1 ─►│
  │                               │   (24h cache)                │
  │◄── 201 Created ───────────────│                              │
  │                               │                              │
  │── POST /api/billing/invoices ─►│                              │
  │   Idempotency-Key: uuid-1      │── GET idempotency:t1:uuid-1─►│
  │   (duplicate request)         │◄── {status:201, body:...} ───│
  │◄── 200 + X-Idempotency-Replayed:true                         │
```

### Frontend Integration

```js
import { useFinancialForm } from '../hooks/useFinancialForm';
import { v4 as uuidv4 } from 'uuid';

// The hook auto-generates and rotates idempotency keys:
const { submit, isSubmitting } = useFinancialForm({
  mutationFn: (data, idempotencyKey) =>
    api.post('/api/billing/invoices', data, {
      headers: { 'Idempotency-Key': idempotencyKey }
    }),
  invalidateKeys: [['billing', 'invoices']],
  successMessage: 'Invoice created',
});
```

---

## 5. Circuit Breaker Registry

**File:** `backend/src/shared/circuit-breaker/CircuitBreaker.js`

### Pre-Registered Breakers

| Service | Threshold | Reset Timeout | Fallback |
|---------|-----------|---------------|---------|
| PostgreSQL | 10 failures | 60s | None (critical) |
| Redis | 10 failures | 30s | None (degrade gracefully) |
| OpenAI | 5 failures | 60s | Static "temporarily unavailable" message |
| EmailSMTP | 3 failures | 30s | None (queue for retry) |
| ExternalPaymentGateway | 3 failures | 60s | None (critical) |

### States

```
CLOSED ──(threshold failures)──► OPEN ──(timeout)──► HALF_OPEN
  ▲                                                        │
  └────────────(successThreshold successes)────────────────┘
```

### Usage

```js
const { registry } = require('../shared/circuit-breaker/CircuitBreaker');
const openaiBreaker = registry.get('OpenAI');

const response = await openaiBreaker.execute(() =>
  openai.chat.completions.create({ model: 'gpt-4o', messages })
);
// If OpenAI is failing → returns fallback message instead of throwing
```

---

## 6. Event Reliability Engine

**File:** `backend/src/shared/events/EventReliabilityEngine.js`

### Guaranteed Delivery Model

1. Event persisted to Redis BEFORE handler execution
2. Handler retried up to 3 times with backoff on failure
3. Dead-letter queue (DLQ) for permanently failed events
4. In-memory dedup prevents double-processing in same process
5. Replay API for disaster recovery

### Standard Financial Events

| Event | Published By | Consumed By |
|-------|-------------|-------------|
| `INVOICE_FINALIZED` | Billing | AR, GL, Audit, Notifications |
| `PAYMENT_RECEIVED` | Billing | AR, Treasury, GL, Audit |
| `CLAIM_SETTLED` | Insurance | AR, GL, Audit |
| `JOURNAL_POSTED` | Accounting | Audit, Analytics |
| `JOURNAL_REVERSED` | Accounting | Audit, Analytics |
| `DEPRECIATION_RUN_COMPLETE` | Assets | GL, Audit, Notifications |
| `PAYROLL_POSTED` | Payroll | GL, HR, Audit |
| `PAYOUT_PROCESSED` | Doctor Payout | Treasury, GL, Audit |

### DLQ Management

```bash
# View dead-letter queue
GET /api/admin/events/dlq

# Replay failed events
POST /api/admin/events/replay
{ "eventType": "INVOICE_FINALIZED", "from": "2026-05-01", "to": "2026-05-21" }
```

---

## 7. Reconciliation Service

**File:** `backend/src/shared/reconciliation/ReconciliationService.js`

### Automated Reconciliations

| Reconciliation | Frequency | Action on Mismatch |
|---------------|-----------|-------------------|
| AR Subledger vs GL | Nightly + on-demand | Alert CFO, flag for review |
| AP Subledger vs GL | Nightly + on-demand | Alert CFO, flag for review |
| Bank Statement vs Cash Book | On statement import | Flag unmatched items |
| Invoice vs GL Posting | On each finalization | Block finalization if mismatch |
| Depreciation vs Asset NBV | On each run | Reject run if mismatch |

### Running Reconciliation

```js
// In a cron job or on-demand:
const { ReconciliationService } = require('./shared/reconciliation/ReconciliationService');
const recon = new ReconciliationService(sequelize, redis);

const results = await recon.runAll(tenantId, {
  startDate: '2026-05-01',
  endDate: '2026-05-31',
});
// Returns: [{ type, balanced, sideA, sideB, variance }]
```

---

## 8. Self-Healing Service

**File:** `backend/src/shared/self-healing/SelfHealingService.js`

### Automated Recovery Tasks

| Task | Interval | Action |
|------|----------|--------|
| Stuck record detection | 5 min | Sets PROCESSING → FAILED for runs stuck > 30 min |
| DLQ retry | 15 min | Re-publishes DLQ events younger than 24h |
| Orphan draft detection | 1 hour | Alerts on DRAFT journals older than 24h (no auto-delete) |
| Cache warmup | 30 min | Pings Redis, triggers reconnect if lost |

### Alerting Philosophy

The self-healing service **never auto-deletes financial records**. For orphaned drafts, it alerts for human review. Only clearly stuck processing states (RUNNING/PROCESSING stuck > 30 min) are automatically resolved to FAILED so workflows can be retried.

---

## 9. Backend Response Transformer

**File:** `backend/src/middleware/responseTransformer.js`

### Uniform Response Envelope

All API responses now use:

```json
// Success (single resource)
{
  "success": true,
  "data": { "id": "...", "status": "FINALIZED" },
  "meta": { "requestId": "uuid", "timestamp": "ISO" }
}

// Success (list)
{
  "success": true,
  "data": [...],
  "meta": { "total": 150, "page": 2, "limit": 25, "totalPages": 6 }
}

// Error
{
  "success": false,
  "code": "FINANCIAL_INTEGRITY_VIOLATION",
  "message": "Debits (10000.00) ≠ Credits (9999.00)",
  "violations": [{ "code": "FIE_001", "field": "lines", "meta": { "variance": "1.00" } }]
}
```

### Controller Usage

```js
// Instead of res.json({ data: invoice })
res.success(invoice);
res.created(invoice);
res.successList(invoices, { total, page, limit });
res.notFound('Invoice');
res.integrityError(integrityErr);
res.forbidden('Only CFO can reverse posted entries');
```

---

## 10. Monitoring Service

**File:** `backend/src/shared/monitoring/MonitoringService.js`

### Endpoints

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/health/detailed` | Public | Full health report JSON |
| `GET /metrics` | Internal only | Prometheus metrics text |
| `GET /api/admin/circuit-breakers` | Admin | All circuit breaker states |

### Key Metrics Tracked

- Request rate, error rate, p50/p95/p99 latency
- `fact_journals_posted_total` — cumulative journal posts
- `fact_integrity_violations_total` — financial integrity failures
- `fact_reconciliations_failed_total` — reconciliation mismatches
- `fact_sagas_compensated_total` — saga rollbacks triggered
- Per-circuit-breaker open/closed status

### Grafana Integration

Point Grafana to `GET /metrics` with a Prometheus datasource. Suggested alerts:
- `fact_integrity_violations_total` rate > 0/min → PagerDuty
- `fact_circuit_breaker_open` = 1 for PostgreSQL → Critical alert
- `fact_reconciliations_failed_total` increase → CFO notification

---

## 11. Frontend Reliability Provider

**File:** `frontend/src/providers/ReliabilityProvider.jsx`

Wraps the entire application. Provides:

- **React Query client** with enterprise-grade retry (no retry on 4xx, 3 retries on 5xx)
- **Offline detection** with banner + automatic query invalidation on reconnect
- **Submission lock registry** preventing double-clicks across all forms
- **Unhandled promise rejection capture** (handles ChunkLoadError → auto-reload)
- **Global loading counter** for app-wide loading state

```jsx
// main.jsx — already wired
<BrowserRouter>
  <ReliabilityProvider>
    <App />
    <Toaster ... />
  </ReliabilityProvider>
</BrowserRouter>
```

---

## 12. Error Boundary System

**File:** `frontend/src/components/shared/ErrorBoundary.jsx`

### Three Tiers

| Component | Scope | Behavior |
|-----------|-------|---------|
| `PageErrorBoundary` | Full page | Full-screen error with retry + reload |
| `ErrorBoundary` | Module/section | Contained error card with retry |
| `InlineErrorBoundary` | Widget | Single-line error with retry link |

`PageErrorBoundary` is already wrapping the entire app via `ReliabilityProvider`.

### Wrap Dangerous Sections

```jsx
import { ErrorBoundary } from '../components/shared/ErrorBoundary';

// In any module:
<ErrorBoundary module="Billing Dashboard">
  <KPIRibbon />
</ErrorBoundary>

<ErrorBoundary module="AR Aging Chart">
  <AgingHeatmap />
</ErrorBoundary>
```

### Client-Side Error Reporting

Every `ErrorBoundary` automatically POSTs to `POST /api/admin/client-errors` with:
- Component stack, error message, URL, timestamp, browser info
- Enables real-time frontend error monitoring in the Admin panel

---

## 13. Enterprise Form Engine

**File:** `frontend/src/components/shared/FormEngine.jsx`

### Features

| Feature | Behavior |
|---------|---------|
| Schema validation | Zod + react-hook-form, runs on blur |
| Duplicate prevention | Locks submission key for the duration of the API call |
| Auto-draft | Debounced save to sessionStorage (opt-in via `autoDraft`) |
| Form-level error | Displays server violations + field errors in banner |
| Loading state | Button shows spinner + "Saving…" text |
| Success state | Optional reset on success |

```jsx
<FormEngine
  id="new-invoice-form"
  schema={patientInvoiceSchema}
  defaultValues={{ billing_type: 'OP', items: [] }}
  onSubmit={handleCreate}
  onSuccess={() => navigate('/billing/invoices')}
  submitLabel="Create Invoice"
  draftKey="new-invoice"
  autoDraft
>
  {({ register, errors, isSubmitting }) => (
    <FormField label="Patient Name" required error={errors.patient_name}>
      <input {...register('patient_name')} className="input" />
    </FormField>
  )}
</FormEngine>
```

---

## 14. Financial Form Hook

**File:** `frontend/src/hooks/useFinancialForm.js`

Use for any financial mutation (invoices, payments, journals, etc.):

```js
const { submit, isSubmitting, violations } = useFinancialForm({
  mutationFn: (data, idempotencyKey) =>
    billingAPI.finalizeInvoice(invoiceId, data, { idempotencyKey }),
  invalidateKeys: [['billing', 'invoices'], ['ar', 'dashboard']],
  successMessage: 'Invoice finalized',
  errorMessage: 'Finalization failed',
});

// violations contains field-level financial integrity errors
// isSubmitting is true only for this specific mutation
// idempotency key auto-rotates after each success
```

---

## 15. Optimistic Update Hook

**File:** `frontend/src/hooks/useOptimisticUpdate.js`

Use when you want instant UI feedback before server responds:

```js
const { mutate } = useOptimisticUpdate({
  queryKey: ['ar', 'invoices'],
  mutationFn: (invoiceId) => arAPI.writeOff(invoiceId),
  updater: (oldData, invoiceId) => ({
    ...oldData,
    data: oldData.data.map(inv =>
      inv.id === invoiceId ? { ...inv, status: 'WRITTEN_OFF' } : inv
    )
  }),
  successMessage: 'Written off',
  errorMessage: 'Write-off failed — reverted',
});
```

On error: automatically reverts the cache to the pre-mutation snapshot and shows an error toast.

---

## 16. Workflow Action Hook

**File:** `frontend/src/hooks/useWorkflowAction.js`

```js
const { trigger, isLoading, activeAction } = useWorkflowAction({
  taskId: task.id,
  invalidateKeys: [['billing', 'invoices'], ['workflow']],
});

// Per-button loading: only the clicked action shows spinner
<button
  onClick={() => trigger('APPROVE', { comment: remarks })}
  disabled={isLoading}
>
  {activeAction === 'APPROVE' ? <Spinner /> : null}
  Approve
</button>
<button onClick={() => trigger('REJECT', { reason })}>Reject</button>
```

---

## 17. Reliable API Service

**File:** `frontend/src/services/reliableApi.js`

```js
import reliableApi from '../services/reliableApi';

// GET with request deduplication (concurrent identical calls share one request):
const data = await reliableApi.get('/api/ar/dashboard', { period: 'monthly' });

// POST with idempotency + retry:
const result = await reliableApi.post('/api/billing/invoices', payload, {
  idempotencyKey: uuidv4(),
});

// Error extraction:
catch (err) {
  const message = reliableApi.extractApiError(err);
  // Returns the most specific message: violations → errors → message → 'Network error'
}
```

---

## 18. Validation Schema Library

**File:** `frontend/src/utils/validationSchemas.js`

Import individual schemas into any form:

```js
import { patientInvoiceSchema, paymentSchema, fields } from '../utils/validationSchemas';

// Use in FormEngine:
<FormEngine schema={patientInvoiceSchema} ...>

// Use individual fields in custom Zod schemas:
const customSchema = z.object({
  amount: fields.positiveAmount,
  date: fields.pastOrPresentDate,
  gstin: fields.gst,
});
```

### Available Schemas

| Schema | Module |
|--------|--------|
| `journalEntrySchema` | Core Accounting — includes debits=credits cross-field validation |
| `patientInvoiceSchema` | Patient Billing |
| `paymentSchema` | All payment forms |
| `vendorInvoiceSchema` | Accounts Payable |
| `claimSchema` | Insurance/TPA |
| `assetSchema` | Fixed Assets |
| `revenueShareFormulaSchema` | Doctor Payouts |
| `loginSchema` | Authentication |
| `changePasswordSchema` | User settings |

---

## 19. Error Handling Utilities

**File:** `frontend/src/utils/errorHandling.js`

```js
import { showErrorToast, safeAction, extractFieldErrors } from '../utils/errorHandling';

// Consistent toast with appropriate icon/duration per error type:
showErrorToast(err);  // auto-classifies: NETWORK, VALIDATION, INTEGRITY, etc.

// Wrap any async action:
const { data, error } = await safeAction(
  () => assetsAPI.dispose(assetId, payload),
  { loading: 'Disposing asset…', success: 'Asset disposed', error: 'Disposal failed' }
);

// Extract field errors from validation response:
const fieldErrors = extractFieldErrors(err);
// { patient_name: 'This field is required', amount: 'Must be > 0' }
```

---

## 20. Testing Architecture

### Test Setup

```bash
cd backend
npm test                    # Run all tests
npm run test:coverage       # Run with coverage report
npm test -- --testPathPattern=billing   # Run specific tests
```

### Test Categories

| Category | Location | Framework | Coverage Target |
|----------|----------|-----------|----------------|
| Unit — Financial Integrity | `__tests__/unit/accounting-engine.test.js` | Jest | 100% of engine |
| Integration — Billing API | `__tests__/integration/billing.test.js` | Jest + Supertest | All endpoints |
| Integration — Auth | `__tests__/integration/auth.test.js` (add) | Jest + Supertest | All auth flows |
| E2E — Critical Workflows | Playwright (add) | Playwright | Golden paths |
| Contract — API | Pact (add) | Pact.js | All consumer/provider pairs |

### Adding New Tests

```js
// Unit test pattern:
describe('FeatureName', () => {
  it('does X when Y', async () => {
    // testHelpers.mockRedis is auto-wired
    // testHelpers.generateTestToken({ roles: ['admin'] })
    // testHelpers.withAuth(request(app).post('/api/...')).send(payload)
  });
});
```

### Financial Integrity Test Requirements

Every new financial service MUST have tests for:
1. Happy path — correct data committed
2. Unbalanced entry — rejected with `FIE_001`
3. Duplicate submission — idempotency key returns cached result
4. Partial failure — saga compensates correctly
5. Reconciliation — subledger matches GL after operation

---

## 21. Cross-Module Integration Map

### Patient Billing → Full Chain

```
Patient Invoice Created (DRAFT)
  ↓ [Finalize via InvoiceFinalizationSaga]
  ├── AR: create receivable entry
  ├── GL: DR Accounts Receivable / CR Revenue
  ├── Audit: log INVOICE_FINALIZED
  └── Notification: alert billing staff

Patient Payment Received
  ↓ [PaymentReceiptSaga]
  ├── Invoice: update paid_amount, status
  ├── AR: allocate payment, reduce balance
  ├── GL: DR Cash/Bank / CR Accounts Receivable
  ├── Treasury: update cash position
  └── Audit: log PAYMENT_RECEIVED

Insurance Claim Settled
  ↓ [ClaimSettlementSaga]
  ├── Claim: status → SETTLED
  ├── Invoice: insurance_paid_amount updated
  ├── AR: reduce balance by settled amount
  ├── GL: DR Insurer Receivable / CR AR Control
  └── Audit: log CLAIM_SETTLED
```

### Fixed Assets → Full Chain

```
Asset Acquired
  └── GL: DR Fixed Assets / CR Cash or AP

Depreciation Run
  ↓ [DepreciationSaga — add this]
  ├── Asset: depreciation_to_date updated, NBV recalculated
  ├── FinancialIntegrityEngine: verifyDepreciationIntegrity()
  ├── GL: DR Depreciation Expense / CR Accumulated Depreciation
  └── Audit: log DEPRECIATION_RUN_COMPLETE

Asset Disposed
  ├── Asset: status → DISPOSED
  ├── GL: DR Accumulated Depreciation + Loss/Gain / CR Fixed Asset
  └── Audit: log ASSET_DISPOSED
```

### Doctor Revenue Sharing → Full Chain

```
Payout Run Executed
  ↓ [PayoutSaga — add this]
  ├── RevenueShare: calculate based on formula (PERCENTAGE/SLAB/PROCEDURE)
  ├── Payout: entries created per doctor
  ├── GL: DR Doctor Revenue Sharing Expense / CR Payable to Doctors
  ├── Treasury: schedule bank transfer
  ├── Payroll: link to payroll period
  └── Audit: log PAYOUT_PROCESSED
```

---

## 22. Production Hardening Checklist

### Infrastructure

- [ ] PostgreSQL connection pooling: max=20, idle timeout=10s configured
- [ ] Redis sentinel/cluster configured for HA
- [ ] All environment variables in `.env` filled (no empty secrets)
- [ ] `NODE_ENV=production` set
- [ ] SSL enabled for DB (`DB_SSL=true`)
- [ ] Rate limits tuned for production traffic
- [ ] Log rotation configured (`LOG_FILE_ENABLED=true`, `LOG_FILE_PATH=./logs/app.log`)
- [ ] Audit log retention set (`AUDIT_LOG_RETENTION_DAYS=2555` for 7 years, HIPAA compliance)

### Security

- [ ] `JWT_SECRET` is 64+ random characters (not the default)
- [ ] `JWT_REFRESH_SECRET` is different from `JWT_SECRET`
- [ ] CORS `FRONTEND_URL` set to exact production domain
- [ ] `helmet()` CSP configured with production asset domains
- [ ] All financial routes require `Idempotency-Key` header (already enforced)
- [ ] RBAC permissions audited — no role has more than required permissions
- [ ] Audit logs are write-only (no DELETE endpoint for audit_logs table)
- [ ] DB user for app has no `DROP TABLE` or `DROP DATABASE` privilege

### Financial Integrity

- [ ] `FinancialIntegrityEngine` imported and called in every service that writes journal lines
- [ ] All saga templates used for multi-step financial operations
- [ ] Nightly reconciliation cron configured (call `ReconciliationService.runAll()`)
- [ ] Fiscal year `OPEN` check before any journal posting
- [ ] Duplicate invoice number prevention (unique constraint on `invoice_number + tenant_id`)

### Frontend

- [ ] `ReliabilityProvider` wraps root in `main.jsx` ✓ (done)
- [ ] `ErrorBoundary` wraps every major dashboard section
- [ ] All financial forms use `useFinancialForm` or `FormEngine`
- [ ] No `console.log` calls in production build
- [ ] Bundle size < 500KB initial (lazy loading active ✓)
- [ ] `Content-Security-Policy` header set in nginx/CDN

### Monitoring

- [ ] `/metrics` endpoint firewalled to internal network only
- [ ] Prometheus scraping `/metrics` every 30s
- [ ] Grafana dashboards created for: error rate, financial integrity violations, circuit breakers
- [ ] PagerDuty/Slack alerts on: circuit breaker open (PostgreSQL), integrity violations > 0/min
- [ ] Self-healing service started in `bootstrap()` ✓ (done)

### Disaster Recovery

- [ ] PostgreSQL WAL archiving enabled
- [ ] Daily `pg_dump` backup with 30-day retention
- [ ] Redis persistence (AOF) enabled
- [ ] Event DLQ monitored — alert if DLQ depth > 100
- [ ] Tested: restart server → self-healing recovers stuck records
- [ ] Tested: Redis restart → circuit breaker probes and recovers

---

## Quick Reference: Which Hook/Component to Use

| Scenario | Use |
|----------|-----|
| Any financial form (invoice, payment, journal) | `useFinancialForm` or `FormEngine` with `patientInvoiceSchema` |
| Status toggle (approve/reject/write-off) | `useOptimisticUpdate` |
| Workflow task action | `useWorkflowAction` |
| Data fetching with retry | `useQuery` from React Query (configured via ReliabilityProvider) |
| Direct API call with retry | `reliableApi.get / .post / .patch` |
| Error message from catch block | `extractApiError(err)` from `reliableApi` |
| Toast with correct icon/duration | `showErrorToast(err)` from `errorHandling` |
| Wrap a dangerous component | `<ErrorBoundary module="X">` |
| Server-side financial validation | `FinancialIntegrityEngine.validateJournalEntry()` |
| Multi-step operation | `new Saga(name, tenantId).step(...).step(...).execute(ctx)` |
| External service call | `circuitBreakerRegistry.get('ServiceName').execute(fn)` |
| Consistent API response | `res.success()`, `res.created()`, `res.integrityError()` |

---

*This framework document is the authoritative reference for the FACT FinOS reliability architecture. All new features must comply with the patterns described here.*
