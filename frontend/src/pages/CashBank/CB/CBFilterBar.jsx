import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, X, ChevronDown,
  Download, CheckSquare, RefreshCw, GitMerge, Printer, Tag,
  Trash2, RotateCcw,
} from 'lucide-react';
import { BRANCHES, DEPARTMENTS, COUNTERS } from './CBConstants';

const TXN_TYPE_OPTS  = ['all', 'RECEIPT', 'PAYMENT', 'PETTY_CASH', 'REVERSAL', 'CONTRA', 'ADJUSTMENT'];
const RECONCILE_OPTS = ['all', 'RECONCILED', 'UNRECONCILED', 'PARTIAL'];
const APPROVAL_OPTS  = ['all', 'APPROVED', 'PENDING', 'REJECTED', 'AUTO_APV'];
const RISK_OPTS      = ['all', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const SOURCE_OPTS    = ['all', 'OP_BILLING', 'IP_BILLING', 'PHARMACY', 'LAB', 'RADIOLOGY', 'EMERGENCY', 'ICU', 'CAFETERIA', 'MANUAL', 'PAYROLL'];

function SelectChip({ label, value, options, onChange }) {
  const active = value !== 'all';
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`h-8 pl-3 pr-7 rounded-lg border text-xs font-medium appearance-none cursor-pointer transition-colors
          ${active
            ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:border-teal-600 dark:text-teal-300'
            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-teal-300'}`}
      >
        <option value="all">{label}: All</option>
        {options.filter(o => o !== 'all').map(o => (
          <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
    </div>
  );
}

function AmountRange({ min, max, onChange }) {
  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        placeholder="Min ₹"
        value={min}
        onChange={e => onChange('amtMin', e.target.value)}
        className="h-8 w-20 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-teal-400"
      />
      <span className="text-slate-400 text-xs">–</span>
      <input
        type="number"
        placeholder="Max ₹"
        value={max}
        onChange={e => onChange('amtMax', e.target.value)}
        className="h-8 w-20 px-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-teal-400"
      />
    </div>
  );
}

export default function CBFilterBar({ filters, onFilterChange, selectedRows, onBulkAction, totalCount, filteredCount }) {
  const [showMore, setShowMore] = useState(false);
  const activeFilters = Object.entries(filters).filter(([k, v]) =>
    k !== 'reset' && v !== 'all' && v !== '' && v !== false
  ).length;

  const hasSel = selectedRows.length > 0;

  return (
    <div className="flex-none bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
      {/* Primary filter row */}
      <div className="flex items-center gap-2 px-4 py-2.5 flex-wrap">

        {/* Search */}
        <div className="relative flex-none">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={filters.search}
            onChange={e => onFilterChange('search', e.target.value)}
            placeholder="Search transactions, vouchers, narrations…"
            className="h-8 pl-8 pr-4 w-64 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-teal-400 dark:focus:border-teal-600 placeholder:text-slate-400"
          />
          {filters.search && (
            <button onClick={() => onFilterChange('search', '')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={11} />
            </button>
          )}
        </div>

        <div className="w-px h-5 bg-slate-200 dark:bg-slate-700" />

        {/* Core filters */}
        <SelectChip label="Type"        value={filters.txnType}    options={TXN_TYPE_OPTS}  onChange={v => onFilterChange('txnType', v)} />
        <SelectChip label="Branch"      value={filters.branch}     options={['all', ...BRANCHES]}    onChange={v => onFilterChange('branch', v)} />
        <SelectChip label="Reconcile"   value={filters.reconcile}  options={RECONCILE_OPTS} onChange={v => onFilterChange('reconcile', v)} />
        <SelectChip label="Risk"        value={filters.risk}       options={RISK_OPTS}      onChange={v => onFilterChange('risk', v)} />

        {/* More filters toggle */}
        <button
          onClick={() => setShowMore(p => !p)}
          className={`flex items-center gap-1.5 h-8 px-3 rounded-lg border text-xs font-medium transition-colors
            ${showMore || activeFilters > 4
              ? 'border-teal-400 bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:border-teal-600 dark:text-teal-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-teal-300'}`}
        >
          <SlidersHorizontal size={12} />
          More filters
          {activeFilters > 0 && (
            <span className="w-4 h-4 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center">{activeFilters}</span>
          )}
          <ChevronDown size={11} className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
        </button>

        {/* Active filter count / Reset */}
        {activeFilters > 0 && (
          <button
            onClick={() => onFilterChange('reset')}
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
          >
            <X size={11} />Reset
          </button>
        )}

        {/* Result count */}
        <div className="ml-auto text-xs text-slate-500 dark:text-slate-500">
          <span className="font-semibold text-slate-700 dark:text-slate-300">{filteredCount}</span>
          {filteredCount !== totalCount && <span> of {totalCount}</span>} transactions
        </div>
      </div>

      {/* Extended filters */}
      <AnimatePresence>
        {showMore && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2 px-4 pb-2.5 flex-wrap border-t border-slate-100 dark:border-slate-800 pt-2.5">
              <SelectChip label="Counter"    value={filters.counter}    options={['all', ...COUNTERS]}    onChange={v => onFilterChange('counter', v)} />
              <SelectChip label="Department" value={filters.department} options={['all', ...DEPARTMENTS]} onChange={v => onFilterChange('department', v)} />
              <SelectChip label="Approval"   value={filters.approval}   options={APPROVAL_OPTS}           onChange={v => onFilterChange('approval', v)} />
              <SelectChip label="Source"     value={filters.source}     options={SOURCE_OPTS}             onChange={v => onFilterChange('source', v)} />
              <AmountRange min={filters.amtMin} max={filters.amtMax} onChange={onFilterChange} />

              {/* AI anomaly flag */}
              <label className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.riskOnly}
                  onChange={e => onFilterChange('riskOnly', e.target.checked)}
                  className="w-3 h-3 accent-teal-600"
                />
                High-risk only
              </label>

              <label className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400 hover:border-teal-300 transition-colors">
                <input
                  type="checkbox"
                  checked={filters.unreconciledOnly}
                  onChange={e => onFilterChange('unreconciledOnly', e.target.checked)}
                  className="w-3 h-3 accent-teal-600"
                />
                Unreconciled only
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk action bar */}
      <AnimatePresence>
        {hasSel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 44, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden bg-teal-50 dark:bg-teal-900/20 border-t border-teal-200 dark:border-teal-800"
          >
            <div className="flex items-center gap-2 px-4 h-11">
              <span className="text-xs font-semibold text-teal-700 dark:text-teal-300">
                {selectedRows.length} selected
              </span>
              <div className="w-px h-4 bg-teal-200 dark:bg-teal-700" />
              {[
                { icon: GitMerge,    label: 'Reconcile',   action: 'reconcile' },
                { icon: CheckSquare, label: 'Approve',      action: 'approve'   },
                { icon: Download,    label: 'Export',       action: 'export'    },
                { icon: Printer,     label: 'Print',        action: 'print'     },
                { icon: Tag,         label: 'Tag',          action: 'tag'       },
                { icon: RotateCcw,   label: 'Reverse',      action: 'reverse'   },
              ].map(a => (
                <button key={a.action}
                  onClick={() => onBulkAction(a.action, selectedRows)}
                  className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-800/40 transition-colors">
                  <a.icon size={12} />{a.label}
                </button>
              ))}
              <button
                onClick={() => onBulkAction('delete', selectedRows)}
                className="flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors ml-1">
                <Trash2 size={12} />Delete
              </button>
              <button
                onClick={() => onBulkAction('clear', [])}
                className="ml-auto text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <X size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
