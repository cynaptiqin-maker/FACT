'use strict';

/**
 * FACT Module Registry
 * Each module can be independently enabled/disabled per tenant.
 * Module activation is stored in the tenant_modules table.
 */

const MODULE_STATUS = {
  CORE: 'core',       // Always enabled, cannot be disabled
  ENABLED: 'enabled', // Enabled by default
  DISABLED: 'disabled', // Disabled by default, available for activation
  ADDON: 'addon',     // Paid add-on module
};

const MODULES = [
  // ─── Core (Always Active) ─────────────────────────────────────────────────
  {
    id: 'auth',
    name: 'Authentication & Authorization',
    description: 'User login, JWT tokens, MFA, RBAC, ABAC',
    status: MODULE_STATUS.CORE,
    routePrefix: '/api/auth',
    version: '1.0.0',
    dependencies: [],
    icon: 'Shield',
    category: 'system',
    routeFile: './modules/auth/auth.routes',
  },
  {
    id: 'admin',
    name: 'System Administration',
    description: 'Tenant management, module configuration, user management',
    status: MODULE_STATUS.CORE,
    routePrefix: '/api/admin',
    version: '1.0.0',
    dependencies: ['auth'],
    icon: 'Settings',
    category: 'system',
    routeFile: './modules/admin/admin.routes',
  },

  // ─── Accounting Core ─────────────────────────────────────────────────────
  {
    id: 'core-accounting',
    name: 'Core Accounting',
    description: 'Chart of accounts, journal vouchers, fiscal year management, trial balance',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/accounting',
    version: '1.0.0',
    dependencies: ['auth'],
    icon: 'BookOpen',
    category: 'accounting',
    routeFile: './modules/core-accounting/routes/accounting.routes',
    features: ['chart-of-accounts', 'journal-voucher', 'fiscal-year', 'trial-balance'],
  },
  {
    id: 'general-ledger',
    name: 'General Ledger',
    description: 'Ledger statements, account balances, period closing, sub-ledger reconciliation',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/ledger',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'FileText',
    category: 'accounting',
    routeFile: './modules/general-ledger/routes/ledger.routes',
  },

  // ─── Receivables & Billing ────────────────────────────────────────────────
  {
    id: 'patient-billing',
    name: 'Patient Billing',
    description: 'OP/IP/ICU/OT/Package billing, deposits, advance management, credit billing',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/billing',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'Receipt',
    category: 'revenue',
    routeFile: './modules/patient-billing/routes/billing.routes',
    features: ['op-billing', 'ip-billing', 'package-billing', 'deposits', 'credit-billing'],
  },
  {
    id: 'accounts-receivable',
    name: 'Accounts Receivable',
    description: 'AR aging, collection tracking, dunning, reconciliation',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/ar',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'patient-billing'],
    icon: 'TrendingUp',
    category: 'revenue',
    routeFile: './modules/accounts-receivable/routes/ar.routes',
  },
  {
    id: 'insurance-tpa',
    name: 'Insurance & TPA',
    description: 'Claim management, pre-authorization, settlement reconciliation, TPA tracking',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/insurance',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'patient-billing'],
    icon: 'ShieldCheck',
    category: 'revenue',
    routeFile: './modules/insurance-tpa/routes/insurance.routes',
    features: ['claims', 'preauth', 'settlement', 'tpa-reconciliation'],
  },

  // ─── Payables & Procurement ────────────────────────────────────────────────
  {
    id: 'accounts-payable',
    name: 'Accounts Payable',
    description: 'Vendor invoices, AP aging, payment scheduling, reconciliation',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/ap',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'TrendingDown',
    category: 'payables',
    routeFile: './modules/accounts-payable/routes/ap.routes',
  },
  {
    id: 'procurement',
    name: 'Procurement',
    description: 'Purchase requisitions, purchase orders, GRN, vendor management',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/procurement',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'accounts-payable'],
    icon: 'ShoppingCart',
    category: 'payables',
    routeFile: './modules/procurement/routes/procurement.routes',
  },

  // ─── Cash & Banking ────────────────────────────────────────────────────────
  {
    id: 'cash-bank',
    name: 'Cash & Bank Management',
    description: 'Bank accounts, payments, receipts, reconciliation, petty cash',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/cash-bank',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'CreditCard',
    category: 'treasury',
    routeFile: './modules/cash-bank/routes/cashBank.routes',
  },

  // ─── Inventory & Pharmacy ──────────────────────────────────────────────────
  {
    id: 'inventory-finance',
    name: 'Inventory Finance',
    description: 'Stock valuation, FIFO/LIFO/Average costing, inventory adjustments, write-offs',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/inventory-finance',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'procurement'],
    icon: 'Package',
    category: 'operations',
    routeFile: './modules/inventory-finance/routes/inventory.routes',
  },
  {
    id: 'pharmacy-finance',
    name: 'Pharmacy Finance',
    description: 'Pharmacy revenue, drug consumption accounting, batch tracking, expiry management',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/pharmacy-finance',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'inventory-finance'],
    icon: 'Pill',
    category: 'operations',
    routeFile: './modules/pharmacy-finance/routes/pharmacy.routes',
  },

  // ─── HR & Payroll ──────────────────────────────────────────────────────────
  {
    id: 'payroll',
    name: 'Payroll & HR Finance',
    description: 'Salary processing, PF/ESI/PT/TDS, payslips, statutory compliance',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/payroll',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'Users',
    category: 'hr',
    routeFile: './modules/payroll/routes/payroll.routes',
  },
  {
    id: 'doctor-payout',
    name: 'Doctor Revenue Sharing',
    description: 'Consultant fees, revenue share formulas (percentage, slab, procedure-based), payout runs',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/doctor-payout',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'payroll'],
    icon: 'Stethoscope',
    category: 'hr',
    routeFile: './modules/doctor-payout/routes/payout.routes',
  },

  // ─── Fixed Assets ──────────────────────────────────────────────────────────
  {
    id: 'fixed-assets',
    name: 'Fixed Assets',
    description: 'Asset register, SLM/WDV depreciation, transfers, disposals, schedules',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/assets',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'Building',
    category: 'assets',
    routeFile: './modules/fixed-assets/routes/assets.routes',
  },

  // ─── Planning ──────────────────────────────────────────────────────────────
  {
    id: 'budgeting',
    name: 'Budgeting & Forecasting',
    description: 'Annual budgets, departmental budgets, variance analysis, rolling forecasts',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/budgeting',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'Target',
    category: 'planning',
    routeFile: './modules/budgeting/routes/budgeting.routes',
  },

  // ─── Tax & Compliance ──────────────────────────────────────────────────────
  {
    id: 'taxation',
    name: 'Tax Management',
    description: 'GST (CGST/SGST/IGST), TDS/TCS, GSTR1/GSTR3B generation, tax reconciliation',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/taxation',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'Calculator',
    category: 'compliance',
    routeFile: './modules/taxation/routes/taxation.routes',
  },
  {
    id: 'compliance',
    name: 'Regulatory Compliance',
    description: 'Audit reports, financial statements, statutory filings, NABH/JCI compliance docs',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/compliance',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'taxation'],
    icon: 'CheckSquare',
    category: 'compliance',
    routeFile: './modules/compliance/routes/compliance.routes',
  },

  // ─── Operations ────────────────────────────────────────────────────────────
  {
    id: 'workflow',
    name: 'Workflow & Approvals',
    description: 'Metadata-driven workflows, multi-level approvals, escalations, SLA tracking',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/workflow',
    version: '1.0.0',
    dependencies: ['auth'],
    icon: 'GitBranch',
    category: 'operations',
    routeFile: './modules/workflow/routes/workflow.routes',
  },
  {
    id: 'notifications',
    name: 'Notifications',
    description: 'Email, SMS, in-app notifications, webhooks, scheduled alerts',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/notifications',
    version: '1.0.0',
    dependencies: ['auth'],
    icon: 'Bell',
    category: 'operations',
    routeFile: './modules/notifications/routes/notifications.routes',
  },
  {
    id: 'reporting',
    name: 'Financial Reporting',
    description: 'P&L, Balance Sheet, Cash Flow, Trial Balance, custom reports, Excel/PDF export',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/reports',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'BarChart2',
    category: 'analytics',
    routeFile: './modules/reporting/routes/reporting.routes',
  },

  // ─── FCRA (Foreign Contribution Regulation Act) ───────────────────────────
  {
    id: 'fcra',
    name: 'FCRA Compliance',
    description: 'Foreign contribution receipts, donor master, project utilisation, admin cap tracking, FC-4 filings',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/fcra',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'Globe',
    category: 'compliance',
    routeFile: './modules/fcra/fcra.routes',
    features: ['registration', 'bank-accounts', 'donors', 'receipts', 'projects', 'utilisation', 'assets', 'fc4', 'compliance'],
  },

  // ─── Operations Hub ────────────────────────────────────────────────────────
  {
    id: 'exceptions',
    name: 'Exception Inbox',
    description: 'Unified operational exception queue: failed postings, recon mismatches, FCRA cap warnings, stale claims',
    status: MODULE_STATUS.CORE,
    routePrefix: '/api/exceptions',
    version: '1.0.0',
    dependencies: ['auth'],
    icon: 'AlertTriangle',
    category: 'operations',
    routeFile: './modules/exceptions/exceptions.routes',
  },
  {
    id: 'reconciliation',
    name: 'Reconciliation Workbench',
    description: 'Bank vs cashbook, AR/AP vs GL, FCRA fund, payroll reconciliation with item-level matching',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/recon',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting'],
    icon: 'GitCompare',
    category: 'accounting',
    routeFile: './modules/reconciliation/reconciliation.routes',
  },
  {
    id: 'period-close',
    name: 'Period Close Center',
    description: 'Month-end close workflow: pre-close checklist, period lock, report generation',
    status: MODULE_STATUS.ENABLED,
    routePrefix: '/api/period-close',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'reconciliation'],
    icon: 'CalendarCheck',
    category: 'accounting',
    routeFile: './modules/period-close/period-close.routes',
  },

  // ─── Command Center (Core) ────────────────────────────────────────────────
  {
    id: 'command-center',
    name: 'Financial Command Center',
    description: 'Unified task inbox, financial pulse, alert feed, quick actions — task-first operations hub',
    status: MODULE_STATUS.CORE,
    routePrefix: '/api/command-center',
    version: '1.0.0',
    dependencies: ['auth'],
    icon: 'LayoutGrid',
    category: 'system',
    routeFile: './modules/command-center/commandCenter.routes',
  },

  // ─── AI (Add-on) ──────────────────────────────────────────────────────────
  {
    id: 'ai-engine',
    name: 'AI Financial Assistant',
    description: 'Natural language queries, anomaly detection, revenue leakage, expense categorization',
    status: MODULE_STATUS.ADDON,
    routePrefix: '/api/ai',
    version: '1.0.0',
    dependencies: ['auth', 'core-accounting', 'reporting'],
    icon: 'Sparkles',
    category: 'analytics',
    routeFile: './modules/ai-engine/routes/ai.routes',
    requiresApiKey: 'OPENAI_API_KEY',
  },
];

// ─── Module Lookup Map ────────────────────────────────────────────────────────
const MODULE_MAP = MODULES.reduce((acc, mod) => {
  acc[mod.id] = mod;
  return acc;
}, {});

/**
 * Get module config by ID.
 */
function getModule(id) {
  return MODULE_MAP[id] || null;
}

/**
 * Get all modules in a category.
 */
function getModulesByCategory(category) {
  return MODULES.filter((m) => m.category === category);
}

/**
 * Check if a module's dependencies are satisfied (all enabled).
 */
function checkDependencies(moduleId, enabledModuleIds) {
  const mod = getModule(moduleId);
  if (!mod) return { satisfied: false, missing: [moduleId] };

  const missing = mod.dependencies.filter((dep) => !enabledModuleIds.includes(dep));
  return {
    satisfied: missing.length === 0,
    missing,
  };
}

/**
 * Get modules that depend on a given module (for cascade disable warnings).
 */
function getDependents(moduleId) {
  return MODULES.filter((m) => m.dependencies.includes(moduleId));
}

module.exports = {
  MODULES,
  MODULE_MAP,
  MODULE_STATUS,
  getModule,
  getModulesByCategory,
  checkDependencies,
  getDependents,
};
