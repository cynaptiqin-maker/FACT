import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FileText, Plus, Upload, Download, GitMerge, CheckCheck,
  Sparkles, ClipboardList, RefreshCw, Wifi, WifiOff,
  ChevronDown, Building2, GitBranch, Calendar, Layers,
} from 'lucide-react';

import JVLKPIRibbon    from './JVL/JVLKPIRibbon';
import JVLFilterBar    from './JVL/JVLFilterBar';
import JVLGrid         from './JVL/JVLGrid';
import JVLDetailDrawer from './JVL/JVLDetailDrawer';
import JVLAIPanel      from './JVL/JVLAIPanel';
import JVLBulkActionBar from './JVL/JVLBulkActionBar';
import { MOCK_KPIS } from './JVL/jvlConstants';
import { accountingAPI } from '@services/api';

const DEFAULT_FILTERS = {
  search: '',
  quickFilter: 'all',
  branch: 'All Branches',
  department: 'All Departments',
  source: 'All Sources',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
};

const PAGE_SIZE = 25;

const VOUCHER_TYPE_MAP = {
  JOURNAL: 'JV', PAYMENT: 'PV', RECEIPT: 'RV',
  CONTRA: 'CV', DEBIT_NOTE: 'DN', CREDIT_NOTE: 'CN',
};

function normalizeEntry(raw) {
  const debit  = parseFloat(raw.total_debit)  || 0;
  const credit = parseFloat(raw.total_credit) || 0;
  const ps = raw.status === 'pending_approval' ? 'pending' : (raw.status || 'draft');
  return {
    id:             raw.id,
    voucherNumber:  raw.entry_number,
    type:           VOUCHER_TYPE_MAP[raw.voucher_type] || 'JV',
    postingStatus:  ps,
    approvalStatus: raw.status === 'pending_approval' ? 'pending'
                  : ps === 'posted' ? 'approved' : 'not_required',
    date:           raw.date,
    postingDate:    raw.posted_at || raw.date,
    branch:         '—',
    department:     '—',
    costCenter:     '—',
    source:         raw.source_module || 'Manual',
    createdBy:      raw.created_by_name || '—',
    modifiedAt:     raw.updated_at,
    narration:      raw.narration || '',
    reference:      raw.reference || '',
    debit,
    credit,
    isBalanced:     Math.abs(debit - credit) < 0.01,
    riskScore:      'low',
    reconStatus:    'unreconciled',
    lineItems:      [],
    approvalTimeline: [
      { step: 'Created',    user: raw.created_by_name || '—', timestamp: raw.created_at, status: 'done' },
      { step: 'L1 Review',  user: '—', timestamp: '', status: ps === 'posted' ? 'done' : 'pending' },
      { step: 'Post to GL', user: 'System', timestamp: ps === 'posted' ? (raw.posted_at || '') : '', status: ps === 'posted' ? 'done' : 'waiting' },
    ],
  };
}

function ContextPill({ icon: Icon, label, value }) {
  return (
    <div className="hidden md:flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-gray-100 dark:bg-[#1a2840] text-xs border border-gray-200 dark:border-gray-700 select-none">
      <Icon className="h-3 w-3 text-gray-400" />
      <span className="text-gray-400 dark:text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-600 dark:text-gray-300">{value}</span>
    </div>
  );
}

export default function JournalList() {
  const [filters, setFilters]             = useState(DEFAULT_FILTERS);
  const [page, setPage]                   = useState(1);
  const [sortBy, setSortBy]               = useState('date');
  const [sortDir, setSortDir]             = useState('desc');
  const [selectedVoucher, setSelectedVoucher] = useState(null);
  const [rightPanel, setRightPanel]       = useState(null);
  const [selectedRows, setSelectedRows]   = useState(new Set());
  const [kpiFilter, setKpiFilter]         = useState('all');

  useEffect(() => {
    setFilters((f) => ({ ...f, quickFilter: kpiFilter }));
    setPage(1);
  }, [kpiFilter]);

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.querySelector('input[placeholder*="Search"]')?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        toast('Ctrl+N → New Journal Voucher', { icon: '✏️' });
      }
      if (e.key === 'Escape') {
        setRightPanel(null);
        setSelectedRows(new Set());
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        toast(selectedRows.size > 0 ? 'Bulk approve ready — confirm in dialog' : 'Select journals first', { icon: selectedRows.size > 0 ? '✅' : '⚠️' });
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedRows]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['journal-vouchers', filters, page, sortBy, sortDir],
    queryFn: async () => {
      const params = { page, limit: PAGE_SIZE };
      if (filters.search) params.search = filters.search;
      const qf = filters.quickFilter;
      if (qf && qf !== 'all') {
        if (['draft', 'posted', 'reversed'].includes(qf)) params.status = qf;
        else if (qf === 'pending_approval') params.status = 'pending_approval';
      }
      if (filters.source && filters.source !== 'All Sources') params.sourceModule = filters.source;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const res = await accountingAPI.getJournalEntries(params);
      const raw = res.data?.data || [];
      return { entries: raw.map(normalizeEntry), total: res.data?.total || 0 };
    },
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const handleSort = useCallback((col) => {
    setSortDir((d) => (sortBy === col ? (d === 'asc' ? 'desc' : 'asc') : 'desc'));
    setSortBy(col);
    setPage(1);
  }, [sortBy]);

  const handleEntrySelect = (entry) => {
    setSelectedVoucher(entry);
    setRightPanel('detail');
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const handleSelectAll = (ids) => setSelectedRows(new Set(ids));

  const handleBulkAction = (action) => {
    const labels = { approve: 'approved', post: 'posted', export: 'exported', reverse: 'reversed', archive: 'archived', tag: 'tagged' };
    toast.success(`${selectedRows.size} journal${selectedRows.size !== 1 ? 's' : ''} ${labels[action] || action}`);
    if (action !== 'export') setSelectedRows(new Set());
  };

  const handleFiltersChange = (next) => {
    setFilters(next);
    setPage(1);
    setKpiFilter(next.quickFilter || 'all');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#f5efe0] dark:bg-[#0f1923]">

      {/* ── Page Header ── */}
      <div className="flex-shrink-0 bg-white dark:bg-[#162030] border-b border-gray-200 dark:border-[#1e3045] px-6 py-4">
        <div className="flex items-start justify-between gap-4 mb-3">

          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1C3741] to-[#2e5f6e] flex items-center justify-center flex-shrink-0 shadow-sm">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Journal Voucher List</h1>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                  <Wifi className="h-2.5 w-2.5" />Live
                </div>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 hidden sm:block">
                Monitor, search, approve, and audit enterprise journal entries in real time.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0">
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="h-8 px-3 flex items-center gap-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={['h-3.5 w-3.5', isRefetching ? 'animate-spin' : ''].join(' ')} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button className="h-8 px-3 hidden sm:flex items-center gap-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Upload className="h-3.5 w-3.5" />Import
            </button>
            <button className="h-8 px-3 hidden sm:flex items-center gap-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <Download className="h-3.5 w-3.5" />Export
            </button>
            <button className="h-8 px-3 hidden md:flex items-center gap-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <GitMerge className="h-3.5 w-3.5" />Reconcile
            </button>
            <button className="h-8 px-3 hidden md:flex items-center gap-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Bulk Approve</span>
            </button>
            <button
              onClick={() => setRightPanel(rightPanel === 'ai' ? null : 'ai')}
              className={[
                'h-8 px-3 flex items-center gap-1.5 rounded-lg text-sm font-medium border transition-colors',
                rightPanel === 'ai'
                  ? 'bg-violet-600 border-violet-600 text-white'
                  : 'border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20',
              ].join(' ')}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Analysis</span>
            </button>
            <button className="h-8 px-3 hidden lg:flex items-center gap-1.5 rounded-lg text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <ClipboardList className="h-3.5 w-3.5" />Audit Logs
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="h-8 px-3.5 flex items-center gap-1.5 rounded-lg text-sm font-semibold bg-[#1C3741] hover:bg-[#254e5b] text-white transition-colors shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">New Voucher</span>
            </motion.button>
          </div>
        </div>

        {/* Context pills row */}
        <div className="flex items-center gap-2 flex-wrap">
          <ContextPill icon={Building2} label="Org"    value="Apollo Healthcare Group" />
          <ContextPill icon={GitBranch} label="Branch" value="All Branches" />
          <ContextPill icon={Calendar}  label="FY"     value="FY 2025–26" />
          <ContextPill icon={Layers}    label="Period" value="May 2025" />

          {(isLoading || isRefetching) && (
            <span className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-xs text-sky-600 dark:text-sky-400">
              <RefreshCw className="h-3 w-3 animate-spin" />Syncing…
            </span>
          )}

          {selectedRows.size > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-[#1C3741] text-white text-xs font-semibold"
            >
              {selectedRows.size} selected
            </motion.span>
          )}

          {MOCK_KPIS.pendingApprovals > 0 && (
            <button
              onClick={() => setKpiFilter('pending_approval')}
              className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
            >
              <span className="font-bold">{MOCK_KPIS.pendingApprovals}</span>
              <span className="hidden sm:inline">pending approvals</span>
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Ribbon ── */}
      <JVLKPIRibbon kpis={MOCK_KPIS} activeFilter={kpiFilter} onFilterChange={setKpiFilter} />

      {/* ── Filter Bar ── */}
      <JVLFilterBar filters={filters} onChange={handleFiltersChange} />

      {/* ── Main workspace ── */}
      <div className="flex-1 flex overflow-hidden">

        <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#162030]">
          <JVLGrid
            entries={data?.entries || []}
            total={data?.total || 0}
            isLoading={isLoading}
            page={page}
            pageSize={PAGE_SIZE}
            sortBy={sortBy}
            sortDir={sortDir}
            selectedRows={selectedRows}
            onEntrySelect={handleEntrySelect}
            onPageChange={setPage}
            onSort={handleSort}
            onSelectRow={handleSelectRow}
            onSelectAll={handleSelectAll}
          />
        </div>

        <AnimatePresence mode="wait">
          {rightPanel === 'detail' && selectedVoucher && (
            <JVLDetailDrawer key="detail" entry={selectedVoucher} onClose={() => setRightPanel(null)} />
          )}
          {rightPanel === 'ai' && (
            <JVLAIPanel key="ai" filters={filters} onClose={() => setRightPanel(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Bulk action bar ── */}
      <AnimatePresence>
        {selectedRows.size > 0 && (
          <JVLBulkActionBar
            count={selectedRows.size}
            selectedRows={selectedRows}
            onAction={handleBulkAction}
            onClear={() => setSelectedRows(new Set())}
          />
        )}
      </AnimatePresence>

      {/* ── Floating AI button ── */}
      <AnimatePresence>
        {rightPanel !== 'ai' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setRightPanel('ai')}
            className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-xl flex items-center justify-center"
            title="AI Accounting Assistant"
          >
            <Sparkles className="h-5 w-5" />
            {MOCK_KPIS.suspicious > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                {MOCK_KPIS.suspicious}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Keyboard shortcut hint bar ── */}
      <div className="hidden lg:flex flex-shrink-0 items-center gap-4 px-6 py-1 bg-gray-50 dark:bg-[#0f1923] border-t border-gray-100 dark:border-gray-900">
        {[
          ['Ctrl+K', 'Search'],
          ['Ctrl+N', 'New voucher'],
          ['Ctrl+⇧+A', 'Bulk approve'],
          ['Esc', 'Close / deselect'],
        ].map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-600">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-[10px] font-mono text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-700">{key}</kbd>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
