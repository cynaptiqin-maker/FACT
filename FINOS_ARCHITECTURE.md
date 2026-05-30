# Healthcare FinOS — Enterprise Architecture & Unified Design Specification
**Version 1.0 | Healthcare Financial Operating System**
*For: Enterprise Architects · Product Designers · Backend Engineers · Frontend Engineers · AI Engineers · Financial Systems Engineers · DevOps · Audit & Compliance · Hospital IT Leadership*

---

## TABLE OF CONTENTS

1. [Vision & System Philosophy](#1-vision--system-philosophy)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Unified Master Data Architecture](#3-unified-master-data-architecture)
4. [Unified Financial Posting Engine](#4-unified-financial-posting-engine)
5. [Unified Workflow Orchestration Engine](#5-unified-workflow-orchestration-engine)
6. [Event-Driven Architecture & Event Catalog](#6-event-driven-architecture--event-catalog)
7. [Unified AI Intelligence Engine](#7-unified-ai-intelligence-engine)
8. [Unified Audit & Traceability Engine](#8-unified-audit--traceability-engine)
9. [Unified Search & Command System](#9-unified-search--command-system)
10. [Unified Notification Engine](#10-unified-notification-engine)
11. [Unified Permission & Security (RBAC/ABAC)](#11-unified-permission--security-rbacabac)
12. [Unified Analytics & Reporting Layer](#12-unified-analytics--reporting-layer)
13. [Unified Design System](#13-unified-design-system)
14. [Frontend Architecture](#14-frontend-architecture)
15. [Backend Architecture](#15-backend-architecture)
16. [API Gateway & Integration Layer](#16-api-gateway--integration-layer)
17. [Real-time Synchronization Strategy](#17-real-time-synchronization-strategy)
18. [Mobile Architecture](#18-mobile-architecture)
19. [Unified Timeline Architecture](#19-unified-timeline-architecture)
20. [Cross-Module Integration Map](#20-cross-module-integration-map)
21. [Suggested Folder Architecture](#21-suggested-folder-architecture)
22. [Shared State Models](#22-shared-state-models)
23. [Shared Component Library](#23-shared-component-library)
24. [Cross-Module Navigation Patterns](#24-cross-module-navigation-patterns)
25. [Performance & Scalability Strategy](#25-performance--scalability-strategy)
26. [Multi-Tenant Enterprise Deployment](#26-multi-tenant-enterprise-deployment)
27. [Disaster Recovery Architecture](#27-disaster-recovery-architecture)
28. [End-to-End Financial Lifecycle Diagrams](#28-end-to-end-financial-lifecycle-diagrams)
29. [Workflow Orchestration Diagrams](#29-workflow-orchestration-diagrams)
30. [Implementation Roadmap](#30-implementation-roadmap)

---

# 1. VISION & SYSTEM PHILOSOPHY

## 1.1 Platform Identity

Healthcare FinOS is not a collection of accounting modules. It is a **single intelligent financial operating system** purpose-built for healthcare enterprises — hospitals, medical colleges, multi-branch chains, and healthcare groups.

It functions simultaneously as:

| Layer | Description |
|---|---|
| **Financial OS** | Real-time double-entry engine, GL, AR, AP, treasury — all unified |
| **Revenue Intelligence Platform** | End-to-end revenue cycle: billing → claim → collection → reconciliation |
| **Workflow Orchestration System** | Every transaction is a workflow node — approvable, traceable, reversible |
| **AI-Native ERP** | Intelligence embedded in every module, not bolted on |
| **Compliance Engine** | GST, TDS, NABH, HIPAA, regulatory reporting baked in |

## 1.2 Core Design Principles

**1. One Data Fabric**
Every entity — patient, vendor, ledger, branch, doctor — exists once. All modules reference it. No duplication. No divergence.

**2. Every Transaction is a Financial Event**
Pharmacy dispense, OT charge, vendor payment, payroll run — each is an immutable financial event that triggers GL postings, workflow state changes, and analytics updates simultaneously.

**3. Workflows Over Forms**
Users never fill forms in isolation. Every action is a step in a visible, traceable workflow with SLA, approver routing, escalation, and audit timeline.

**4. AI is Infrastructure, Not a Feature**
The AI engine is the nervous system — it reads all events, learns patterns, detects anomalies, and surfaces insights before users ask.

**5. Real-time or Never**
No batch jobs for critical paths. Financial positions, dashboards, and notifications update within milliseconds of a transaction posting.

**6. Immutable by Default**
Transactions, audit events, and state transitions cannot be deleted. They can only be reversed with a countertransaction — creating a full trace.

**7. Context Travels with the User**
When a user navigates from AR Aging to a patient bill to a journal entry — context, filters, and state persist. No re-searching.

## 1.3 What Users Will Never Feel

- Switching between disconnected modules
- Re-entering data that already exists
- Waiting for data to refresh
- Unclear workflow status
- Missing financial trail
- Duplicate master records

---

# 2. SYSTEM ARCHITECTURE OVERVIEW

## 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                           │
│  Next.js 14 · React 18 · TailwindCSS · shadcn/ui · Framer Motion   │
│  Web App · Mobile PWA · Executive Dashboard · Approvals Portal      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS / WebSocket
┌──────────────────────────────▼──────────────────────────────────────┐
│                         API GATEWAY LAYER                           │
│  Rate limiting · Auth · Tenant routing · Schema validation          │
│  GraphQL Federation + REST · OpenAPI 3.1 · API versioning           │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────────────┘
       │          │          │          │          │
┌──────▼──┐ ┌────▼────┐ ┌───▼────┐ ┌───▼────┐ ┌──▼──────────┐
│ Finance │ │Billing  │ │Procure │ │Payroll │ │ AI Engine   │
│ Service │ │Service  │ │Service │ │Service │ │ Service     │
│ (GL/AR/ │ │(Invoice │ │(PO/GRN │ │(Salary │ │ (Anomaly/   │
│ AP/Cash)│ │/Claims) │ │/Invent)│ │/TDS)   │ │  Forecast)  │
└──────┬──┘ └────┬────┘ └───┬────┘ └───┬────┘ └──┬──────────┘
       │          │          │          │          │
┌──────▼──────────▼──────────▼──────────▼──────────▼──────────────────┐
│                     SHARED PLATFORM SERVICES                        │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Accounting  │  │  Workflow    │  │  Audit Engine            │  │
│  │  Engine      │  │  Orchestrator│  │  (Immutable Event Log)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Notification│  │  Permission  │  │  Search Engine           │  │
│  │  Engine      │  │  Engine      │  │  (Elasticsearch)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │  Master Data │  │  Analytics   │  │  Event Bus               │  │
│  │  Service     │  │  Engine      │  │  (Kafka / NATS)          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                          DATA LAYER                                 │
│                                                                     │
│  PostgreSQL (transactional)  │  Redis (cache / sessions / pubsub)  │
│  TimescaleDB (time-series)   │  Elasticsearch (search / audit)     │
│  S3/MinIO (documents/files)  │  ClickHouse (analytics/OLAP)        │
└─────────────────────────────────────────────────────────────────────┘
```

## 2.2 Service Boundary Map

| Domain Service | Owns | Publishes Events | Consumes Events |
|---|---|---|---|
| **Finance Service** | GL, COA, JV, Trial Balance | JournalPosted, AccountUpdated | All module events |
| **Billing Service** | Patient invoices, payments, packages | InvoiceCreated, PaymentReceived | AdmissionCreated, ServiceRendered |
| **AR Service** | Receivables, aging, collections | ARCreated, ARSettled, ARWriteOff | InvoiceFinalized, ClaimSettled |
| **AP Service** | Vendor invoices, payments, aging | APCreated, APPaid, APApproved | PurchaseOrderApproved, GRNCreated |
| **Insurance Service** | Claims, TPA, preauth, denials | ClaimSubmitted, ClaimApproved, ClaimRejected | InvoiceFinalized |
| **Procurement Service** | PO, GRN, vendor, contracts | PurchaseOrderCreated, GRNPosted | InventoryLow, BudgetApproved |
| **Inventory Service** | Stock, pharmacy, consumables | StockIssued, StockLow, ExpiryAlert | GRNPosted, ServiceRendered |
| **Payroll Service** | Salary, TDS, PF, ESI, doctor payout | PayrollPosted, SalaryPaid | AttendanceSubmitted, LeaveApproved |
| **Fixed Assets Service** | Assets, depreciation, disposal | AssetCreated, DepreciationRun | PurchaseOrderReceived |
| **Treasury Service** | Bank accounts, reconciliation, forex | BankStatementImported, ReconciliationCompleted | PaymentMade, CollectionPosted |
| **Taxation Service** | GST, TDS, returns | GSTReturnFiled, TDSChallanGenerated | InvoiceCreated, VendorPaymentMade |
| **AI Service** | Anomaly, forecast, leakage, risk | AnomalyDetected, ForecastUpdated | All events (read-only consumer) |
| **Audit Service** | Immutable event log, trail | (none — sink only) | All events |
| **Notification Service** | Alerts, reminders, escalations | (none — delivery only) | All events requiring notification |
| **Master Data Service** | Patient, vendor, doctor, branch, COA | MasterCreated, MasterUpdated | (none — source of truth) |

---

# 3. UNIFIED MASTER DATA ARCHITECTURE

## 3.1 Master Data Philosophy

All master data lives in one **Master Data Service (MDS)**. Domain services hold a foreign key reference only — they never replicate master fields.

## 3.2 Core Master Entities

### 3.2.1 Patient Master
```sql
patient_master (
  id              UUID PRIMARY KEY,
  patient_code    VARCHAR(20) UNIQUE,     -- HC-000001
  name            VARCHAR(200),
  dob             DATE,
  gender          ENUM('M','F','O'),
  contact_primary VARCHAR(15),
  contact_alt     VARCHAR(15),
  email           VARCHAR(200),
  address         JSONB,                  -- {line1, city, state, pin, country}
  insurance       JSONB[],                -- [{tpa_id, policy_no, valid_till}]
  government_ids  JSONB,                  -- {aadhar, abha, pan}
  blood_group     VARCHAR(5),
  allergies       TEXT[],
  language        VARCHAR(10),
  branch_id       UUID REFERENCES branch_master,
  created_at      TIMESTAMPTZ,
  updated_at      TIMESTAMPTZ,
  is_active       BOOLEAN
)
```

### 3.2.2 Vendor Master
```sql
vendor_master (
  id              UUID PRIMARY KEY,
  vendor_code     VARCHAR(20) UNIQUE,
  name            VARCHAR(200),
  vendor_type     ENUM('supplier','contractor','consultant','lab','pharma'),
  gstin           VARCHAR(15),
  pan             VARCHAR(10),
  bank_details    JSONB[],                -- [{bank, ifsc, account_no, type}]
  address         JSONB,
  contact         JSONB,
  payment_terms   INTEGER,               -- days
  credit_limit    NUMERIC(15,2),
  tds_category    VARCHAR(50),
  tds_rate        NUMERIC(5,2),
  msme_registered BOOLEAN,
  ap_ledger_id    UUID REFERENCES accounts,
  branch_ids      UUID[],
  tags            TEXT[],
  is_active       BOOLEAN
)
```

### 3.2.3 Branch Master
```sql
branch_master (
  id              UUID PRIMARY KEY,
  branch_code     VARCHAR(20) UNIQUE,
  name            VARCHAR(200),
  branch_type     ENUM('hospital','clinic','lab','pharmacy','corporate'),
  address         JSONB,
  gstin           VARCHAR(15),
  license_no      VARCHAR(50),
  parent_id       UUID REFERENCES branch_master,  -- for hierarchy
  cost_center_id  UUID REFERENCES cost_center_master,
  bank_account_id UUID REFERENCES bank_master,
  fiscal_year_id  UUID REFERENCES fiscal_year_master,
  timezone        VARCHAR(50),
  currency        VARCHAR(3) DEFAULT 'INR',
  is_active       BOOLEAN
)
```

### 3.2.4 Doctor Master
```sql
doctor_master (
  id              UUID PRIMARY KEY,
  doctor_code     VARCHAR(20) UNIQUE,
  user_id         UUID REFERENCES users,
  name            VARCHAR(200),
  specialization  TEXT[],
  qualification   TEXT[],
  registration_no VARCHAR(50),
  council         VARCHAR(100),
  department_id   UUID REFERENCES department_master,
  branch_ids      UUID[],
  revenue_sharing JSONB,    -- {type: 'fixed'|'percent', value, service_type_overrides}
  payout_ledger_id UUID REFERENCES accounts,
  consulting_fee  NUMERIC(10,2),
  is_visiting     BOOLEAN,
  is_active       BOOLEAN
)
```

### 3.2.5 Department & Cost Center Masters
```sql
department_master (
  id              UUID PRIMARY KEY,
  code            VARCHAR(20) UNIQUE,
  name            VARCHAR(100),
  department_type ENUM('clinical','diagnostic','surgical','admin','support'),
  branch_id       UUID REFERENCES branch_master,
  head_doctor_id  UUID REFERENCES doctor_master,
  revenue_ledger_id UUID REFERENCES accounts,
  expense_ledger_id UUID REFERENCES accounts,
  budget_id       UUID REFERENCES budgets,
  is_billable     BOOLEAN
)

cost_center_master (
  id              UUID PRIMARY KEY,
  code            VARCHAR(20) UNIQUE,
  name            VARCHAR(100),
  cc_type         ENUM('profit_center','cost_center','investment_center'),
  parent_id       UUID REFERENCES cost_center_master,
  department_id   UUID REFERENCES department_master,
  manager_id      UUID REFERENCES users,
  gl_segment      VARCHAR(20)              -- used in GL segmentation
)
```

### 3.2.6 Service Catalog
```sql
service_catalog (
  id              UUID PRIMARY KEY,
  service_code    VARCHAR(30) UNIQUE,
  name            VARCHAR(200),
  service_type    ENUM('consultation','procedure','lab','radiology','ot','icu',
                       'pharmacy','package','room','consumable','blood'),
  department_id   UUID REFERENCES department_master,
  cpt_code        VARCHAR(10),            -- international coding
  icd_code        VARCHAR(10),
  price           NUMERIC(12,2),
  price_class     JSONB,                  -- {general, semi_private, private, suite}
  tax_category_id UUID REFERENCES tax_master,
  revenue_ledger_id UUID REFERENCES accounts,
  insurance_mappings JSONB,              -- {tpa_id: tpa_service_code}
  is_packageable  BOOLEAN,
  is_active       BOOLEAN
)
```

### 3.2.7 Tax Master
```sql
tax_master (
  id              UUID PRIMARY KEY,
  tax_code        VARCHAR(20) UNIQUE,
  tax_name        VARCHAR(100),
  tax_type        ENUM('GST','TDS','TCS','custom'),
  gst_rate        NUMERIC(5,2),
  cgst_rate       NUMERIC(5,2),
  sgst_rate       NUMERIC(5,2),
  igst_rate       NUMERIC(5,2),
  hsn_sac_code    VARCHAR(10),
  input_ledger_id  UUID REFERENCES accounts,
  output_ledger_id UUID REFERENCES accounts,
  applicable_from DATE,
  applicable_to   DATE
)
```

### 3.2.8 Insurance / TPA Master
```sql
insurance_master (
  id              UUID PRIMARY KEY,
  tpa_code        VARCHAR(20) UNIQUE,
  name            VARCHAR(200),
  tpa_type        ENUM('government','private','corporate','esic','cghs'),
  empanelment_no  VARCHAR(50),
  portal_url      VARCHAR(500),
  api_config      JSONB,                  -- {base_url, auth_type, credentials_ref}
  tariff_schedule JSONB,                  -- {service_code: approved_rate}
  credit_limit    NUMERIC(15,2),
  payment_terms   INTEGER,
  ar_ledger_id    UUID REFERENCES accounts,
  contact         JSONB,
  is_active       BOOLEAN
)
```

## 3.3 Master Data Access Pattern

```
Module Service
    │
    ├─ On READ: calls MDS GraphQL → resolves master entity
    │
    ├─ On WRITE transaction: stores only master_id (FK)
    │
    └─ On DISPLAY: joins via MDS or uses cached projection
```

Master data changes emit `MasterUpdated` events — all cached projections are invalidated automatically.

---

# 4. UNIFIED FINANCIAL POSTING ENGINE

## 4.1 Architecture

The Financial Posting Engine (FPE) is the single transaction authority for the entire platform. Every module that involves money calls FPE. No module writes to GL tables directly.

```
Module Service
    │
    ├─ calls FPE.postTransaction(payload)
    │
FPE validates:
    ├─ Debit sum === Credit sum
    ├─ All accounts exist and are active
    ├─ Fiscal year is open
    ├─ Posting period is not locked
    ├─ Transaction reference is unique
    │
FPE atomically:
    ├─ Inserts journal_entries row
    ├─ Inserts journal_lines rows (all debits + credits)
    ├─ Updates accounts.current_balance for each line
    ├─ Updates cost_center_balances
    ├─ Updates department_balances
    ├─ Publishes JournalPosted event
    │
Returns:
    └─ { journal_entry_id, entry_number, timestamp }
```

## 4.2 Core Data Model

```sql
journal_entries (
  id              UUID PRIMARY KEY,
  entry_number    VARCHAR(20) UNIQUE,      -- JV-2026-000001
  entry_type      ENUM('JV','PV','RV','BPV','BRV','CN','DN','OB'),
  source_module   VARCHAR(50),             -- 'patient_billing','payroll','ap', etc.
  source_id       UUID,                    -- FK to originating record
  source_ref      VARCHAR(100),            -- human-readable: INV-2026-001234
  narration       TEXT,
  posting_date    DATE,
  fiscal_year_id  UUID REFERENCES fiscal_year_master,
  period_id       UUID REFERENCES fiscal_periods,
  branch_id       UUID REFERENCES branch_master,
  currency        VARCHAR(3) DEFAULT 'INR',
  exchange_rate   NUMERIC(10,6) DEFAULT 1,
  total_debit     NUMERIC(18,2),
  total_credit    NUMERIC(18,2),
  status          ENUM('draft','posted','reversed','void'),
  is_auto_posted  BOOLEAN,                 -- system vs manual
  is_reversible   BOOLEAN DEFAULT TRUE,
  reversal_of     UUID REFERENCES journal_entries,
  tags            TEXT[],
  created_by      UUID REFERENCES users,
  approved_by     UUID REFERENCES users,
  posted_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ
)

journal_lines (
  id              UUID PRIMARY KEY,
  journal_entry_id UUID REFERENCES journal_entries,
  line_number     INTEGER,
  account_id      UUID REFERENCES accounts,
  dr_amount       NUMERIC(18,2) DEFAULT 0,
  cr_amount       NUMERIC(18,2) DEFAULT 0,
  narration       TEXT,
  cost_center_id  UUID REFERENCES cost_center_master,
  department_id   UUID REFERENCES department_master,
  branch_id       UUID REFERENCES branch_master,
  subledger_type  ENUM('patient','vendor','employee','doctor','insurance'),
  subledger_id    UUID,                    -- polymorphic FK to subledger entity
  running_balance NUMERIC(18,2),           -- computed at insert time
  reconciled      BOOLEAN DEFAULT FALSE,
  reconciled_at   TIMESTAMPTZ,
  tags            TEXT[]
)
```

## 4.3 Auto-Posting Templates

Each module has a registered **posting template** that maps business events to GL entries. Templates reference accounts by `account_type_code` (not hardcoded IDs), resolved at post-time from the tenant's Chart of Accounts.

```json
{
  "template_id": "PATIENT_INVOICE_FINALIZE",
  "source_module": "patient_billing",
  "trigger_event": "InvoiceFinalized",
  "lines": [
    {
      "side": "DR",
      "account_type": "AR_PATIENT",
      "amount_field": "net_amount",
      "subledger_type": "patient",
      "subledger_field": "patient_id"
    },
    {
      "side": "CR",
      "account_type": "REVENUE_SERVICE",
      "amount_field": "taxable_amount",
      "department_field": "department_id"
    },
    {
      "side": "CR",
      "account_type": "OUTPUT_CGST",
      "amount_field": "cgst_amount"
    },
    {
      "side": "CR",
      "account_type": "OUTPUT_SGST",
      "amount_field": "sgst_amount"
    }
  ]
}
```

Templates are configurable per tenant, enabling custom COA without code changes.

## 4.4 Complete Auto-Posting Map

| Transaction | DR | CR |
|---|---|---|
| Patient Invoice Finalized | AR-Patient | Revenue, Output GST |
| Patient Invoice Discount | Discount Allowed | AR-Patient |
| Patient Cash Collection | Cash / Bank | AR-Patient |
| Insurance Claim Raised | AR-Insurance | AR-Patient |
| Insurance Settlement | Bank | AR-Insurance |
| Insurance Shortfall | Claim Write-off | AR-Insurance |
| Vendor Invoice Posted | Expense / Asset / Inventory | AP-Vendor |
| Vendor Payment Made | AP-Vendor | Bank / Cash |
| Vendor TDS Deducted | AP-Vendor | TDS Payable |
| Payroll Posted | Salary Expense, PF Exp, ESI Exp | Salary Payable, PF Payable, ESI Payable, TDS Payable |
| Salary Disbursed | Salary Payable | Bank |
| Asset Purchased | Fixed Asset | AP-Vendor / Bank |
| Asset Depreciation | Depreciation Expense | Accumulated Depreciation |
| Asset Disposal Gain | Bank | Fixed Asset, Gain on Disposal |
| Pharmacy Issue (Patient) | Pharmacy COGS | Pharmacy Inventory |
| Inventory GRN Posted | Inventory / Expense | AP-Vendor (Accrual) |
| Bank Charges | Bank Charges Expense | Bank Account |
| Advance to Vendor | Advance to Vendor | Bank |
| Advance Adjusted | AP-Vendor | Advance to Vendor |
| Credit Note Issued | Revenue | AR-Patient |
| Debit Note Received | AP-Vendor | Expense |
| Inter-Branch Transfer | Inter-Branch Receivable | Inter-Branch Payable |
| Budget Provision | Provision Expense | Provision Liability |

---

# 5. UNIFIED WORKFLOW ORCHESTRATION ENGINE

## 5.1 Architecture

The Workflow Engine is a shared service. Every module declares workflows as configuration — not code. The engine handles state transitions, SLA timers, notifications, escalations, and audit events.

```
WorkflowDefinition (config):
  name: "vendor_invoice_approval"
  states: [draft, submitted, l1_review, l2_review, approved, rejected, posted, paid]
  transitions: [
    { from: draft,      to: submitted,  trigger: "submit",     actor: "creator" },
    { from: submitted,  to: l1_review,  trigger: "auto",       sla: "4h",       
      assignee_rule: "department_head" },
    { from: l1_review,  to: l2_review,  trigger: "approve",    amount_gt: 50000 },
    { from: l1_review,  to: approved,   trigger: "approve",    amount_lte: 50000 },
    { from: l2_review,  to: approved,   trigger: "approve",    actor: "finance_head" },
    { from: l2_review,  to: rejected,   trigger: "reject" },
    { from: approved,   to: posted,     trigger: "auto",       
      action: "FPE.postVendorInvoice" },
    { from: posted,     to: paid,       trigger: "payment_confirmed" }
  ]
  sla_breach_action: "escalate_to_cfo"
  on_complete_event: "VendorInvoiceApproved"
```

## 5.2 Universal Workflow States

All modules use this canonical state vocabulary:

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → POSTED → RECONCILED → CLOSED → ARCHIVED
                         ↓
                      REJECTED → (back to DRAFT or terminal)
                         ↓
                     ESCALATED → UNDER_REVIEW
                         ↓
                     ON_HOLD → UNDER_REVIEW
```

## 5.3 Workflow Definitions by Module

| Module | Workflow | States | Auto-Trigger on Completion |
|---|---|---|---|
| Journal Voucher | JV Approval | draft → posted | JournalPosted |
| Vendor Invoice | Invoice Approval | draft → paid | APCreated, VendorInvoicePosted |
| Patient Invoice | Invoice Finalization | draft → final | InvoiceFinalized, ARCreated |
| Purchase Order | PO Approval | draft → approved | PurchaseOrderApproved |
| GRN | GRN Verification | draft → posted | GRNPosted, InventoryUpdated |
| Payroll | Payroll Approval | calculated → posted | PayrollPosted |
| Credit Note | Credit Approval | requested → issued | CreditNoteIssued |
| Refund | Refund Approval | requested → paid | RefundPaid |
| Bank Recon | Reconciliation | open → reconciled | ReconciliationCompleted |
| Claim | Claim Cycle | raised → settled | ClaimSettled |
| Asset Disposal | Disposal Approval | draft → disposed | AssetDisposed |
| Budget | Budget Approval | draft → approved | BudgetApproved |
| Write-off | Write-off Approval | requested → approved | WriteOffPosted |

## 5.4 Cross-Module Workflow Chaining

```
Patient Discharge
    │
    ├─► Trigger: BillingWorkflow.create(patient_id, encounter_id)
    │       │
    │       ├─► Invoice draft created
    │       ├─► Insurance preauth verified
    │       ├─► Package reconciliation run
    │       ├─► Invoice finalized → InvoiceFinalized event
    │       │
    │       ├─► [if insurance patient] → ClaimWorkflow.submit(invoice_id)
    │       │       │
    │       │       ├─► TPA portal submission (API)
    │       │       ├─► SLA: 24h for response
    │       │       └─► on settlement → FPE.postClaimSettlement()
    │       │
    │       └─► [if self-pay] → CollectionWorkflow.initiate(invoice_id)
    │               │
    │               ├─► Payment reminder at T+0, T+3, T+7
    │               └─► on payment → FPE.postPatientReceipt()
    │
    └─► All states update AR dashboard, GL, AI leakage engine in real-time
```

---

# 6. EVENT-DRIVEN ARCHITECTURE & EVENT CATALOG

## 6.1 Event Bus Architecture

```
Producers                    Event Bus (Kafka)              Consumers
─────────                    ─────────────────              ─────────
Finance Service    ──────►  finance.journal.posted  ──────► Analytics Engine
Billing Service    ──────►  billing.invoice.created ──────► AI Service
AP Service         ──────►  ap.invoice.approved     ──────► Audit Service
Payroll Service    ──────►  payroll.run.posted      ──────► Notification Service
Treasury Service   ──────►  treasury.recon.done     ──────► Dashboard Service
Insurance Service  ──────►  insurance.claim.denied  ──────► Workflow Engine
Inventory Service  ──────►  inventory.stock.low     ──────► Search Indexer
```

## 6.2 Event Schema Standard

Every event follows this envelope:

```typescript
interface FinOSEvent<T = unknown> {
  event_id:       string;          // UUID v4
  event_type:     string;          // 'InvoiceFinalized'
  event_version:  string;          // '1.0'
  source_service: string;          // 'billing-service'
  tenant_id:      string;          // multi-tenant
  branch_id:      string;
  fiscal_year_id: string;
  actor_id:       string;          // user who triggered
  actor_role:     string;
  correlation_id: string;          // trace entire workflow chain
  causation_id:   string;          // immediate parent event_id
  timestamp:      string;          // ISO 8601 UTC
  payload:        T;
  metadata: {
    ip_address:   string;
    user_agent:   string;
    session_id:   string;
  };
}
```

## 6.3 Complete Event Catalog

### Finance Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `JournalPosted` | entry_id, entry_type, total_debit, source_module | GL updated, dashboards refresh, audit logged |
| `JournalReversed` | original_entry_id, reversal_entry_id | AR/AP reversed, reconciliation flagged |
| `AccountBalanceUpdated` | account_id, old_balance, new_balance | Trial balance refreshed |
| `FiscalYearClosed` | year_id, closing_entry_ids | All periods locked |
| `PeriodLocked` | period_id, locked_by | Block postings to period |

### Billing Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `InvoiceCreated` | invoice_id, patient_id, amount, type | AI leakage check triggered |
| `InvoiceFinalized` | invoice_id, net_amount, tax_amount | FPE posts to GL, AR created |
| `PaymentReceived` | payment_id, invoice_id, amount, mode | FPE posts receipt, AR reduced, cash updated |
| `InvoiceVoided` | invoice_id, reason | FPE reverses entries, AR reversed |
| `CreditNoteIssued` | credit_note_id, invoice_id, amount | FPE posts CR note, AR reduced |
| `PackageConsumed` | package_id, patient_id, services_used | Revenue recognition triggered |
| `RefundApproved` | refund_id, amount, patient_id | FPE posts refund, cash reduced |

### AR Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `ARCreated` | ar_id, patient_id, amount, due_date | AR aging starts, notifications scheduled |
| `ARSettled` | ar_id, settled_amount | Leakage engine updated |
| `ARWrittenOff` | ar_id, amount, reason | Bad debt expense posted |
| `ARAgingBreached` | ar_id, bucket, days_overdue | Escalation triggered, collection workflow |
| `CollectionInitiated` | collection_id, agent_id, amount | CRM updated |

### AP Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `VendorInvoiceReceived` | invoice_id, vendor_id, amount | AP aging starts, approval workflow |
| `VendorInvoiceApproved` | invoice_id, approver_id | FPE posts AP, budget consumed |
| `VendorPaymentScheduled` | payment_id, due_date, amount | Cash flow forecast updated |
| `VendorPaymentMade` | payment_id, invoice_id, amount | FPE posts payment, bank reduced |
| `APAgingBreached` | invoice_id, days_overdue | Vendor notification, finance alert |
| `TDSDeducted` | tds_id, vendor_id, amount, rate | TDS payable created |

### Insurance Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `PreAuthRequested` | preauth_id, claim_estimate, tpa_id | Approval workflow started |
| `PreAuthApproved` | preauth_id, approved_amount | Billing authorization updated |
| `ClaimSubmitted` | claim_id, invoice_id, claimed_amount | TPA API called, SLA started |
| `ClaimApproved` | claim_id, approved_amount | FPE posts receivable |
| `ClaimRejected` | claim_id, rejection_code, reason | AI leakage logged, rework workflow |
| `ClaimSettled` | claim_id, settled_amount, deductions | FPE posts settlement, AR closed |
| `ClaimWriteOff` | claim_id, write_off_amount | Bad debt posted, AI learns pattern |
| `TPAPaymentReceived` | payment_id, claim_ids[], amount | Bank reconciliation triggered |

### Procurement Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `PurchaseRequisitionCreated` | pr_id, items[], department_id | Budget check run |
| `PurchaseOrderApproved` | po_id, vendor_id, amount | Vendor notified, commitment posted |
| `GRNCreated` | grn_id, po_id, items_received | Inventory updated, AP accrual posted |
| `GRNVarianceDetected` | grn_id, variance_amount | Finance alerted, dispute workflow |
| `VendorContractExpiring` | contract_id, expiry_date | Procurement notified |

### Payroll Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `PayrollCalculated` | run_id, month, total_gross, total_net | Review workflow initiated |
| `PayrollApproved` | run_id, approver_id | FPE posts payroll entries |
| `PayrollPosted` | run_id, journal_entry_id | Salary liability created |
| `SalaryDisbursed` | run_id, bank_reference | FPE posts payment, bank reduced |
| `DoctorPayoutCalculated` | payout_id, doctor_id, amount | Doctor notified, approval started |

### Treasury Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `BankStatementImported` | statement_id, bank_id, period | Reconciliation engine started |
| `ReconciliationCompleted` | recon_id, matched_count, unmatched_count | Cash position updated |
| `CashVarianceDetected` | variance_id, amount, account_id | Finance alerted, AI flagged |
| `InwardRemittancePosted` | remittance_id, amount | FPE posts, AR matched |
| `OutwardPaymentConfirmed` | payment_id, amount | FPE posts, AP closed |

### AI / Intelligence Domain
| Event | Payload Key Fields | Downstream Impact |
|---|---|---|
| `AnomalyDetected` | anomaly_id, type, severity, affected_entity | Notification sent, workflow created |
| `FraudRiskFlagged` | risk_id, score, evidence | Compliance alerted, transaction held |
| `RevenueLeakageDetected` | leakage_id, estimated_amount, source | Revenue cycle team notified |
| `CashFlowForecastUpdated` | forecast_id, period, projected_balance | Treasury dashboard updated |
| `ClaimDenialRiskHigh` | claim_id, risk_score, reason_codes | Pre-submission review triggered |

---

# 7. UNIFIED AI INTELLIGENCE ENGINE

## 7.1 Architecture

```
All Events (Kafka)
      │
      ▼
AI Event Ingestion Layer
      │
      ├─► Feature Extraction Pipeline (Apache Flink)
      │       │
      │       ├─ Transaction features
      │       ├─ Pattern features
      │       ├─ Temporal features
      │       └─ Relational features (patient→invoice→claim→payment)
      │
      ├─► Model Serving Layer (FastAPI + MLflow)
      │       │
      │       ├─ Anomaly Detection Model (Isolation Forest / Autoencoder)
      │       ├─ Revenue Leakage Model (Gradient Boosting)
      │       ├─ Claim Denial Prediction (XGBoost)
      │       ├─ Cash Flow Forecast (LSTM / Prophet)
      │       ├─ Fraud Detection (Graph Neural Network)
      │       └─ AR Collection Probability (Logistic Regression)
      │
      ├─► LLM Layer (Claude / GPT-4o via API)
      │       │
      │       ├─ Natural language financial Q&A
      │       ├─ Narrative report generation
      │       ├─ Anomaly explanation in plain language
      │       └─ Workflow recommendations
      │
      └─► AI Context Store (Redis + Postgres)
              │
              └─ Per-entity AI context persists across modules
```

## 7.2 AI Intelligence Capabilities

### Revenue Leakage Detection
```
Inputs consumed:
  - Service catalog rates vs. billed amounts
  - Package utilization vs. charged items
  - Pharmacy issues vs. billing line items
  - OT/ICU duration vs. billed duration
  - Discount patterns by cashier / doctor

Output:
  - Leakage amount per category
  - Responsible entity (dept, doctor, cashier, shift)
  - Trend: improving / worsening
  - Specific transactions for audit
```

### Claim Denial Prediction
```
Inputs:
  - Historical claim submissions and outcomes by TPA
  - Rejection reason codes per service type
  - Patient insurance eligibility status
  - Pre-auth approval vs. actual claim

Output:
  - Risk score (0–100) per claim before submission
  - Top rejection risk factors
  - Suggested corrections before submission
```

### Cash Flow Forecasting
```
Inputs:
  - AR aging + historical collection rates by TPA/payer
  - AP payment schedule
  - Payroll due dates
  - Seasonal admission patterns
  - Outstanding claims pipeline

Output:
  - 13-week rolling cash flow forecast
  - Low-balance alert with specific dates
  - Action recommendations (accelerate collections, delay payments)
```

### Fraud & Anomaly Detection
```
Monitored patterns:
  - Duplicate invoice submissions
  - Round-trip cash transactions
  - Vendor invoices without PO/GRN (3-way mismatch)
  - Unusual discount rates by user
  - Off-hours transaction spikes
  - Claim amount clustering (just below approval threshold)
  - Employee payroll ghost records
  - Inventory variance vs. pharmacy consumption

Output:
  - Risk score + evidence list
  - Peer comparison (this entity vs. similar)
  - Suggested investigation steps
```

## 7.3 AI Context Persistence

Every entity carries an AI context object that persists across modules:

```typescript
interface AIEntityContext {
  entity_type: 'patient' | 'vendor' | 'doctor' | 'department';
  entity_id:   string;
  risk_score:  number;           // 0–100, continuously updated
  leakage_indicators: string[];
  anomaly_flags:  AnomalyFlag[];
  predictions: {
    claim_denial_risk?:     number;
    collection_probability?: number;
    fraud_risk?:            number;
  };
  insights:    AIInsight[];      // plain-language observations
  last_updated: string;
}
```

This context is visible in every module that shows the entity — a patient's risk score appears in Billing, AR, Insurance, and Audit panels simultaneously.

---

# 8. UNIFIED AUDIT & TRACEABILITY ENGINE

## 8.1 Audit Data Model

```sql
audit_events (
  id              UUID PRIMARY KEY,
  event_id        UUID,                    -- links to domain event
  event_type      VARCHAR(100),
  entity_type     VARCHAR(50),             -- 'invoice','journal_entry','patient',etc.
  entity_id       UUID,
  entity_ref      VARCHAR(100),            -- human-readable ID
  action          ENUM('create','update','delete','view','approve',
                       'reject','post','reverse','export','login',
                       'permission_change','config_change'),
  actor_id        UUID REFERENCES users,
  actor_name      VARCHAR(200),
  actor_role      VARCHAR(50),
  actor_ip        VARCHAR(45),
  actor_session   VARCHAR(100),
  branch_id       UUID,
  old_state       JSONB,                   -- snapshot before change
  new_state       JSONB,                   -- snapshot after change
  delta           JSONB,                   -- computed diff
  financial_impact JSONB,                  -- {dr_amount, cr_amount, accounts_affected}
  correlation_id  UUID,                    -- links events in same workflow
  timestamp       TIMESTAMPTZ,
  is_sensitive    BOOLEAN,                 -- PII/financial — access controlled
  hash            VARCHAR(64)              -- SHA-256 of (id+timestamp+actor+entity)
)
-- Stored in Elasticsearch for full-text search
-- Written to append-only Postgres table (no UPDATE/DELETE permissions)
-- Hash chain for tamper detection
```

## 8.2 Full Traceability Path

Every entity exposes a `GET /audit/timeline/:entity_type/:entity_id` endpoint that returns:

```json
{
  "entity": { "type": "patient_invoice", "id": "...", "ref": "INV-2026-001234" },
  "timeline": [
    { "at": "2026-05-20T09:00Z", "action": "create", "actor": "Dr. Ramesh", "state": "draft" },
    { "at": "2026-05-20T09:15Z", "action": "service_added", "detail": "ICU Day 3", "amount": 15000 },
    { "at": "2026-05-20T10:00Z", "action": "finalize", "actor": "Billing Staff", "state": "final",
      "linked": [{ "type": "journal_entry", "ref": "JV-2026-000891" }] },
    { "at": "2026-05-20T10:05Z", "action": "claim_raised", "actor": "System",
      "linked": [{ "type": "insurance_claim", "ref": "CLM-2026-000210" }] },
    { "at": "2026-05-21T14:00Z", "action": "claim_settled", "amount": 42000,
      "linked": [{ "type": "journal_entry", "ref": "JV-2026-000944" },
                 { "type": "bank_transaction", "ref": "BNK-20260521-001" }] },
    { "at": "2026-05-21T14:01Z", "action": "ar_closed", "actor": "System" }
  ],
  "cross_links": {
    "journal_entries": ["JV-2026-000891", "JV-2026-000944"],
    "bank_transactions": ["BNK-20260521-001"],
    "insurance_claims": ["CLM-2026-000210"],
    "ar_records": ["AR-2026-001234"]
  }
}
```

Any linked entity is clickable in the UI — navigating while preserving full context.

---

# 9. UNIFIED SEARCH & COMMAND SYSTEM

## 9.1 Architecture

```
User types in Global Search
      │
      ▼
Intent Parser (LLM-powered)
      │
      ├─► Structured query → Elasticsearch
      │       Indexes: invoices, patients, vendors, JVs,
      │                payments, claims, POs, bank_txns, ledgers
      │
      ├─► Natural language → Query Translation
      │       "unpaid ICU claims > 30 days" →
      │       { index: claims, filters: { department: ICU,
      │                                   status: pending,
      │                                   age_gt: 30 } }
      │
      └─► Command intent → Action dispatch
              "approve pending vendor invoices"
              → opens Vendor Invoice queue with pending filter
```

## 9.2 Search Index Schema

```
Universal Search Index (Elasticsearch):

Document {
  id, type, ref_number, title, description,
  amount, currency, status, date,
  entity_type, entity_id, entity_name,
  branch_id, department_id, fiscal_year_id,
  tags, metadata,
  url,                     -- deep link to exact record
  permissions_required[]   -- which roles can see this result
}
```

## 9.3 Example Natural Language Queries

| Query | Resolves To |
|---|---|
| "Show unpaid ICU claims" | Claims index, dept=ICU, status=pending |
| "Find INV-2026-001234" | Invoice by ref number |
| "Vendor invoices with GST mismatch" | AP invoices, gst_mismatch=true |
| "All transactions for patient Ravi Kumar" | Cross-index: invoices + payments + claims |
| "Suspicious cash reversals last week" | JV index, type=reversal, is_flagged=true |
| "Overdue AR > ₹1 lakh" | AR index, outstanding_gt=100000, overdue=true |
| "Payroll TDS this quarter" | Payroll index + tax index, period=Q3 |

---

# 10. UNIFIED NOTIFICATION ENGINE

## 10.1 Notification Architecture

```
Event Bus
    │
    ▼
Notification Rules Engine
    │
    ├─ Rule: ClaimRejected → notify(billing_manager, finance_head)
    ├─ Rule: ARAgingBreached(90d) → notify(CFO) + escalate_workflow
    ├─ Rule: CashBalance < threshold → notify(treasurer, CFO)
    ├─ Rule: AnomalyDetected(HIGH) → notify(compliance_officer)
    ├─ Rule: PO awaiting approval > SLA → escalate + notify(next_approver)
    │
    ▼
Delivery Engine
    ├─ In-app notification (WebSocket push)
    ├─ Email (SendGrid / AWS SES)
    ├─ SMS / WhatsApp (Twilio)
    ├─ Mobile push (FCM / APNs)
    └─ Slack / Teams webhook
```

## 10.2 Notification Data Model

```sql
notifications (
  id              UUID PRIMARY KEY,
  tenant_id       UUID,
  recipient_id    UUID REFERENCES users,
  notification_type VARCHAR(50),
  severity        ENUM('info','warning','alert','critical'),
  title           VARCHAR(200),
  body            TEXT,
  financial_impact JSONB,              -- {amount, currency, entity_ref}
  action_url      VARCHAR(500),        -- deep link into app
  action_label    VARCHAR(100),
  entity_type     VARCHAR(50),
  entity_id       UUID,
  workflow_id     UUID,                -- if linked to workflow
  is_read         BOOLEAN DEFAULT FALSE,
  is_actioned     BOOLEAN DEFAULT FALSE,
  actioned_at     TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  channels        TEXT[],              -- ['in_app','email','sms']
  delivered_at    JSONB,               -- {channel: timestamp}
  created_at      TIMESTAMPTZ
)
```

## 10.3 Notification Types & Routing

| Notification | Severity | Recipients | Channels |
|---|---|---|---|
| Invoice finalized | Info | Patient (receipt) | Email, SMS |
| Claim rejected | Alert | Billing manager | In-app, Email |
| AR overdue 30d | Warning | AR team | In-app |
| AR overdue 90d | Alert | Finance head, CFO | In-app, Email |
| Anomaly detected (high) | Critical | Compliance, CFO | In-app, Email, SMS |
| Fraud risk flagged | Critical | CFO, Audit | In-app, Email, SMS |
| Cash balance low | Alert | Treasurer, CFO | In-app, SMS |
| Approval pending SLA breach | Alert | Next approver | In-app, Email |
| Bank recon mismatch | Warning | Treasury team | In-app |
| Stock below reorder | Warning | Procurement | In-app |
| TDS payment due | Alert | Finance | In-app, Email |
| GST return due | Alert | Taxation team | In-app, Email |
| Payroll approval due | Alert | HR head | In-app, Email |
| Asset warranty expiring | Info | Procurement | In-app |
| Revenue leakage detected | Alert | Revenue cycle head | In-app, Email |

---

# 11. UNIFIED PERMISSION & SECURITY (RBAC/ABAC)

## 11.1 Permission Model

The system uses **Hybrid RBAC + ABAC**: roles define base permissions, attributes add dynamic constraints.

```sql
roles (id, name, description, is_system_role)

permissions (
  id, resource, action, description
  -- resource: 'invoice', 'journal_entry', 'patient', etc.
  -- action: 'create', 'read', 'update', 'delete', 'approve', 'post', 'export', 'void'
)

role_permissions (role_id, permission_id)

user_roles (user_id, role_id, branch_id, department_id, valid_from, valid_to)

permission_attributes (
  role_id, resource, action,
  attribute_type  ENUM('amount_limit','own_records_only','branch_restricted',
                       'department_restricted','read_only_after_post',
                       'require_dual_approval','time_restricted'),
  attribute_value JSONB
)
```

## 11.2 System Roles

| Role | Core Access |
|---|---|
| `super_admin` | All modules, all branches, system config |
| `group_cfo` | All branches read/approve, no config |
| `branch_finance_head` | All modules own branch, approve up to limit |
| `accountant` | GL, AR, AP, billing — post, no approve |
| `billing_manager` | Patient billing, insurance — full |
| `billing_staff` | Patient billing — create/edit/finalize only |
| `ar_collector` | AR module — read + update collection status |
| `procurement_manager` | PO, GRN, vendor — full |
| `store_manager` | Inventory, GRN — full |
| `payroll_admin` | Payroll — full |
| `treasury_manager` | Bank, reconciliation — full |
| `tax_accountant` | Taxation, GL read |
| `auditor` | Read-only all modules + full audit trail |
| `doctor` | Own patient billing read, own payout read |
| `department_head` | Department analytics + approval workflows |
| `it_admin` | User management, system config |

## 11.3 Attribute-Based Constraints

```typescript
// Example: billing_staff can only finalize invoices they created
{
  role: 'billing_staff',
  resource: 'invoice',
  action: 'finalize',
  constraint: 'created_by = current_user'
}

// Accountant can post JVs only up to ₹1,00,000
{
  role: 'accountant',
  resource: 'journal_entry',
  action: 'post',
  constraint: 'total_debit <= 100000'
}

// Finance head restricted to own branch
{
  role: 'branch_finance_head',
  resource: '*',
  action: '*',
  constraint: 'branch_id IN user.assigned_branches'
}
```

## 11.4 Security Controls

| Control | Implementation |
|---|---|
| Authentication | JWT (15-min access token) + Refresh token (7-day rotating) |
| MFA | TOTP via authenticator app for finance/admin roles |
| Session | Redis session store, device fingerprinting |
| API Security | Rate limiting, input schema validation (Zod), CORS |
| Data Encryption | TLS 1.3 in transit, AES-256 at rest |
| Audit Grade | Every API call creates an audit_event |
| PII Protection | Patient data masked in logs, role-based field visibility |
| IP Allowlisting | Optional per tenant for finance roles |

---

# 12. UNIFIED ANALYTICS & REPORTING LAYER

## 12.1 Architecture

```
Source of Truth: PostgreSQL (operational)
      │
      ├─► Kafka CDC (Debezium) → ClickHouse (OLAP)
      │       │
      │       └─► Pre-computed aggregates:
      │               - daily_revenue_by_department
      │               - daily_ar_aging_snapshot
      │               - daily_cash_position
      │               - weekly_claim_status_summary
      │               - monthly_pl_by_branch
      │
      └─► TimescaleDB (time-series)
              │
              └─► Real-time metrics: transactions/sec,
                  collection rate, avg claim cycle time
```

## 12.2 Unified Executive Dashboard

**Purpose:** CFO/CEO/Group Management view — single screen showing the health of the entire healthcare enterprise.

**KPI Cards (real-time):**
- Total Revenue (MTD / YTD)
- Net Collections (MTD)
- Outstanding AR (with aging breakdown)
- Outstanding AP (with aging breakdown)
- Cash Position (all banks)
- Claim Approval Rate (%)
- Revenue Leakage Estimate
- Budget Utilization (%)
- EBITDA (MTD)
- Days Sales Outstanding (DSO)

**Drill-down hierarchy:**
```
Group → Branch → Department → Doctor → Patient / Vendor
```

## 12.3 Analytics by Module

| Module | Key Analytics |
|---|---|
| **GL** | Trial balance, P&L, Balance sheet, Cash flow statement |
| **AR** | Aging buckets, DSO trend, payer mix, collection efficiency |
| **AP** | Aging buckets, DPO trend, vendor spend analysis, budget vs. actual |
| **Billing** | Revenue by dept/doctor/payer, package revenue, discount analysis |
| **Insurance** | Claim approval rate by TPA, average settlement time, denial analysis |
| **Payroll** | Cost-per-employee, department salary cost, PF/ESI trends |
| **Inventory** | Turnover ratio, stockout frequency, expiry write-offs |
| **Fixed Assets** | Net book value, depreciation schedule, asset utilization |
| **Treasury** | Cash flow forecast, bank utilization, float analysis |
| **Revenue Leakage** | Leakage by category, trend, responsible department |

---

# 13. UNIFIED DESIGN SYSTEM

## 13.1 Design Tokens

```css
/* Color System */
--color-brand-primary:    #6366F1;  /* Indigo — finance/GL */
--color-brand-secondary:  #8B5CF6;  /* Violet — AP/vendor */
--color-success:          #10B981;  /* Emerald — positive/received */
--color-warning:          #F59E0B;  /* Amber — pending/review */
--color-danger:           #EF4444;  /* Red — overdue/rejected */
--color-info:             #3B82F6;  /* Blue — informational */
--color-neutral-900:      #111827;
--color-neutral-50:       #F9FAFB;

/* Module Color Coding */
--module-gl:              #6366F1;  /* Indigo */
--module-ar:              #06B6D4;  /* Cyan */
--module-ap:              #8B5CF6;  /* Violet */
--module-billing:         #F59E0B;  /* Amber */
--module-insurance:       #10B981;  /* Emerald */
--module-payroll:         #EC4899;  /* Pink */
--module-procurement:     #84CC16;  /* Lime */
--module-treasury:        #14B8A6;  /* Teal */
--module-ai:              #F97316;  /* Orange */
--module-audit:           #6B7280;  /* Gray */

/* Typography */
--font-heading:  'Inter', sans-serif;
--font-mono:     'JetBrains Mono', monospace;  /* amounts, codes */
--font-size-xs:  11px;
--font-size-sm:  13px;
--font-size-md:  15px;
--font-size-lg:  17px;
--font-size-xl:  20px;
--font-size-2xl: 24px;
--font-size-3xl: 30px;

/* Spacing */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-6: 24px;  --space-8: 32px;

/* Radius */
--radius-sm: 6px;  --radius-md: 10px;  --radius-lg: 16px;
```

## 13.2 Component Standards

**Every page must include:**
1. **Module Header** — breadcrumb + page title + KPI strip + global search + notifications
2. **Filter Bar** — branch, date range, fiscal period, status, entity — always visible
3. **Data Grid** — sortable, filterable, selectable rows, bulk actions
4. **Side Drawer** — 7-tab detail panel (Overview, Transactions, Workflow, Audit, AI, Documents, Comments)
5. **AI Panel** — collapsible right panel with contextual intelligence
6. **Workflow Status Strip** — visual state machine with current position

**Status Badge Standards:**
```typescript
const STATUS_BADGES = {
  draft:        { color: 'gray',    label: 'Draft' },
  submitted:    { color: 'blue',    label: 'Submitted' },
  under_review: { color: 'amber',   label: 'Under Review' },
  approved:     { color: 'emerald', label: 'Approved' },
  rejected:     { color: 'red',     label: 'Rejected' },
  posted:       { color: 'indigo',  label: 'Posted' },
  reconciled:   { color: 'teal',    label: 'Reconciled' },
  closed:       { color: 'green',   label: 'Closed' },
  escalated:    { color: 'orange',  label: 'Escalated' },
  void:         { color: 'gray',    label: 'Void' },
}
```

## 13.3 Motion System

```typescript
// Framer Motion variants — shared across all pages
export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  exit:    { opacity: 0, y: -8 }
}

export const cardEntrance = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.15 } }
}

export const drawerSlide = {
  initial: { x: '100%' },
  animate: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit:    { x: '100%' }
}

export const numberCount = {
  // Framer Motion useMotionValue + animate for KPI number roll
}
```

---

# 14. FRONTEND ARCHITECTURE

## 14.1 Tech Stack

| Concern | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| UI Library | React 18 |
| Styling | Tailwind CSS + CSS Variables |
| Components | shadcn/ui (Radix UI primitives) |
| Animation | Framer Motion |
| Data Grid | TanStack Table v8 |
| Data Fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Charts | Recharts + custom SVG |
| State | Zustand (global) + TanStack Query (server state) |
| Real-time | Native WebSocket via custom hook |
| Icons | Lucide React |
| Routing | Next.js App Router |
| Auth | NextAuth.js v5 |

## 14.2 Module Federation Pattern

Each module is a Next.js route group with its own layout, loading, and error boundaries:

```
app/
├── (auth)/                 # Unauthenticated routes
│   └── login/
├── (shell)/                # Authenticated shell with sidebar
│   ├── layout.tsx          # Global layout: sidebar + header + notification
│   ├── dashboard/
│   ├── (finance)/
│   │   ├── gl/             # General Ledger
│   │   ├── ar/             # Accounts Receivable
│   │   ├── ap/             # Accounts Payable
│   │   └── treasury/       # Cash & Bank
│   ├── (billing)/
│   │   ├── billing/        # Patient Billing
│   │   ├── insurance/      # Insurance / TPA
│   │   └── packages/
│   ├── (operations)/
│   │   ├── procurement/
│   │   ├── inventory/
│   │   ├── pharmacy/
│   │   └── fixed-assets/
│   ├── (hr)/
│   │   ├── payroll/
│   │   └── doctor-payout/
│   ├── (analytics)/
│   │   ├── bi/
│   │   └── executive/
│   └── (platform)/
│       ├── audit/
│       ├── notifications/
│       ├── settings/
│       └── admin/
```

## 14.3 Shared State Architecture (Zustand)

```typescript
// Global app store — shared context across all modules
interface AppStore {
  // Session
  user: User;
  tenant: Tenant;
  activeBranch: Branch;
  activeFiscalYear: FiscalYear;

  // Navigation context
  navigationContext: {
    from: string;               // which module navigated from
    entityType: string;
    entityId: string;
    filters: Record<string, unknown>;
  };

  // Notification state
  unreadCount: number;
  notifications: Notification[];

  // AI panel state
  aiPanelOpen: boolean;
  aiContext: AIEntityContext | null;

  // Global search
  searchOpen: boolean;
  searchQuery: string;
  searchResults: SearchResult[];

  // Workflow queue
  pendingApprovals: WorkflowTask[];

  // Real-time
  wsConnected: boolean;
  lastEventTimestamp: string;
}
```

## 14.4 Universal Data Grid Pattern

Every module's list page uses the same composable grid:

```typescript
interface FinOSGridConfig<T> {
  columns:       ColumnDef<T>[];
  filterConfig:  FilterConfig[];
  actions:       GridAction[];
  bulkActions:   BulkAction[];
  exportFormats: ('csv' | 'xlsx' | 'pdf')[];
  drawerTabs:    DrawerTabConfig[];
  aiEnabled:     boolean;
  workflowEnabled: boolean;
  auditEnabled:  boolean;
}
// Used across: JVL, AR, AP, Billing, Claims, PO, GRN, Payroll, Inventory
```

---

# 15. BACKEND ARCHITECTURE

## 15.1 Tech Stack

| Concern | Technology |
|---|---|
| Runtime | Node.js 20 LTS |
| Framework | Fastify (preferred) or Express |
| ORM | Prisma (type-safe) |
| Primary DB | PostgreSQL 16 |
| Cache | Redis 7 (sessions, cache, pubsub) |
| Search | Elasticsearch 8 |
| OLAP | ClickHouse |
| Time-series | TimescaleDB extension on Postgres |
| Message Bus | Apache Kafka (or NATS for lighter deployments) |
| File Storage | MinIO / AWS S3 |
| Job Queue | BullMQ (Redis-backed) |
| AI/ML | Python FastAPI microservice (PyTorch / scikit-learn) |
| LLM | Anthropic Claude API / OpenAI |

## 15.2 Service Structure

```
backend/
├── gateway/                    # API Gateway (rate limit, auth, routing)
├── services/
│   ├── finance/                # GL, COA, JV, trial balance
│   ├── billing/                # Patient invoices, payments, packages
│   ├── ar/                     # Receivables, aging, collections
│   ├── ap/                     # Payables, vendor invoices
│   ├── insurance/              # Claims, TPA, preauth
│   ├── procurement/            # PO, GRN, vendor contracts
│   ├── inventory/              # Stock, pharmacy, consumables
│   ├── payroll/                # Salary, TDS, PF, doctor payout
│   ├── fixed-assets/           # Assets, depreciation, disposal
│   ├── treasury/               # Bank, reconciliation, forex
│   ├── taxation/               # GST, TDS returns
│   └── master-data/            # Patient, vendor, doctor, COA
├── shared/
│   ├── accounting-engine/      # FPE — the transaction authority
│   ├── workflow-engine/        # State machine orchestrator
│   ├── audit-engine/           # Immutable event logger
│   ├── notification-engine/    # Multi-channel notification dispatcher
│   ├── permission-engine/      # RBAC + ABAC evaluator
│   ├── search-engine/          # Elasticsearch indexer + query
│   ├── ai-engine/              # Python FastAPI bridge + context store
│   ├── event-bus/              # Kafka producer/consumer wrappers
│   └── analytics-engine/       # ClickHouse query layer
```

## 15.3 API Standards

All REST APIs follow:
```
GET    /api/v1/{module}/{resource}          # List (paginated)
GET    /api/v1/{module}/{resource}/:id      # Single record
POST   /api/v1/{module}/{resource}          # Create
PATCH  /api/v1/{module}/{resource}/:id      # Partial update
DELETE /api/v1/{module}/{resource}/:id      # Soft delete (is_active=false)
POST   /api/v1/{module}/{resource}/:id/actions/{action}  # State transitions

Response envelope:
{
  success: boolean,
  data: T | T[],
  meta: { total, page, per_page, has_next },
  errors?: ValidationError[],
  trace_id: string            // correlates to audit events
}
```

---

# 16. API GATEWAY & INTEGRATION LAYER

## 16.1 External Integration Map

| External System | Integration Type | Trigger | Data Flow |
|---|---|---|---|
| **HIS / EMR** | REST webhook | Admission, discharge, service order | → Billing auto-draft |
| **LIS (Lab)** | HL7 FHIR | Lab result posted | → Lab billing trigger |
| **RIS/PACS** | HL7 FHIR | Radiology study completed | → Radiology billing trigger |
| **Payment Gateway** | REST callback | Payment captured | → FPE posts receipt |
| **Bank (API banking)** | ISO 20022 | Statement import, payment initiation | → Treasury + FPE |
| **GST Portal** | Govt API | Return filing, GSTR-2A reconciliation | → Taxation module |
| **TDS (TRACES)** | Govt API | TDS return filing | → Payroll taxation |
| **Insurance Portal** | REST / FHIR | Claim submission, settlement | → Insurance module |
| **HRMS** | REST | Attendance, leave | → Payroll |
| **UPI/NACH** | API | Bulk payment, collections | → Treasury + AR |

## 16.2 Webhook Ingestion Pattern

```
External System → POST /api/v1/webhooks/{source}
      │
      ▼
Webhook Gateway:
  1. Verify signature (HMAC-SHA256)
  2. Validate schema (Zod)
  3. Persist raw payload (idempotency key)
  4. Publish to Kafka: webhooks.{source}.received
      │
      ▼
Domain Service Consumer:
  1. Map external schema → internal schema
  2. Apply business rules
  3. Call relevant service (Billing, AR, etc.)
  4. Publish domain event
```

---

# 17. REAL-TIME SYNCHRONIZATION STRATEGY

## 17.1 WebSocket Architecture

```
Browser ←── WebSocket ──► WS Gateway (per tenant channel)
                               │
                               ▼
                          Redis Pub/Sub
                               ▲
                               │
                     Kafka Consumer (all events)
                     → filters by tenant_id
                     → publishes to Redis channel: ws:{tenant_id}:{branch_id}
```

## 17.2 Frontend Real-time Hook

```typescript
// Every module subscribes to relevant events
const useFinOSRealtime = (subscriptions: EventSubscription[]) => {
  useEffect(() => {
    const ws = new WebSocket(`wss://api.finos.io/ws?token=${token}`);
    ws.onmessage = (msg) => {
      const event = JSON.parse(msg.data) as FinOSEvent;
      // Route to matching subscription handlers
      subscriptions
        .filter(s => s.event_type === event.event_type)
        .forEach(s => s.handler(event));
    };
    return () => ws.close();
  }, []);
};

// Usage in AR module:
useFinOSRealtime([
  { event_type: 'PaymentReceived', handler: () => queryClient.invalidateQueries(['ar']) },
  { event_type: 'ClaimSettled',    handler: () => queryClient.invalidateQueries(['ar','claims']) },
  { event_type: 'AnomalyDetected', handler: (e) => showAIAlert(e.payload) },
]);
```

---

# 18. MOBILE ARCHITECTURE

## 18.1 Strategy

React Native (Expo) PWA-first approach with selective native capabilities.

**Mobile-first workflows:**
- Approval queue (approve/reject with biometric auth)
- Collection follow-up (call, note, update status)
- Cash collection entry
- Dashboard and KPIs
- Notification center
- AI alerts and insights

**Mobile-specific features:**
- Biometric authentication for approvals
- Camera → document upload (invoices, GRN photos)
- Offline queue for collection updates (sync on reconnect)
- Push notifications for all critical alerts

## 18.2 Context Continuity

Desktop-Mobile handoff is seamless:
- Filter state persists via URL + server-side session
- Notification links open the exact record regardless of device
- Workflow tasks opened on mobile continue on desktop with full context

---

# 19. UNIFIED TIMELINE ARCHITECTURE

## 19.1 Financial Timeline Component

A reusable `<FinancialTimeline>` component available in every entity's drawer.

```typescript
interface TimelineEvent {
  id:           string;
  timestamp:    string;
  event_type:   string;
  actor:        { name: string; role: string; avatar?: string };
  title:        string;
  description:  string;
  state_from?:  string;
  state_to?:    string;
  financial?:   { dr?: number; cr?: number; account?: string };
  linked_entities: LinkedEntity[];
  is_system:    boolean;
  is_reversible: boolean;
  icon:         string;
  color:        string;
}
```

## 19.2 Patient Financial Timeline Example

```
Admission (HIS) ──────────────────────────────────────── Day 1
   │
   ├─ Services ordered (ICU, pharmacy, procedures)
   │
Pharmacy Dispense ────────────────────────────────────── Day 1-5
   │ → Inventory reduced, pharmacy COGS posted
   │
OT Procedure ────────────────────────────────────────── Day 3
   │ → OT billing line created
   │
Pre-Authorization Approved ──────────────────────────── Day 2
   │ → TPA approved ₹80,000
   │
Invoice Drafted ─────────────────────────────────────── Day 5
   │ → All services consolidated
   │
Invoice Finalized ───────────────────────────────────── Day 5
   │ → GL: DR AR-Patient, CR Revenue, CR GST
   │ → AR record created
   │
Insurance Claim Submitted ───────────────────────────── Day 5
   │ → TPA portal API call
   │ → GL: DR AR-Insurance, CR AR-Patient
   │
Claim Approved ──────────────────────────────────────── Day 8
   │ → TPA approved ₹78,500
   │
Claim Settled (Bank Receipt) ────────────────────────── Day 12
   │ → GL: DR Bank, CR AR-Insurance
   │ → Bank reconciliation updated
   │
Balance Collected from Patient ──────────────────────── Day 12
   │ → GL: DR Cash, CR AR-Patient
   │
AR Closed ───────────────────────────────────────────── Day 12
   └─ Full trace available. Zero leakage. All GL balanced.
```

---

# 20. CROSS-MODULE INTEGRATION MAP

## 20.1 Master Dependency Graph

```
                    [Master Data Service]
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    [Patient]         [Vendor]          [Doctor]
         │                 │                 │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │Billing  │       │   AP    │       │ Doctor  │
    │Service  │       │ Service │       │ Payout  │
    └────┬────┘       └────┬────┘       └────┬────┘
         │                 │                 │
    ┌────▼────┐       ┌────▼────┐            │
    │Insurance│       │Procure  │            │
    │Service  │       │Service  │            │
    └────┬────┘       └────┬────┘            │
         │                 │                 │
         └────────┬─────────┘                │
                  │                          │
         ┌────────▼──────────────────────────▼────┐
         │        Financial Posting Engine         │
         │   (Single authority for all GL writes)  │
         └────────┬────────────────────────────────┘
                  │
         ┌────────▼────────┐
         │   GL / COA      │
         │   Journal Entries│
         └────────┬────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
┌───▼───┐   ┌────▼────┐   ┌────▼────┐
│  AR   │   │  AP     │   │ Treasury│
│ Aging │   │ Aging   │   │ Cash Book│
└───┬───┘   └────┬────┘   └────┬────┘
    │             │             │
    └─────────────┴─────────────┘
                  │
         ┌────────▼────────┐
         │  Analytics /    │
         │  Reporting /    │
         │  BI Dashboard   │
         └─────────────────┘
```

## 20.2 Event Flow: Vendor Invoice → End State

```
Vendor delivers goods
    │
GRN created (Procurement)
    │
    ├─ Inventory quantities updated
    ├─ GRNPosted event published
    │
Vendor Invoice received (AP)
    │
    ├─ 3-way match: PO ↔ GRN ↔ Invoice
    ├─ Mismatch → GRNVarianceDetected event → Finance alerted
    ├─ Match → Approval workflow initiated
    │
L1 Approval (Department Head)
    │
L2 Approval if > threshold (Finance Head)
    │
VendorInvoiceApproved event published
    │
FPE.postVendorInvoice()
    ├─ DR Expense/Inventory
    ├─ CR AP-Vendor
    ├─ DR Input GST (CGST/SGST)
    ├─ Update vendor AP aging
    ├─ Update budget consumption
    ├─ Update cash flow forecast
    │
Payment Scheduling (Treasury)
    │
Payment made (Bank transfer / NEFT)
    │
FPE.postVendorPayment()
    ├─ DR AP-Vendor
    ├─ CR Bank (if TDS: CR TDS Payable, DR AP for TDS amount)
    │
Bank Statement Import (Treasury)
    │
Bank Reconciliation matched
    │
ReconciliationCompleted event
    └─ Full cycle complete. AP zero. Expense posted. Cash reduced. Trail complete.
```

---

# 21. SUGGESTED FOLDER ARCHITECTURE

```
finos/
├── apps/
│   ├── web/                            # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   └── (shell)/
│   │   │       ├── layout.tsx
│   │   │       ├── dashboard/
│   │   │       ├── gl/
│   │   │       ├── ar/
│   │   │       ├── ap/
│   │   │       ├── billing/
│   │   │       ├── insurance/
│   │   │       ├── procurement/
│   │   │       ├── inventory/
│   │   │       ├── payroll/
│   │   │       ├── treasury/
│   │   │       ├── taxation/
│   │   │       ├── fixed-assets/
│   │   │       ├── analytics/
│   │   │       ├── audit/
│   │   │       └── admin/
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn/ui base components
│   │   │   ├── shared/                 # FinOS-specific shared components
│   │   │   │   ├── FinOSGrid/
│   │   │   │   ├── FinOSDrawer/
│   │   │   │   ├── WorkflowStatusBar/
│   │   │   │   ├── AIPanelRight/
│   │   │   │   ├── FinancialTimeline/
│   │   │   │   ├── GlobalSearch/
│   │   │   │   ├── NotificationCenter/
│   │   │   │   ├── KPICard/
│   │   │   │   ├── ModuleHeader/
│   │   │   │   └── AmountDisplay/
│   │   │   └── charts/                 # Recharts wrappers
│   │   ├── hooks/
│   │   │   ├── useFinOSRealtime.ts
│   │   │   ├── useWorkflow.ts
│   │   │   ├── useAuditTrail.ts
│   │   │   ├── useAIContext.ts
│   │   │   ├── usePermission.ts
│   │   │   └── useGlobalSearch.ts
│   │   ├── stores/
│   │   │   ├── appStore.ts             # Global Zustand store
│   │   │   ├── workflowStore.ts
│   │   │   └── notificationStore.ts
│   │   └── lib/
│   │       ├── api.ts                  # Axios instance + interceptors
│   │       ├── queryKeys.ts            # TanStack Query key factory
│   │       ├── formatters.ts           # Currency, date, number formatters
│   │       └── permissions.ts          # Client-side permission helpers
│   │
│   └── mobile/                         # React Native (Expo)
│
├── services/
│   ├── gateway/                        # API Gateway (Fastify)
│   ├── finance/
│   ├── billing/
│   ├── ar/
│   ├── ap/
│   ├── insurance/
│   ├── procurement/
│   ├── inventory/
│   ├── payroll/
│   ├── fixed-assets/
│   ├── treasury/
│   ├── taxation/
│   └── master-data/
│
├── shared/
│   ├── accounting-engine/
│   │   ├── index.ts
│   │   ├── doubleEntry.ts
│   │   ├── postingTemplates.ts
│   │   ├── journal.ts
│   │   └── ledger.ts
│   ├── workflow-engine/
│   │   ├── index.ts
│   │   ├── stateMachine.ts
│   │   ├── slaTracker.ts
│   │   ├── escalationRules.ts
│   │   └── workflowDefinitions/
│   ├── audit-engine/
│   ├── notification-engine/
│   ├── permission-engine/
│   ├── search-engine/
│   ├── event-bus/
│   │   ├── producer.ts
│   │   ├── consumer.ts
│   │   └── topics.ts
│   └── ai-engine/
│       ├── bridge.ts                   # Calls Python AI FastAPI
│       └── contextStore.ts
│
├── ai/                                 # Python FastAPI AI service
│   ├── models/
│   ├── features/
│   ├── api/
│   └── training/
│
├── infra/
│   ├── docker/
│   ├── kubernetes/
│   ├── terraform/
│   └── monitoring/
│
└── packages/                           # Shared TypeScript types/utils
    ├── types/                          # Shared interfaces
    ├── validators/                     # Zod schemas
    └── constants/                      # Shared enums, codes
```

---

# 22. SHARED STATE MODELS

## 22.1 Core TypeScript Interfaces

```typescript
// shared/types/core.ts

export interface FinancialEntity {
  id:           string;
  ref_number:   string;
  branch_id:    string;
  fiscal_year:  string;
  status:       WorkflowStatus;
  created_by:   string;
  created_at:   string;
  updated_at:   string;
  workflow?:    WorkflowState;
  audit_trail?: AuditEvent[];
  ai_context?:  AIEntityContext;
}

export type WorkflowStatus =
  | 'draft' | 'submitted' | 'under_review' | 'approved'
  | 'rejected' | 'posted' | 'reconciled' | 'closed' | 'archived'
  | 'escalated' | 'on_hold' | 'void';

export interface WorkflowState {
  workflow_id:      string;
  definition_name:  string;
  current_state:    WorkflowStatus;
  current_assignee: string;
  sla_deadline:     string;
  sla_breached:     boolean;
  transitions:      WorkflowTransition[];
  can_approve:      boolean;
  can_reject:       boolean;
}

export interface MoneyAmount {
  amount:   number;
  currency: string;    // ISO 4217
  formatted: string;   // '₹1,23,456.00'
}

export interface PostingReference {
  journal_entry_id:  string;
  entry_number:      string;
  posted_at:         string;
  total_debit:       number;
  total_credit:      number;
  lines:             JournalLine[];
}
```

---

# 23. SHARED COMPONENT LIBRARY

## 23.1 Core Shared Components

### `<FinOSGrid<T>>` — Universal Data Grid
```typescript
Props: {
  data:          T[];
  columns:       ColumnDef<T>[];
  filters:       FilterConfig[];
  actions:       RowAction[];
  bulkActions:   BulkAction[];
  onRowClick:    (row: T) => void;
  drawerContent: (row: T) => ReactNode;
  aiEnabled?:    boolean;
  loading?:      boolean;
  totalCount?:   number;
}
```

### `<WorkflowStatusBar>` — Universal Workflow Visual
```typescript
// Renders the state machine visually with current position highlighted
// Used in every module that has workflow
Props: {
  definition:   WorkflowDefinition;
  currentState: WorkflowStatus;
  transitions:  WorkflowTransition[];
  canTransition: boolean;
  onTransition: (action: string) => void;
}
```

### `<FinancialTimeline>` — Universal Audit Trail
```typescript
Props: {
  entityType: string;
  entityId:   string;
  compact?:   boolean;   // for drawer vs. full page
}
// Fetches from GET /audit/timeline/:type/:id
// Renders clickable linked entities
```

### `<AIPanelRight>` — Universal AI Context Panel
```typescript
Props: {
  entityType:    string;
  entityId:      string;
  moduleContext: string;
}
// Shows: risk score, anomalies, predictions, insights
// Collapsible, persists state across navigation
```

### `<KPICard>` — Universal KPI Display
```typescript
Props: {
  label:        string;
  value:        number | string;
  format:       'currency' | 'number' | 'percent' | 'days';
  trend?:       { direction: 'up'|'down'|'flat'; percent: number };
  color?:       string;
  drilldown?:   () => void;
  loading?:     boolean;
}
```

### `<GlobalSearch>` — Command Palette (⌘K)
```typescript
// Opens on Cmd+K / Ctrl+K
// Searches across all modules
// Supports natural language
// Deep links to exact record
// Context-aware (shows relevant results based on current module)
```

---

# 24. CROSS-MODULE NAVIGATION PATTERNS

## 24.1 Deep Linking Standard

Every entity in every module has a stable, bookmarkable URL:

```
/gl/journals/:id
/ar/:id
/ar/invoices/:id
/ap/vendor-invoices/:id
/billing/invoices/:id
/billing/invoices/new
/insurance/claims/:id
/procurement/purchase-orders/:id
/payroll/runs/:id
/treasury/reconciliation/:id
```

## 24.2 Context-Preserving Navigation

When navigating from Module A to Module B via a linked entity:

```typescript
// Navigation with context
router.push(`/gl/journals/${jvId}`, {
  state: {
    from: 'ar/invoices',
    from_id: invoiceId,
    breadcrumb: ['AR', 'Invoice INV-2026-001234', 'Journal Entry'],
    returnUrl: `/ar/invoices/${invoiceId}`
  }
});

// Target page reads context:
const { from, breadcrumb, returnUrl } = useNavigationContext();
// Renders: AR > Invoice INV-2026-001234 > Journal Entry JV-2026-000891
//          [← Back to Invoice]
```

## 24.3 Universal Sidebar Navigation

```
FINANCE
  ├── General Ledger
  │    ├── Chart of Accounts
  │    ├── Journal Vouchers
  │    ├── Ledger
  │    └── Trial Balance / Reports
  ├── Accounts Receivable       [badge: overdue count]
  │    ├── AR Dashboard
  │    ├── AR Aging
  │    └── Collections
  └── Accounts Payable          [badge: pending approval count]
       ├── AP Dashboard
       ├── Vendor Invoices
       └── Payment Schedule

REVENUE
  ├── Patient Billing            [badge: pending finalization]
  │    ├── Billing Dashboard
  │    ├── New Invoice
  │    └── Invoice List
  └── Insurance / TPA            [badge: pending claims]
       ├── Claims Dashboard
       └── TPA Management

OPERATIONS
  ├── Procurement                [badge: PO approvals pending]
  │    ├── Purchase Orders
  │    └── GRN
  ├── Inventory
  └── Fixed Assets

HR & PAYROLL
  ├── Payroll
  └── Doctor Revenue Sharing

TREASURY
  ├── Cash Book
  ├── Bank Reconciliation
  └── Cash Flow Forecast

COMPLIANCE
  ├── Taxation (GST / TDS)
  └── Regulatory Reports

INTELLIGENCE
  ├── BI Analytics
  ├── Executive Dashboard
  └── Revenue Leakage Engine

PLATFORM
  ├── Audit Center               [badge: flagged events]
  ├── Notification Center        [badge: unread count]
  ├── Workflow Engine
  └── Administration
```

---

# 25. PERFORMANCE & SCALABILITY STRATEGY

## 25.1 Database Performance

| Strategy | Implementation |
|---|---|
| **Read replicas** | 2+ read replicas for GL queries, analytics, reports |
| **Partitioning** | `journal_entries` partitioned by `fiscal_year_id` |
| **Indexing** | Compound indexes on (tenant_id, branch_id, status, created_at) for all tables |
| **CQRS** | Write to Postgres, read complex queries from ClickHouse |
| **Connection pooling** | PgBouncer (max 10k connections pooled) |
| **Query budget** | All list queries must return < 100ms at P95 |

## 25.2 Caching Strategy

```
L1: In-process cache (1s TTL) — hot paths (COA, user permissions)
L2: Redis (5min TTL)          — master data, session, workflow definitions
L3: ClickHouse                — pre-aggregated analytics (refreshed every 5min)
L4: CDN                       — static assets, API response caching for public data
```

## 25.3 Horizontal Scaling

- All services are stateless → horizontal scale with Kubernetes HPA
- WebSocket connections use Redis Pub/Sub → any WS node can serve any client
- Job queues (BullMQ) allow worker scaling independent of API
- Kafka partitioned by `tenant_id` → parallel processing per tenant

## 25.4 Performance Targets

| Metric | Target |
|---|---|
| API P95 latency (list) | < 150ms |
| API P95 latency (post transaction) | < 300ms |
| GL posting throughput | 5,000 transactions/min |
| Dashboard load (cold) | < 2 seconds |
| Dashboard load (warm) | < 500ms |
| Search results | < 200ms |
| Real-time event delivery | < 500ms end-to-end |
| Concurrent users per tenant | 2,000+ |
| Data retention | 10 years (audit-grade) |

---

# 26. MULTI-TENANT ENTERPRISE DEPLOYMENT

## 26.1 Tenancy Model

**Recommended: Database-per-tenant (isolated)**
- Each hospital group gets a separate database schema
- Shared application services
- Tenant routing at API Gateway layer via subdomain: `apollo.finos.io`, `manipal.finos.io`

**Alternative for smaller tenants: Schema-per-tenant within shared cluster**

## 26.2 Tenant Configuration

Each tenant configures:
- Chart of Accounts template (NABH-standard or custom)
- GST registration (GSTIN per branch)
- Workflow approval limits (configurable, not hardcoded)
- Posting templates (configurable without code changes)
- Notification rules
- Integration endpoints (HIS, LIS, bank APIs)
- Fiscal year structure (April–March, Jan–Dec, custom)

## 26.3 Multi-Branch Architecture

```
Tenant: Apollo Healthcare Group
    ├── Branch: Apollo Delhi        (branch_id: BRN001)
    ├── Branch: Apollo Mumbai       (branch_id: BRN002)
    ├── Branch: Apollo Chennai      (branch_id: BRN003)
    └── Branch: Apollo Lab Network  (branch_id: BRN004)

Consolidated view available to group_cfo:
  - Consolidated Trial Balance
  - Consolidated P&L
  - Inter-branch reconciliation
  - Branch vs. branch benchmarking
  - Group cash position
```

---

# 27. DISASTER RECOVERY ARCHITECTURE

| Component | Strategy | RPO | RTO |
|---|---|---|---|
| Primary DB (Postgres) | Streaming replication to standby | < 1 min | < 5 min |
| Kafka | Multi-broker, replicated topics | 0 (log) | < 2 min |
| Redis | Redis Sentinel / Cluster | < 5 min | < 1 min |
| File storage (S3/MinIO) | Cross-region replication | < 1 min | < 5 min |
| Application services | Kubernetes multi-AZ deployment | 0 | < 30 sec |
| Audit log (Elasticsearch) | Cross-cluster replication | 0 | < 5 min |
| Full DR failover | Automated via Kubernetes + Terraform | — | < 15 min |

**Backup schedule:**
- Continuous WAL archiving to S3
- Daily full backup retained 90 days
- Monthly backup retained 7 years (audit compliance)

**Key principle:** The audit engine writes to an append-only store that is replicated to a separate immutable storage (WORM) for compliance. Even a full DR event cannot alter historical audit records.

---

# 28. END-TO-END FINANCIAL LIFECYCLE DIAGRAMS

## 28.1 Patient Revenue Lifecycle

```
ADMISSION
  └─ HIS webhook → BillingService.createEncounter()
  └─ Patient financial context initialized

CLINICAL (Ongoing)
  └─ Services ordered → service_catalog lookup → billing line drafted
  └─ Pharmacy dispense → pharmacy.issue() → COGS posted
  └─ Lab results → lab_billing.post() → billing line added
  └─ OT procedure → ot_billing.post() → billing line added

PRE-DISCHARGE
  └─ Insurance preauth verified (if applicable)
  └─ Package reconciliation (included vs. additional)
  └─ Discount authorization (if > threshold, needs approval)

INVOICE FINALIZATION
  └─ Invoice reviewed → finalized
  └─ FPE.postVendorInvoice() [SALES JV]:
       DR AR-Patient        ← net patient responsibility
       DR AR-Insurance      ← TPA responsibility
       CR Revenue-Dept      ← by department
       CR Output GST        ← CGST + SGST
  └─ InvoiceFinalized event → AR created, AI leakage check, dashboard update

PAYMENT / CLAIM
  ├─ Insurance path:
  │    └─ ClaimService.submit() → TPA API
  │    └─ On settlement: FPE → DR Bank, CR AR-Insurance
  │    └─ Shortfall collected from patient
  └─ Self-pay path:
       └─ PaymentReceived → FPE → DR Cash/Bank, CR AR-Patient

CLOSE
  └─ AR-Patient = 0, AR-Insurance = 0
  └─ Revenue fully realized
  └─ Bank reconciliation picks up receipt
  └─ Full audit trail complete
```

## 28.2 Vendor Payment Lifecycle

```
PROCUREMENT
  └─ Purchase Requisition → Budget check → PO raised → Approved
  └─ Commitment posted to budget engine

RECEIPT
  └─ GRN created → Inventory updated → 3-way match run
  └─ FPE: DR Inventory/Expense (GRN accrual), CR AP-Accrual

INVOICE
  └─ Vendor invoice received → Matched to PO + GRN
  └─ FPE: DR AP-Accrual, CR AP-Vendor + Input GST
  └─ Approval workflow → Posted

PAYMENT
  └─ Payment scheduled (treasury) → Cash flow forecast updated
  └─ NEFT/RTGS initiated → Bank confirmation
  └─ FPE: DR AP-Vendor (net of TDS), DR TDS Payable → CR Bank
  └─ Bank reconciliation auto-matches

TDS COMPLIANCE
  └─ TDS Payable accumulated → TDS challan generated monthly
  └─ FPE: DR TDS Payable → CR Bank (govt payment)
  └─ Form 26Q / 16A generated
```

---

# 29. WORKFLOW ORCHESTRATION DIAGRAMS

## 29.1 Vendor Invoice Approval (Configurable Thresholds)

```
                       [Invoice Received]
                              │
                    ┌─────────▼─────────┐
                    │   3-Way Match     │
                    │  PO ↔ GRN ↔ INV  │
                    └─────────┬─────────┘
                    ┌─────────┴─────────┐
               MATCH│                   │MISMATCH
                    │                   ▼
                    │         [Variance Resolution]
                    │         ← Finance + Procurement
                    │
           ┌────────▼────────┐
           │  Amount Check   │
           └────────┬────────┘
         ≤50K│          │>50K
             │          │
    ┌────────▼──┐  ┌────▼────────────┐
    │ Dept Head │  │  Finance Head   │
    │  Approve  │  │    Approve      │
    └────┬──────┘  └────┬────────────┘
         │              │>5L → CFO Approve
    APPROVE│              │
             └─────┬──────┘
                   │
          ┌────────▼────────┐
          │  FPE Post AP    │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Payment Queue   │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  Bank Transfer  │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Recon Matched   │
          └─────────────────┘
```

## 29.2 Insurance Claim Lifecycle

```
[Invoice Finalized]
       │
[Pre-Auth Verified?]──No──► [Submit Pre-Auth] ──► [TPA Approval]
       │Yes                                               │
       └───────────────────────────────────────────────►┘
                                                         │
                                               [Claim Submitted]
                                                         │
                                               ┌─────────┴─────────┐
                                          APPROVED           REJECTED/QUERY
                                               │                    │
                                    [FPE: DR Bank]         [Rework Workflow]
                                    [CR AR-Insurance]       ← Billing edits
                                               │            → Resubmit
                                    [AR Closed]
                                               │
                                    [Patient Balance]
                                    [Collection if any]
```

---

# 30. IMPLEMENTATION ROADMAP

## Phase 1 — Foundation (Months 1–3)
**Goal: Core accounting engine + billing + AR working end-to-end**

- [ ] Shared accounting engine (FPE) — hardened, tested
- [ ] Chart of Accounts + Fiscal Year management
- [ ] Journal Voucher (manual entry + auto-posting)
- [ ] General Ledger + Trial Balance
- [ ] Patient Billing — invoice create/finalize/collect
- [ ] AR module — aging, dashboard
- [ ] Audit engine — append-only, hash-chained
- [ ] Auth + RBAC permission engine
- [ ] Event bus setup (Kafka / NATS)
- [ ] Real-time WebSocket foundation

## Phase 2 — AP + Insurance + Treasury (Months 4–5)
**Goal: Complete the payment cycle**

- [ ] **AP service** — vendor invoices, 3-way match, payment posting (CRITICAL gap to close first)
- [ ] Workflow engine — approval routing, SLA, escalation
- [ ] Insurance / TPA — claim submission, settlement posting
- [ ] Treasury — cash book, bank reconciliation, cash flow forecast
- [ ] Notification engine — in-app + email
- [ ] Global search (Elasticsearch)
- [ ] Taxation — GST computation, GSTR-1/3B

## Phase 3 — Operations + Payroll (Months 6–8)
**Goal: Full operational coverage**

- [ ] Procurement — PR, PO, GRN, vendor contracts
- [ ] Inventory — stock management, pharmacy, consumables
- [ ] Payroll — salary, PF, ESI, TDS, disbursement
- [ ] Doctor revenue sharing — calculation, approval, payout
- [ ] Fixed assets — acquisition, depreciation, disposal
- [ ] Budgeting — budget creation, consumption tracking, variance alerts
- [ ] Mobile app — approval queue, dashboards, notifications

## Phase 4 — Intelligence + Analytics (Months 9–11)
**Goal: AI-native and BI-powered**

- [ ] AI engine — anomaly detection, revenue leakage, claim denial prediction
- [ ] Cash flow forecasting (LSTM model)
- [ ] Fraud detection (graph-based)
- [ ] BI Analytics — ClickHouse + executive dashboards
- [ ] Revenue leakage engine
- [ ] Natural language search + Q&A
- [ ] Compliance reporting automation

## Phase 5 — Enterprise Scale (Months 12+)
**Goal: Multi-tenant, multi-branch, enterprise-grade**

- [ ] Multi-tenant architecture hardening
- [ ] Consolidated group reporting (multi-branch P&L, balance sheet)
- [ ] External integrations — HIS, LIS, PACS, payment gateways, banks
- [ ] NABH / HIPAA compliance audit
- [ ] Performance optimization (ClickHouse, read replicas, CDN)
- [ ] Disaster recovery drills + SLA certification
- [ ] White-label + partner deployment model

---

## APPENDIX: KEY DESIGN DECISIONS

| Decision | Choice | Rationale |
|---|---|---|
| Primary DB | PostgreSQL | ACID, mature, Sequelize/Prisma support, JSON support |
| Event bus | Kafka (NATS for <50 node) | Durable, replayable, ordered within partition |
| Analytics | ClickHouse | 10-100x faster than Postgres for aggregations |
| AI LLM | Claude API (Anthropic) | Superior reasoning for financial narrative + audit |
| Frontend | Next.js 14 App Router | SSR, streaming, layouts, built-in auth |
| Component lib | shadcn/ui | Accessible, unstyled, composable with Tailwind |
| ORM | Prisma | Type safety, migration management, introspection |
| Auth | NextAuth v5 | OIDC, session management, multi-provider |
| GL write strategy | FPE-only (no direct DB writes) | Single source of truth, enforces DR=CR |
| Audit strategy | Append-only + hash chain | Tamper detection, compliance grade |
| Workflow | Configuration-driven | No-code workflow changes without deployment |
| Master data | Single service, FK references | No duplication, single source of truth |
| Mobile | React Native (Expo) + PWA | Single codebase, near-native performance |
| Multi-tenancy | DB-per-tenant | Strongest data isolation, regulatory compliance |

---

*Healthcare FinOS Enterprise Architecture v1.0*
*Built for hospitals that need the depth of Tally, the intelligence of AI, and the speed of fintech — unified into one operating system.*
