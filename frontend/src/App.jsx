import React, { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@store/authStore';
import { useModuleStore } from '@store/moduleStore';
import Layout from '@components/Layout/Layout';

// Lazy-loaded pages
const Login = lazy(() => import('@pages/Login'));
const Landing = lazy(() => import('@pages/Landing'));
const CFODashboard = lazy(() => import('@pages/Dashboard/CFODashboard'));

// Core Accounting
const JournalVoucher = lazy(() => import('@pages/CoreAccounting/JournalVoucher'));
const ChartOfAccounts = lazy(() => import('@pages/CoreAccounting/ChartOfAccounts'));
const Ledger = lazy(() => import('@pages/CoreAccounting/Ledger'));
const FiscalYears = lazy(() => import('@pages/CoreAccounting/FiscalYears'));
const TrialBalance = lazy(() => import('@pages/CoreAccounting/TrialBalance'));

// General Ledger
const GeneralLedger = lazy(() => import('@pages/GeneralLedger/GeneralLedger'));
const JournalList = lazy(() => import('@pages/GeneralLedger/JournalList'));

// Accounts Receivable
const ARDashboard = lazy(() => import('@pages/AccountsReceivable/ARDashboard'));
const InvoiceList = lazy(() => import('@pages/AccountsReceivable/InvoiceList'));
const AgingReport = lazy(() => import('@pages/AccountsReceivable/AgingReport'));

// Accounts Payable
const APDashboard = lazy(() => import('@pages/AccountsPayable/APDashboard'));
const VendorInvoices = lazy(() => import('@pages/AccountsPayable/VendorInvoices'));

// Patient Billing
const BillingDashboard = lazy(() => import('@pages/PatientBilling/BillingDashboard'));
const NewInvoice = lazy(() => import('@pages/PatientBilling/NewInvoice'));
const PatientInvoices = lazy(() => import('@pages/PatientBilling/PatientInvoices'));
const PaymentReceipt = lazy(() => import('@pages/PatientBilling/PaymentReceipt'));

// Insurance / TPA
const ClaimsDashboard = lazy(() => import('@pages/InsuranceTPA/ClaimsDashboard'));
const ClaimDetail = lazy(() => import('@pages/InsuranceTPA/ClaimDetail'));
const TPAAgingReport = lazy(() => import('@pages/InsuranceTPA/TPAAgingReport'));

// Cash & Bank
const CashBook = lazy(() => import('@pages/CashBank/CashBook'));
const BankReconciliation = lazy(() => import('@pages/CashBank/BankReconciliation'));

// Fixed Assets
const AssetRegister = lazy(() => import('@pages/FixedAssets/AssetRegister'));
const AssetDetail = lazy(() => import('@pages/FixedAssets/AssetDetail'));
const DepreciationRuns = lazy(() => import('@pages/FixedAssets/DepreciationRuns'));

// Payroll
const PayrollDashboard = lazy(() => import('@pages/Payroll/PayrollDashboard'));
const PayrollRun = lazy(() => import('@pages/Payroll/PayrollRun'));
const Payslips = lazy(() => import('@pages/Payroll/Payslips'));

// Doctor Payouts
const DoctorPayouts = lazy(() => import('@pages/DoctorPayout/DoctorPayouts'));
const RevenueSharing = lazy(() => import('@pages/DoctorPayout/RevenueSharing'));

// Budgeting
const BudgetDashboard = lazy(() => import('@pages/Budgeting/BudgetDashboard'));
const BudgetVariance = lazy(() => import('@pages/Budgeting/BudgetVariance'));

// Taxation
const GSTReturns = lazy(() => import('@pages/Taxation/GSTReturns'));
const TDSSummary = lazy(() => import('@pages/Taxation/TDSSummary'));

// Reporting
const FinancialReports = lazy(() => import('@pages/Reporting/FinancialReports'));
const PLStatement = lazy(() => import('@pages/Reporting/PLStatement'));
const BalanceSheet = lazy(() => import('@pages/Reporting/BalanceSheet'));
const CashFlowReport = lazy(() => import('@pages/Reporting/CashFlowReport'));
const FCRAFundStatement = lazy(() => import('@pages/Reporting/FCRAFundStatement'));
const ReportingTrialBalance = lazy(() => import('@pages/Reporting/TrialBalance'));

// Command Center
const CommandCenter = lazy(() => import('@pages/CommandCenter/CommandCenter'));

// FCRA
const FCRADashboard    = lazy(() => import('@pages/FCRA/FCRADashboard'));
const FCRARegistration = lazy(() => import('@pages/FCRA/FCRARegistration'));
const FCRABankAccounts = lazy(() => import('@pages/FCRA/FCRABankAccounts'));
const FCRADonors       = lazy(() => import('@pages/FCRA/FCRADonors'));
const FCRAReceipts     = lazy(() => import('@pages/FCRA/FCRAReceipts'));
const FCRAProjects     = lazy(() => import('@pages/FCRA/FCRAProjects'));
const FCRAUtilisation  = lazy(() => import('@pages/FCRA/FCRAUtilisation'));
const FCRACompliance   = lazy(() => import('@pages/FCRA/FCRACompliance'));
const FCRAFC4          = lazy(() => import('@pages/FCRA/FCRAFC4'));
const FCRAAssets       = lazy(() => import('@pages/FCRA/FCRAAssets'));
const FCRADisposals    = lazy(() => import('@pages/FCRA/FCRADisposals'));
const FCRAAssetIncome  = lazy(() => import('@pages/FCRA/FCRAAssetIncome'));
const FCRAReports      = lazy(() => import('@pages/FCRA/FCRAReports'));
const FCRAAuditLog     = lazy(() => import('@pages/FCRA/FCRAAuditLog'));

// Operations Hub
const ExceptionInbox        = lazy(() => import('@pages/Exceptions/ExceptionInbox'));
const ReconciliationWorkbench = lazy(() => import('@pages/Reconciliation/ReconciliationWorkbench'));
const PeriodCloseCenter     = lazy(() => import('@pages/PeriodClose/PeriodCloseCenter'));

// AI Engine
const AIAssistant = lazy(() => import('@pages/AIEngine/AIAssistant'));
const AnomalyDetector = lazy(() => import('@pages/AIEngine/AnomalyDetector'));

// Admin
const AdminDashboard = lazy(() => import('@pages/Admin/AdminDashboard'));
const ModuleManager = lazy(() => import('@pages/Admin/ModuleManager'));
const UserManagement = lazy(() => import('@pages/Admin/UserManagement'));
const AuditLogs = lazy(() => import('@pages/Admin/AuditLogs'));
const WorkflowConfigs = lazy(() => import('@pages/Admin/WorkflowConfigs'));
const SystemSettings = lazy(() => import('@pages/Admin/SystemSettings'));

// ─── Loading Fallback ────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

// ─── Protected Route ─────────────────────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isAuthenticated, token } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// ─── Module Guard HOC ─────────────────────────────────────────────────────────
function ModuleRoute({ moduleId, children }) {
  // In development, always render — module gating requires backend to be running
  if (process.env.NODE_ENV === 'development') return children;

  const { lastFetched, enabledIds } = useModuleStore();

  // Pass through if modules haven't been fetched yet
  if (!moduleId || !lastFetched) return children;

  if (!enabledIds.has(moduleId)) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Module Not Enabled</h2>
          <p className="text-slate-500 text-sm">
            This module is not enabled for your organization. Contact your administrator to enable it.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

// ─── Guest Route ─────────────────────────────────────────────────────────────
function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { initAuth } = useAuthStore();
  const { fetchModules } = useModuleStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchModules();
    }
  }, [isAuthenticated, fetchModules]);

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/welcome" element={<Landing />} />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <Login />
            </GuestRoute>
          }
        />

        {/* Protected — all inside Layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Suspense fallback={<PageLoader />}><CFODashboard /></Suspense>} />

          {/* Command Center */}
          <Route path="command-center" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="command-center"><CommandCenter /></ModuleRoute></Suspense>} />

          {/* Core Accounting */}
          <Route path="accounting">
            <Route index element={<Navigate to="journal" replace />} />
            <Route path="journal" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="core-accounting"><JournalVoucher /></ModuleRoute></Suspense>} />
            <Route path="chart-of-accounts" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="core-accounting"><ChartOfAccounts /></ModuleRoute></Suspense>} />
            <Route path="ledger" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="core-accounting"><Ledger /></ModuleRoute></Suspense>} />
            <Route path="fiscal-years" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="core-accounting"><FiscalYears /></ModuleRoute></Suspense>} />
            <Route path="trial-balance" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="core-accounting"><TrialBalance /></ModuleRoute></Suspense>} />
          </Route>

          {/* General Ledger */}
          <Route path="gl">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="general-ledger"><GeneralLedger /></ModuleRoute></Suspense>} />
            <Route path="journals" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="general-ledger"><JournalList /></ModuleRoute></Suspense>} />
          </Route>

          {/* Accounts Receivable */}
          <Route path="ar">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="accounts-receivable"><ARDashboard /></ModuleRoute></Suspense>} />
            <Route path="invoices" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="accounts-receivable"><InvoiceList /></ModuleRoute></Suspense>} />
            <Route path="aging" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="accounts-receivable"><AgingReport /></ModuleRoute></Suspense>} />
          </Route>

          {/* Accounts Payable */}
          <Route path="ap">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="accounts-payable"><APDashboard /></ModuleRoute></Suspense>} />
            <Route path="vendor-invoices" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="accounts-payable"><VendorInvoices /></ModuleRoute></Suspense>} />
          </Route>

          {/* Patient Billing */}
          <Route path="billing">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="patient-billing"><BillingDashboard /></ModuleRoute></Suspense>} />
            <Route path="new" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="patient-billing"><NewInvoice /></ModuleRoute></Suspense>} />
            <Route path="invoices" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="patient-billing"><PatientInvoices /></ModuleRoute></Suspense>} />
            <Route path="payment" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="patient-billing"><PaymentReceipt /></ModuleRoute></Suspense>} />
          </Route>

          {/* Insurance TPA */}
          <Route path="insurance">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="insurance-tpa"><ClaimsDashboard /></ModuleRoute></Suspense>} />
            <Route path="claims/:id" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="insurance-tpa"><ClaimDetail /></ModuleRoute></Suspense>} />
            <Route path="aging" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="insurance-tpa"><TPAAgingReport /></ModuleRoute></Suspense>} />
          </Route>

          {/* Cash & Bank */}
          <Route path="cash-bank">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="cash-bank"><CashBook /></ModuleRoute></Suspense>} />
            <Route path="reconciliation" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="cash-bank"><BankReconciliation /></ModuleRoute></Suspense>} />
          </Route>

          {/* Fixed Assets */}
          <Route path="assets">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fixed-assets"><AssetRegister /></ModuleRoute></Suspense>} />
            <Route path=":id" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fixed-assets"><AssetDetail /></ModuleRoute></Suspense>} />
            <Route path="depreciation" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fixed-assets"><DepreciationRuns /></ModuleRoute></Suspense>} />
          </Route>

          {/* Payroll */}
          <Route path="payroll">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="payroll"><PayrollDashboard /></ModuleRoute></Suspense>} />
            <Route path="run" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="payroll"><PayrollRun /></ModuleRoute></Suspense>} />
            <Route path="payslips" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="payroll"><Payslips /></ModuleRoute></Suspense>} />
          </Route>

          {/* Doctor Payouts */}
          <Route path="doctor-payouts">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="doctor-payout"><DoctorPayouts /></ModuleRoute></Suspense>} />
            <Route path="revenue-sharing" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="doctor-payout"><RevenueSharing /></ModuleRoute></Suspense>} />
          </Route>

          {/* Budgeting */}
          <Route path="budgeting">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="budgeting"><BudgetDashboard /></ModuleRoute></Suspense>} />
            <Route path="variance" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="budgeting"><BudgetVariance /></ModuleRoute></Suspense>} />
          </Route>

          {/* Taxation */}
          <Route path="taxation">
            <Route index element={<Navigate to="gst" replace />} />
            <Route path="gst" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="taxation"><GSTReturns /></ModuleRoute></Suspense>} />
            <Route path="tds" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="taxation"><TDSSummary /></ModuleRoute></Suspense>} />
          </Route>

          {/* Reporting */}
          <Route path="reports">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="reporting"><FinancialReports /></ModuleRoute></Suspense>} />
            <Route path="pl" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="reporting"><PLStatement /></ModuleRoute></Suspense>} />
            <Route path="balance-sheet" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="reporting"><BalanceSheet /></ModuleRoute></Suspense>} />
            <Route path="cash-flow" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="reporting"><CashFlowReport /></ModuleRoute></Suspense>} />
            <Route path="trial-balance" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="reporting"><ReportingTrialBalance /></ModuleRoute></Suspense>} />
            <Route path="fcra-fund-statement" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="reporting"><FCRAFundStatement /></ModuleRoute></Suspense>} />
          </Route>

          {/* FCRA */}
          <Route path="fcra">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRADashboard /></ModuleRoute></Suspense>} />
            <Route path="registration" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRARegistration /></ModuleRoute></Suspense>} />
            <Route path="bank-accounts" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRABankAccounts /></ModuleRoute></Suspense>} />
            <Route path="donors" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRADonors /></ModuleRoute></Suspense>} />
            <Route path="receipts" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAReceipts /></ModuleRoute></Suspense>} />
            <Route path="projects" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAProjects /></ModuleRoute></Suspense>} />
            <Route path="utilisation" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAUtilisation /></ModuleRoute></Suspense>} />
            <Route path="compliance" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRACompliance /></ModuleRoute></Suspense>} />
            <Route path="fc4"        element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAFC4 /></ModuleRoute></Suspense>} />
            <Route path="assets"     element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAAssets /></ModuleRoute></Suspense>} />
            <Route path="disposals"  element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRADisposals /></ModuleRoute></Suspense>} />
            <Route path="income"     element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAAssetIncome /></ModuleRoute></Suspense>} />
            <Route path="reports"    element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAReports /></ModuleRoute></Suspense>} />
            <Route path="audit"      element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="fcra"><FCRAAuditLog /></ModuleRoute></Suspense>} />
          </Route>

          {/* Operations Hub */}
          <Route path="exceptions" element={<Suspense fallback={<PageLoader />}><ExceptionInbox /></Suspense>} />
          <Route path="reconciliation" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="reconciliation"><ReconciliationWorkbench /></ModuleRoute></Suspense>} />
          <Route path="period-close" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="period-close"><PeriodCloseCenter /></ModuleRoute></Suspense>} />

          {/* AI Engine */}
          <Route path="ai">
            <Route index element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="ai-engine"><AIAssistant /></ModuleRoute></Suspense>} />
            <Route path="anomalies" element={<Suspense fallback={<PageLoader />}><ModuleRoute moduleId="ai-engine"><AnomalyDetector /></ModuleRoute></Suspense>} />
          </Route>

          {/* Admin */}
          <Route path="admin">
            <Route index element={<Suspense fallback={<PageLoader />}><AdminDashboard /></Suspense>} />
            <Route path="modules" element={<Suspense fallback={<PageLoader />}><ModuleManager /></Suspense>} />
            <Route path="users" element={<Suspense fallback={<PageLoader />}><UserManagement /></Suspense>} />
            <Route path="audit-logs" element={<Suspense fallback={<PageLoader />}><AuditLogs /></Suspense>} />
            <Route path="workflows" element={<Suspense fallback={<PageLoader />}><WorkflowConfigs /></Suspense>} />
            <Route path="system-settings" element={<Suspense fallback={<PageLoader />}><SystemSettings /></Suspense>} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
