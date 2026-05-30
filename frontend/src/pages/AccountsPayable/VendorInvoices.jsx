import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Upload, Scan, CheckCircle2, Link2, Download,
  Sparkles, History, RefreshCw, ChevronRight, AlertTriangle,
  IndianRupee, Clock, ShieldX, Copy, Zap, X, Building2,
  Calendar, User, Hash, CreditCard, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';

import VIKPIRibbon    from './VI/VIKPIRibbon';
import VIFilterBar    from './VI/VIFilterBar';
import VIGrid         from './VI/VIGrid';
import VIDetailDrawer from './VI/VIDetailDrawer';
import VIAIPanel      from './VI/VIAIPanel';
import VIMatchingPanel from './VI/VIMatchingPanel';
import { MOCK_INVOICES, applyFilters } from './VI/VIConstants';

const INITIAL_FILTERS = {
  search: '', branch: 'all', department: 'all', category: 'all',
  paymentStatus: 'all', approvalStatus: 'all', matchingStatus: 'all', riskLevel: 'all',
};

// ─── Quick Stat Chip ──────────────────────────────────────────────────────────
function QuickStat({ label, value, color, icon: Icon }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} className={color} />
      <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-100">{value}</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
    </div>
  );
}

// ─── Header Action Button ─────────────────────────────────────────────────────
function HeaderBtn({ icon: Icon, label, primary = false, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        primary
          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-200 dark:shadow-violet-900'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-400'
      }`}
    >
      <Icon size={13} />
      {label}
    </motion.button>
  );
}

// ─── New Vendor Invoice Modal ─────────────────────────────────────────────────
function NewVendorInvoiceModal({ onClose }) {
  const [form, setForm] = useState({
    vendor: '', invoiceNo: '', invoiceDate: '', dueDate: '',
    amount: '', gst: '18', description: '', category: 'services',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.vendor || !form.invoiceNo || !form.amount) {
      toast.error('Vendor, Invoice # and Amount are required');
      return;
    }
    toast.success(`Invoice ${form.invoiceNo} created — pending approval`);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 32, scale: 0.95 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Plus size={15} className="text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">New Vendor Invoice</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">AP · Procurement</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Vendor *</label>
              <div className="relative">
                <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.vendor} onChange={e => set('vendor', e.target.value)}
                  placeholder="Vendor name"
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Invoice # *</label>
              <div className="relative">
                <Hash size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.invoiceNo} onChange={e => set('invoiceNo', e.target.value)}
                  placeholder="INV-2026-0001"
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Invoice Date</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date" value={form.invoiceDate} onChange={e => set('invoiceDate', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Due Date</label>
              <div className="relative">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date" value={form.dueDate} onChange={e => set('dueDate', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Amount (₹) *</label>
              <div className="relative">
                <IndianRupee size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number" value={form.amount} onChange={e => set('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">GST %</label>
              <div className="relative">
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={form.gst} onChange={e => set('gst', e.target.value)}
                  className="w-full pl-3 pr-7 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 appearance-none focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {['0','5','12','18','28'].map(v => <option key={v} value={v}>{v}%</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
            <div className="flex gap-2 flex-wrap">
              {['services','supplies','equipment','utilities','others'].map(c => (
                <button
                  key={c} type="button"
                  onClick={() => set('category', c)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-colors ${
                    form.category === c
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-200'
                  }`}
                >{c}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Description</label>
            <textarea
              rows={2} value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Brief description of goods/services..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-none focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[10px] text-slate-400">Invoice will be routed for approval</p>
            <div className="flex gap-2">
              <button
                type="button" onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >Cancel</button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition-colors shadow-sm"
              >Create Invoice</button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Bulk Approve Confirmation ────────────────────────────────────────────────
function BulkApproveModal({ count, onConfirm, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6"
      >
        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={22} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 text-center mb-1">Bulk Approve Invoices</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5">
          {count > 0 ? `Approve ${count} selected invoices?` : 'No invoices selected. Select rows to bulk approve.'}
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
          {count > 0 && (
            <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 px-4 py-2 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors">Approve All</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── OCR Upload Toast ─────────────────────────────────────────────────────────
function OCRToast({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.95 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-4 w-[400px]"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-none">
          <Scan size={20} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Upload Invoice for OCR</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
            Drag & drop PDF/image or click to browse. AI will extract vendor, amounts, and line items automatically.
          </p>
          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <div className="flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 hover:border-violet-500 bg-violet-50 dark:bg-violet-900/20 transition-colors">
                <Upload size={13} className="text-violet-600" />
                <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Choose File</span>
              </div>
            </label>
            <button className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-all">
              <Scan size={12} /> Scan
            </button>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-0.5">
          <X size={15} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VendorInvoices() {
  const navigate = useNavigate();
  const [filters, setFilters]         = useState(INITIAL_FILTERS);
  const [drawerInvoice, setDrawer]    = useState(null);
  const [showAI, setShowAI]           = useState(false);
  const [bottomTab, setBottomTab]     = useState('matching');
  const [showOCR, setShowOCR]         = useState(false);
  const [showNewVI, setShowNewVI]     = useState(false);
  const [showBulkApprove, setShowBulkApprove] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const onFilterChange = useCallback((key, value) => {
    if (key === 'reset') { setFilters(INITIAL_FILTERS); return; }
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const filtered = useMemo(() => applyFilters(MOCK_INVOICES, filters), [filters]);

  const handleExport = useCallback(() => {
    const headers = ['Invoice #','Vendor','Category','Invoice Date','Due Date','Amount','Status','Approval','Risk'];
    const rows = filtered.map(i => [
      i.invoiceNo, i.vendorName, i.category, i.invoiceDate, i.dueDate,
      i.totalAmount, i.paymentStatus, i.approvalStatus, i.riskLevel,
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'vendor-invoices.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported vendor-invoices.csv');
  }, [filtered]);

  const selectedCount = 0; // wired to VIGrid selection via lift-state if needed

  // Derived stats for header
  const pendingApprovals = MOCK_INVOICES.filter(i => i.approvalStatus === 'pending' || i.approvalStatus === 'escalated').length;
  const unmatched        = MOCK_INVOICES.filter(i => i.matchingStatus === 'unmatched' || i.matchingStatus === 'exception').length;
  const criticalRisk     = MOCK_INVOICES.filter(i => i.riskLevel === 'critical').length;
  const overdue          = MOCK_INVOICES.filter(i => i.paymentStatus === 'overdue').length;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex-none bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="flex items-start justify-between gap-4">
          {/* Left: title */}
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <FileText size={15} className="text-violet-600 dark:text-violet-400" />
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">Vendor Invoices</h1>
              <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 px-1.5 py-0.5 rounded-full">AP · Procurement</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Capture, validate, approve, match, and reconcile enterprise procurement invoices in real time.
            </p>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <HeaderBtn icon={Plus}         label="New Invoice"    primary onClick={() => setShowNewVI(true)} />
            <HeaderBtn icon={Upload}       label="Upload"                onClick={() => setShowOCR(true)} />
            <HeaderBtn icon={Scan}         label="OCR Scan"              onClick={() => setShowOCR(true)} />
            <HeaderBtn icon={Link2}        label="Bulk Match"            onClick={() => setBottomTab('matching')} />
            <HeaderBtn icon={CheckCircle2} label="Bulk Approve"          onClick={() => setShowBulkApprove(true)} />
            <HeaderBtn icon={Download}     label="Export"                onClick={handleExport} />
            <HeaderBtn icon={History}      label="Audit Logs"            onClick={() => navigate('/admin/audit-logs')} />
            <button
              onClick={() => setShowAI(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                showAI
                  ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-300 dark:border-violet-700'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-violet-300 hover:text-violet-700'
              }`}
            >
              <Sparkles size={13} className={showAI ? 'text-violet-500' : ''} />
              {showAI ? 'Hide AI' : 'AI Analysis'}
            </button>
          </div>
        </div>

        {/* Header quick stats */}
        <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex-wrap">
          <QuickStat label="total invoices"    value={MOCK_INVOICES.length} color="text-violet-600 dark:text-violet-400" icon={FileText}       />
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <QuickStat label="pending approval"  value={pendingApprovals}      color="text-amber-500"                         icon={Clock}          />
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <QuickStat label="unmatched"         value={unmatched}             color="text-red-500"                           icon={AlertTriangle}  />
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <QuickStat label="critical risk"     value={criticalRisk}          color="text-red-600"                           icon={ShieldX}        />
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <QuickStat label="overdue"           value={overdue}               color="text-orange-500"                        icon={Clock}          />
          <span className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-1.5 ml-auto">
            <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">Live sync</span>
            <button className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1">
              <RefreshCw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Ribbon ──────────────────────────────────────────────────────── */}
      <VIKPIRibbon />

      {/* ── Filter Bar ──────────────────────────────────────────────────────── */}
      <VIFilterBar
        filters={filters}
        onFilterChange={onFilterChange}
        resultCount={filtered.length}
        totalCount={MOCK_INVOICES.length}
        selectedCount={selectedCount}
        onBulkApprove={() => setShowBulkApprove(true)}
        onBulkMatch={() => setBottomTab('matching')}
        onBulkExport={handleExport}
        onBulkDelete={() => toast.error('Select invoices and confirm deletion')}
      />

      {/* ── Main Workspace ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Grid + Bottom Panel column */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Invoice Grid */}
          <VIGrid rows={filtered} onOpenDrawer={inv => setDrawer(inv)} />

          {/* Bottom Intelligence Panel */}
          <VIMatchingPanel activeTab={bottomTab} onTabChange={setBottomTab} />
        </div>

        {/* AI Panel (right) */}
        <AnimatePresence>
          {showAI && (
            <VIAIPanel key="ai-panel" onClose={() => setShowAI(false)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Detail Drawer ────────────────────────────────────────────────────── */}
      <VIDetailDrawer invoice={drawerInvoice} onClose={() => setDrawer(null)} />

      {/* ── OCR Upload Toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showOCR && <OCRToast key="ocr-toast" onClose={() => setShowOCR(false)} />}
      </AnimatePresence>

      {/* ── New Vendor Invoice Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewVI && <NewVendorInvoiceModal key="new-vi" onClose={() => setShowNewVI(false)} />}
      </AnimatePresence>

      {/* ── Bulk Approve Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showBulkApprove && (
          <BulkApproveModal
            key="bulk-approve"
            count={selectedIds.length}
            onConfirm={() => {
              toast.success(`${selectedIds.length} invoices approved`);
              setSelectedIds([]);
            }}
            onClose={() => setShowBulkApprove(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Keyboard Shortcut Hint ───────────────────────────────────────────── */}
      <div className="fixed bottom-3 left-6 flex items-center gap-3 text-[10px] text-slate-400 pointer-events-none select-none z-10">
        {[
          { key: '⌘K', label: 'Search' },
          { key: '⌘N', label: 'New Invoice' },
          { key: '⌘M', label: 'Match PO' },
          { key: '/',   label: 'Filter' },
        ].map(s => (
          <span key={s.key} className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[9px] text-slate-500 dark:text-slate-400">{s.key}</kbd>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
