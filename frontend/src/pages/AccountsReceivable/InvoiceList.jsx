import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Plus, Upload, Download, Printer, ChevronDown, Sparkles,
  BarChart3, RefreshCw, Wifi, WifiOff, Building2, Calendar,
  FileText, MoreHorizontal, FileDown, FileSpreadsheet, QrCode,
} from 'lucide-react';

import ILKPIRibbon      from './IL/ILKPIRibbon';
import ILFilterBar      from './IL/ILFilterBar';
import ILGrid           from './IL/ILGrid';
import ILDetailDrawer   from './IL/ILDetailDrawer';
import ILAnalyticsPanel from './IL/ILAnalyticsPanel';
import ILAIPanel        from './IL/ILAIPanel';
import { MOCK_INVOICES, INVOICE_TYPES, PAYMENT_STATUSES } from './IL/ILConstants';
import CsvImportModal from '@components/shared/CsvImportModal';
import { arAPI } from '@services/api';

// ─── Defaults ─────────────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
  search:      '',
  quickFilter: 'all',
  type:        'all',
  status:      'all',
  branch:      'all',
  currency:    'all',
  dateFrom:    '',
  dateTo:      '',
};

const PAGE_SIZE = 15;

// ─── Filtering logic ──────────────────────────────────────────────────────────
function applyFilters(invoices, filters, sortBy, sortDir) {
  let res = [...invoices];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    res = res.filter(inv =>
      inv.invoiceNo.toLowerCase().includes(q) ||
      inv.customer.name.toLowerCase().includes(q) ||
      (inv.gstin && inv.gstin.toLowerCase().includes(q)) ||
      (inv.customer.phone && inv.customer.phone.includes(q)) ||
      inv.total.toString().includes(q)
    );
  }

  switch (filters.quickFilter) {
    case 'paid':      res = res.filter(i => i.paymentStatus === 'PAID');      break;
    case 'pending':   res = res.filter(i => i.paymentStatus === 'PENDING');   break;
    case 'overdue':   res = res.filter(i => i.paymentStatus === 'OVERDUE');   break;
    case 'draft':     res = res.filter(i => i.paymentStatus === 'DRAFT');     break;
    case 'cancelled': res = res.filter(i => i.paymentStatus === 'CANCELLED'); break;
    case 'gst':       res = res.filter(i => i.gstin && i.gstin !== 'N/A');    break;
    case 'credit':    res = res.filter(i => i.type === 'CN');                 break;
    case 'purchase':  res = res.filter(i => i.type === 'PI');                 break;
    default: break;
  }

  if (filters.type     && filters.type     !== 'all') res = res.filter(i => i.type             === filters.type);
  if (filters.status   && filters.status   !== 'all') res = res.filter(i => i.paymentStatus     === filters.status);
  if (filters.branch   && filters.branch   !== 'all') res = res.filter(i => i.branch            === filters.branch);
  if (filters.currency && filters.currency !== 'all') res = res.filter(i => i.currency          === filters.currency);
  if (filters.dateFrom)  res = res.filter(i => i.invoiceDate >= filters.dateFrom);
  if (filters.dateTo)    res = res.filter(i => i.invoiceDate <= filters.dateTo);

  if (sortBy) {
    res.sort((a, b) => {
      let av = a[sortBy], bv = b[sortBy];
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1  : -1;
      return 0;
    });
  }

  return res;
}

// ─── Context pill ─────────────────────────────────────────────────────────────
function ContextPill({ icon: Icon, label, value }) {
  return (
    <div className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs border border-slate-200 dark:border-slate-700 select-none">
      <Icon size={11} className="text-slate-400" />
      <span className="text-slate-400 dark:text-slate-500">{label}:</span>
      <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>
    </div>
  );
}

// ─── Export dropdown ──────────────────────────────────────────────────────────
function ExportDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Download size={13} />
        Export
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.13 }}
              className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-48 py-1"
            >
              {[
                { label: 'Export as PDF',        icon: FileDown        },
                { label: 'Export as Excel',       icon: FileSpreadsheet },
                { label: 'Export as CSV',         icon: FileText        },
                { label: 'GST Filing Export',     icon: Receipt         },
                { label: 'Print Invoice List',    icon: Printer         },
                { label: 'QR Invoice Export',     icon: QrCode          },
              ].map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => { toast.success(`${label} triggered`); setOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <Icon size={13} className="text-slate-400" />
                  {label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Bulk action dropdown ─────────────────────────────────────────────────────
function BulkActionDropdown({ selectedIds = [], onArchive, onImport }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const n = selectedIds.length;

  const handleArchive = () => {
    if (n === 0) { toast.error('Select invoices first'); return; }
    setConfirming(true);
  };

  const confirmArchive = () => {
    setConfirming(false);
    setOpen(false);
    onArchive(selectedIds);
  };

  // Entries: { label, action?, href?, disabled?, hint }
  const items = [
    {
      label: 'Archive Selected',
      hint: n > 0 ? `Cancel ${n} invoice${n !== 1 ? 's' : ''}` : 'Select invoices first',
      action: handleArchive,
      disabled: false,
    },
    {
      label: 'Import CSV',
      hint: 'Bulk-import invoices from a CSV file',
      action: () => { setOpen(false); onImport(); },
      disabled: false,
    },
    { divider: true },
    {
      label: 'Reconcile Selected',
      hint: 'Available from AR Aging → Match Payments',
      disabled: true,
    },
    {
      label: 'Apply Credit Note',
      hint: 'Use Journal Vouchers → Credit Note type',
      disabled: true,
    },
    {
      label: 'Recurring Setup',
      hint: 'Configure from the patient profile page',
      disabled: true,
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <MoreHorizontal size={13} />
        More
        {n > 0 && <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">{n}</span>}
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.96 }}
              transition={{ duration: 0.13 }}
              className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl w-60 py-1"
            >
              {confirming ? (
                <div className="px-3 py-3">
                  <p className="text-xs font-semibold text-slate-800 mb-1">Archive {n} invoice{n !== 1 ? 's' : ''}?</p>
                  <p className="text-[11px] text-slate-500 mb-3">This will mark them as Cancelled. This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirming(false)} className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50">Cancel</button>
                    <button onClick={confirmArchive} className="flex-1 px-2 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700">Archive</button>
                  </div>
                </div>
              ) : (
                items.map((item, i) => item.divider
                  ? <div key={i} className="my-1 border-t border-slate-100 dark:border-slate-800" />
                  : (
                    <button
                      key={item.label}
                      onClick={item.disabled ? undefined : item.action}
                      disabled={item.disabled}
                      className={`w-full px-3 py-2 text-left transition-colors ${
                        item.disabled
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer'
                      }`}
                    >
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.hint}</p>
                    </button>
                  )
                )
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Receipt icon shim (not in lucide top-level) ──────────────────────────────
function Receipt(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" />
      <path d="M16 8H8M16 12H8M12 16H8" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InvoiceList() {
  const [filters, setFilters]           = useState(DEFAULT_FILTERS);
  const [selectedIds, setSelectedIds]   = useState([]);
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAI, setShowAI]             = useState(false);
  const [sortBy, setSortBy]             = useState('invoiceDate');
  const [sortDir, setSortDir]           = useState('desc');
  const [page, setPage]                 = useState(1);
  const [isLive, setIsLive]             = useState(true);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setSelectedIds([]);
  }, []);

  const handleSort = useCallback((col) => {
    setSortBy(prev => {
      if (prev === col) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return col; }
      setSortDir('asc');
      return col;
    });
    setPage(1);
  }, []);

  const filtered = useMemo(
    () => applyFilters(MOCK_INVOICES, filters, sortBy, sortDir),
    [filters, sortBy, sortDir]
  );

  const handleKpiClick = (kpiId) => {
    const map = {
      paid: 'PAID', overdue: 'OVERDUE', draft: 'DRAFT', pending: 'PENDING',
    };
    if (map[kpiId]) {
      handleFilterChange('status', map[kpiId]);
      handleFilterChange('quickFilter', kpiId in { paid: 1, overdue: 1, draft: 1, pending: 1 } ? kpiId : 'all');
    }
  };

  const handleBulkAction = useCallback((action) => {
    if (action === 'Delete') {
      toast.error(`Delete ${selectedIds.length} invoices — confirm in modal`);
    } else {
      toast.success(`${action} applied to ${selectedIds.length} invoice(s)`);
    }
    setSelectedIds([]);
  }, [selectedIds]);

  const handleArchive = useCallback(async (ids) => {
    if (!ids.length) return;
    const results = await Promise.allSettled(
      ids.map(id => arAPI.cancelInvoice(id).catch(e => { throw e; }))
    );
    const ok  = results.filter(r => r.status === 'fulfilled').length;
    const bad = results.filter(r => r.status === 'rejected').length;
    if (ok)  toast.success(`${ok} invoice${ok !== 1 ? 's' : ''} archived`);
    if (bad) toast.error(`${bad} invoice${bad !== 1 ? 's' : ''} could not be archived`);
    setSelectedIds([]);
  }, []);

  // summary stats for breadcrumb area
  const overdueCount = MOCK_INVOICES.filter(i => i.paymentStatus === 'OVERDUE').length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* ── Page Header ── */}
        <div className="flex-none px-6 pt-5 pb-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
          {/* breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 mb-2">
            <span>Finance</span>
            <span>›</span>
            <span>Sales</span>
            <span>›</span>
            <span className="text-slate-700 dark:text-slate-300 font-medium">Invoices</span>
          </div>

          {/* title row */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Invoice Management</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Track, manage, and reconcile all invoices across your organisation
              </p>
            </div>

            {/* actions */}
            <div className="flex items-center gap-2 flex-wrap flex-none">
              {/* live indicator */}
              <button
                onClick={() => { setIsLive(p => !p); toast(isLive ? 'Live updates paused' : 'Live updates resumed'); }}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
                  ${isLive
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                    : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                {isLive ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isLive ? 'Live' : 'Paused'}
              </button>

              <button
                onClick={() => { setShowAnalytics(p => !p); if (showAI) setShowAI(false); }}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
                  ${showAnalytics
                    ? 'border-indigo-400 bg-indigo-600 text-white dark:border-indigo-600'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <BarChart3 size={13} />
                Analytics
              </button>

              <button
                onClick={() => { setShowAI(p => !p); if (showAnalytics) setShowAnalytics(false); }}
                className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
                  ${showAI
                    ? 'border-violet-400 bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <Sparkles size={13} />
                AI Insights
              </button>

              <button
                onClick={() => toast('Import dialog — OCR / CSV / Excel')}
                className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Upload size={13} />
                Import
              </button>

              <ExportDropdown />
              <BulkActionDropdown
                selectedIds={selectedIds}
                onArchive={handleArchive}
                onImport={() => setShowBulkImport(true)}
              />

              <button
                onClick={() => toast.success('Create Invoice — opening form')}
                className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40"
              >
                <Plus size={13} />
                Create Invoice
              </button>
            </div>
          </div>

          {/* context pills */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <ContextPill icon={Building2} label="Branch"   value="All Branches"  />
            <ContextPill icon={Calendar}  label="Period"   value="May 2026"       />
            <ContextPill icon={FileText}  label="Invoices" value={`${MOCK_INVOICES.length} total`} />
            {overdueCount > 0 && (
              <button
                onClick={() => handleFilterChange('quickFilter', 'overdue')}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-400 font-medium hover:bg-rose-100 dark:hover:bg-rose-900/30 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                {overdueCount} overdue
              </button>
            )}
            <button
              onClick={() => { setFilters(DEFAULT_FILTERS); setPage(1); setSelectedIds([]); }}
              className="flex items-center gap-1 h-7 px-2 rounded-lg text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors ml-auto"
            >
              <RefreshCw size={11} />
              Refresh
            </button>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* main table column */}
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* KPI ribbon */}
            <div className="flex-none px-6 py-4 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800/60">
              <ILKPIRibbon onKpiClick={handleKpiClick} />
            </div>

            {/* filter bar */}
            <div className="flex-none px-6 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm">
              <ILFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                selectedRows={selectedIds}
                onBulkAction={handleBulkAction}
                totalCount={MOCK_INVOICES.length}
                filteredCount={filtered.length}
              />
            </div>

            {/* grid */}
            <div className="flex-1 overflow-hidden px-6 py-4">
              {filtered.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full gap-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <FileText size={28} className="text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No invoices found</p>
                    <p className="text-sm text-slate-400 mt-1">Try adjusting your search or clearing filters</p>
                  </div>
                  <button
                    onClick={() => { setFilters(DEFAULT_FILTERS); setPage(1); }}
                    className="h-9 px-4 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </motion.div>
              ) : (
                <ILGrid
                  invoices={filtered}
                  selectedIds={selectedIds}
                  onSelectionChange={setSelectedIds}
                  onRowClick={setActiveInvoice}
                  sortBy={sortBy}
                  sortDir={sortDir}
                  onSort={handleSort}
                  page={page}
                  pageSize={PAGE_SIZE}
                  onPageChange={setPage}
                />
              )}
            </div>
          </div>

          {/* analytics panel */}
          <AnimatePresence>
            {showAnalytics && <ILAnalyticsPanel onClose={() => setShowAnalytics(false)} />}
          </AnimatePresence>

          {/* AI panel */}
          <AnimatePresence>
            {showAI && <ILAIPanel onClose={() => setShowAI(false)} />}
          </AnimatePresence>
        </div>
      </div>

      {/* detail drawer */}
      <ILDetailDrawer
        invoice={activeInvoice}
        onClose={() => setActiveInvoice(null)}
      />

      <CsvImportModal
        open={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        title="Import AR Invoices"
        templateFilename="ar_invoices_template.csv"
        templateHeaders={['patientName', 'invoiceNumber', 'invoiceDate', 'dueDate', 'totalAmount', 'billingType', 'status']}
        templateExample={[
          { patientName: 'John Doe', invoiceNumber: 'INV-2026-00001', invoiceDate: '2026-04-01', dueDate: '2026-04-30', totalAmount: '15000', billingType: 'OP', status: 'FINALIZED' },
        ]}
        onImport={async (rows) => {
          const res = await arAPI.importInvoices(rows);
          return res.data.data;
        }}
      />
    </div>
  );
}
