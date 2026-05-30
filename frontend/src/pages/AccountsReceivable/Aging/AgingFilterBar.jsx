import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronDown, Download,
  Send, UserCheck, GitMerge, Trash2, BellRing, Filter,
} from 'lucide-react';
import { AGING_BUCKETS_CONFIG, DEPARTMENTS, BRANCHES, COLLECTORS, RECEIVABLE_TYPES } from './AgingConstants';

const BUCKET_PILLS = [
  { key: 'all',     label: 'All Buckets', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
  { key: 'current', label: 'Current',     color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' },
  { key: 'd31',     label: '31–60d',      color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'   },
  { key: 'd61',     label: '61–90d',      color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
  { key: 'd91',     label: '91–120d',     color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'         },
  { key: 'd121',    label: '120+ Days',   color: 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400'},
];

const AI_SUGGESTIONS = [
  'Show ICU claims overdue 90+ days',
  'Find high-risk insurance receivables',
  'Show unpaid pharmacy invoices',
  'Critical CGHS claims this week',
  'Accounts likely to default',
];

export default function AgingFilterBar({
  filters, onFilterChange, selectedRows, onBulkAction, totalCount, filteredCount,
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && v !== 'all' && k !== 'search' && k !== 'amtMin' && k !== 'amtMax',
  ).length + (filters.amtMin || filters.amtMax ? 1 : 0);

  const hasBulk = selectedRows.length > 0;

  return (
    <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* ── Primary filter row ───────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5">

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search invoices, patients, TPAs…"
            className="w-full h-8 pl-8 pr-8 text-xs rounded-lg border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400
              transition-colors"
          />
          {filters.search && (
            <button onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={12} />
            </button>
          )}

          {/* AI suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && !filters.search && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute left-0 right-0 top-full mt-1 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden"
              >
                <div className="px-3 py-2 text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  AI-powered search suggestions
                </div>
                {AI_SUGGESTIONS.map((s, i) => (
                  <button key={i} onMouseDown={() => onFilterChange('search', s)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 text-left transition-colors">
                    <Search size={11} className="text-cyan-500 flex-none" />
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Aging bucket pills */}
        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-2.5">
          {BUCKET_PILLS.map(b => (
            <button
              key={b.key}
              onClick={() => onFilterChange('aging', b.key)}
              className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap
                ${filters.aging === b.key
                  ? b.color + ' ring-1 ring-inset ring-current/30 shadow-sm'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Filter count + toggle */}
        <button
          onClick={() => setShowAdvanced(p => !p)}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
            ${showAdvanced || activeFilterCount > 0
              ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:border-slate-300'}`}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] font-bold flex items-center justify-center">{activeFilterCount}</span>
          )}
          <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>

        {/* Count */}
        <span className="text-[11px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {filteredCount !== totalCount ? (
            <><span className="text-blue-600 dark:text-blue-400 font-semibold">{filteredCount}</span> of {totalCount}</>
          ) : totalCount} records
        </span>

        {/* Reset */}
        {activeFilterCount > 0 && (
          <button onClick={() => onFilterChange('reset')}
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-[11px] text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <X size={12} />Reset
          </button>
        )}
      </div>

      {/* ── Advanced filter panel ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-slate-100 dark:border-slate-800"
          >
            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {/* Type */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Type</label>
                <select value={filters.type} onChange={e => onFilterChange('type', e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="all">All Types</option>
                  {Object.entries(RECEIVABLE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {/* Branch */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Branch</label>
                <select value={filters.branch} onChange={e => onFilterChange('branch', e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="all">All Branches</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Department</label>
                <select value={filters.department} onChange={e => onFilterChange('department', e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="all">All Depts</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Risk */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Risk Level</label>
                <select value={filters.risk} onChange={e => onFilterChange('risk', e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="all">All Risks</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              {/* Collector */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Collector</label>
                <select value={filters.collector} onChange={e => onFilterChange('collector', e.target.value)}
                  className="w-full h-7 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400">
                  <option value="all">All Collectors</option>
                  {COLLECTORS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Amount range */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Amount (₹)</label>
                <div className="flex gap-1">
                  <input type="number" placeholder="Min" value={filters.amtMin}
                    onChange={e => onFilterChange('amtMin', e.target.value)}
                    className="w-1/2 h-7 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield]" />
                  <input type="number" placeholder="Max" value={filters.amtMax}
                    onChange={e => onFilterChange('amtMax', e.target.value)}
                    className="w-1/2 h-7 px-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-400 [appearance:textfield]" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {hasBulk && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-2">
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                {selectedRows.length} selected
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'remind',  icon: BellRing,   label: 'Send Reminders' },
                  { id: 'assign',  icon: UserCheck,  label: 'Assign Collector' },
                  { id: 'export',  icon: Download,   label: 'Export Selected' },
                  { id: 'reconcile', icon: GitMerge, label: 'Reconcile' },
                  { id: 'writeoff', icon: Trash2,    label: 'Write-Off', danger: true },
                ].map(a => (
                  <button key={a.id} onClick={() => onBulkAction(a.id, selectedRows)}
                    className={`flex items-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium border transition-colors
                      ${a.danger
                        ? 'border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        : 'border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 bg-white dark:bg-slate-900 hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}>
                    <a.icon size={12} />{a.label}
                  </button>
                ))}
              </div>
              <button onClick={() => onBulkAction('clear', [])}
                className="ml-auto text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                Clear selection
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
