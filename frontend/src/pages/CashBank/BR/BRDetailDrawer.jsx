import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle, Clock,
  FileText, Link2, User, RotateCcw, Printer, Download, ChevronRight,
  AlertOctagon, BookOpen, History, MessageSquare, Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { MATCH_STATUS, fmtINR } from './BRConstants';

const TABS_SYS  = ['Overview', 'Journal', 'Settlement', 'Audit', 'Notes'];
const TABS_BANK = ['Overview', 'Settlement', 'Audit'];

function StatusBadge({ status }) {
  const s = MATCH_STATUS[status];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function FieldRow({ label, value, mono }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 w-32">{label}</span>
      <span className={`text-xs font-medium text-slate-700 dark:text-slate-200 text-right ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  );
}

function ConfidenceMeter({ value }) {
  if (!value) return null;
  const color = value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">Match Confidence</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

export default function BRDetailDrawer({ rec, type, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const tabs = type === 'bank' ? TABS_BANK : TABS_SYS;
  const isCredit = (type === 'sys' && rec?.cr > 0) || (type === 'bank' && rec?.type === 'CREDIT');

  return (
    <AnimatePresence>
      {rec && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40"
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className={`px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 ${
              isCredit
                ? 'bg-gradient-to-r from-emerald-500/8 to-emerald-600/4 dark:from-emerald-500/12 dark:to-emerald-600/6'
                : 'bg-gradient-to-r from-red-500/8 to-red-600/4 dark:from-red-500/12 dark:to-red-600/6'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isCredit ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'
                  }`}>
                    {isCredit
                      ? <ArrowDownLeft className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                      : <ArrowUpRight  className="w-4.5 h-4.5 text-red-600 dark:text-red-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">{rec.ref || rec.bankRef || rec.id}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <StatusBadge status={rec.status} />
                      {rec.riskLevel && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                          rec.riskLevel === 'CRITICAL' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' :
                          rec.riskLevel === 'HIGH'     ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' :
                          rec.riskLevel === 'MEDIUM'   ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300' :
                          'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                        }`}>
                          {rec.riskLevel} RISK
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Amount banner */}
              <div className="mt-3 flex items-center gap-6">
                <div>
                  <div className="text-[10px] text-slate-400 mb-0.5">{isCredit ? 'Credit Amount' : 'Debit Amount'}</div>
                  <div className={`text-2xl font-bold ${isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmtINR(rec.amount || rec.cr || rec.dr)}
                  </div>
                </div>
                {rec.variance && (
                  <div>
                    <div className="text-[10px] text-slate-400 mb-0.5">Variance</div>
                    <div className="text-base font-bold text-amber-600 dark:text-amber-400">{fmtINR(rec.variance)}</div>
                  </div>
                )}
                {rec.confidence && (
                  <div className="flex-1">
                    <ConfidenceMeter value={rec.confidence} />
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 flex-shrink-0 overflow-x-auto">
              {tabs.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`flex-1 py-2.5 text-[11px] font-semibold whitespace-nowrap px-2 border-b-2 transition-colors ${
                    activeTab === t
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="p-5 space-y-4"
                >
                  {activeTab === 'Overview' && (
                    <>
                      <div className="space-y-0 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800/50">
                        <FieldRow label="Date & Time"  value={`${rec.date || '—'}  ${rec.time || ''}`} />
                        <FieldRow label="Reference"    value={rec.ref || rec.bankRef}  mono />
                        <FieldRow label="Bank Ref"     value={rec.bankRef}             mono />
                        <FieldRow label="Narration"    value={rec.narration || rec.description} />
                        {type === 'sys' && <>
                          <FieldRow label="Type"         value={rec.type} />
                          <FieldRow label="Branch"       value={rec.branch} />
                          <FieldRow label="Department"   value={rec.department} />
                          <FieldRow label="Source"       value={rec.source?.replace('_',' ')} />
                          <FieldRow label="Payment Method" value={rec.method} />
                          <FieldRow label="GL Account"   value={rec.glAccount} />
                          <FieldRow label="Voucher No."  value={rec.voucherNo} mono />
                          <FieldRow label="Processed By" value={rec.user} />
                        </>}
                        {type === 'bank' && <>
                          <FieldRow label="Transaction Type" value={rec.type} />
                          <FieldRow label="Payment Method"   value={rec.method} />
                          <FieldRow label="Description"      value={rec.description} />
                        </>}
                        {rec.matchId && <FieldRow label="Matched With" value={rec.matchId} mono />}
                      </div>

                      {(rec.aiNote || rec.varianceReason || rec.exceptionReason || rec.riskNote) && (
                        <div className="rounded-xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-500/5 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">AI Intelligence</span>
                          </div>
                          {rec.aiNote        && <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rec.aiNote}</p>}
                          {rec.varianceReason && <p className="text-xs text-amber-600 dark:text-amber-400">{rec.varianceReason}</p>}
                          {rec.exceptionReason&& <p className="text-xs text-orange-600 dark:text-orange-400">{rec.exceptionReason}</p>}
                          {rec.riskNote      && (
                            <div className="flex items-start gap-1.5">
                              <AlertOctagon className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                              <p className="text-xs text-red-600 dark:text-red-400">{rec.riskNote}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'Journal' && rec.journalEntries?.length > 0 && (
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/50 px-4 py-2.5 flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        <span>Account</span>
                        <div className="flex gap-8">
                          <span>Dr</span>
                          <span>Cr</span>
                        </div>
                      </div>
                      {rec.journalEntries.map((je, i) => (
                        <div key={i} className="px-4 py-2.5 flex justify-between text-xs border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-700 dark:text-slate-200">{je.account}</span>
                          <div className="flex gap-8">
                            <span className={je.dr > 0 ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-300 dark:text-slate-600'}>
                              {je.dr > 0 ? fmtINR(je.dr) : '—'}
                            </span>
                            <span className={je.cr > 0 ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-300 dark:text-slate-600'}>
                              {je.cr > 0 ? fmtINR(je.cr) : '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Settlement' && (
                    <div className="space-y-2">
                      {(rec.settlementHistory || []).length === 0
                        ? <p className="text-sm text-slate-400 text-center py-8">No settlement history available</p>
                        : rec.settlementHistory.map((s, i) => (
                          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <div className="flex-1">
                              <div className="text-xs font-medium text-slate-700 dark:text-slate-200">{s.status}</div>
                              <div className="text-[10px] text-slate-400">{s.date}</div>
                            </div>
                            {s.amount > 0 && <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(s.amount)}</span>}
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {activeTab === 'Audit' && (
                    <div className="space-y-2">
                      {(rec.auditLog || []).map((log, i) => (
                        <div key={i} className="flex gap-3">
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1" />
                            {i < (rec.auditLog.length - 1) && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-1" />}
                          </div>
                          <div className="pb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">{log.action}</span>
                              <span className="text-[10px] text-slate-400">{log.ts}</span>
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{log.user} · {log.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'Notes' && (
                    <div>
                      <textarea
                        placeholder="Add reconciliation notes…"
                        className="w-full h-32 px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none outline-none focus:border-indigo-400 dark:focus:border-indigo-500/60 transition-colors"
                      />
                      <button className="mt-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-xs font-semibold hover:bg-indigo-600 transition-colors">
                        Save Note
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => onAction?.('match', rec)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Match
                </button>
                <button onClick={() => onAction?.('adjust', rec)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-500/30 hover:bg-amber-500/20 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Adjust
                </button>
                <button onClick={() => onAction?.('reverse', rec)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Reverse
                </button>
                <button className="ml-auto p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Printer className="w-3.5 h-3.5" />
                </button>
                <button className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
