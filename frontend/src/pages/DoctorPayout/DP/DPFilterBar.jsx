// ─── Doctor Payouts — Filter Bar ──────────────────────────────────────────────
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronDown, Sparkles,
  CheckSquare, Square, Trash2, Send, Download, RefreshCw,
  CreditCard, BookOpen, GitMerge, Zap,
} from 'lucide-react';
import { DEPARTMENTS, BRANCHES, PAYOUT_STATUSES, PAYOUT_TYPES, RISK_LEVELS } from './DPConstants';

const AI_QUICK_SEARCHES = [
  'Show pending surgeon payouts',
  'Find payout anomalies in cardiology',
  'Show unpaid ICU incentives',
  'Detect abnormal revenue sharing',
  'Visiting consultants pending transfer',
  'Insurance-linked payouts under review',
];

function FilterChip({ label, value, options, onChange, color = '#059669' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const active = value !== 'all';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
          active
            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        {active && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />}
        <span>{active ? options.find(o => o.value === value)?.label ?? label : label}</span>
        <ChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-1.5 z-20 min-w-[160px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    value === opt.value ? 'text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-900/20' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {value === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-none" />}
                  {value !== opt.value && <span className="w-1.5 h-1.5 flex-none" />}
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function BulkActionBar({ count, onAction }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl"
    >
      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mr-1">
        {count} selected
      </span>
      {[
        { id: 'approve',   icon: CheckSquare,  label: 'Approve',          cls: 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40' },
        { id: 'transfer',  icon: CreditCard,   label: 'Process Transfer',  cls: 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20' },
        { id: 'export',    icon: Download,     label: 'Export',            cls: 'text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800' },
        { id: 'reconcile', icon: GitMerge,     label: 'Reconcile',         cls: 'text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' },
        { id: 'gl',        icon: BookOpen,     label: 'Post to GL',        cls: 'text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20' },
        { id: 'deselect',  icon: X,            label: 'Clear',             cls: 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20' },
      ].map(({ id, icon: Icon, label, cls }) => (
        <button
          key={id}
          onClick={() => onAction(id)}
          title={label}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${cls}`}
        >
          <Icon size={12} />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </motion.div>
  );
}

export default function DPFilterBar({ filters, onFilterChange, selectedCount, onBulkAction, activeFilterCount }) {
  const [showAI, setShowAI] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    ...Object.entries(PAYOUT_STATUSES).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    ...Object.entries(PAYOUT_TYPES).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  const riskOptions = [
    { value: 'all', label: 'All Risk Levels' },
    ...Object.entries(RISK_LEVELS).map(([k, v]) => ({ value: k, label: v.label })),
  ];

  const deptOptions = [
    { value: 'all', label: 'All Departments' },
    ...DEPARTMENTS.map(d => ({ value: d, label: d })),
  ];

  const branchOptions = [
    { value: 'all', label: 'All Branches' },
    ...BRANCHES.map(b => ({ value: b, label: b })),
  ];

  const empTypeOptions = [
    { value: 'all', label: 'All Employment Types' },
    { value: 'FULL_TIME', label: 'Full-Time' },
    { value: 'VISITING', label: 'Visiting' },
    { value: 'TELEMEDICINE', label: 'Telemedicine' },
    { value: 'CONTRACTUAL', label: 'Contractual' },
  ];

  const paymentOptions = [
    { value: 'all', label: 'All Payment Statuses' },
    { value: 'UNPAID', label: 'Unpaid' },
    { value: 'PENDING_TRANSFER', label: 'Pending Transfer' },
    { value: 'TRANSFERRED', label: 'Transferred' },
    { value: 'PAID', label: 'Paid' },
  ];

  return (
    <div className="space-y-2">
      {/* Primary search + toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            placeholder="Search doctor, payout ID, department, specialty…"
            className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
          {filters.search && (
            <button onClick={() => onFilterChange('search', '')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}
        </div>

        {/* AI search toggle */}
        <button
          onClick={() => setShowAI(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
            showAI
              ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-400'
          }`}
        >
          <Sparkles size={12} />
          AI Search
        </button>

        {/* Advanced filters toggle */}
        <button
          onClick={() => setShowAdvanced(o => !o)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
            showAdvanced || activeFilterCount > 0
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-400 text-emerald-700 dark:text-emerald-400'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal size={12} />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <button
            onClick={() => onFilterChange('reset')}
            className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all"
          >
            <RefreshCw size={11} />
            Clear
          </button>
        )}
      </div>

      {/* AI quick search */}
      <AnimatePresence>
        {showAI && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl">
              <Sparkles size={14} className="text-cyan-500 flex-none" />
              <span className="text-[11px] font-semibold text-cyan-700 dark:text-cyan-400 mr-1">AI Natural Language Search:</span>
              <div className="flex flex-wrap gap-1.5">
                {AI_QUICK_SEARCHES.map(q => (
                  <button
                    key={q}
                    onClick={() => { onFilterChange('search', q); setShowAI(false); }}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-800 text-[11px] text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors font-medium"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced filter chips */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-1">
              <FilterChip
                label="Status"
                value={filters.status}
                options={statusOptions}
                onChange={v => onFilterChange('status', v)}
              />
              <FilterChip
                label="Payout Type"
                value={filters.payoutType}
                options={typeOptions}
                onChange={v => onFilterChange('payoutType', v)}
              />
              <FilterChip
                label="Department"
                value={filters.department}
                options={deptOptions}
                onChange={v => onFilterChange('department', v)}
              />
              <FilterChip
                label="Branch"
                value={filters.branch}
                options={branchOptions}
                onChange={v => onFilterChange('branch', v)}
              />
              <FilterChip
                label="Employment"
                value={filters.employmentType}
                options={empTypeOptions}
                onChange={v => onFilterChange('employmentType', v)}
              />
              <FilterChip
                label="Payment"
                value={filters.paymentStatus}
                options={paymentOptions}
                onChange={v => onFilterChange('paymentStatus', v)}
              />
              <FilterChip
                label="Risk Level"
                value={filters.riskLevel}
                options={riskOptions}
                onChange={v => onFilterChange('riskLevel', v)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedCount > 0 && (
          <BulkActionBar count={selectedCount} onAction={onBulkAction} />
        )}
      </AnimatePresence>
    </div>
  );
}
