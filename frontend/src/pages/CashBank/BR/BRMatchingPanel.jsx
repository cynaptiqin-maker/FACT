import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, AlertCircle, Zap, ArrowRight,
  ChevronRight, RefreshCw, GitMerge,
} from 'lucide-react';
import { MOCK_SYSTEM_TXNS, MOCK_BANK_TXNS, fmtINR, MATCH_DISTRIBUTION } from './BRConstants';

const SUGGESTED_MATCHES = MOCK_SYSTEM_TXNS
  .filter(t => t.status === 'SUGGESTED' || t.status === 'IN_REVIEW')
  .map(t => {
    const bank = MOCK_BANK_TXNS.find(b => b.id === t.matchId);
    return { sys: t, bank, confidence: t.confidence };
  })
  .filter(m => m.bank);

const ALL_SUGGESTIONS = [
  ...SUGGESTED_MATCHES,
  {
    sys: { id: 'SYS-005', ref: 'REC-2026-04525', narration: 'IP Advance – Kavya Nair', amount: 50000 },
    bank: { id: 'BANK-0050', bankRef: 'NEFT2026051900050', description: 'UNITED INDIA INSURANCE CO', amount: 195000 },
    confidence: 29,
    note: 'Low confidence – amounts differ significantly',
  },
];

const CONF_COLOR = (c) => c >= 85 ? 'text-emerald-400' : c >= 65 ? 'text-amber-400' : 'text-red-400';
const CONF_BG    = (c) => c >= 85 ? 'bg-emerald-400' : c >= 65 ? 'bg-amber-400' : 'bg-red-400';

export default function BRMatchingPanel({ onAcceptMatch }) {
  const [autoRunning, setAutoRunning] = useState(false);
  const [acceptedIds, setAcceptedIds] = useState([]);

  const total = MOCK_SYSTEM_TXNS.length + MOCK_BANK_TXNS.length;
  const matched = MATCH_DISTRIBUTION.MATCHED * 2;
  const matchPct = Math.round((matched / total) * 100);

  const handleAutoMatch = () => {
    setAutoRunning(true);
    setTimeout(() => setAutoRunning(false), 2800);
  };

  const handleAccept = (sysId) => {
    setAcceptedIds(ids => [...ids, sysId]);
    onAcceptMatch?.(sysId);
  };

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Reconciliation progress */}
      <div className="bg-gradient-to-br from-indigo-500/8 to-violet-500/5 dark:from-indigo-500/12 dark:to-violet-500/8 rounded-xl border border-indigo-200 dark:border-indigo-500/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-white">Reconciliation Progress</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">19-May-2026 · HDFC – 4521</p>
          </div>
          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{matchPct}%</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${matchPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
          <span>{matched} matched</span>
          <span>{total - matched} remaining</span>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Matched',    value: MATCH_DISTRIBUTION.MATCHED,   color: 'emerald' },
          { label: 'Unmatched',  value: MATCH_DISTRIBUTION.UNMATCHED,  color: 'red' },
          { label: 'Partial',    value: MATCH_DISTRIBUTION.PARTIAL,    color: 'amber' },
          { label: 'In Review',  value: MATCH_DISTRIBUTION.IN_REVIEW,  color: 'blue' },
          { label: 'Exception',  value: MATCH_DISTRIBUTION.EXCEPTION,  color: 'orange' },
          { label: 'AI Suggest', value: MATCH_DISTRIBUTION.SUGGESTED,  color: 'cyan' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`rounded-lg bg-${color}-500/8 dark:bg-${color}-500/12 border border-${color}-200 dark:border-${color}-500/20 p-2.5 text-center`}>
            <div className={`text-lg font-bold text-${color}-600 dark:text-${color}-400`}>{value}</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Auto-match */}
      <div className="flex gap-2">
        <motion.button
          onClick={handleAutoMatch}
          disabled={autoRunning}
          whileTap={{ scale: 0.97 }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-70"
        >
          {autoRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              AI Matching…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Auto-Match
            </>
          )}
        </motion.button>
        <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <GitMerge className="w-3.5 h-3.5" />
          Manual
        </button>
      </div>

      {autoRunning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-xl border border-indigo-300/50 dark:border-indigo-500/30 bg-indigo-500/5 p-3"
        >
          {['Analyzing transaction patterns…', 'Comparing amounts and dates…', 'Evaluating narration similarity…', 'Generating match scores…'].map((step, i) => (
            <motion.div
              key={step}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.6 }}
              className="flex items-center gap-2 py-1"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear', delay: i * 0.3 }}
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
              </motion.div>
              <span className="text-xs text-slate-500 dark:text-slate-400">{step}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* AI match suggestions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-white">AI Match Suggestions</h3>
          <span className="ml-auto text-[10px] text-slate-400">{ALL_SUGGESTIONS.length} pending</span>
        </div>
        <div className="space-y-2">
          <AnimatePresence>
            {ALL_SUGGESTIONS.map(({ sys, bank, confidence, note }, idx) => {
              const accepted = acceptedIds.includes(sys.id);
              return (
                <motion.div
                  key={sys.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: accepted ? 0.5 : 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-3 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{sys.narration || sys.ref}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{fmtINR(sys.amount)}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                        <span className="font-medium text-slate-600 dark:text-slate-300">{fmtINR(bank.amount)}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{bank.description || bank.bankRef}</div>
                      {note && <div className="text-[10px] text-amber-500 dark:text-amber-400">{note}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <div className={`text-sm font-bold ${CONF_COLOR(confidence)}`}>{confidence}%</div>
                      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${CONF_BG(confidence)}`} style={{ width: `${confidence}%` }} />
                      </div>
                    </div>
                  </div>
                  {!accepted ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAccept(sys.id)}
                        className="flex-1 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                      >
                        Accept Match
                      </button>
                      <button className="flex-1 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[11px] font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        Reject
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" /> Match accepted
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {/* One-to-many info */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-3">
        <div className="flex items-center gap-2 mb-2">
          <GitMerge className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Matching Rules Active</span>
        </div>
        {['One-to-one (amount + date + ref)', 'One-to-many (batch gateway settlements)', 'Tolerance matching (±₹500 variance)', 'AI narration similarity scoring'].map(rule => (
          <div key={rule} className="flex items-center gap-2 py-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-500 dark:text-slate-400">{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
