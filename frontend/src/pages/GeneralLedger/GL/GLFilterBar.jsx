import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Sparkles, SlidersHorizontal, X, ChevronDown,
  Calendar, Building2, Layers, Tag, User, GitBranch,
  AlertCircle, CheckCircle2, RefreshCw,
} from 'lucide-react';
import { BRANCHES, DEPARTMENTS, VOUCHER_TYPES, ACCOUNTS, AI_PROMPTS } from './glConstants';
import clsx from 'clsx';

const QUICK_FILTERS = [
  { id: 'all',          label: 'All Entries',         icon: null       },
  { id: 'unreconciled', label: 'Unreconciled',         icon: RefreshCw  },
  { id: 'pending',      label: 'Pending Approval',     icon: CheckCircle2},
  { id: 'anomaly',      label: 'Anomalies',            icon: AlertCircle },
  { id: 'manual',       label: 'Manual Entries',       icon: User       },
  { id: 'this-month',   label: 'This Month',           icon: Calendar   },
];

function FilterChip({ label, onRemove }) {
  return (
    <motion.span
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      className="inline-flex items-center gap-1 px-2 py-1 bg-brand-800 text-pearl-100 rounded-md text-xs font-medium"
    >
      {label}
      <button onClick={onRemove} className="hover:text-white ml-0.5">
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  );
}

function SelectFilter({ icon: Icon, label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.id === value);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(p => !p)}
        className={clsx(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-all',
          value && value !== 'all'
            ? 'bg-brand-800 text-pearl-100 border-brand-700'
            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
        )}
      >
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="max-w-[90px] truncate">{selected?.label || label}</span>
        <ChevronDown className="w-3 h-3 flex-shrink-0 ml-0.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl border border-slate-200
              shadow-xl z-50 overflow-hidden py-1"
          >
            {options.map(opt => (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className={clsx(
                  'w-full text-left px-3 py-2 text-xs transition-colors',
                  value === opt.id
                    ? 'bg-brand-50 text-brand-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50',
                )}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GLFilterBar({ filters, setFilters, onClear }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiMode, setAiMode]             = useState(false);
  const [aiInput, setAiInput]           = useState('');
  const inputRef = useRef(null);

  const activeFilterCount = Object.entries(filters).filter(([k, v]) =>
    k !== 'search' && v && v !== 'all',
  ).length;

  function removeFilter(key) {
    setFilters(p => ({ ...p, [key]: 'all' }));
  }

  function submitAI(prompt) {
    setFilters(p => ({ ...p, search: prompt }));
    setAiInput('');
    setAiMode(false);
  }

  const activeLabels = [
    filters.branch !== 'all' && { key: 'branch',   label: `Branch: ${BRANCHES.find(b => b.id === filters.branch)?.short}` },
    filters.dept   !== 'all' && { key: 'dept',     label: `Dept: ${DEPARTMENTS.find(d => d.id === filters.dept)?.label}` },
    filters.vtype  !== 'all' && { key: 'vtype',    label: `Type: ${VOUCHER_TYPES.find(v => v.id === filters.vtype)?.id}` },
    filters.status !== 'all' && { key: 'status',   label: `Status: ${filters.status}` },
    filters.recon  !== 'all' && { key: 'recon',    label: `Recon: ${filters.recon}` },
  ].filter(Boolean);

  return (
    <div className="space-y-3">
      {/* ── Search row ─────────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {/* Main search box */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            {aiMode
              ? <Sparkles className="w-4 h-4 text-violet-500" />
              : <Search   className="w-4 h-4 text-slate-400" />
            }
          </div>

          <input
            ref={inputRef}
            value={aiMode ? aiInput : filters.search}
            onChange={e => aiMode
              ? setAiInput(e.target.value)
              : setFilters(p => ({ ...p, search: e.target.value }))
            }
            onKeyDown={e => { if (aiMode && e.key === 'Enter') submitAI(aiInput); }}
            placeholder={aiMode
              ? 'Ask anything… "Show ICU expenses over ₹10L"'
              : 'Search ledger entries, accounts, voucher numbers…'
            }
            className={clsx(
              'w-full pl-9 pr-32 py-2.5 rounded-xl border text-sm outline-none transition-all',
              aiMode
                ? 'border-violet-300 bg-violet-50/50 ring-2 ring-violet-100 placeholder:text-violet-400'
                : 'border-slate-200 bg-white hover:border-slate-300 focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
            )}
          />

          <div className="absolute inset-y-0 right-2 flex items-center gap-1">
            {(filters.search || aiInput) && (
              <button
                onClick={() => { setFilters(p => ({ ...p, search: '' })); setAiInput(''); }}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setAiMode(p => !p)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all',
                aiMode
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50',
              )}
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AI Search</span>
            </button>
          </div>
        </div>

        {/* Advanced filter toggle */}
        <button
          onClick={() => setShowAdvanced(p => !p)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all relative',
            showAdvanced || activeFilterCount > 0
              ? 'bg-brand-800 text-pearl-100 border-brand-700'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
          )}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white
              text-[9px] font-bold flex items-center justify-center shadow">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── AI prompt suggestions ───────────────────────────────────────────── */}
      <AnimatePresence>
        {aiMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              <span className="text-xs text-violet-500 font-semibold self-center mr-1">
                Try asking:
              </span>
              {AI_PROMPTS.map(p => (
                <button
                  key={p}
                  onClick={() => submitAI(p)}
                  className="px-2.5 py-1 text-xs bg-violet-50 text-violet-700 border border-violet-200
                    rounded-full hover:bg-violet-100 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Quick filter chips ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {QUICK_FILTERS.map(qf => {
          const Ic = qf.icon;
          const active = filters.quick === qf.id;
          return (
            <button
              key={qf.id}
              onClick={() => setFilters(p => ({ ...p, quick: qf.id }))}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all',
                active
                  ? 'bg-brand-800 text-pearl-100 border-brand-700 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300',
              )}
            >
              {Ic && <Ic className="w-3 h-3" />}
              {qf.label}
            </button>
          );
        })}

        {/* Active filter chips */}
        <AnimatePresence mode="popLayout">
          {activeLabels.map(f => (
            <FilterChip key={f.key} label={f.label} onRemove={() => removeFilter(f.key)} />
          ))}
        </AnimatePresence>

        {(activeFilterCount > 0 || filters.search) && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* ── Advanced filters panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex flex-wrap gap-3">
                <SelectFilter
                  icon={Building2}
                  label="Branch"
                  options={BRANCHES}
                  value={filters.branch}
                  onChange={v => setFilters(p => ({ ...p, branch: v }))}
                />
                <SelectFilter
                  icon={Layers}
                  label="Department"
                  options={[{ id: 'all', label: 'All Departments' }, ...DEPARTMENTS]}
                  value={filters.dept}
                  onChange={v => setFilters(p => ({ ...p, dept: v }))}
                />
                <SelectFilter
                  icon={Tag}
                  label="Voucher Type"
                  options={[{ id: 'all', label: 'All Types' }, ...VOUCHER_TYPES]}
                  value={filters.vtype}
                  onChange={v => setFilters(p => ({ ...p, vtype: v }))}
                />
                <SelectFilter
                  icon={CheckCircle2}
                  label="Status"
                  options={[
                    { id: 'all', label: 'All Statuses' },
                    { id: 'posted',   label: 'Posted'   },
                    { id: 'pending',  label: 'Pending'  },
                    { id: 'draft',    label: 'Draft'    },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                  ]}
                  value={filters.status}
                  onChange={v => setFilters(p => ({ ...p, status: v }))}
                />
                <SelectFilter
                  icon={RefreshCw}
                  label="Reconciliation"
                  options={[
                    { id: 'all',          label: 'All'           },
                    { id: 'reconciled',   label: 'Reconciled'    },
                    { id: 'unreconciled', label: 'Unreconciled'  },
                    { id: 'partial',      label: 'Partial'       },
                    { id: 'auto-matched', label: 'Auto-matched'  },
                  ]}
                  value={filters.recon}
                  onChange={v => setFilters(p => ({ ...p, recon: v }))}
                />
                <SelectFilter
                  icon={GitBranch}
                  label="Source Module"
                  options={[
                    { id: 'all',             label: 'All Modules'     },
                    { id: 'Patient Billing', label: 'Patient Billing' },
                    { id: 'Insurance TPA',   label: 'Insurance TPA'   },
                    { id: 'Pharmacy',        label: 'Pharmacy'        },
                    { id: 'Payroll',         label: 'Payroll'         },
                    { id: 'Manual Entry',    label: 'Manual Entry'    },
                  ]}
                  value={filters.source}
                  onChange={v => setFilters(p => ({ ...p, source: v }))}
                />

                {/* Date range */}
                <div className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2 bg-white">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={filters.dateFrom || ''}
                    onChange={e => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
                    className="text-xs text-slate-600 outline-none bg-transparent w-28"
                  />
                  <span className="text-slate-400 text-xs">→</span>
                  <input
                    type="date"
                    value={filters.dateTo || ''}
                    onChange={e => setFilters(p => ({ ...p, dateTo: e.target.value }))}
                    className="text-xs text-slate-600 outline-none bg-transparent w-28"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
