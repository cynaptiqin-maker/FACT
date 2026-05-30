import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitMerge, CheckCircle2, AlertCircle, Clock, Sparkles,
  ChevronRight, RefreshCw, Zap,
} from 'lucide-react';
import { MOCK_CASH_TRANSACTIONS, fmtINR } from './CBConstants';

const UNRECONCILED = MOCK_CASH_TRANSACTIONS.filter(t => t.reconcileStatus !== 'RECONCILED');
const PARTIAL      = MOCK_CASH_TRANSACTIONS.filter(t => t.reconcileStatus === 'PARTIAL');

function ReconcileItem({ txn, idx, selected, onToggle }) {
  const isHighRisk = txn.riskLevel === 'HIGH' || txn.riskLevel === 'CRITICAL';
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.04, duration: 0.25 }}
      className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0 cursor-pointer group transition-colors
        ${selected ? 'bg-teal-50 dark:bg-teal-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-900/40'}`}
      onClick={() => onToggle(txn.id)}
    >
      <input type="checkbox" checked={selected} onChange={() => onToggle(txn.id)}
        className="w-3.5 h-3.5 accent-teal-600 cursor-pointer flex-none" onClick={e => e.stopPropagation()} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[11px] font-mono font-semibold text-slate-700 dark:text-slate-300">{txn.id}</span>
          {txn.reconcileStatus === 'PARTIAL' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">PARTIAL</span>
          )}
          {isHighRisk && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">HIGH RISK</span>
          )}
        </div>
        <div className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{txn.narration}</div>
        <div className="text-[10px] text-slate-400 mt-0.5">{txn.branch} · {txn.counter} · {txn.dateTime.split(' ')[0]}</div>
      </div>

      <div className="text-right flex-none">
        {txn.receiptAmount > 0 ? (
          <div className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">+{fmtINR(txn.receiptAmount)}</div>
        ) : (
          <div className="text-xs font-bold font-mono text-red-600 dark:text-red-400">-{fmtINR(txn.paymentAmount)}</div>
        )}
        <div className="text-[10px] text-slate-400 mt-0.5">{txn.approvalStatus}</div>
      </div>

      <ChevronRight size={13} className="text-slate-300 flex-none opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export default function CBReconciliationPanel() {
  const [selected,   setSelected]   = useState([]);
  const [autoMode,   setAutoMode]   = useState(false);
  const [processing, setProcessing] = useState(false);

  const toggleItem = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelected(prev => prev.length === UNRECONCILED.length ? [] : UNRECONCILED.map(t => t.id));
  };

  const handleAutoReconcile = async () => {
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    setProcessing(false);
    setAutoMode(false);
  };

  const totalUnreconciledAmt = UNRECONCILED.reduce((s, t) => s + t.receiptAmount + t.paymentAmount, 0);

  return (
    <div className="grid grid-cols-3 gap-5">

      {/* Unreconciled entries list */}
      <div className="col-span-2">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <GitMerge size={14} className="text-teal-600 dark:text-teal-400" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Unreconciled Entries
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold">
              {UNRECONCILED.length} pending · {fmtINR(totalUnreconciledAmt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleAll}
              className="text-[11px] text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              {selected.length === UNRECONCILED.length ? 'Deselect all' : 'Select all'}
            </button>
            {selected.length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-1.5 h-7 px-3 rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-[11px] font-semibold hover:opacity-90 transition-opacity"
              >
                <GitMerge size={11} />Reconcile {selected.length}
              </motion.button>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
          {UNRECONCILED.map((txn, i) => (
            <ReconcileItem
              key={txn.id}
              txn={txn}
              idx={i}
              selected={selected.includes(txn.id)}
              onToggle={toggleItem}
            />
          ))}
        </div>
      </div>

      {/* AI Reconciliation Assist */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-cyan-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">AI Reconciliation Assist</span>
        </div>

        {/* Summary cards */}
        {[
          { icon: CheckCircle2, label: 'Auto-Reconcilable',  count: 11, amount: 84200,  color: 'emerald', detail: 'High confidence match' },
          { icon: AlertCircle,  label: 'Manual Review Needed',count: 5,  amount: 127300, color: 'amber',   detail: 'Variance detected'    },
          { icon: Clock,        label: 'Awaiting Approval',   count: 2,  amount: 70000,  color: 'blue',    detail: 'Pending manager auth' },
        ].map(({ icon: Icon, label, count, amount, color, detail }) => (
          <div key={label} className={`bg-${color}-50 dark:bg-${color}-900/10 border border-${color}-200 dark:border-${color}-800 rounded-xl p-3`}>
            <div className="flex items-center gap-2">
              <Icon size={13} className={`text-${color}-600 dark:text-${color}-400`} />
              <span className={`text-[11px] font-semibold text-${color}-700 dark:text-${color}-400`}>{label}</span>
              <span className={`ml-auto text-[11px] font-bold font-mono text-${color}-600 dark:text-${color}-400`}>
                {count} · {fmtINR(amount)}
              </span>
            </div>
            <div className={`text-[10px] text-${color}-500 mt-1`}>{detail}</div>
          </div>
        ))}

        {/* Auto-reconcile button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAutoReconcile}
          disabled={processing}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity shadow-md shadow-teal-200 dark:shadow-teal-900/40"
        >
          {processing ? (
            <><RefreshCw size={13} className="animate-spin" />Processing…</>
          ) : (
            <><Zap size={13} />Auto-Reconcile 11 Entries</>
          )}
        </motion.button>

        <p className="text-[10px] text-slate-400 dark:text-slate-600 text-center">
          AI will match and reconcile entries with 95%+ confidence. Manual entries unchanged.
        </p>
      </div>

    </div>
  );
}
