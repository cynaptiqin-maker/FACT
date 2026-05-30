import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronDown, Sparkles,
  Download, RefreshCw, Send, Printer, CheckSquare,
  FileText, Shield, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { BILL_TYPES, DEPARTMENTS, TPA_LIST, BRANCHES, INV_STATUSES, CLAIM_STATUSES, RISK_LEVELS } from './PIConstants';

const AI_QUICK_SEARCHES = [
  'Show unpaid ICU invoices',
  'Find denied insurance claims',
  'Invoices with pending discharge',
  'Detect unusual discounts',
  'High-risk overdue invoices',
  'Missing OT consumable charges',
];

function DropFilter({ label, icon: Icon, options, value, onChange, accent = '#f43f5e' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const active = value && value !== '__ALL__';
  return (
    <div className="relative flex-none" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all
          ${active
            ? 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:border-rose-500/60 dark:text-rose-400'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
      >
        {Icon && <Icon size={13} />}
        <span>{active ? value : label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-1 min-w-[160px] max-h-60 overflow-y-auto
              bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
              rounded-xl shadow-xl z-50 py-1"
          >
            <button
              onClick={() => { onChange('__ALL__'); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50 dark:hover:bg-slate-700/60
                ${!active ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}
            >
              All
            </button>
            {options.map(opt => (
              <button
                key={opt}
                onClick={() => { onChange(opt); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors
                  ${value === opt ? 'text-rose-600 dark:text-rose-400 font-semibold bg-rose-50/50 dark:bg-rose-900/10' : 'text-slate-700 dark:text-slate-300'}`}
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-[11px] font-medium
        bg-rose-100 text-rose-700 dark:bg-rose-900/25 dark:text-rose-400 border border-rose-200 dark:border-rose-700/50"
    >
      {label}
      <button onClick={onRemove} className="hover:bg-rose-200 dark:hover:bg-rose-800/40 rounded-full p-0.5 transition-colors">
        <X size={9} />
      </button>
    </motion.span>
  );
}

export default function PIFilterBar({ filters, setFilters, selectedRows, onBulkAction, onResetFilters }) {
  const [aiMode, setAiMode] = useState(false);
  const [aiQuery, setAiQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const setFilter = useCallback((key, val) => {
    setFilters(f => ({ ...f, [key]: val === '__ALL__' ? '' : val }));
  }, [setFilters]);

  const activeFilters = Object.entries(filters)
    .filter(([k, v]) => v && k !== 'search')
    .map(([k, v]) => ({ key: k, label: `${k}: ${v}` }));

  const bulkActions = [
    { label: 'Submit Claims',   icon: Send,          action: 'submitClaims'   },
    { label: 'Record Payment',  icon: FileText,       action: 'recordPayment'  },
    { label: 'Bulk Export',     icon: Download,       action: 'export'         },
    { label: 'Send Reminder',   icon: RefreshCw,      action: 'sendReminder'   },
    { label: 'Print Invoices',  icon: Printer,        action: 'print'          },
    { label: 'Bulk Approve',    icon: CheckSquare,    action: 'approve'        },
  ];

  return (
    <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">

      {/* ── Search row ── */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        {/* Main search */}
        <div className="relative flex-1 min-w-0">
          {aiMode
            ? <Sparkles size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500" />
            : <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          }
          <input
            type="text"
            value={aiMode ? aiQuery : (filters.search ?? '')}
            onChange={e => aiMode ? setAiQuery(e.target.value) : setFilter('search', e.target.value)}
            placeholder={aiMode ? 'Ask AI — "Find denied ICU claims with high overdue..."' : 'Search invoice, patient, UHID, doctor…'}
            className={`w-full pl-9 pr-4 py-2 rounded-xl text-[13px] border transition-colors outline-none
              ${aiMode
                ? 'border-rose-300 dark:border-rose-600 bg-rose-50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-300 placeholder-rose-400'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:border-rose-400 dark:focus:border-rose-500'
              }`}
          />
        </div>

        {/* AI toggle */}
        <button
          onClick={() => setAiMode(p => !p)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all flex-none
            ${aiMode
              ? 'bg-gradient-to-r from-rose-500 to-pink-500 border-rose-400 text-white shadow-sm'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:border-rose-300'
            }`}
        >
          <Sparkles size={13} />
          AI Search
        </button>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(p => !p)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700
            text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800
            hover:border-slate-300 transition-colors flex-none"
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeFilters.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold">
              {activeFilters.length}
            </span>
          )}
        </button>

        {/* Reset */}
        {activeFilters.length > 0 && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700
              text-[12px] text-slate-500 bg-white dark:bg-slate-800 hover:text-rose-500 transition-colors flex-none"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {/* ── AI quick suggestions ── */}
      <AnimatePresence>
        {aiMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 px-3 pb-2.5 overflow-x-auto scrollbar-none">
              {AI_QUICK_SEARCHES.map(s => (
                <button
                  key={s}
                  onClick={() => setAiQuery(s)}
                  className="flex-none px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap
                    bg-rose-50 dark:bg-rose-900/15 text-rose-600 dark:text-rose-400
                    border border-rose-200 dark:border-rose-700/40 hover:bg-rose-100 dark:hover:bg-rose-900/25 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick filter dropdowns ── */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 px-3 pb-3 pt-1 border-t border-slate-100 dark:border-slate-700/60">
              <DropFilter
                label="Bill Type" icon={FileText}
                options={Object.values(BILL_TYPES).map(b => b.label)}
                value={filters.billType} onChange={v => setFilter('billType', v)}
              />
              <DropFilter
                label="Department"
                options={DEPARTMENTS}
                value={filters.department} onChange={v => setFilter('department', v)}
              />
              <DropFilter
                label="Invoice Status"
                options={Object.values(INV_STATUSES).map(s => s.label)}
                value={filters.status} onChange={v => setFilter('status', v)}
              />
              <DropFilter
                label="Claim Status" icon={Shield}
                options={Object.values(CLAIM_STATUSES).filter(s => s.label !== 'N/A').map(s => s.label)}
                value={filters.claimStatus} onChange={v => setFilter('claimStatus', v)}
              />
              <DropFilter
                label="TPA / Insurer" icon={Shield}
                options={TPA_LIST}
                value={filters.tpa} onChange={v => setFilter('tpa', v)}
              />
              <DropFilter
                label="Branch"
                options={BRANCHES}
                value={filters.branch} onChange={v => setFilter('branch', v)}
              />
              <DropFilter
                label="Risk Level" icon={AlertTriangle}
                options={Object.values(RISK_LEVELS).map(r => r.label)}
                value={filters.riskLevel} onChange={v => setFilter('riskLevel', v)}
              />

              {/* Amount range */}
              <div className="flex items-center gap-1.5 flex-none">
                <span className="text-[11px] text-slate-500 font-medium">₹</span>
                <input
                  type="number" placeholder="Min"
                  value={filters.amtMin ?? ''}
                  onChange={e => setFilter('amtMin', e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                    text-[12px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none
                    focus:border-rose-400"
                />
                <span className="text-[11px] text-slate-400">–</span>
                <input
                  type="number" placeholder="Max"
                  value={filters.amtMax ?? ''}
                  onChange={e => setFilter('amtMax', e.target.value)}
                  className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                    text-[12px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none
                    focus:border-rose-400"
                />
              </div>

              {/* Date range */}
              <div className="flex items-center gap-1.5 flex-none">
                <input
                  type="date"
                  value={filters.dateFrom ?? ''}
                  onChange={e => setFilter('dateFrom', e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                    text-[12px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none
                    focus:border-rose-400"
                />
                <span className="text-[11px] text-slate-400">to</span>
                <input
                  type="date"
                  value={filters.dateTo ?? ''}
                  onChange={e => setFilter('dateTo', e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700
                    text-[12px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none
                    focus:border-rose-400"
                />
              </div>
            </div>

            {/* Active chips */}
            <AnimatePresence>
              {activeFilters.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-1.5 px-3 pb-2.5 flex-wrap overflow-hidden"
                >
                  {activeFilters.map(f => (
                    <ActiveChip key={f.key} label={f.label} onRemove={() => setFilter(f.key, '')} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk action bar ── */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-t border-rose-200 dark:border-rose-800/40 bg-rose-50/60 dark:bg-rose-900/10">
              <span className="flex-none text-[12px] font-semibold text-rose-700 dark:text-rose-400">
                {selectedRows.length} selected
              </span>
              <div className="w-px h-4 bg-rose-200 dark:bg-rose-700/40 flex-none" />
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {bulkActions.map(({ label, icon: Icon, action }) => (
                  <button
                    key={action}
                    onClick={() => onBulkAction?.(action, selectedRows)}
                    className="flex-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                      bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-700/50
                      text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/15
                      transition-colors shadow-sm"
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onBulkAction?.('clearSelection')}
                className="ml-auto flex-none text-[11px] text-slate-500 hover:text-rose-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
