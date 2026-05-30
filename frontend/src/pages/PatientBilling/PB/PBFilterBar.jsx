import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, X, SlidersHorizontal, Calendar, Sparkles } from 'lucide-react';
import { DEPARTMENTS, BILL_TYPES, PAYMENT_STATUSES, BRANCHES } from './PBConstants';

const DATE_OPTIONS = [
  { value: 'today',      label: 'Today'      },
  { value: 'yesterday',  label: 'Yesterday'  },
  { value: 'this_week',  label: 'This Week'  },
  { value: 'this_month', label: 'This Month' },
  { value: 'custom',     label: 'Custom'     },
];

const AI_QUICK_SEARCHES = [
  'Pending ICU bills',
  'Denied insurance claims',
  'High outstanding dues',
  'Unusual billing adjustments',
  'Overdue payments',
];

export default function PBFilterBar({ filters, onFilterChange }) {
  const searchRef = useRef(null);
  const hasActive = filters.search || filters.dept !== 'all' || filters.payStatus !== 'all'
    || filters.billType !== 'all' || filters.branch !== 'all' || filters.risk !== 'all';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y:  0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-2"
    >
      {/* Row 1: Search + date + quick actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex items-center flex-1 min-w-[260px] max-w-md">
          <Search size={14} className="absolute left-3 text-slate-400 pointer-events-none" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            placeholder="Search patient, UHID, bill no, doctor…"
            className="w-full pl-9 pr-8 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
              rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400
              dark:focus:border-indigo-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 transition-all"
          />
          {filters.search && (
            <button onClick={() => onFilterChange('search', '')}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
          <Calendar size={13} className="text-slate-400" />
          <select
            value={filters.dateRange}
            onChange={e => onFilterChange('dateRange', e.target.value)}
            className="text-sm bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
          >
            {DATE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Department */}
        <select value={filters.dept} onChange={e => onFilterChange('dept', e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer">
          <option value="all">All Departments</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Bill type */}
        <select value={filters.billType} onChange={e => onFilterChange('billType', e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer">
          <option value="all">All Types</option>
          {Object.entries(BILL_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Pay status */}
        <select value={filters.payStatus} onChange={e => onFilterChange('payStatus', e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer">
          <option value="all">All Statuses</option>
          {Object.entries(PAYMENT_STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>

        {/* Risk */}
        <select value={filters.risk} onChange={e => onFilterChange('risk', e.target.value)}
          className="text-sm px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700
            rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer">
          <option value="all">All Risk</option>
          <option value="HIGH">High Risk</option>
          <option value="MEDIUM">Medium Risk</option>
          <option value="LOW">Low Risk</option>
        </select>

        {hasActive && (
          <button onClick={() => onFilterChange('reset')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-400
              border border-rose-200 dark:border-rose-800 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
            <X size={13} /> Clear
          </button>
        )}
      </div>

      {/* Row 2: AI quick-search chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
          <Sparkles size={11} /> AI Search:
        </div>
        {AI_QUICK_SEARCHES.map(q => (
          <button
            key={q}
            onClick={() => onFilterChange('search', q)}
            className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-indigo-50 dark:bg-indigo-900/20
              border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400
              hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
