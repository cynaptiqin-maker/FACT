# FACT — Finance Accounting with Complete Transparency
## Financial Operating System (FinOS) for Hospital & Medical College Ecosystems

**Version:** 1.0.0  
**Date:** May 2026  
**Classification:** Engineering Design Document  
**Audience:** Engineering Team, CTO, CFO, Product Management

---

# TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [System Vision](#2-system-vision)
3. [Functional Architecture](#3-functional-architecture)
4. [Technical Architecture](#4-technical-architecture)
5. [Database Design](#5-database-design)
6. [Service-by-Service Breakdown](#6-service-by-service-breakdown)
7. [API Specifications](#7-api-specifications)
8. [Workflow Diagrams](#8-workflow-diagrams)
9. [Financial Posting Engine](#9-financial-posting-engine)
10. [Security Architecture](#10-security-architecture)
11. [AI Architecture](#11-ai-architecture)
12. [DevOps Architecture](#12-devops-architecture)
13. [Deployment Strategy](#13-deployment-strategy)
14. [Scalability Plan](#14-scalability-plan)
15. [UI/UX Strategy](#15-uiux-strategy)
16. [Reporting Architecture](#16-reporting-architecture)
17. [Compliance Strategy](#17-compliance-strategy)
18. [Development Phases](#18-development-phases)
19. [Team Structure](#19-team-structure)
20. [Estimated Timeline](#20-estimated-timeline)
21. [Risks & Mitigation](#21-risks--mitigation)
22. [Future Expansion](#22-future-expansion)

---

## 1. EXECUTIVE SUMMARY

FACT (Finance Accounting with Complete Transparency) is an enterprise-grade Financial Operating System purpose-built for secondary and tertiary care hospitals and medical college ecosystems. It replaces fragmented legacy accounting tools (Tally, manual spreadsheets, siloed billing systems) with a unified, real-time, AI-augmented financial platform.

### Core Value Proposition

| Dimension | Legacy Systems | FACT |
|---|---|---|
| Architecture | Monolithic, desktop-bound | Cloud-native, API-first, modular |
| Accounting | Single-entity, manual | Multi-entity, multi-branch, auto-posting |
| Visibility | End-of-day batch | Real-time ledger posting |
| Hospital Finance | None or basic | Deep OP/IP/ICU/OT/TPA workflows |
| AI | None | NLP queries, fraud detection, OCR |
| Mobile | Limited | Mobile-first approval workflows |
| Compliance | Manual filing | GST/TDS automated with e-invoice |
| Audit | Log files | Immutable blockchain-style audit trail |
| Scalability | Single hospital | Multi-hospital chain, multi-company |

### What FACT Replaces / Integrates With

- **Replaces:** TallyPrime, manual billing ledgers, spreadsheet payroll, paper-based TPA reconciliation
- **Integrates with:** Hospital Information System (HIS), ABDM (Ayushman Bharat Digital Mission), GST Portal, PFMS, banking APIs, insurance TPA portals

---

## 2. SYSTEM VISION

### Design Philosophy

> "Every rupee that moves through a hospital must be traceable, auditable, and visible to the right person at the right time."

FACT is designed around three pillars:

**1. Financial Integrity**
- Every transaction is double-entry balanced
- No transaction can be deleted — only reversed with a traceable entry
- All events are immutable and replayable

**2. Operational Intelligence**
- Real-time dashboards replace end-of-day batch reports
- AI surfaces anomalies before they become problems
- Natural language interface for non-finance users

**3. Healthcare Awareness**
- The system understands hospital billing cycles (OP/IP/ICU/OT)
- TPA/insurance workflows are first-class citizens
- Doctor revenue sharing is automated and transparent

### Module Philosophy

Every module is:
- **Independent**: can be enabled/disabled without affecting others
- **Event-producing**: publishes domain events consumed by other modules
- **API-complete**: every operation available via REST API
- **Audit-logged**: every state change is recorded immutably
- **Permission-gated**: every endpoint is RBAC+ABAC protected

---

## 3. FUNCTIONAL ARCHITECTURE

### 3.1 Module Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FACT FinOS Platform                          │
├─────────────────────────────────────────────────────────────────────┤
│  FOUNDATION LAYER                                                    │
│  ┌─────────────┐ ┌──────────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ Core Account│ │General Ledger│ │  Fiscal Yr │ │ Chart/Account│  │
│  └─────────────┘ └──────────────┘ └────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  REVENUE LAYER                                                       │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐               │
│  │Patient Billing│ │Insurance/TPA  │ │  AR Module   │               │
│  └──────────────┘ └───────────────┘ └──────────────┘               │
├─────────────────────────────────────────────────────────────────────┤
│  EXPENSE LAYER                                                       │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │
│  │   Payroll  │ │  Procurement │ │  Inventory │ │ Fixed Assets  │  │
│  └────────────┘ └──────────────┘ └────────────┘ └───────────────┘  │
│  ┌────────────┐ ┌──────────────┐                                    │
│  │  Cash/Bank │ │     AP       │                                    │
│  └────────────┘ └──────────────┘                                    │
├─────────────────────────────────────────────────────────────────────┤
│  SPECIALIST LAYER                                                    │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │
│  │Dr. Payout  │ │  Pharmacy Fi │ │  Taxation  │ │  Budgeting    │  │
│  └────────────┘ └──────────────┘ └────────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  INTELLIGENCE LAYER                                                  │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │
│  │ Reporting  │ │  AI Engine   │ │  Workflow  │ │  Compliance   │  │
│  └────────────┘ └──────────────┘ └────────────┘ └───────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER                                                │
│  ┌────────────┐ ┌──────────────┐ ┌────────────┐ ┌───────────────┐  │
│  │   Admin    │ │Notifications │ │  Mobile    │ │  Audit Trail  │  │
│  └────────────┘ └──────────────┘ └────────────┘ └───────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 All 22 Modules

| # | Module | Key Functions | Dependencies |
|---|---|---|---|
| 1 | Core Accounting | Vouchers, CoA, posting engine | None |
| 2 | General Ledger | Trial balance, closing, P&L | Core Accounting |
| 3 | Accounts Receivable | Invoices, aging, collections | Core Accounting |
| 4 | Accounts Payable | Vendor invoices, payments | Core Accounting |
| 5 | Cash & Bank | Bank recon, petty cash | Core Accounting |
| 6 | Patient Billing | OP/IP/ICU/OT billing | Core Accounting, AR |
| 7 | Insurance/TPA | Claims, preauth, settlements | Patient Billing, AR |
| 8 | Inventory Finance | Stock valuation, consumption | Procurement, Core |
| 9 | Pharmacy Finance | Batch accounting, margins | Inventory, Core |
| 10 | Procurement | PO, GRN, vendor invoice | AP, Inventory |
| 11 | Fixed Assets | Register, depreciation, disposal | Core Accounting |
| 12 | Doctor Payout | Revenue sharing, settlements | Payroll, Core |
| 13 | Payroll | Salary, statutory, payslips | Core Accounting |
| 14 | Budgeting | Budget creation, variance | All modules |
| 15 | Taxation | GST, TDS, e-invoice | Core Accounting |
| 16 | Compliance & Audit | Audit trail, controls | All modules |
| 17 | Reporting & BI | Dashboards, standard reports | All modules |
| 18 | Workflow Engine | Approvals, escalations | All modules |
| 19 | Notifications | Email, SMS, push, in-app | Workflow |
| 20 | AI Engine | NLP query, OCR, anomaly | All modules |
| 21 | Mobile | Approval, dashboard, receipts | All modules |
| 22 | Admin Config | Tenant, users, module toggle | None |

### 3.3 Module Activation Matrix

The `tenant_modules` table controls which modules are active per hospital:

```
Hospital A (Full Suite): All 22 modules ON
Hospital B (Clinic):     Modules 1,2,3,4,5,6,13,17,22 ON
Hospital C (New):        Modules 1,2,22 ON (onboarding)
```

Disabling a module:
- Hides UI routes for that module
- Blocks API routes via `moduleGuard` middleware
- Does NOT delete historical data
- Does NOT affect other modules (event consumers skip gracefully)

---

## 4. TECHNICAL ARCHITECTURE

### 4.1 Architecture Pattern: Modular Monolith → Microservices-Ready

FACT starts as a **modular monolith** — a single deployable with clean domain boundaries — designed to extract individual modules into microservices as load demands it.

```
Phase 1-2: Modular Monolith
┌─────────────────────────────────────┐
│           FACT Backend              │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │Module A│ │Module B│ │Module C│  │
│  └────┬───┘ └────┬───┘ └────┬───┘  │
│       └──────────┴──────────┘       │
│           Event Bus (in-process)    │
└─────────────────────────────────────┘

Phase 3-4: Microservices (extract hot modules)
┌───────────┐  ┌───────────┐  ┌──────────────┐
│  Billing  │  │   Claims  │  │  Accounting  │
│  Service  │  │  Service  │  │   Service    │
└─────┬─────┘  └─────┬─────┘  └──────┬───────┘
      └───────────────┴───────────────┘
                RabbitMQ / Kafka
```

### 4.2 Design Patterns Used

| Pattern | Where Applied |
|---|---|
| Domain-Driven Design (DDD) | Module boundaries map to bounded contexts |
| CQRS | Reporting module reads from read-replica/ClickHouse |
| Event Sourcing | All financial transactions stored as immutable events |
| Outbox Pattern | Reliable event publishing (DB write + event in one transaction) |
| Saga Pattern | Multi-step workflows (claim settlement, payroll run) |
| Repository Pattern | Data access abstracted from business logic |
| Factory Pattern | Voucher/invoice number generation |
| Strategy Pattern | Tax calculation, depreciation methods |
| Observer Pattern | Event bus subscriptions |

### 4.3 Tech Stack

#### Backend
| Component | Technology | Why |
|---|---|---|
| Runtime | Node.js 20 LTS | Non-blocking I/O, large ecosystem |
| Framework | Express.js + modular structure | Lightweight, familiar, flexible |
| ORM | Sequelize 6 | PostgreSQL support, migrations, models |
| Database | PostgreSQL 16 | ACID, JSON support, complex queries, partitioning |
| Cache | Redis 7 | Sessions, queues, ledger balance cache |
| Queue | BullMQ (Redis-backed) | Reliable job queues with retries |
| Financial Math | decimal.js | Precision arithmetic (no float errors) |
| Auth | JWT + bcryptjs + speakeasy | Stateless auth + TOTP MFA |
| Validation | Joi | Schema validation on all inputs |
| Logging | Winston + Morgan | Structured logs, request logging |
| File/OCR | Multer + Tesseract.js | Invoice scanning |
| Email | Nodemailer | Notifications |
| PDF | PDFKit | Invoice, report generation |
| Excel | ExcelJS | Report export |
| AI | OpenAI API + LangChain | NLP queries, categorization |

#### Frontend
| Component | Technology | Why |
|---|---|---|
| Framework | React 18 | Component model, concurrent features |
| Build | Vite 5 | Fast HMR, ESM-native |
| Styling | TailwindCSS 3 | Utility-first, consistent design |
| Components | shadcn/ui + Radix UI | Accessible, unstyled primitives |
| State | Zustand | Minimal, no boilerplate |
| Server State | TanStack Query v5 | Caching, background refresh, optimistic updates |
| Routing | React Router v6 | File-system-like routing |
| Forms | React Hook Form + Zod | Performant, type-safe validation |
| Charts | Recharts + D3 | Composable, customizable |
| Tables | TanStack Table | Headless, powerful |
| Notifications | react-hot-toast | Lightweight toasts |
| Icons | lucide-react | Clean, consistent |
| Date | date-fns | Tree-shakeable date utilities |

#### Infrastructure
| Component | Technology |
|---|---|
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (production) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Logging | ELK Stack (Elasticsearch + Logstash + Kibana) |
| Search | PostgreSQL pg_trgm → Elasticsearch at scale |
| Object Storage | MinIO (self-hosted) / AWS S3 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt / Cert-Manager |

### 4.4 Data Flow Architecture

```
Client Request
     │
     ▼
[Nginx/Load Balancer]
     │
     ▼
[Express Server]
     │
     ├──▶ [Auth Middleware] ──▶ JWT verify → user context
     ├──▶ [Tenant Middleware] ──▶ X-Tenant-ID → tenant context
     ├──▶ [Module Guard] ──▶ check tenant_modules table
     ├──▶ [RBAC Middleware] ──▶ user role → permission check
     ├──▶ [ABAC Middleware] ──▶ resource attributes → fine-grained check
     │
     ▼
[Module Controller]
     │
     ▼
[Module Service]
     │
     ├──▶ [Repository / Sequelize] ──▶ [PostgreSQL]
     ├──▶ [Accounting Engine] ──▶ [double-entry posting]
     ├──▶ [Event Bus] ──▶ [publish domain event]
     ├──▶ [Cache Service] ──▶ [Redis]
     └──▶ [Queue] ──▶ [BullMQ Job] ──▶ [Worker]
```

---

## 5. DATABASE DESIGN

### 5.1 Schema Organization

All tables are namespaced by `tenant_id` (UUID). PostgreSQL Row Level Security (RLS) enforces tenant isolation at the database layer.

### 5.2 Core Account Table Hierarchy

```
accounts
├── id (UUID)
├── tenant_id
├── code (e.g., "1001", "1001.01")
├── name
├── type: ASSET | LIABILITY | EQUITY | INCOME | EXPENSE
├── parent_id → accounts(id)   [self-referential]
├── level (1=root group, 2=sub-group, 3=ledger)
├── is_group (boolean — group accounts cannot post directly)
├── currency (default: INR)
├── cost_center_id → cost_centers(id)
├── department_id → departments(id)
├── branch_id → branches(id)
├── opening_balance (DECIMAL 18,4)
├── current_balance (DECIMAL 18,4)  [denormalized for speed]
└── is_active
```

### 5.3 Standard Hospital Chart of Accounts

```
1000 — ASSETS
  1100 — Current Assets
    1110 — Cash & Bank
      1111 — Main Current Account (SBI)
      1112 — Petty Cash
      1113 — Savings Account
    1120 — Accounts Receivable
      1121 — Patient AR — Cash
      1122 — Patient AR — Insurance/TPA
      1123 — Corporate AR
    1130 — Inventory
      1131 — Pharmacy Stock
      1132 — Surgical Consumables
      1133 — Medical Gases
  1200 — Fixed Assets
    1210 — Medical Equipment
    1211 — Less: Acc. Dep. — Medical Equipment
    1220 — Buildings
    1221 — Less: Acc. Dep. — Buildings
    1230 — Furniture & Fixtures
    1240 — IT Equipment
    1250 — Vehicles

2000 — LIABILITIES
  2100 — Current Liabilities
    2110 — Accounts Payable
      2111 — Vendor Payable — Pharma
      2112 — Vendor Payable — Equipment
    2120 — Patient Deposits & Advances
    2130 — Statutory Liabilities
      2131 — GST Payable — CGST
      2132 — GST Payable — SGST
      2133 — TDS Payable
      2134 — PF Payable
      2135 — ESI Payable
    2140 — Salary Payable
  2200 — Long-term Liabilities
    2210 — Bank Loans
    2220 — Equipment Finance

3000 — EQUITY
  3100 — Share Capital
  3200 — Retained Earnings
  3300 — Current Year Profit/Loss

4000 — INCOME
  4100 — OP Revenue
    4101 — Consultation Fees
    4102 — Procedure Charges
    4103 — OP Pharmacy
  4200 — IP Revenue
    4201 — Bed Charges
    4202 — Nursing Charges
    4203 — ICU Charges
    4204 — OT Charges
    4205 — Anaesthesia Charges
  4300 — Lab & Radiology
    4301 — Laboratory Revenue
    4302 — Radiology Revenue
  4400 — Insurance Revenue
    4401 — Cashless Revenue — CGHS
    4402 — Cashless Revenue — ESI
    4403 — TPA Revenue
  4500 — Other Income
    4501 — Interest Income
    4502 — Pharmacy Retail

5000 — EXPENSES
  5100 — Personnel Costs
    5101 — Doctor Salaries
    5102 — Nursing Staff
    5103 — Administrative Staff
    5104 — PF Contribution — Employer
    5105 — ESI Contribution — Employer
  5200 — Cost of Materials
    5201 — Pharmacy Cost of Goods
    5202 — Surgical Consumables
    5203 — Blood Products
  5300 — Overheads
    5301 — Electricity
    5302 — Housekeeping
    5303 — Security
    5304 — Repairs & Maintenance
  5400 — Depreciation
    5401 — Depreciation — Equipment
    5402 — Depreciation — Buildings
  5500 — Finance Costs
    5501 — Bank Interest
    5502 — Bank Charges
```

### 5.4 Journal Entry Structure (Double-Entry)

```
journal_entries (header)
├── id
├── tenant_id
├── entry_number (JV-2026-000001, PV-2026-000001, etc.)
├── voucher_type: JOURNAL | PAYMENT | RECEIPT | CONTRA | DEBIT_NOTE | CREDIT_NOTE
├── date
├── fiscal_year_id
├── period (1-12)
├── narration
├── reference (cheque no., patient ID, claim ID)
├── status: DRAFT | PENDING_APPROVAL | APPROVED | POSTED | REVERSED | CANCELLED
├── total_debit (DECIMAL 18,4)
├── total_credit (DECIMAL 18,4)
├── source_module (patient_billing, payroll, etc.)
├── source_id (UUID of source record)
└── posted_by, posted_at, approved_by, reversed_by

journal_lines (line items)
├── id
├── journal_entry_id → journal_entries(id)
├── line_number (1, 2, 3...)
├── account_id → accounts(id)
├── debit_amount (DECIMAL 18,4, default 0)
├── credit_amount (DECIMAL 18,4, default 0)
├── cost_center_id
├── department_id
├── branch_id
├── narration
├── tax_code (GST18, TDS10, etc.)
└── tax_amount
```

### 5.5 Entity Relationship Summary

```
tenants ──< tenant_modules
tenants ──< users ──< user_roles >── roles ──< role_permissions >── permissions
tenants ──< branches ──< departments ──< cost_centers
tenants ──< fiscal_years ──< accounting_periods
tenants ──< accounts (self-referential tree)
accounts ──< journal_lines >── journal_entries ──< workflow_instances
patients ──< patient_invoices ──< invoice_line_items
patient_invoices ──< payments ──< payment_allocations
patients ──< insurance_policies ──< claims ──< claim_items
claims ──< settlements ──< settlement_lines ──< journal_entries
vendors ──< purchase_orders ──< goods_receipts ──< vendor_invoices
vendor_invoices ──< journal_entries
employees ──< payroll_runs ──< payslips ──< payslip_components
assets ──< depreciation_schedules ──< depreciation_runs
```

---

## 6. SERVICE-BY-SERVICE BREAKDOWN

### 6.1 Core Accounting Service

**Responsibility:** Master of all financial transactions. Every other module that posts money MUST go through this service.

**Key Operations:**
- `createJournalEntry(data)` — Creates and validates voucher
- `postEntry(entryId)` — Posts to ledger (DR/CR balance check, fiscal period check)
- `reverseEntry(entryId, reason)` — Creates offsetting reversal entry
- `getTrialBalance(from, to, branchId?)` — Trial balance for any period
- `getLedgerStatement(accountId, from, to)` — Detailed ledger with running balance
- `lockPeriod(fiscalYearId, period)` — Prevents posting to closed periods

**Auto-posting Triggers:**
- Patient Invoice Finalized → Revenue + AR entry
- Payment Received → Cash/Bank + AR clearing entry
- Claim Settled → TPA AR reduction + Bank entry
- GRN Completed → Inventory + AP entry
- Payroll Approved → Salary expense + Statutory liabilities + Payable entry
- Asset Purchased → Asset account + AP/Cash entry
- Depreciation Run → Depreciation expense + Accumulated depreciation entry

### 6.2 Patient Billing Service

**Billing Types and Auto-posting Logic:**

| Billing Type | Revenue Account | AR Account |
|---|---|---|
| OP Cash | 4101-Consultation | 1121-Patient AR Cash |
| OP Insurance | 4101-Consultation | 1122-Patient AR Insurance |
| IP Bed | 4201-Bed Charges | 1121-Patient AR Cash |
| ICU | 4203-ICU Charges | 1122-Patient AR Insurance |
| OT | 4204-OT Charges | 1121-Patient AR Cash |
| Lab | 4301-Lab Revenue | 1121-Patient AR Cash |
| Pharmacy | 4501-Pharmacy | 1121-Patient AR Cash |

**Deposit Handling:**
```
On deposit received:
  DR  1111-Cash/Bank          5,000
  CR  2120-Patient Deposits   5,000

On invoice settlement (adjust deposit):
  DR  2120-Patient Deposits   5,000
  CR  1121-Patient AR         5,000
```

### 6.3 Insurance/TPA Service

**Claim Lifecycle:**
```
DRAFT ──▶ SUBMITTED ──▶ PREAUTH_REQUESTED ──▶ PREAUTH_APPROVED
                                                      │
                                                      ▼
                              REJECTED ◀── CLAIM_LODGED ──▶ UNDER_REVIEW
                                │                                  │
                                ▼                                  ▼
                          RESUBMITTED              PARTIAL_SETTLEMENT ──▶ SETTLED
```

**Settlement Posting:**
```
On claim settlement (₹45,000 approved, ₹5,000 deducted from ₹50,000 claim):
  DR  1111-Bank Account               45,000  (amount received)
  DR  4501-TPA Deductions              5,000  (write-off)
  CR  1122-TPA Accounts Receivable    50,000  (clear AR)
```

### 6.4 Procurement Service

**GRN → Accounting Flow:**
```
On GRN (Goods Receipt Note):
  DR  1131-Pharmacy Stock (or relevant inventory)   [GRN value]
  CR  2111-Vendor Payable — Pharma                  [GRN value]

On Vendor Invoice match to GRN:
  DR  2111-Vendor Payable (provisional)
  CR  2111-Vendor Payable — Invoice                 [confirmed payable]

On Payment:
  DR  2111-Vendor Payable
  CR  1111-Bank Account
```

### 6.5 Fixed Assets Service

**Depreciation Methods:**

| Method | Formula | Use Case |
|---|---|---|
| SLM (Straight Line) | (Cost - Salvage) / Useful Life | Buildings, furniture |
| WDV (Written Down Value) | Book Value × Rate% | Electronics, vehicles |
| Units of Production | (Cost/Total Units) × Units Used | Medical equipment |

**Depreciation Posting:**
```
Monthly depreciation run (SLM, ₹120,000/year = ₹10,000/month):
  DR  5401-Depreciation Expense — Equipment   10,000
  CR  1211-Acc. Dep. — Medical Equipment      10,000
```

### 6.6 Payroll Service

**Payroll Calculation Engine:**
```
Gross Salary
  - TDS (as per slab)
  - PF Employee (12% of basic)
  - ESI Employee (0.75% if applicable)
  - Professional Tax (state-specific slab)
  - Advances/Loans
= Net Pay

Employer Contributions:
  + PF Employer (12% of basic)
  + ESI Employer (3.25% if applicable)
```

**Payroll Posting:**
```
On payroll approval:
  DR  5101-Doctor Salaries              [gross]
  DR  5102-Nursing Staff                [gross]
  DR  5104-PF Contribution — Employer   [employer PF]
  DR  5105-ESI Contribution — Employer  [employer ESI]
  CR  2131-TDS Payable                  [TDS deducted]
  CR  2134-PF Payable                   [total PF]
  CR  2135-ESI Payable                  [total ESI]
  CR  2140-Salary Payable               [net pay]

On bank transfer:
  DR  2140-Salary Payable
  CR  1111-Bank Account
```

### 6.7 Doctor Revenue Sharing Service

**Revenue Share Formulas (all admin-configurable):**

| Type | Formula Example |
|---|---|
| Flat Percentage | 30% of consultation revenue |
| Slab-based | 0-100 patients: 25%, 101-200: 30%, 200+: 35% |
| Procedure-based | Appendectomy: ₹8,000 fixed; Cataract: 40% of OT charges |
| Gross minus expenses | Revenue - (consumables + implants) × 70% |
| Minimum guarantee | Max(calculated share, ₹1,50,000/month) |

### 6.8 Taxation Service

**GST Engine:**
```
Transaction Tags:
  - Intra-state: CGST (9%) + SGST (9%) = 18%
  - Inter-state: IGST (18%)
  - Exempt: Healthcare services (mostly exempt)
  - Composition: For small pharmacy retailers

Tax rules are configuration-driven (admin can add/edit rules):
  Rule: Service = "Pharmacy Sale", State = "same", Rate = 12%
  Rule: Service = "Lab", Category = "Healthcare", Exempt = true
```

**GSTR-1 Report Logic:**
- Aggregate all B2B and B2C invoices in the tax period
- Group by GSTIN of recipient (B2B) or state (B2C)
- Calculate taxable value, CGST, SGST, IGST per rate slab
- Generate JSON in GSTN prescribed format

### 6.9 AI Engine Service

**Natural Language Query Pipeline:**
```
User: "Show unpaid vendors over 90 days"
  │
  ▼
[LangChain + OpenAI]
  │ Converts to structured query intent:
  │ { entity: "vendor_invoices", filter: "due_date < today-90", status: "unpaid" }
  │
  ▼
[SQL Generator]
  │ SELECT v.name, vi.invoice_number, vi.amount, vi.due_date
  │ FROM vendor_invoices vi JOIN vendors v ON vi.vendor_id = v.id
  │ WHERE vi.status = 'PENDING' AND vi.due_date < NOW() - INTERVAL '90 days'
  │ AND vi.tenant_id = $tenant_id
  │
  ▼
[Result Formatter] → Table + Chart in UI
```

**Anomaly Detection:**
- Statistical baseline: rolling 30-day average per account/department
- Alert if transaction > 3σ from baseline
- Duplicate invoice detection: same vendor + same amount + similar date (±7 days)
- Revenue leakage: discharge without billing, unbilled lab orders

---

## 7. API SPECIFICATIONS

### 7.1 API Design Principles

- **Base URL:** `https://api.fact.hospital/{tenantId}/v1`
- **Authentication:** `Authorization: Bearer <jwt_token>`
- **Tenant:** `X-Tenant-ID: <tenant_uuid>` (redundant safety check)
- **Format:** JSON request/response
- **Pagination:** `?page=1&limit=25&sort=created_at:desc`
- **Response Envelope:**

```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 25, "total": 340 },
  "message": "Journal entry created successfully"
}
```

### 7.2 Core Accounting Endpoints

```
POST   /accounting/journal-entries           Create journal/voucher
GET    /accounting/journal-entries           List with filters
GET    /accounting/journal-entries/:id       Get single entry
PATCH  /accounting/journal-entries/:id/post  Post to ledger
PATCH  /accounting/journal-entries/:id/reverse  Reverse entry
DELETE /accounting/journal-entries/:id       Soft delete (DRAFT only)

GET    /accounting/accounts                  Chart of accounts (tree)
POST   /accounting/accounts                  Create account
PATCH  /accounting/accounts/:id              Update account
GET    /accounting/accounts/:id/ledger       Ledger statement
GET    /accounting/accounts/:id/balance      Current balance

GET    /accounting/trial-balance             Trial balance report
GET    /accounting/fiscal-years              List fiscal years
POST   /accounting/fiscal-years/:id/close   Close fiscal year
POST   /accounting/fiscal-years/:id/reopen  Reopen (admin only)
```

### 7.3 Billing Endpoints

```
POST   /billing/invoices              Create patient invoice
GET    /billing/invoices              List invoices
GET    /billing/invoices/:id          Invoice detail
PATCH  /billing/invoices/:id/finalize Finalize (triggers auto-posting)
POST   /billing/invoices/:id/payment  Record payment
POST   /billing/invoices/:id/refund   Process refund
GET    /billing/patients/:id/ledger   Patient account ledger
POST   /billing/deposits              Record advance deposit
PATCH  /billing/deposits/:id/adjust   Adjust against invoice
```

### 7.4 Insurance/TPA Endpoints

```
POST   /insurance/claims                        Create claim
GET    /insurance/claims                        List claims
GET    /insurance/claims/:id                    Claim detail
PATCH  /insurance/claims/:id/submit             Submit to TPA
POST   /insurance/claims/:id/preauth            Request preauth
PATCH  /insurance/claims/:id/preauth/approve    Approve preauth
PATCH  /insurance/claims/:id/settle             Record settlement
POST   /insurance/claims/:id/denial             Record denial
POST   /insurance/claims/:id/resubmit           Resubmit denied
GET    /insurance/claims/aging                  Aging analysis
GET    /insurance/claims/dashboard              Claims KPIs
```

### 7.5 Sample API Request/Response

**Create Journal Voucher:**
```json
POST /accounting/journal-entries
{
  "voucher_type": "PAYMENT",
  "date": "2026-05-15",
  "narration": "Vendor payment - Cipla Pharma - May supplies",
  "reference": "CHQ-001234",
  "lines": [
    {
      "account_id": "uuid-vendor-payable",
      "debit_amount": 285000.00,
      "credit_amount": 0,
      "department_id": "uuid-pharmacy-dept",
      "narration": "Clearing vendor payable"
    },
    {
      "account_id": "uuid-bank-account",
      "debit_amount": 0,
      "credit_amount": 285000.00,
      "narration": "Payment via RTGS"
    }
  ]
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid-journal",
    "entry_number": "PV-2026-000342",
    "status": "PENDING_APPROVAL",
    "total_debit": 285000.00,
    "total_credit": 285000.00,
    "workflow_instance_id": "uuid-workflow"
  }
}
```

---

## 8. WORKFLOW DIAGRAMS

### 8.1 Patient Invoice → Cash Collection Flow

```
Patient Admission / OP Visit
         │
         ▼
  [Billing Creates Invoice]
  - Add line items
  - Apply packages/discounts
  - Attach insurance policy (if TPA)
         │
         ├──── Cash Patient ──────────────────────────────────┐
         │                                                    │
         └──── TPA Patient ────────▶ [Request Preauth]       │
                                          │                   │
                                    [Preauth Approved]        │
                                          │                   │
                                    [Finalize Invoice]        │
                                          │                   │
                    ┌─────────────────────┘                   │
                    ▼                                         │
          [Auto-Post to GL]                                   │
          DR: Patient AR                                      │
          CR: Revenue accounts                               │
                    │                                         │
         ┌──────────┴──────────┐                             │
         ▼                     ▼                             │
  [Patient Pays Cash]   [TPA Pays Claim]            [Patient Pays Cash]
         │                     │                             │
         ▼                     ▼                             ▼
  [Record Payment]      [Claim Settlement]          [Record Payment]
  DR: Cash/Bank         DR: Bank (settled)          DR: Cash/Bank
  CR: Patient AR        DR: Write-off (deducted)    CR: Patient AR
                        CR: TPA AR
```

### 8.2 Purchase Order → Payment Cycle

```
[Purchase Requisition] ──▶ Approval ──▶ [Purchase Order Created]
                                                   │
                                                   ▼
                                         [Goods Receipt Note]
                                         DR: Inventory
                                         CR: GRN Payable (provisional)
                                                   │
                                                   ▼
                                         [Vendor Invoice Received]
                                         Match to GRN (3-way match)
                                         DR: GRN Payable
                                         CR: Vendor Payable (confirmed)
                                                   │
                                          ┌────────┴────────┐
                                          ▼                 ▼
                                   [Approved]          [Disputed]
                                          │                 │
                                          ▼                 ▼
                                   [Payment Run]    [Debit Note Raised]
                                   DR: Vendor Payable
                                   CR: Bank Account
```

### 8.3 Multi-Level Approval Workflow

```
[Transaction Created by Maker]
         │
         ▼
[Workflow Engine evaluates rules]
  - Amount > ₹10L → CFO approval required
  - Amount > ₹1L → Finance Manager approval
  - Any amount → Finance Officer approval
         │
         ▼
[Notification sent to approver L1]
         │
    ┌────┴────┐
    ▼         ▼
[Approved] [Rejected]
    │         │
    ▼         ▼
[Next Level] [Returned to Maker]
  Approver
    │
    ▼
[Final Approval → Auto Post to GL]
```

---

## 9. FINANCIAL POSTING ENGINE

### 9.1 Core Double-Entry Rules

**The Golden Rule:** `Total Debits = Total Credits` in every transaction. Violated transactions are rejected before they touch the database.

```javascript
// Pseudocode: doubleEntry.postTransaction()
async function postTransaction(entries, options) {
  // 1. Validate balance
  const totalDR = sum(entries, 'debit_amount')
  const totalCR = sum(entries, 'credit_amount')
  if (!totalDR.equals(totalCR)) {
    throw new Error(`Unbalanced entry: DR=${totalDR}, CR=${totalCR}`)
  }

  // 2. Validate accounts exist and are active ledger accounts (not groups)
  for (const entry of entries) {
    const account = await Account.findById(entry.account_id)
    if (!account || account.is_group) throw new Error('Invalid account')
    if (!account.is_active) throw new Error('Account inactive')
  }

  // 3. Check fiscal period is open
  const period = await FiscalPeriod.findForDate(entry.date)
  if (period.status === 'LOCKED') throw new Error('Period locked')

  // 4. PostgreSQL transaction — atomic
  await sequelize.transaction(async (t) => {
    // Create journal entry header
    const journal = await JournalEntry.create({ ...header, status: 'POSTED' }, { transaction: t })

    // Create all lines
    for (const line of entries) {
      await JournalLine.create({ ...line, journal_entry_id: journal.id }, { transaction: t })

      // Update account balance (denormalized for speed)
      const balanceChange = line.debit_amount.minus(line.credit_amount)
      await Account.increment('current_balance', { by: balanceChange }, { transaction: t })
    }

    // Write audit log
    await AuditLog.create({ entity: 'journal_entry', action: 'POSTED', ... }, { transaction: t })

    // Publish event (outbox pattern — same transaction)
    await OutboxEvent.create({ type: 'JOURNAL_POSTED', payload: journal }, { transaction: t })
  })
}
```

### 9.2 Account Normal Balance Rules

| Account Type | Increases With | Decreases With | Normal Balance |
|---|---|---|---|
| ASSET | Debit | Credit | Debit |
| LIABILITY | Credit | Debit | Credit |
| EQUITY | Credit | Debit | Credit |
| INCOME | Credit | Debit | Credit |
| EXPENSE | Debit | Credit | Debit |

### 9.3 Complete Financial Posting Examples

**Example 1: OT Billing + TPA Claim**
```
Patient: Mrs. Sharma | Procedure: Knee Replacement | OT Charges: ₹2,50,000 | TPA: Star Health

On Invoice Finalization:
  DR  1122-Patient AR — Insurance     2,50,000
  CR  4204-OT Charges                 2,10,000
  CR  4202-Nursing/Ward Charges         25,000
  CR  4205-Anaesthesia Charges          15,000

On TPA Settlement (₹2,35,000 approved, ₹15,000 deducted):
  DR  1111-SBI Current Account        2,35,000
  DR  4901-TPA Deductions               15,000
  CR  1122-Patient AR — Insurance     2,50,000
```

**Example 2: Pharmacy Stock Purchase (with GST)**
```
Vendor: Cipla Ltd | Invoice: ₹1,00,000 + GST 12% = ₹1,12,000

On GRN:
  DR  1131-Pharmacy Stock             1,00,000
  DR  1401-Input Tax Credit — CGST       6,000
  DR  1402-Input Tax Credit — SGST       6,000
  CR  2111-Vendor Payable (Provisional) 1,12,000

On Payment:
  DR  2111-Vendor Payable             1,12,000
  CR  1111-Bank Account               1,12,000
```

**Example 3: Equipment Depreciation (SLM)**
```
Asset: MRI Machine | Cost: ₹1,20,00,000 | Life: 10 years | Annual Dep: ₹12,00,000 | Monthly: ₹1,00,000

Monthly Depreciation Entry:
  DR  5401-Depreciation — Equipment   1,00,000
  CR  1211-Acc. Dep. — MRI Machine    1,00,000
```

**Example 4: Payroll (50 employees, ₹30L gross)**
```
Salary Processing:
  DR  5101-Doctor Salaries            12,00,000
  DR  5102-Nursing Staff               8,00,000
  DR  5103-Admin Staff                10,00,000
  DR  5104-PF — Employer (12%)         2,40,000
  DR  5105-ESI — Employer (3.25%)        45,000
  CR  2131-TDS Payable                 3,60,000
  CR  2134-PF Payable (total)          4,80,000
  CR  2135-ESI Payable (total)           67,500
  CR  2140-Salary Payable             24,77,500
```

### 9.4 Trial Balance Snapshot

```
TRIAL BALANCE — Apollo Multi-Specialty Hospital
Period: April 2026 | Generated: 15 May 2026

Account                              Debit (₹)      Credit (₹)
─────────────────────────────────────────────────────────────
1111 - SBI Current Account          45,32,100.00
1121 - Patient AR — Cash             8,21,450.00
1122 - Patient AR — Insurance       22,45,000.00
1131 - Pharmacy Stock                6,83,200.00
1210 - Medical Equipment           2,40,00,000.00
1211 - Acc. Dep. — Equipment                        85,00,000.00
2111 - Vendor Payable                               12,45,000.00
2120 - Patient Deposits                              3,21,000.00
2134 - PF Payable                                    2,40,000.00
3100 - Share Capital                               1,00,00,000.00
4101 - Consultation Revenue                         18,45,000.00
4201 - Bed Charges                                  22,30,000.00
5101 - Doctor Salaries              12,00,000.00
5201 - Pharmacy COGS                 4,21,000.00
─────────────────────────────────────────────────────────────
TOTAL                              3,38,02,750.00  3,38,02,750.00  ✓ BALANCED
```

---

## 10. SECURITY ARCHITECTURE

### 10.1 Authentication & Authorization

**Multi-Layer Security:**
```
Layer 1: Transport Security
  - TLS 1.3 enforced (HTTPS only)
  - HSTS headers
  - Certificate pinning for mobile apps

Layer 2: Authentication
  - JWT (access token: 15min, refresh token: 7 days)
  - bcrypt password hashing (cost factor 12)
  - TOTP MFA (Google Authenticator / Authy compatible)
  - Backup codes (8 one-time codes)
  - Device fingerprinting

Layer 3: Authorization
  - RBAC: Role → Permissions matrix
  - ABAC: Resource attributes (branch, department, cost center)
  - Module Guard: API blocked if module disabled

Layer 4: Data Security
  - Row Level Security in PostgreSQL (tenant isolation)
  - Encryption at rest (PostgreSQL TDE or disk encryption)
  - Field-level encryption for PII (patient names, Aadhaar)

Layer 5: Audit
  - Every API call logged (user, IP, timestamp, action, resource)
  - Immutable audit log (append-only table with trigger preventing UPDATE/DELETE)
  - Alert on: failed login ×5, unusual access patterns, off-hours access
```

### 10.2 RBAC Permission Matrix

| Role | Core Accounting | Billing | Claims | Payroll | Admin |
|---|---|---|---|---|---|
| Super Admin | Full | Full | Full | Full | Full |
| CFO | View+Approve | View | View | View+Approve | Config |
| Finance Manager | Post | View | Settle | Approve | None |
| Accountant | Create | View | None | None | None |
| Billing Staff | None | Create+View | None | None | None |
| Doctor | None | View own | None | View own | None |
| Auditor | View only | View only | View only | View only | View logs |

### 10.3 Immutable Audit Trail

```sql
-- audit_logs table has a trigger that prevents modification
CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;

-- Every financial event stored:
{
  "id": "uuid",
  "tenant_id": "...",
  "user_id": "...",
  "user_name": "Dr. Admin",
  "ip_address": "10.0.1.45",
  "user_agent": "Mozilla/5.0...",
  "entity_type": "journal_entry",
  "entity_id": "uuid-journal",
  "action": "POSTED",
  "before_state": null,
  "after_state": { "entry_number": "JV-2026-001", "amount": 50000, ... },
  "timestamp": "2026-05-15T10:30:45Z",
  "session_id": "..."
}
```

---

## 11. AI ARCHITECTURE

### 11.1 AI Component Overview

```
┌─────────────────────────────────────────────────────┐
│                   AI Engine Module                   │
├───────────────────┬───────────────────┬──────────────┤
│  NLP Query Engine │  Anomaly Detector │  OCR Engine  │
│  (LangChain +    │  (Statistical +   │  (Tesseract  │
│   OpenAI GPT-4o) │   ML Rules)       │   + OpenAI)  │
├───────────────────┼───────────────────┼──────────────┤
│  Categorization  │  Revenue Leakage  │  Duplicate   │
│  Engine          │  Detection        │  Detection   │
└───────────────────┴───────────────────┴──────────────┘
```

### 11.2 NLP Query Engine

**Architecture:**
1. User types natural language query
2. Query + schema context sent to GPT-4o with few-shot examples
3. GPT-4o returns structured JSON intent
4. Intent → SQL generation (parameterized, injection-safe)
5. SQL executed against read replica
6. Results formatted as table/chart
7. GPT-4o generates plain-language interpretation

**Query Examples:**
```
"Which department spent the most on consumables last quarter?"
→ GROUP BY department, SUM(amount) WHERE account IN expense_accounts AND date BETWEEN...

"Show me all TPA claims pending over 60 days"
→ SELECT claims WHERE status IN ('SUBMITTED','UNDER_REVIEW') AND submitted_date < now()-60 days

"What is our cash burn rate this month?"
→ SUM of all expense journal lines WHERE date IN current month / 30

"Compare ICU revenue April vs May"
→ SUM(invoice_line_items.amount) WHERE service_category='ICU' GROUP BY month
```

### 11.3 Anomaly Detection

**Rules Engine (configurable by admin):**
```
Rule 1: Duplicate Invoice Alert
  Trigger: vendor_invoice created WHERE
    vendor_id = X AND amount = Y AND date BETWEEN (Z-7, Z+7)
    AND another invoice exists with same vendor+amount

Rule 2: Unusual Transaction
  Trigger: journal_entry.amount > (avg_amount_for_account × 3)
  Action: Flag for review, notify Finance Manager

Rule 3: Revenue Leakage
  Trigger: hospital_admission.discharge_date IS NOT NULL
    AND patient_invoice does not exist after 4 hours
  Action: Alert billing team

Rule 4: After-Hours Posting
  Trigger: journal_entry.posted_at BETWEEN 23:00 AND 06:00
  Action: Log alert, notify CFO
```

---

## 12. DEVOPS ARCHITECTURE

### 12.1 CI/CD Pipeline

```
Developer pushes code
        │
        ▼
[GitHub Actions Trigger]
        │
        ├──▶ Lint (ESLint, Prettier)
        ├──▶ Unit Tests (Jest)
        ├──▶ Integration Tests (Supertest)
        ├──▶ Security Scan (Trivy, OWASP ZAP)
        ├──▶ Docker Build
        │
        ▼
[Staging Deploy]
  - Docker Compose on staging server
  - Run DB migrations
  - Smoke tests
        │
        ▼
[Manual Gate — QA Approval]
        │
        ▼
[Production Deploy]
  - Kubernetes rolling update
  - Zero-downtime deployment
  - Post-deploy health checks
  - Rollback on failure
```

### 12.2 Monitoring Stack

```
Application Metrics → Prometheus → Grafana Dashboards
  Alerts: response time > 2s, error rate > 1%, DB connections > 80%

Application Logs → Winston → Filebeat → Elasticsearch → Kibana
  Search: all logs searchable, trace IDs for request tracing

Uptime → Prometheus Blackbox → Grafana → PagerDuty alerts

Database → pg_stat_statements → Slow query log → DBA alerts

Queue → BullMQ Bull Board UI → queue depth, failed jobs

Infrastructure → cAdvisor + node-exporter → Grafana
```

---

## 13. DEPLOYMENT STRATEGY

### 13.1 Infrastructure Environments

| Environment | Purpose | Infrastructure |
|---|---|---|
| Development | Local development | docker-compose (single machine) |
| Staging | QA, UAT, demos | 2-node Docker Swarm or small K8s |
| Production | Live hospital | Kubernetes cluster (min 3 nodes) |
| DR | Disaster recovery | Standby K8s in secondary region |

### 13.2 Production Kubernetes Architecture

```
┌──────────────────── Kubernetes Cluster ─────────────────────┐
│                                                              │
│  Ingress (Nginx)  ──▶  Frontend Pod(s)  [2 replicas]       │
│                   ──▶  Backend Pod(s)   [3 replicas]        │
│                                                              │
│  StatefulSets:                                               │
│    PostgreSQL Primary + 2 Read Replicas                      │
│    Redis Sentinel (3 nodes)                                  │
│                                                              │
│  Jobs:                                                       │
│    Depreciation CronJob (monthly)                            │
│    Report Generation CronJob (daily/weekly)                  │
│    GST Reconciliation CronJob (monthly)                      │
│                                                              │
│  ConfigMaps: app config, module registry                     │
│  Secrets: DB passwords, JWT secret, API keys                 │
│  PVCs: Database storage, File uploads                        │
└──────────────────────────────────────────────────────────────┘
```

### 13.3 Multi-Tenant Deployment Options

| Model | Description | Use Case |
|---|---|---|
| Shared Schema | All tenants in one DB, `tenant_id` column + RLS | SaaS — many small hospitals |
| Separate Schema | One PostgreSQL database, separate schemas per tenant | Mid-size hospital groups |
| Separate Database | Dedicated PostgreSQL instance per tenant | Large hospital chains, compliance-sensitive |

---

## 14. SCALABILITY PLAN

### 14.1 Horizontal Scaling

- Backend: Stateless Express instances → scale with K8s HPA on CPU/memory
- Database: Read replicas for reporting queries (CQRS read side)
- Queue: BullMQ workers scale independently per queue
- Cache: Redis Cluster for high-availability

### 14.2 Data Partitioning

```sql
-- Partition journal_entries by fiscal year for performance
CREATE TABLE journal_entries_2026 PARTITION OF journal_entries
  FOR VALUES FROM ('2026-04-01') TO ('2027-03-31');

-- Partition audit_logs by month (audit tables grow largest)
CREATE TABLE audit_logs_2026_05 PARTITION OF audit_logs
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
```

### 14.3 Caching Strategy

| Data | Cache | TTL |
|---|---|---|
| Account balances | Redis | 30 seconds |
| Chart of accounts tree | Redis | 5 minutes |
| Module activation status | Redis | 1 minute |
| User permissions | Redis | 2 minutes |
| Dashboard KPIs | Redis | 60 seconds |
| Reports (generated) | Redis | 15 minutes |
| Vendor/Patient lookups | Redis | 5 minutes |

---

## 15. UI/UX STRATEGY

### 15.1 Design Principles

1. **Minimal clicks**: Any core operation in ≤ 3 clicks from dashboard
2. **Progressive disclosure**: Show summary first, drill down on demand
3. **Role-aware**: Different users see different dashboards and menus
4. **Mobile-first approvals**: CFO/HOD approves from phone in <30 seconds
5. **Real-time feedback**: Live DR/CR balance as user types journal lines
6. **Contextual help**: AI sidebar answers "how do I..." questions

### 15.2 Navigation Design

```
Global Command Palette (Cmd+K):
  > journal entry     → opens blank JV
  > vendor payment    → opens AP payment
  > patient 10045     → jumps to patient ledger
  > "show TPA aging"  → AI query result

Sidebar (role-based, module-aware):
  ┌─────────────────────┐
  │ FACT FinOS        ≡ │
  ├─────────────────────┤
  │ ◉ CFO Dashboard     │  (role: CFO only)
  │ ◉ Finance Dashboard │  (role: Finance)
  ├─── ACCOUNTING ──────┤
  │   Chart of Accounts │
  │   Journal Voucher   │
  │   Ledger            │
  │   Trial Balance     │
  ├─── REVENUE ─────────┤
  │   Patient Billing   │
  │   Insurance/TPA     │
  │   Collections       │
  ├─── EXPENSES ────────┤
  │   Procurement       │
  │   Payroll           │
  │   Fixed Assets      │
  ├─── REPORTS ─────────┤
  │   P&L Statement     │
  │   Balance Sheet     │
  │   Cash Flow         │
  ├─── AI ──────────────┤
  │ ✦ AI Finance Chat   │
  └─────────────────────┘
```

### 15.3 CFO Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  FACT FinOS — Apollo Hospital   [May 2026]   [AI] [🔔5] [KG▾]  │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Revenue  │ │ EBITDA   │ │Cash Pos. │ │Pending   │           │
│  │ ₹2.4Cr   │ │ 28.4%    │ │₹45.3L    │ │Claims    │           │
│  │ ▲12% MoM │ │ ▼2% MoM  │ │ ▲8%      │ │₹22.4L    │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  Revenue vs Expense (6M)     Department Profitability           │
│  ┌─────────────────────┐     ┌──────────────────────┐          │
│  │  ████ Rev ▓▓▓ Exp   │     │ ICU     ████ 42%     │          │
│  │  ████████████       │     │ OT      ███  38%      │          │
│  │  ▓▓▓▓▓▓▓▓▓▓         │     │ Lab     ██   28%      │          │
│  └─────────────────────┘     └──────────────────────┘          │
│                                                                  │
│  TPA Aging                   Pending Approvals                  │
│  ┌─────────────────────┐     ┌──────────────────────┐          │
│  │ 0-30d: ₹8.2L  ████  │     │ JV-2026-034 ₹5.2L   │          │
│  │ 31-60d:₹6.1L  ███   │     │ PO-2026-089 ₹12.4L  │          │
│  │ 61-90d:₹4.8L  ██    │     │ PR-2026-102 ₹3.1L   │          │
│  │ 90d+: ₹3.3L   █     │     │ [Approve All]        │          │
│  └─────────────────────┘     └──────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### 15.4 Component Library

- **Foundation**: Radix UI (accessible primitives) + shadcn/ui (styled components)
- **Charts**: Recharts (standard charts) + D3 (custom visualizations)
- **Tables**: TanStack Table (headless, powerful sorting/filtering)
- **Forms**: React Hook Form + Zod validation
- **Notifications**: react-hot-toast (transient) + in-app notification center
- **Date Picker**: react-day-picker
- **Rich Text**: TipTap (for narrations with formatting)
- **Command Palette**: cmdk library

---

## 16. REPORTING ARCHITECTURE

### 16.1 Report Types

| Category | Reports | Frequency |
|---|---|---|
| Statutory | Trial Balance, P&L, Balance Sheet | Monthly/Yearly |
| Tax | GSTR-1, GSTR-3B, TDS 26Q, 24Q | Monthly/Quarterly |
| Treasury | Cash Flow, Bank Position, Petty Cash | Daily/Weekly |
| Billing | Revenue by Department, IP/OP Split | Daily |
| TPA | Aging, Pending Claims, Settlement | Weekly |
| Procurement | Vendor Payments, GRN Pending | Weekly |
| HR | Payroll Register, Statutory | Monthly |
| AI-Generated | Revenue Leakage, Anomaly Report | On-demand |

### 16.2 Reporting Stack

```
Ad-hoc queries → PostgreSQL (primary) with indexes
Standard reports → PostgreSQL read replica
Heavy analytics → ClickHouse (optional, Phase 3)
Export → ExcelJS (XLSX) + PDFKit (PDF)
Scheduled → BullMQ cron + email delivery via Nodemailer
Dashboard → Recharts + TanStack Query (real-time polling)
```

### 16.3 P&L Statement Generation Logic

```javascript
// Simplified P&L generation
async function generatePL(tenantId, from, to, branchId) {
  const revenue = await sumJournalLines({
    tenant_id: tenantId,
    account_type: 'INCOME',
    date: { between: [from, to] },
    branch_id: branchId
  })

  const expenses = await sumJournalLines({
    account_type: 'EXPENSE',
    date: { between: [from, to] }
  })

  const grossProfit = revenue.operating - expenses.cogs
  const ebitda = grossProfit - expenses.overhead
  const pbt = ebitda - expenses.finance - expenses.depreciation
  const pat = pbt - expenses.tax

  return { revenue, expenses, grossProfit, ebitda, pbt, pat }
}
```

---

## 17. COMPLIANCE STRATEGY

### 17.1 Financial Compliance

| Regulation | Requirement | FACT Implementation |
|---|---|---|
| Companies Act 2013 | Books of accounts, audit trail | Immutable journal, trial balance |
| GST (2017) | GSTR-1, GSTR-3B, e-invoice | Automated GST returns, IRP integration |
| TDS | 26Q, 24Q returns | TDS deduction + payment tracking |
| PFMS | Public financial reporting | PFMS-compatible export |
| NABH/NABL | Clinical finance traceability | Patient billing ↔ clinical linkage |

### 17.2 Data Privacy Compliance

- Patient financial data: encrypted at field level (AES-256)
- Aadhaar/PAN: tokenized storage, never stored in plain text
- Access logs: every access to patient data logged
- Data retention: 7 years for financial records (as per IT Act)
- Right to erasure: anonymization (not deletion) of PII

### 17.3 Audit Requirements

```
ICAI Standard Audit Requirements:
  ✓ Voucher-level drill-down to source transaction
  ✓ User who created, modified, approved every entry
  ✓ Timestamp of every state change
  ✓ IP address of every posting
  ✓ Fiscal period lock prevents backdated entries
  ✓ Reversal creates new entry (no deletion)
  ✓ Balance sheet tally verification
```

---

## 18. DEVELOPMENT PHASES

### Phase 1: Foundation (Months 1-4)
**Goal:** Core accounting operational with basic billing

| Sprint | Deliverables |
|---|---|
| 1-2 | Project setup, auth, tenant management, admin module |
| 3-4 | Chart of accounts, fiscal year, journal vouchers |
| 5-6 | Ledger, trial balance, P&L, Balance Sheet |
| 7-8 | Patient billing (OP/IP), payment recording |

**Milestone:** Hospital can replace manual cash book and basic billing

### Phase 2: Hospital Finance (Months 5-9)
**Goal:** Complete hospital-specific financial workflows

| Sprint | Deliverables |
|---|---|
| 9-10 | Insurance/TPA module, preauth, claims |
| 11-12 | Procurement — PR, PO, GRN, vendor invoice |
| 13-14 | Payroll (salary + statutory), doctor payouts |
| 15-16 | Fixed assets, depreciation engine |
| 17-18 | Cash & Bank, bank reconciliation |

**Milestone:** Hospital can replace TallyPrime + manual payroll

### Phase 3: Intelligence Layer (Months 10-14)
**Goal:** Automation, AI, and advanced reporting

| Sprint | Deliverables |
|---|---|
| 19-20 | Workflow engine, multi-level approvals |
| 21-22 | Taxation engine (GST, TDS, e-invoice) |
| 23-24 | Budgeting & variance analysis |
| 25-26 | BI dashboards (CFO, CEO, department) |
| 27-28 | AI engine (NLP query, anomaly detection) |

**Milestone:** Zero manual reporting, AI-surfaced insights

### Phase 4: Scale (Months 15-18)
**Goal:** Multi-hospital, mobile, integrations

| Sprint | Deliverables |
|---|---|
| 29-30 | Multi-branch, multi-company, consolidation |
| 31-32 | Mobile apps (React Native) for approvals |
| 33-34 | HIS integration (HL7 FHIR), ABDM |
| 35-36 | Banking API integration, auto-reconciliation |

**Milestone:** Full enterprise chain deployment

---

## 19. TEAM STRUCTURE

| Role | Count | Responsibilities |
|---|---|---|
| Tech Lead / Architect | 1 | Architecture, code review, API design |
| Backend Engineers | 3 | Node.js, modules, accounting engine |
| Frontend Engineers | 2 | React, dashboards, forms |
| Database Engineer | 1 | PostgreSQL, query optimization, migrations |
| DevOps Engineer | 1 | Docker, K8s, CI/CD, monitoring |
| QA Engineer | 1 | Test plans, automation, UAT |
| UI/UX Designer | 1 | Figma designs, user research |
| Finance Domain Expert | 1 | Accounting logic, hospital finance workflows |
| AI/ML Engineer | 1 (Phase 3) | LangChain, ML models, NLP |
| **Total** | **11** | |

---

## 20. ESTIMATED TIMELINE

| Phase | Duration | Months | Team |
|---|---|---|---|
| Phase 1: Foundation | 4 months | 1-4 | 6 engineers |
| Phase 2: Hospital Finance | 5 months | 5-9 | 8 engineers |
| Phase 3: Intelligence | 5 months | 10-14 | 10 engineers |
| Phase 4: Scale | 4 months | 15-18 | 11 engineers |
| **Total** | **18 months** | | |

**Budget Estimate (ballpark):**
- Engineering (18 months × 11 FTE): ₹1.5-2.5 Cr
- Infrastructure (cloud/servers): ₹15-25L/year
- Third-party APIs (OpenAI, SMS, payment): ₹5-10L/year
- Total first-year investment: ₹2-3.5 Cr

---

## 21. RISKS & MITIGATION

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Accounting engine bugs | Medium | Critical | Extensive unit tests, parallel run with TallyPrime for 3 months |
| Data migration from Tally | High | High | Dedicated migration tool + validation scripts |
| Hospital staff adoption | High | High | Training program, role-specific simplified UI |
| Regulatory changes (GST) | Medium | Medium | Config-driven tax rules, no hardcoding |
| Performance at scale | Low | High | Load testing from Day 1, read replicas, caching |
| Security breach | Low | Critical | Penetration testing, bug bounty, security audit |
| TPA portal integration failures | High | Medium | Mock TPA adapter, graceful fallback to manual |
| AI hallucinations in NLP queries | Medium | Medium | Query confirmation step, SQL shown to user |
| Multi-tenant data leak | Low | Critical | PostgreSQL RLS, tenant ID on every query, quarterly security audit |

---

## 22. FUTURE EXPANSION

### Near-term (Year 2)
- **ABDM Integration**: Digital health records with financial linkage
- **UPI/Payment Gateway**: Online bill payment portal for patients
- **Banking API**: Auto bank statement import + reconciliation
- **e-Invoice**: NIC IRP integration for GST e-invoicing
- **WhatsApp Notifications**: Bill receipts, payment reminders via WhatsApp Business API

### Medium-term (Year 2-3)
- **Mobile App**: React Native apps for iOS/Android (patient billing, approvals)
- **Consolidated Reporting**: Multi-hospital group P&L, Balance Sheet
- **Insurance API**: Direct claim submission to Medi Assist, TTK, MD India
- **Payroll Biometric Integration**: Attendance → Payroll auto-calculation
- **Asset Tracking**: QR/barcode-based physical asset verification

### Long-term (Year 3+)
- **ClinicOS Module**: Extend to primary care clinic chains
- **Revenue Cycle Management (RCM)**: End-to-end claim denial management
- **Predictive Analytics**: Cash flow forecasting, revenue prediction
- **Blockchain Audit**: Immutable audit trail on private blockchain
- **AI Accounting**: Fully automated transaction categorization (90%+ accuracy)
- **Open Banking**: Treasury management with real-time bank balances
- **FACT Marketplace**: Plugin marketplace for hospital-specific modules

---

*This document is maintained by the FACT Engineering Team. For questions, contact the Tech Lead. Last updated: May 2026.*

*FACT FinOS — Building financial transparency, one transaction at a time.*
