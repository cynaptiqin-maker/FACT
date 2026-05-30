# FACT E2E Tests (Playwright)

End-to-end tests covering the 5 key finance workflows.

## Quick start

```bash
# 1. Install Playwright + browsers (first time only)
cd e2e
npm install
npm run install:browsers

# 2. Start the backend (Terminal 1)
cd backend
npm run migrate        # apply pending SQL migrations
npm run db:seed        # load demo data
npm run dev            # starts on port 5001

# 3. Start the frontend (Terminal 2)
cd frontend
npm run dev            # starts on port 3000 (or 3004 if 3000 is taken)

# 4. Run E2E tests (Terminal 3)
cd e2e
npm test

# If frontend is on a non-default port:
FACT_URL=http://localhost:3004 npm test
```

## Test files

| File | Workflow |
|---|---|
| `tests/01-auth.spec.js` | Login / logout / unauthenticated redirect |
| `tests/02-dashboard-cfo.spec.js` | CFO Command Center widgets |
| `tests/03-billing-to-pl.spec.js` | Patient invoice → P&L statement |
| `tests/04-ap-recon.spec.js` | Vendor invoices → Reconciliation Workbench |
| `tests/05-fcra-fund-statement.spec.js` | FCRA receipts → Fund Statement |
| `tests/06-period-close.spec.js` | Period close checklist → Lock |
| `tests/07-exceptions-health.spec.js` | Exception Inbox + Health Score API |

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `FACT_URL` | `http://localhost:3000` | Frontend URL |
| `BACKEND_PORT` | `5001` | Backend port |
| `DEMO_EMAIL` | `admin@medanta.fact` | Seed admin email |
| `DEMO_PASSWORD` | `Demo@1234` | Seed admin password |
| `SKIP_BACKEND_SERVER` | unset | Set to `1` to skip auto-start |

## Demo credentials (from seed)

```
Email:    admin@medanta.fact
Password: Demo@1234
Tenant:   Medanta Super Specialty Hospital
```

## Useful commands

```bash
npm run test:headed   # see the browser
npm run test:ui       # Playwright UI mode (interactive)
npm run test:debug    # step through with debugger
npm run report        # open HTML test report
```
