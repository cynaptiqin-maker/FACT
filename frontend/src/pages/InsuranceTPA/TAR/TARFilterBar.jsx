import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, Sparkles, ChevronDown, Save, Filter, RotateCcw,
} from 'lucide-react';
import {
  AGING_BUCKETS, INSURANCE_TPAS, CLAIM_TYPES, DEPARTMENTS, RISK_LEVELS,
  BRANCHES,
} from './TARConstants';
import { FOLLOWUP_STATUSES, SETTLEMENT_STATUSES } from './TARConstants';

const AI_SUGGESTIONS = [
  '>90 days overdue claims',
  'High-risk CGHS claims',
  'Denied Oncology — appeal pending',
  'Star Health non-responsive',
  'Missing documents — urgent',
  'Critical aging — write-off risk',
  'Claims approaching 90-day threshold',
];

const SAVED_VIEWS = [
  { id: 'high-risk',  label: 'High Risk',       preset: { risk: 'critical', aging: 'all' } },
  { id: '90d-plus',   label: '90d+ Overdue',     preset: { aging: 'days91', risk: 'all' } },
  { id: 'denied',     label: 'Denied Claims',    preset: { settlement: 'all', risk: 'all' } },
];

function FilterSelect({ label, value, onChange, options, placeholder = 'All' }) {
  return (
    <div className="relative flex-none">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none h-8 pl-3 pr-7 rounded-lg border border-slate-200 dark:border-slate-700
          bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200
          text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
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

export default function TARFilterBar({ filters, onChange, total, filtered, selectedCount, onBulkAction }) {
  const searchRef = useRef(null);

  const handleKey = (e) => {
    if (e.key === 'Escape') onChange('search', '');
  };

  const agingOptions   = AGING_BUCKETS.map(b => ({ value: b.key, label: b.label }));
  const tpaOptions     = INSURANCE_TPAS.map(t => ({ value: t, label: t }));
  const typeOptions    = Object.entries(CLAIM_TYPES).map(([k, v]) => ({ value: k, label: v.label }));
  const deptOptions    = DEPARTMENTS.map(d => ({ value: d, label: d }));
  const riskOptions    = Object.entries(RISK_LEVELS).map(([k, v]) => ({ value: k, label: v.label }));
  const branchOptions  = BRANCHES.map(b => ({ value: b, label: b }));
  const followUpOptions = Object.entries(FOLLOWUP_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));
  const settlementOptions = Object.entries(SETTLEMENT_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));

  // Count active filters
  const activeCount = Object.entries(filters).filter(([k, v]) => k !== 'search' && v !== 'all').length
    + (filters.search ? 1 : 0);

  // Active filter chips
  const activeChips = [];
  if (filters.search) activeChips.push({ key: 'search', label: `"${filters.search}"` });
  if (filters.aging !== 'all')      activeChips.push({ key: 'aging',      label: AGING_BUCKETS.find(b => b.key === filters.aging)?.label ?? filters.aging });
  if (filters.tpa !== 'all')        activeChips.push({ key: 'tpa',        label: filters.tpa });
  if (filters.claimType !== 'all')  activeChips.push({ key: 'claimType',  label: CLAIM_TYPES[filters.claimType]?.label ?? filters.claimType });
  if (filters.department !== 'all') activeChips.push({ key: 'department', label: filters.department });
  if (filters.risk !== 'all')       activeChips.push({ key: 'risk',       label: RISK_LEVELS[filters.risk]?.label ?? filters.risk });
  if (filters.followUp !== 'all')   activeChips.push({ key: 'followUp',   label: FOLLOWUP_STATUSES[filters.followUp]?.label ?? filters.followUp });
  if (filters.settlement !== 'all') activeChips.push({ key: 'settlement', label: SETTLEMENT_STATUSES[filters.settlement]?.label ?? filters.settlement });
  if (filters.branch !== 'all')     activeChips.push({ key: 'branch',     label: filters.branch });

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 space-y-2.5">

      {/* Row 1: Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* Search */}
        <div className="relative flex-1 min-w-64 max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchRef}
            value={filters.search}
            onChange={e => onChange('search', e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search claims, patient, UHID, TPA, diagnosis… (Ctrl+K)"
            className="w-full h-9 pl-9 pr-10 rounded-xl border border-slate-200 dark:border-slate-700
              bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm
              placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400"
          />
          {filters.search && (
            <button
              onClick={() => onChange('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        <FilterSelect label="Aging" value={filters.aging} onChange={v => onChange('aging', v)} options={agingOptions} placeholder="Aging Bucket" />
        <FilterSelect label="TPA" value={filters.tpa} onChange={v => onChange('tpa', v)} options={tpaOptions} placeholder="TPA / Insurer" />
        <FilterSelect label="Type" value={filters.claimType} onChange={v => onChange('claimType', v)} options={typeOptions} placeholder="Claim Type" />
        <FilterSelect label="Dept" value={filters.department} onChange={v => onChange('department', v)} options={deptOptions} placeholder="Department" />
        <FilterSelect label="Risk" value={filters.risk} onChange={v => onChange('risk', v)} options={riskOptions} placeholder="Risk Level" />
        <FilterSelect label="Follow-up" value={filters.followUp} onChange={v => onChange('followUp', v)} options={followUpOptions} placeholder="Follow-up" />
        <FilterSelect label="Settlement" value={filters.settlement} onChange={v => onChange('settlement', v)} options={settlementOptions} placeholder="Settlement" />
        <FilterSelect label="Branch" value={filters.branch} onChange={v => onChange('branch', v)} options={branchOptions} placeholder="Branch" />

        {/* Right actions */}
        <div className="flex items-center gap-2 ml-auto flex-wrap">
          {/* Row count */}
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {filtered} / {total} records
          </span>

          {/* Bulk action button */}
          {selectedCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onBulkAction?.('bulk')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-500 hover:bg-amber-600
                text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Filter size={11} />
              Bulk Actions ({selectedCount})
            </motion.button>
          )}

          {/* Reset */}
          {activeCount > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={() => onChange('reset')}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-amber-50 dark:bg-amber-900/20
                text-amber-600 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-700/40 hover:bg-amber-100 transition-colors"
            >
              <RotateCcw size={11} />
              Clear ({activeCount})
            </motion.button>
          )}

          {/* Saved views */}
          <div className="relative group">
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700
              text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Save size={11} />
              Saved Views
              <ChevronDown size={10} />
            </button>
            <div className="absolute right-0 top-9 z-30 w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-all">
              {SAVED_VIEWS.map(v => (
                <button
                  key={v.id}
                  onClick={() => {
                    Object.entries(v.preset).forEach(([k, val]) => onChange(k, val));
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400"
                >
                  <Filter size={10} className="text-slate-400" />
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: AI Suggestion chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        <div className="flex items-center gap-1 text-[10.5px] font-semibold text-amber-500 dark:text-amber-400 flex-none">
          <Sparkles size={10} />
          AI:
        </div>
        {AI_SUGGESTIONS.map(s => (
          <button
            key={s}
            onClick={() => onChange('search', s)}
            className="flex-none px-2.5 py-1 rounded-full text-[11px] font-medium
              bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400
              border border-amber-100 dark:border-amber-800/40
              hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Row 3: Active filter chips */}
      <AnimatePresence>
        {activeChips.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 flex-wrap overflow-hidden"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Active:</span>
            {activeChips.map(chip => (
              <motion.span
                key={chip.key}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
                  bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400
                  border border-indigo-200 dark:border-indigo-700/40"
              >
                {chip.label}
                <button onClick={() => onChange(chip.key, 'all')} className="hover:text-red-500 transition-colors">
                  <X size={9} />
                </button>
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
