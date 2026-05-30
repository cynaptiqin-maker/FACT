import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, Sparkles, ChevronDown,
  RefreshCw, Save, Filter,
} from 'lucide-react';
import { CLAIM_STATUSES, CLAIM_TYPES, RISK_LEVELS, AGING_BUCKETS, INSURANCE_TPAS, DEPARTMENTS, BRANCHES } from './ICConstants';

const AI_SUGGESTIONS = [
  'ICU claims pending > 90 days',
  'Denied Oncology claims',
  'Missing documentation — high risk',
  'Star Health claims under review',
  'Claims approaching submission deadline',
  'Predict high denial risk claims',
];

function FilterSelect({ label, value, onChange, options, placeholder = 'All' }) {
  return (
    <div className="relative flex-none">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200
          text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
      >
        <option value="all">{placeholder}: All</option>
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  );
}

export default function ICFilterBar({ filters, onFilterChange, activeCount }) {
  const searchRef = useRef(null);

  const handleKey = (e) => {
    if (e.key === 'Escape') onFilterChange('search', '');
  };

  const statusOptions = Object.entries(CLAIM_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));
  const typeOptions   = Object.entries(CLAIM_TYPES).map(([k, v]) => ({ value: k, label: v.label }));
  const riskOptions   = Object.entries(RISK_LEVELS).map(([k, v]) => ({ value: k, label: v.label }));
  const agingOptions  = AGING_BUCKETS.map(b => ({ value: b.key, label: b.label }));
  const tpaOptions    = INSURANCE_TPAS.map(t => ({ value: t, label: t }));
  const deptOptions   = DEPARTMENTS.map(d => ({ value: d, label: d }));
  const branchOptions = BRANCHES.map(b => ({ value: b, label: b }));

  const settlementOptions = [
    { value: 'PENDING',  label: 'Pending' },
    { value: 'PARTIAL',  label: 'Partial' },
    { value: 'SETTLED',  label: 'Settled' },
    { value: 'NOT_APPLICABLE', label: 'N/A' },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 space-y-2.5">

      {/* ── Row 1: Search + Quick Filters ──────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search claims, patient, UHID, invoice, TPA…"
            className="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status */}
        <FilterSelect label="Status" value={filters.status} onChange={v => onFilterChange('status', v)} options={statusOptions} placeholder="Status" />

        {/* Type */}
        <FilterSelect label="Type" value={filters.claimType} onChange={v => onFilterChange('claimType', v)} options={typeOptions} placeholder="Type" />

        {/* TPA */}
        <FilterSelect label="TPA" value={filters.tpa} onChange={v => onFilterChange('tpa', v)} options={tpaOptions} placeholder="TPA" />

        {/* Aging */}
        <FilterSelect label="Aging" value={filters.aging} onChange={v => onFilterChange('aging', v)} options={agingOptions} placeholder="Aging" />

        {/* Risk */}
        <FilterSelect label="Risk" value={filters.risk} onChange={v => onFilterChange('risk', v)} options={riskOptions} placeholder="Risk" />

        {/* Dept */}
        <FilterSelect label="Dept" value={filters.department} onChange={v => onFilterChange('department', v)} options={deptOptions} placeholder="Department" />

        {/* Settlement */}
        <FilterSelect label="Settlement" value={filters.settlement} onChange={v => onFilterChange('settlement', v)} options={settlementOptions} placeholder="Settlement" />

        {/* Branch */}
        <FilterSelect label="Branch" value={filters.branch} onChange={v => onFilterChange('branch', v)} options={branchOptions} placeholder="Branch" />

        <div className="flex items-center gap-2 ml-auto">
          {activeCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onFilterChange('reset')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20
                text-indigo-600 dark:text-indigo-400 text-xs font-semibold border border-indigo-200 dark:border-indigo-700/40 hover:bg-indigo-100 transition-colors"
            >
              <X size={11} />
              Clear ({activeCount})
            </motion.button>
          )}
          <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700
            text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <Save size={11} />
            Save View
          </button>
        </div>
      </div>

      {/* ── Row 2: AI Search Suggestions ───────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        <div className="flex items-center gap-1 text-[10.5px] font-semibold text-indigo-500 dark:text-indigo-400 flex-none">
          <Sparkles size={10} />
          AI:
        </div>
        {AI_SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onFilterChange('search', s)}
            className="flex-none px-2.5 py-1 rounded-full text-[11px] font-medium
              bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400
              border border-indigo-100 dark:border-indigo-800/40
              hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
