import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, X, Filter, SlidersHorizontal, ChevronDown,
  Building2, Shield, Users, Layers, Calendar, AlertTriangle,
  Tag, RefreshCw, Download, Trash2, Send, GitMerge, CheckSquare,
} from 'lucide-react';
import { RECEIVABLE_TYPES, COLLECTION_STATUSES, AGING_BUCKETS, BRANCHES, DEPARTMENTS } from './ARConstants';

const RISK_OPTIONS = ['All Risk Levels','Low','Medium','High','Critical'];
const STATUS_KEYS  = Object.keys(COLLECTION_STATUSES);
const TYPE_KEYS    = Object.keys(RECEIVABLE_TYPES);

function DropFilter({ icon: Icon, label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const selected = value !== 'all' && value ? options.find(o => (o.key || o) === value) : null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
          ${selected
            ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-600'
            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-slate-400'
          }`}
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
              <div
                onClick={() => { onChange('all'); setOpen(false); }}
                className="px-3 py-2 text-xs text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                All
              </div>
              {options.map(o => {
                const key = o.key || o;
                const lbl = o.label || o;
                return (
                  <div
                    key={key}
                    onClick={() => { onChange(key); setOpen(false); }}
                    className={`px-3 py-2 text-xs cursor-pointer transition-colors
                      ${value === key ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                  >
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
      className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[11px] font-medium"
    >
      {label}
      <button onClick={onRemove} className="hover:text-blue-900 dark:hover:text-blue-100">
        <X size={10} />
      </button>
    </motion.span>
  );
}

export default function ARFilterBar({ filters, onFilterChange, selectedRows, onBulkAction, totalCount, filteredCount }) {
  const [aiMode, setAiMode] = useState(false);
  const [searchVal, setSearchVal] = useState(filters.search || '');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFilters = [];
  if (filters.type    && filters.type    !== 'all') activeFilters.push({ key: 'type',    label: `Type: ${RECEIVABLE_TYPES[filters.type]?.label}` });
  if (filters.status  && filters.status  !== 'all') activeFilters.push({ key: 'status',  label: `Status: ${COLLECTION_STATUSES[filters.status]?.label}` });
  if (filters.aging   && filters.aging   !== 'all') activeFilters.push({ key: 'aging',   label: `Aging: ${AGING_BUCKETS.find(b=>b.key===filters.aging)?.label}` });
  if (filters.branch  && filters.branch  !== 'all') activeFilters.push({ key: 'branch',  label: `Branch: ${filters.branch}` });
  if (filters.risk    && filters.risk    !== 'all') activeFilters.push({ key: 'risk',    label: `Risk: ${filters.risk}` });

  const handleSearch = (v) => {
    setSearchVal(v);
    onFilterChange('search', v);
  };

  const bulkActions = [
    { id: 'reminder',   label: 'Send Reminder',  icon: Send,      color: 'text-blue-600'   },
    { id: 'reconcile',  label: 'Reconcile',       icon: GitMerge,  color: 'text-violet-600' },
    { id: 'assign',     label: 'Assign Collector',icon: Users,     color: 'text-emerald-600'},
    { id: 'export',     label: 'Export',          icon: Download,  color: 'text-slate-600'  },
    { id: 'tag',        label: 'Tag',             icon: Tag,       color: 'text-amber-600'  },
    { id: 'writeoff',   label: 'Write Off',       icon: Trash2,    color: 'text-rose-600'   },
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
            className="overflow-hidden bg-blue-50 dark:bg-blue-950/50 border-b border-blue-200 dark:border-blue-900"
          >
            <div className="px-4 py-2 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckSquare size={15} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">
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
                    <a.icon size={12} />
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-4 py-3 flex flex-col gap-2">
        {/* Main filter row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className={`relative flex-1 min-w-64 transition-all ${aiMode ? 'ring-2 ring-cyan-400 rounded-xl' : ''}`}>
            <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
              {aiMode ? <Sparkles size={14} className="text-cyan-500 animate-pulse" /> : <Search size={14} className="text-slate-400" />}
            </div>
            <input
              value={searchVal}
              onChange={e => handleSearch(e.target.value)}
              placeholder={aiMode ? 'Ask AI: "Show ICU claims over 90 days"…' : 'Search invoices, patients, organizations…'}
              className={`w-full h-9 pl-9 pr-24 rounded-xl border text-sm outline-none transition-colors
                ${aiMode
                  ? 'border-cyan-400 bg-cyan-50/50 dark:bg-cyan-950/20 dark:border-cyan-700 placeholder:text-cyan-400 dark:text-slate-200'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 placeholder:text-slate-400 dark:text-slate-200 focus:border-blue-400 dark:focus:border-blue-500'
                }`}
            />
            {searchVal && (
              <button onClick={() => handleSearch('')} className="absolute right-20 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
            <button
              onClick={() => setAiMode(p => !p)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold transition-all
                ${aiMode ? 'bg-cyan-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-cyan-100 hover:text-cyan-600'}`}
            >
              <Sparkles size={10} />AI
            </button>
          </div>

          {/* Quick filters */}
          <DropFilter
            icon={Layers}
            label="Type"
            options={TYPE_KEYS.map(k => ({ key: k, label: RECEIVABLE_TYPES[k].label }))}
            value={filters.type}
            onChange={v => onFilterChange('type', v)}
          />
          <DropFilter
            icon={Tag}
            label="Status"
            options={STATUS_KEYS.map(k => ({ key: k, label: COLLECTION_STATUSES[k].label }))}
            value={filters.status}
            onChange={v => onFilterChange('status', v)}
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
            options={RISK_OPTIONS.slice(1).map(r => ({ key: r, label: r }))}
            value={filters.risk}
            onChange={v => onFilterChange('risk', v)}
          />

          <button
            onClick={() => setShowAdvanced(p => !p)}
            className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
              ${showAdvanced ? 'border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 hover:border-slate-400'}`}
          >
            <SlidersHorizontal size={12} />
            Advanced
          </button>

          {activeFilters.length > 0 && (
            <button onClick={() => onFilterChange('reset')} className="flex items-center gap-1 h-8 px-2 text-xs text-rose-600 dark:text-rose-400 hover:underline">
              <RefreshCw size={11} /> Clear all
            </button>
          )}

          {/* Count */}
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {filteredCount} of {totalCount} receivables
          </span>
        </div>

        {/* Active filter chips */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="flex items-center gap-1.5 flex-wrap overflow-hidden">
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
                <DropFilter icon={Users} label="Collector" options={['Priya Sharma','Rahul Mehta','Ananya Iyer','Suresh Nair','Deepa Rao','Kiran Pillai']} value={filters.collector} onChange={v => onFilterChange('collector', v)} />
                <DropFilter icon={Layers} label="Department" options={['Cardiology','ICU','OT','General Surgery','Neurology','Oncology','Orthopedics','Pediatrics','Radiology','Pharmacy','Laboratory','Emergency']} value={filters.department} onChange={v => onFilterChange('department', v)} />
                <DropFilter icon={Shield} label="Ins. Status" options={['SUBMITTED','PROCESSING','APPROVED','PARTIAL_SETTLED','DENIED']} value={filters.insStatus} onChange={v => onFilterChange('insStatus', v)} />

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Amount:</span>
                  <input
                    type="number"
                    placeholder="Min ₹"
                    className="w-24 h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
                    onChange={e => onFilterChange('amtMin', e.target.value)}
                  />
                  <span className="text-xs text-slate-400">–</span>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    className="w-24 h-7 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
                    onChange={e => onFilterChange('amtMax', e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
