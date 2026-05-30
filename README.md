# FACT — Finance Accounting with Complete Transparency
### Financial Operating System (FinOS) for Hospitals & Medical College Ecosystems

> Combining the accounting power of TallyPrime with the usability of modern SaaS ERP — built specifically for healthcare.

---

## What is FACT?

FACT is an enterprise-grade, modular Financial Operating System for secondary/tertiary care hospitals and medical college ecosystems. It handles the complete financial lifecycle — from patient billing to TPA reconciliation, payroll to GST filing — in one unified, real-time, AI-augmented platform.

## Architecture Documents

- [Full Architecture](ARCHITECTURE.md) — All 22 sections, posting examples, API specs, diagrams
- [Database Schema](database/schema.sql) — Complete PostgreSQL schema
- [Database Seed](database/seed.sql) — Initial data (CoA, roles, admin user)

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20 LTS (for local dev)
- PostgreSQL 16 (or use Docker)

### 1. Clone & Setup

```bash
git clone <repo>
cd FACT

# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start with Docker (recommended)

```bash
docker-compose up -d
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Adminer (DB GUI): http://localhost:8080

### 3. Initialize Database

```bash
# Create database and run schema
docker-compose exec postgres psql -U fact_user -d fact_db -f /docker-entrypoint-initdb.d/schema.sql

# Or manually:
cd backend && npm run db:migrate && npm run db:seed
```

### 4. Local Development

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

**Default admin credentials:**
- Email: `admin@fact.hospital`
- Password: `Admin@2026!` (change immediately)
- MFA: disabled by default for first login

---

## Module Overview

| # | Module | Status | Route Prefix |
|---|---|---|---|
| 1 | Core Accounting | Active | `/api/accounting` |
| 2 | General Ledger | Active | `/api/ledger` |
| 3 | Accounts Receivable | Active | `/api/ar` |
| 4 | Accounts Payable | Active | `/api/ap` |
| 5 | Cash & Bank | Active | `/api/cash-bank` |
| 6 | Patient Billing | Active | `/api/billing` |
| 7 | Insurance/TPA | Active | `/api/insurance` |
| 8 | Inventory Finance | Active | `/api/inventory` |
| 9 | Pharmacy Finance | Active | `/api/pharmacy` |
| 10 | Procurement | Active | `/api/procurement` |
| 11 | Fixed Assets | Active | `/api/assets` |
| 12 | Doctor Payout | Active | `/api/doctor-payout` |
| 13 | Payroll | Active | `/api/payroll` |
| 14 | Budgeting | Active | `/api/budgeting` |
| 15 | Taxation | Active | `/api/taxation` |
| 16 | Compliance | Active | `/api/compliance` |
| 17 | Reporting | Active | `/api/reports` |
| 18 | Workflow Engine | Active | `/api/workflow` |
| 19 | Notifications | Active | `/api/notifications` |
| 20 | AI Engine | Active | `/api/ai` |
| 21 | Mobile | Active | `/api/mobile` |
| 22 | Admin Config | Active | `/api/admin` |

Enable/disable any module per tenant from Admin → Module Manager.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js 20 + Express |
| Database | PostgreSQL 16 + Redis 7 |
| ORM | Sequelize 6 |
| Queue | BullMQ (Redis) |
| Frontend | React 18 + Vite |
| Styling | TailwindCSS 3 + shadcn/ui |
| State | Zustand + TanStack Query |
| AI | OpenAI GPT-4o + LangChain |
| Auth | JWT + TOTP MFA |
| Reports | ExcelJS + PDFKit |
| Container | Docker + Docker Compose |
| Production | Kubernetes |

---

## Project Structure

```
FACT/
├── ARCHITECTURE.md     ← Full system design (read this first)
├── README.md
├── docker-compose.yml
├── backend/
│   ├── server.js       ← Entry point
│   ├── .env.example
│   └── src/
│       ├── config/     ← DB, Redis, module registry
│       ├── shared/     ← Accounting engine, events, queue, audit
│       ├── middleware/  ← Auth, RBAC, ABAC, tenant, module guard
│       └── modules/    ← 22 independent modules
├── frontend/
│   └── src/
│       ├── pages/      ← One folder per module
│       ├── components/ ← Shared UI components
│       ├── store/      ← Zustand stores
│       └── services/   ← Axios API calls
└── database/
    ├── schema.sql      ← Complete PostgreSQL schema
    └── seed.sql        ← Initial data
```

---

## User Roles

| Role | Description |
|---|---|
| `super_admin` | Full platform access, tenant management |
| `admin` | Hospital admin, module config, user management |
| `cfo` | Full financial view + approval authority |
| `finance_manager` | Post transactions, approve payables |
| `accountant` | Create vouchers, view reports |
| `billing_staff` | Create patient invoices, record payments |
| `doctor` | View own revenue share, approve own bills |
| `auditor` | Read-only access to all financial records |
| `procurement` | PO, GRN, vendor invoice management |
| `hr` | Payroll processing, employee management |

---

## Integration Points

| System | Integration Type |
|---|---|
| Hospital HIS | REST API (HL7 FHIR compatible) |
| GST Portal (NIC) | e-Invoice API, GSTR filing |
| Banking | Account statement import (CSV/OFX), future: Open Banking |
| TPA Portals | Claim submission (module-specific adapters) |
| ABDM | Health ID + health records linkage |
| PFMS | Government scheme reporting |

---

## License

Proprietary — FACT FinOS. All rights reserved.

---

*Built for hospitals that believe every rupee deserves to be accounted for.*
