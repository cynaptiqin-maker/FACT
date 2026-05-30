import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, X, SlidersHorizontal, ChevronDown,
  Building2, Users, Calendar, AlertTriangle, Tag,
  RefreshCw, Download, CheckSquare, Layers,
  CheckCircle2, Ban, Clock, Send, GitMerge,
} from 'lucide-react';
import {
  VENDOR_CATEGORIES, PAYMENT_STATUSES, APPROVAL_STATUSES,
  AGING_BUCKETS, BRANCHES, DEPARTMENTS, PROC_CATEGORIES,
} from './APConstants';

const RISK_OPTIONS = ['Low','Medium','High','Critical'];
const PAY_KEYS     = Object.keys(PAYMENT_STATUSES);
const APV_KEYS     = Object.keys(APPROVAL_STATUSES);

function DropFilter({ icon: Icon, label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value !== 'all' && value ? options.find(o => (o.key || o) === value) : null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
          ${selected
            ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-slate-400'}`}
      >
        <Icon size={12} />
        {selected ? (selected.label || selected) : label}
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
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-1 left-0 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl min-w-44 py-1 max-h-64 overflow-y-auto"
            >
              <div onClick={() => { onChange('all'); setOpen(false); }}
                className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                All
              </div>
              {options.map(o => {
                const key = o.key || o;
                const lbl = o.label || o;
                return (
                  <div key={key} onClick={() => { onChange(key); setOpen(false); }}
                    className={`px-3 py-2 text-xs cursor-pointer transition-colors
                      ${value === key ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    {lbl}
                  </div>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ActiveChip({ label, onRemove }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 text-[11px] font-medium"
    >
      {label}
      <button onClick={onRemove} className="hover:text-amber-900 dark:hover:text-amber-100">
        <X size={10} />
      </button>
    </motion.span>
  );
}

const AI_SEARCHES = [
  'Show overdue ICU procurement invoices',
  'Find duplicate pharmacy vendor invoices',
  'Show high-risk payment approvals',
  'Find invoices pending more than 60 days',
];

export default function APFilterBar({ filters, onFilterChange, selectedRows, onBulkAction, totalCount, filteredCount }) {
  const [aiMode, setAiMode]             = useState(false);
  const [searchVal, setSearchVal]       = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAISugg, setShowAISugg]     = useState(false);

  const activeFilters = [];
  if (filters.category     && filters.category     !== 'all') activeFilters.push({ key: 'category',     label: `Category: ${VENDOR_CATEGORIES[filters.category]?.label ?? filters.category}` });
  if (filters.payStatus    && filters.payStatus    !== 'all') activeFilters.push({ key: 'payStatus',    label: `Payment: ${PAYMENT_STATUSES[filters.payStatus]?.label}` });
  if (filters.apvStatus    && filters.apvStatus    !== 'all') activeFilters.push({ key: 'apvStatus',    label: `Approval: ${APPROVAL_STATUSES[filters.apvStatus]?.label}` });
  if (filters.aging        && filters.aging        !== 'all') activeFilters.push({ key: 'aging',        label: `Aging: ${AGING_BUCKETS.find(b => b.key === filters.aging)?.label}` });
  if (filters.branch       && filters.branch       !== 'all') activeFilters.push({ key: 'branch',       label: `Branch: ${filters.branch}` });
  if (filters.risk         && filters.risk         !== 'all') activeFilters.push({ key: 'risk',         label: `Risk: ${filters.risk}` });
  if (filters.department   && filters.department   !== 'all') activeFilters.push({ key: 'department',   label: `Dept: ${filters.department}` });

  const handleSearch = (v) => {
    setSearchVal(v);
    onFilterChange('search', v);
    setShowAISugg(aiMode && v.length === 0);
  };

  const bulkActions = [
    { id: 'approve',    label: 'Approve',         icon: CheckCircle2, color: 'text-emerald-600' },
    { id: 'schedule',   label: 'Schedule Payment', icon: Calendar,     color: 'text-blue-600'    },
    { id: 'hold',       label: 'Put On Hold',      icon: Ban,          color: 'text-orange-600'  },
    { id: 'reconcile',  label: 'Reconcile',        icon: GitMerge,     color: 'text-violet-600'  },
    { id: 'remind',     label: 'Send to Approver', icon: Send,         color: 'text-amber-600'   },
    { id: 'export',     label: 'Export',           icon: Download,     color: 'text-slate-600'   },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-900"
          >
            <div className="px-4 py-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  {selectedRows.length} selected
                </span>
              </div>
              <div className="flex items-center gap-1">
                {bulkActions.map(a => (
                  <button
                    key={a.id}
                    onClick={() => onBulkAction(a.id, selectedRows)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors ${a.color}`}
                  >
                    <a.icon size={12} />{a.label}
                  </button>
                ))}
              </div>
              <span className="ml-auto text-xs text-amber-700 dark:text-amber-400 italic">
                Validation preview available before action
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Main filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search with AI mode */}
          <div className={`relative flex-1 min-w-64 transition-all ${aiMode ? 'ring-2 ring-cyan-400 rounded-xl' : ''}`}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              {aiMode ? <Sparkles size={14} className="text-cyan-500 animate-pulse" /> : <Search size={14} className="text-slate-400" />}
            </div>
            <input
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => aiMode && setShowAISugg(true)}
              onBlur={() => setTimeout(() => setShowAISugg(false), 150)}
              placeholder={aiMode ? 'Ask AI: "Show overdue ICU invoices"…' : 'Search invoices, vendors, PO numbers…'}
              className={`w-full h-9 pl-9 pr-24 rounded-xl border text-sm outline-none transition-colors
                ${aiMode
                  ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20 dark:border-cyan-700 placeholder:text-cyan-400 dark:text-slate-200'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 placeholder:text-slate-400 dark:text-slate-200 focus:border-amber-400 dark:focus:border-amber-500'}`}
            />
            {searchVal && (
              <button onClick={() => handleSearch('')} className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
            <button
              onClick={() => { setAiMode(p => !p); setShowAISugg(false); }}
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all
                ${aiMode ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-cyan-100 hover:text-cyan-600'}`}
            >
              <Sparkles size={10} />AI
            </button>

            {/* AI suggestion dropdown */}
            <AnimatePresence>
              {showAISugg && aiMode && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 left-0 right-0 z-30 bg-white dark:bg-slate-900 border border-cyan-200 dark:border-cyan-800 rounded-xl shadow-xl py-1"
                >
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles size={9} />Suggested searches
                  </div>
                  {AI_SEARCHES.map((q, i) => (
                    <div
                      key={i}
                      onMouseDown={() => handleSearch(q)}
                      className="px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 cursor-pointer"
                    >
                      {q}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick filters */}
          <DropFilter
            icon={Layers}
            label="Category"
            options={Object.keys(VENDOR_CATEGORIES).map(k => ({ key: k, label: VENDOR_CATEGORIES[k].label }))}
            value={filters.category}
            onChange={v => onFilterChange('category', v)}
          />
          <DropFilter
            icon={Clock}
            label="Payment"
            options={PAY_KEYS.map(k => ({ key: k, label: PAYMENT_STATUSES[k].label }))}
            value={filters.payStatus}
            onChange={v => onFilterChange('payStatus', v)}
          />
          <DropFilter
            icon={Tag}
            label="Approval"
            options={APV_KEYS.map(k => ({ key: k, label: APPROVAL_STATUSES[k].label }))}
            value={filters.apvStatus}
            onChange={v => onFilterChange('apvStatus', v)}
          />
          <DropFilter
            icon={Calendar}
            label="Aging"
            options={AGING_BUCKETS.map(b => ({ key: b.key, label: b.label }))}
            value={filters.aging}
            onChange={v => onFilterChange('aging', v)}
          />
          <DropFilter
            icon={Building2}
            label="Branch"
            options={BRANCHES}
            value={filters.branch}
            onChange={v => onFilterChange('branch', v)}
          />
          <DropFilter
            icon={AlertTriangle}
            label="Risk"
            options={RISK_OPTIONS.map(r => ({ key: r, label: r }))}
            value={filters.risk}
            onChange={v => onFilterChange('risk', v)}
          />

          <button
            onClick={() => setShowAdvanced(p => !p)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
              ${showAdvanced ? 'border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-slate-400'}`}
          >
            <SlidersHorizontal size={12} />Advanced
          </button>

          {activeFilters.length > 0 && (
            <button onClick={() => onFilterChange('reset')} className="flex items-center gap-1 h-8 px-2 text-xs text-rose-600 dark:text-rose-400 hover:underline">
              <RefreshCw size={11} />Clear all
            </button>
          )}

          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {filteredCount} of {totalCount} invoices
          </span>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="flex items-center gap-1.5 flex-wrap overflow-hidden">
              {activeFilters.map(f => (
                <ActiveChip key={f.key} label={f.label} onRemove={() => onFilterChange(f.key, 'all')} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Advanced filters */}
        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-2 flex items-center gap-3 flex-wrap border-t border-slate-100 dark:border-slate-800">
                <DropFilter icon={Users} label="Department"
                  options={DEPARTMENTS}
                  value={filters.department}
                  onChange={v => onFilterChange('department', v)}
                />
                <DropFilter icon={Layers} label="Proc. Category"
                  options={PROC_CATEGORIES}
                  value={filters.procCat}
                  onChange={v => onFilterChange('procCat', v)}
                />
                <DropFilter icon={AlertTriangle} label="Approver"
                  options={['Dr. Anita Rao','Rajiv Sharma','Nisha Mehta','Pradeep Nair','Sunita Pillai','Arvind Kumar']}
                  value={filters.approver}
                  onChange={v => onFilterChange('approver', v)}
                />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Amount:</span>
                  <input type="number" placeholder="Min ₹"
                    className="w-24 h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
                    onChange={e => onFilterChange('amtMin', e.target.value)} />
                  <span className="text-xs text-slate-400">–</span>
                  <input type="number" placeholder="Max ₹"
                    className="w-24 h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
                    onChange={e => onFilterChange('amtMax', e.target.value)} />
                </div>
                {/* Fraud-risk quick toggle */}
                <button
                  onClick={() => onFilterChange('fraudOnly', !filters.fraudOnly)}
                  className={`flex items-center gap-1.5 h-7 px-3 rounded-lg border text-xs font-medium transition-colors
                    ${filters.fraudOnly ? 'border-red-400 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900'}`}
                >
                  <AlertTriangle size={11} />Fraud Risk Only
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
