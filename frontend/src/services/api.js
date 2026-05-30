import axios from 'axios';
import toast from 'react-hot-toast';

// ─── Axios Instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're already refreshing to avoid loops
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    // Auth token is set directly on api.defaults.headers.common['Authorization']
    // Tenant ID is set directly on api.defaults.headers.common['X-Tenant-ID']
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 — attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Dynamic import to avoid circular dependency
        const { useAuthStore } = await import('@store/authStore');
        const newToken = await useAuthStore.getState().refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        const { useAuthStore } = await import('@store/authStore');
        await useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 402 — module not enabled
    if (error.response?.status === 402) {
      toast.error('This module is not enabled for your organization.');
    }

    // Handle 403 — forbidden
    if (error.response?.status === 403) {
      toast.error('You do not have permission to perform this action.');
    }

    // Handle 429 — rate limit
    if (error.response?.status === 429) {
      toast.error('Too many requests. Please slow down.');
    }

    // Handle 500+ server errors
    if (error.response?.status >= 500) {
      const message = error.response?.data?.message || 'Server error. Please try again.';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export default api;

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const authAPI = {
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  refresh: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  me: () => api.get('/api/auth/me'),
  changePassword: (data) => api.post('/api/auth/change-password', data),
  setupMFA: () => api.post('/api/auth/mfa/setup'),
  enableMFA: (data) => api.post('/api/auth/mfa/enable', data),
  disableMFA: (data) => api.post('/api/auth/mfa/disable', data),
  verifyMFA: (data) => api.post('/api/auth/mfa/verify', data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CORE ACCOUNTING APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const accountingAPI = {
  // Chart of Accounts
  getAccounts: (params) => api.get('/api/accounting/accounts', { params }),
  getAccount: (id) => api.get(`/api/accounting/accounts/${id}`),
  createAccount: (data) => api.post('/api/accounting/accounts', data),
  updateAccount: (id, data) => api.put(`/api/accounting/accounts/${id}`, data),
  getAccountTree: () => api.get('/api/accounting/accounts/tree'),
  importAccounts: (rows) => api.post('/api/accounting/accounts/import', { rows }),

  // Journal Entries
  getJournalEntries: (params) => api.get('/api/accounting/journals', { params }),
  getJournalEntry: (id) => api.get(`/api/accounting/journals/${id}`),
  createJournalEntry: (data) => api.post('/api/accounting/journals', data),
  postJournalEntry: (id) => api.post(`/api/accounting/journals/${id}/post`),
  reverseJournalEntry: (id, data) => api.post(`/api/accounting/journals/${id}/reverse`, data),
  importJournals: (rows, fiscalYearId) => api.post('/api/accounting/journals/import', { rows, fiscalYearId }),

  // Fiscal Years & Periods
  getFiscalYears: () => api.get('/api/accounting/fiscal-years'),
  createFiscalYear: (data) => api.post('/api/accounting/fiscal-years', data),
  closeFiscalYear: (id) => api.post(`/api/accounting/fiscal-years/${id}/close`),

  // Ledger
  getLedgerStatement: (accountId, params) => api.get(`/api/accounting/ledger/${accountId}`, { params }),
  getTrialBalance: (params) => api.get('/api/accounting/trial-balance', { params }),

  // Lineage & Reconciliation
  getJournalsBySource: (module, sourceId) => api.get(`/api/accounting/journals/source/${module}/${sourceId}`),
  runReconciliation: (params) => api.get('/api/accounting/reconcile', { params }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT BILLING APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const billingAPI = {
  getInvoices: (params) => api.get('/api/billing/invoices', { params }),
  getInvoice: (id) => api.get(`/api/billing/invoices/${id}`),
  createInvoice: (data) => api.post('/api/billing/invoices', data),
  finalizeInvoice: (id) => api.post(`/api/billing/invoices/${id}/finalize`),
  cancelInvoice: (id, data) => api.post(`/api/billing/invoices/${id}/cancel`, data),
  receivePayment: (id, data) => api.post(`/api/billing/invoices/${id}/payment`, data),
  getStats: (params) => api.get('/api/billing/stats', { params }),
  generatePDF: (id) => api.get(`/api/billing/invoices/${id}/pdf`, { responseType: 'blob' }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// INSURANCE / TPA APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const insuranceAPI = {
  getClaims: (params) => api.get('/api/insurance/claims', { params }),
  getClaim: (id) => api.get(`/api/insurance/claims/${id}`),
  createClaim: (data) => api.post('/api/insurance/claims', data),
  advanceStatus: (id, data) => api.post(`/api/insurance/claims/${id}/advance`, data),
  getTPAs: () => api.get('/api/insurance/tpas'),
  getInsurers: () => api.get('/api/insurance/insurers'),
  getAgingSummary: (params) => api.get('/api/insurance/aging', { params }),
  getStats: (params) => api.get('/api/insurance/stats', { params }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTS RECEIVABLE APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const arAPI = {
  getARDashboard: (params) => api.get('/api/ar/dashboard', { params }),
  getAgingReport: (params) => api.get('/api/ar/aging', { params }),
  getOutstandingInvoices: (params) => api.get('/api/ar/outstanding', { params }),
  allocatePayment: (data) => api.post('/api/ar/allocate', data),
  writeOff: (id, data) => api.post(`/api/ar/${id}/write-off`, data),
  cancelInvoice: (id) => api.post(`/api/billing/invoices/${id}/cancel`),
  importInvoices: (rows) => api.post('/api/billing/invoices/import', { rows }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ACCOUNTS PAYABLE APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const apAPI = {
  getAPDashboard: (params) => api.get('/api/ap/dashboard', { params }),
  getVendorInvoices: (params) => api.get('/api/ap/invoices', { params }),
  createVendorInvoice: (data) => api.post('/api/ap/invoices', data),
  approveVendorInvoice: (id) => api.post(`/api/ap/invoices/${id}/approve`),
  schedulePayment: (id, data) => api.post(`/api/ap/invoices/${id}/schedule-payment`, data),
  recordPayment: (id, data) => api.post(`/api/ap/invoices/${id}/pay`, data),
  getVendors: (params) => api.get('/api/ap/vendors', { params }),
  createVendor: (data) => api.post('/api/ap/vendors', data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// CASH & BANK APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const cashBankAPI = {
  getCashBook: (params) => api.get('/api/cash-bank/cashbook', { params }),
  getBankAccounts: () => api.get('/api/cash-bank/accounts'),
  createTransaction: (data) => api.post('/api/cash-bank/transactions', data),
  reconcile: (data) => api.post('/api/cash-bank/reconcile', data),
  getCashPosition: () => api.get('/api/cash-bank/position'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// FIXED ASSETS APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const assetsAPI = {
  getAssets: (params) => api.get('/api/assets', { params }),
  getAsset: (id) => api.get(`/api/assets/${id}`),
  createAsset: (data) => api.post('/api/assets', data),
  updateAsset: (id, data) => api.put(`/api/assets/${id}`, data),
  disposeAsset: (id, data) => api.post(`/api/assets/${id}/dispose`, data),
  getCategories: () => api.get('/api/assets/categories'),
  runDepreciation: (data) => api.post('/api/assets/depreciation/run', data),
  getDepreciationRuns: (params) => api.get('/api/assets/depreciation/runs', { params }),
  getDepreciationSchedule: (assetId) => api.get(`/api/assets/${assetId}/depreciation-schedule`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// PAYROLL APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const payrollAPI = {
  getEmployees: (params) => api.get('/api/payroll/employees', { params }),
  getEmployee: (id) => api.get(`/api/payroll/employees/${id}`),
  createEmployee: (data) => api.post('/api/payroll/employees', data),
  updateEmployee: (id, data) => api.put(`/api/payroll/employees/${id}`, data),
  getSalaryStructures: () => api.get('/api/payroll/salary-structures'),
  runPayroll: (data) => api.post('/api/payroll/run', data),
  getPayrollRuns: (params) => api.get('/api/payroll/runs', { params }),
  getPayslips: (params) => api.get('/api/payroll/payslips', { params }),
  getPayslip: (id) => api.get(`/api/payroll/payslips/${id}`),
  postPayrollToAccounting: (runId) => api.post(`/api/payroll/runs/${runId}/post`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOCTOR PAYOUT APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const doctorPayoutAPI = {
  getDoctors: (params) => api.get('/api/doctor-payout/doctors', { params }),
  getFormulas: (doctorId) => api.get(`/api/doctor-payout/doctors/${doctorId}/formulas`),
  createFormula: (doctorId, data) => api.post(`/api/doctor-payout/doctors/${doctorId}/formulas`, data),
  runPayouts: (data) => api.post('/api/doctor-payout/run', data),
  getPayoutRuns: (params) => api.get('/api/doctor-payout/runs', { params }),
  getPayoutDetails: (runId) => api.get(`/api/doctor-payout/runs/${runId}/details`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUDGETING APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const budgetAPI = {
  getBudgets: (params) => api.get('/api/budgeting/budgets', { params }),
  getBudget: (id) => api.get(`/api/budgeting/budgets/${id}`),
  createBudget: (data) => api.post('/api/budgeting/budgets', data),
  updateBudget: (id, data) => api.put(`/api/budgeting/budgets/${id}`, data),
  getVarianceReport: (params) => api.get('/api/budgeting/variance', { params }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// TAXATION APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const taxAPI = {
  generateGSTR1: (params) => api.post('/api/taxation/gstr1', params),
  generateGSTR3B: (params) => api.post('/api/taxation/gstr3b', params),
  getTDSSummary: (params) => api.get('/api/taxation/tds-summary', { params }),
  getTaxRules: () => api.get('/api/taxation/rules'),
  createTaxRule: (data) => api.post('/api/taxation/rules', data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTING APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const reportAPI = {
  getPLStatement: (params) => api.get('/api/reports/pl', { params }),
  getBalanceSheet: (params) => api.get('/api/reports/balance-sheet', { params }),
  getCashFlow: (params) => api.get('/api/reports/cash-flow', { params }),
  getCFODashboard: () => api.get('/api/reports/cfo-dashboard'),
  exportReport: (reportType, params) =>
    api.get(`/api/reports/${reportType}/export`, { params, responseType: 'blob' }),
  getCFOSummary:        ()       => api.get('/api/reports/cfo-summary'),
  getHealthScore:       ()       => api.get('/api/reports/health-score'),
  getTrialBalance:      (params) => api.get('/api/reports/trial-balance', { params }),
  getFCRAFundStatement: (params) => api.get('/api/reports/fcra-fund-statement', { params }),
  getDeptPL:            (params) => api.get('/api/reports/dept-pl', { params }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI ENGINE APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const aiAPI = {
  query: (question) => api.post('/api/ai/query', { question }),
  detectAnomalies: () => api.post('/api/ai/anomalies'),
  getCFOInsights: () => api.get('/api/ai/cfo-insights'),
  getQueryHistory: (params) => api.get('/api/ai/history', { params }),
  // Context-aware copilot endpoints
  getContextInsights: (module) => api.get('/api/ai/context', { params: { module } }),
  queryWithContext: (question, module, kpis) => api.post('/api/ai/context-query', { question, module, kpis }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const adminAPI = {
  // Users
  getUsers: (params) => api.get('/api/admin/users', { params }),
  getUser: (id) => api.get(`/api/admin/users/${id}`),
  createUser: (data) => api.post('/api/admin/users', data),
  updateUser: (id, data) => api.put(`/api/admin/users/${id}`, data),
  deactivateUser: (id) => api.post(`/api/admin/users/${id}/deactivate`),
  resetUserMFA: (id) => api.post(`/api/admin/users/${id}/reset-mfa`),

  // Roles & Permissions
  getRoles: () => api.get('/api/admin/roles'),
  getPermissions: () => api.get('/api/admin/permissions'),

  // Modules
  getModules: () => api.get('/api/admin/modules'),
  enableModule: (moduleId) => api.post(`/api/admin/modules/${moduleId}/enable`),
  disableModule: (moduleId) => api.post(`/api/admin/modules/${moduleId}/disable`),

  // Audit Logs
  getAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),

  // Tenant
  getTenant: () => api.get('/api/admin/tenant'),
  updateTenant: (data) => api.put('/api/admin/tenant', data),

  // Workflows
  getWorkflowDefinitions: () => api.get('/api/workflow/definitions'),
  createWorkflowDefinition: (data) => api.post('/api/workflow/definitions', data),
  updateWorkflowDefinition: (id, data) => api.put(`/api/workflow/definitions/${id}`, data),
  getWorkflowInstances: (params) => api.get('/api/workflow/instances', { params }),
  processWorkflowTask: (taskId, data) => api.post(`/api/workflow/tasks/${taskId}/action`, data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND CENTER APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const commandCenterAPI = {
  getSummary: () => api.get('/api/command-center/summary'),
  getTasks: (params) => api.get('/api/command-center/tasks', { params }),
  getAlerts: () => api.get('/api/command-center/alerts'),
  getActivity: () => api.get('/api/command-center/activity'),
  getHealth: () => api.get('/api/command-center/health'),
  getTrend: () => api.get('/api/command-center/trend'),
};

// ═══════════════════════════════════════════════════════════════════════════════
// FCRA (Foreign Contribution Regulation Act) APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const fcraAPI = {
  // Dashboard & AI
  getDashboard:          ()         => api.get('/api/fcra/dashboard'),
  getAIContext:          ()         => api.get('/api/fcra/ai/context'),
  chatAI:                (data)     => api.post('/api/fcra/ai/chat', data),

  // Registration
  getRegistrations:      (params)   => api.get('/api/fcra/registration', { params }),
  createRegistration:    (data)     => api.post('/api/fcra/registration', data),
  updateRegistration:    (id, data) => api.put(`/api/fcra/registration/${id}`, data),

  // Bank Accounts
  getBankAccounts:       (params)   => api.get('/api/fcra/bank-accounts', { params }),
  createBankAccount:     (data)     => api.post('/api/fcra/bank-accounts', data),
  updateBankAccount:     (id, data) => api.put(`/api/fcra/bank-accounts/${id}`, data),

  // Donors
  getDonors:             (params)   => api.get('/api/fcra/donors', { params }),
  createDonor:           (data)     => api.post('/api/fcra/donors', data),
  updateDonor:           (id, data) => api.put(`/api/fcra/donors/${id}`, data),

  // Receipts
  getReceipts:           (params)   => api.get('/api/fcra/receipts', { params }),
  createReceipt:         (data)     => api.post('/api/fcra/receipts', data),
  updateReceipt:         (id, data) => api.put(`/api/fcra/receipts/${id}`, data),
  verifyReceipt:         (id)       => api.post(`/api/fcra/receipts/${id}/verify`),

  // Projects
  getProjects:           (params)   => api.get('/api/fcra/projects', { params }),
  createProject:         (data)     => api.post('/api/fcra/projects', data),
  updateProject:         (id, data) => api.put(`/api/fcra/projects/${id}`, data),

  // Utilisation
  getUtilisations:       (params)   => api.get('/api/fcra/utilisation', { params }),
  createUtilisation:     (data)     => api.post('/api/fcra/utilisation', data),
  updateUtilisation:     (id, data) => api.put(`/api/fcra/utilisation/${id}`, data),
  approveUtilisation:    (id)       => api.post(`/api/fcra/utilisation/${id}/approve`),
  rejectUtilisation:     (id, data) => api.post(`/api/fcra/utilisation/${id}/reject`, data),

  // Compliance
  getCompliances:        (params)   => api.get('/api/fcra/compliance', { params }),
  createCompliance:      (data)     => api.post('/api/fcra/compliance', data),
  updateCompliance:      (id, data) => api.put(`/api/fcra/compliance/${id}`, data),
  completeCompliance:    (id, data) => api.post(`/api/fcra/compliance/${id}/complete`, data),

  // FC-4 Filings
  getFC4Filings:         (params)   => api.get('/api/fcra/fc4', { params }),
  createFC4Filing:       (data)     => api.post('/api/fcra/fc4', data),
  updateFC4Filing:       (id, data) => api.put(`/api/fcra/fc4/${id}`, data),
  computeFC4:            (id)       => api.post(`/api/fcra/fc4/${id}/compute`),

  // Reports
  getUtilisationSummary: (params)   => api.get('/api/fcra/reports/utilisation-summary', { params }),
  getReceiptsSummary:    (params)   => api.get('/api/fcra/reports/receipts-summary', { params }),
  getAdminCapReport:     (params)   => api.get('/api/fcra/reports/admin-cap', { params }),

  // Assets
  getAssets:             (params)   => api.get('/api/fcra/assets', { params }),
  createAsset:           (data)     => api.post('/api/fcra/assets', data),
  updateAsset:           (id, data) => api.put(`/api/fcra/assets/${id}`, data),

  // Asset Disposals
  getDisposals:          (params)   => api.get('/api/fcra/asset-disposals', { params }),
  createDisposal:        (data)     => api.post('/api/fcra/asset-disposals', data),

  // Asset Income
  getAssetIncome:        (params)   => api.get('/api/fcra/asset-income', { params }),
  createAssetIncome:     (data)     => api.post('/api/fcra/asset-income', data),
  getJournals:           (sourceId) => api.get(`/api/fcra/journals/${sourceId}`),
};

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const notificationAPI = {
  getNotifications: (params) => api.get('/api/notifications', { params }),
  markRead: (id) => api.post(`/api/notifications/${id}/read`),
  markAllRead: () => api.post('/api/notifications/read-all'),
  getUnreadCount: () => api.get('/api/notifications/unread-count'),
};


// ═══════════════════════════════════════════════════════════════════════════════
// EXCEPTION INBOX APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const exceptionAPI = {
  list:        (params) => api.get('/api/exceptions', { params }),
  getStats:    ()       => api.get('/api/exceptions/stats'),
  getTypes:    ()       => api.get('/api/exceptions/types'),
  acknowledge: (id)     => api.post(`/api/exceptions/${id}/acknowledge`),
  resolve:     (id, data) => api.post(`/api/exceptions/${id}/resolve`, data),
  dismiss:     (id, data) => api.post(`/api/exceptions/${id}/dismiss`, data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// RECONCILIATION WORKBENCH APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const reconAPI = {
  getSummary:  (period)        => api.get('/api/recon/workbench/summary', { params: { period } }),
  getWorkbench:(type, period)  => api.get('/api/recon/workbench', { params: { type, period } }),
  match:       (data)          => api.post('/api/recon/match', data),
  unmatch:     (data)          => api.post('/api/recon/unmatch', data),
  dispute:     (data)          => api.post('/api/recon/dispute', data),
};

// ═══════════════════════════════════════════════════════════════════════════════
// PERIOD CLOSE APIs
// ═══════════════════════════════════════════════════════════════════════════════
export const periodCloseAPI = {
  getChecklist:    (period, fiscalYearId) => api.get('/api/period-close/checklist', { params: { period, fiscalYearId } }),
  lock:            (data)                 => api.post('/api/period-close/lock', data),
  unlock:          (data)                 => api.post('/api/period-close/unlock', data),
  generateReports: (data)                 => api.post('/api/period-close/generate-reports', data),
  getHistory:      (fiscalYearId)         => api.get('/api/period-close/history', { params: { fiscalYearId } }),
};
