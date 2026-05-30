import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Layers, Clock, Paperclip, ExternalLink,
  ArrowDownCircle, ArrowUpCircle, GitMerge, Edit2, RotateCcw,
  Shield, User, Building, Hash, Printer, Download,
} from 'lucide-react';
import { TXN_TYPES, RECONCILE_STATUSES, APPROVAL_STATUSES, RISK_LEVELS, SOURCE_MODULES, fmtINR } from './CBConstants';

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={13} className="text-teal-600 dark:text-teal-400" />
      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
  );
}

function DataRow({ label, value, mono = false, className = '' }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-500 flex-none">{label}</span>
      <span className={`text-xs font-medium text-slate-700 dark:text-slate-300 text-right ${mono ? 'font-mono' : ''} ${className}`}>
        {value}
      </span>
    </div>
  );
}

export default function CBDetailDrawer({ rec, onClose }) {
  if (!rec) return null;

  const txnCfg     = TXN_TYPES[rec.txnType]     ?? TXN_TYPES.RECEIPT;
  const reconcileCfg = RECONCILE_STATUSES[rec.reconcileStatus] ?? RECONCILE_STATUSES.UNRECONCILED;
  const approvalCfg  = APPROVAL_STATUSES[rec.approvalStatus]   ?? APPROVAL_STATUSES.PENDING;
  const riskCfg      = RISK_LEVELS[rec.riskLevel]              ?? RISK_LEVELS.LOW;
  const sourceCfg    = SOURCE_MODULES[rec.sourceModule]        ?? SOURCE_MODULES.MANUAL;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0,      opacity: 1 }}
        exit={{ x: '100%',   opacity: 0 }}
        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
        className="fixed inset-y-0 right-0 z-50 flex"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Drawer */}
        <div className="relative ml-auto w-[520px] h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl">

          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-none">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                  {rec.receiptAmount > 0
                    ? <ArrowDownCircle size={15} className="text-white" />
                    : <ArrowUpCircle size={15} className="text-white" />
                  }
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">{rec.id}</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{rec.voucherNo} · {rec.dateTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${txnCfg.bg} ${txnCfg.text}`}>
                  {txnCfg.label}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${reconcileCfg.bg} ${reconcileCfg.text}`}>
                  {reconcileCfg.label}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${riskCfg.badgeText}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskCfg.color }} />
                  {riskCfg.label} Risk
                </span>
              </div>
            </div>

            <button onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors flex-none">
              <X size={16} />
            </button>
          </div>

          {/* Cash impact banner */}
          <div className="flex-none px-5 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-0.5">Receipt</div>
                <div className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                  {rec.receiptAmount > 0 ? fmtINR(rec.receiptAmount) : '—'}
                </div>
              </div>
              <div className="text-center border-x border-slate-200 dark:border-slate-700">
                <div className="text-[10px] text-slate-500 mb-0.5">Payment</div>
                <div className="text-lg font-bold font-mono text-red-600 dark:text-red-400">
                  {rec.paymentAmount > 0 ? fmtINR(rec.paymentAmount) : '—'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-500 mb-0.5">Running Balance</div>
                <div className="text-lg font-bold font-mono text-teal-600 dark:text-teal-400">
                  {fmtINR(rec.runningBalance)}
                </div>
              </div>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            {/* Transaction Details */}
            <div>
              <SectionHeader icon={FileText} title="Transaction Details" />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1">
                <DataRow label="Transaction ID"  value={rec.id}           mono />
                <DataRow label="Voucher No."     value={rec.voucherNo}    mono />
                <DataRow label="Date & Time"     value={rec.dateTime}     mono />
                <DataRow label="Transaction Type" value={`${txnCfg.label} · ${rec.subType}`} />
                <DataRow label="Ledger Account"  value={rec.ledgerAccount} />
                <DataRow label="Shift ID"        value={rec.shiftId}      mono />
                {rec.patientId && <DataRow label="Patient ID" value={rec.patientId} mono />}
              </div>
            </div>

            {/* Location */}
            <div>
              <SectionHeader icon={Building} title="Location" />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1">
                <DataRow label="Branch"     value={rec.branch} />
                <DataRow label="Counter"    value={rec.counter} />
                <DataRow label="Department" value={rec.department} />
              </div>
            </div>

            {/* Narration */}
            <div>
              <SectionHeader icon={Hash} title="Narration" />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{rec.narration}</p>
                {rec.notes && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mb-1">⚠ Note</div>
                    <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{rec.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Workflow Status */}
            <div>
              <SectionHeader icon={Clock} title="Workflow Status" />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-500 mb-1">Approval</div>
                    <div className={`text-xs font-semibold ${approvalCfg.text}`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${approvalCfg.dot}`} />
                      {approvalCfg.label}
                    </div>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-lg p-3 text-center">
                    <div className="text-[10px] text-slate-500 mb-1">Reconciliation</div>
                    <div className={`text-xs font-semibold ${reconcileCfg.text}`}>{reconcileCfg.label}</div>
                  </div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-500 mb-1">Source Module</div>
                  <span className="text-xs font-medium px-2 py-0.5 rounded" style={{ background: `${sourceCfg.color}1a`, color: sourceCfg.color }}>
                    {sourceCfg.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div>
              <SectionHeader icon={Shield} title="Risk Assessment" />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">Risk Level</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${riskCfg.badgeBg} ${riskCfg.badgeText}`}>
                    {riskCfg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${rec.riskScore}%`, background: riskCfg.color }} />
                  </div>
                  <span className="text-xs font-bold font-mono" style={{ color: riskCfg.color }}>{rec.riskScore}/100</span>
                </div>
              </div>
            </div>

            {/* Linked Journals */}
            {rec.linkedJournals.length > 0 && (
              <div>
                <SectionHeader icon={Layers} title="Linked Journal Entries" />
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  {rec.linkedJournals.map(jv => (
                    <button key={jv}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors">
                      <ExternalLink size={12} className="text-teal-600 flex-none" />
                      <span className="text-xs font-mono font-semibold text-teal-700 dark:text-teal-400">{jv}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {rec.attachments.length > 0 && (
              <div>
                <SectionHeader icon={Paperclip} title={`Attachments (${rec.attachments.length})`} />
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                  {rec.attachments.map(a => (
                    <button key={a}
                      className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                      <Paperclip size={12} className="text-blue-500 flex-none" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">{a}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* User info */}
            <div>
              <SectionHeader icon={User} title="Created By" />
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-1">
                <DataRow label="User"  value={rec.user} />
                <DataRow label="Shift" value={rec.shiftId} mono />
              </div>
            </div>

          </div>

          {/* Footer actions */}
          <div className="flex-none px-5 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { icon: GitMerge,  label: 'Reconcile', primary: true  },
                { icon: Edit2,     label: 'Edit',       primary: false },
                { icon: RotateCcw, label: 'Reverse',    primary: false },
                { icon: Printer,   label: 'Print',      primary: false },
              ].map(a => (
                <button key={a.label}
                  className={`flex items-center justify-center gap-1.5 h-9 rounded-xl text-xs font-semibold transition-colors
                    ${a.primary
                      ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-200 dark:shadow-teal-900/40 hover:opacity-90'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400'}`}>
                  <a.icon size={13} />{a.label}
                </button>
              ))}
            </div>
            <button className="w-full flex items-center justify-center gap-1.5 h-8 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <Download size={12} />Export Voucher PDF
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
