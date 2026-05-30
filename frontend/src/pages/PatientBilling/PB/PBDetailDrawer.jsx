import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, IndianRupee, RefreshCcw, Shield, FileText, Clock, CheckCircle2 } from 'lucide-react';
import {
  BILL_TYPES, PAYMENT_STATUSES, INSURANCE_STATUSES, RISK_LEVELS,
  fmtINRFull, fmtDate, fmtTime,
} from './PBConstants';

const TABS = [
  { id: 'overview',  label: 'Overview'   },
  { id: 'services',  label: 'Services'   },
  { id: 'payments',  label: 'Payments'   },
  { id: 'insurance', label: 'Insurance'  },
  { id: 'audit',     label: 'Audit'      },
];

export default function PBDetailDrawer({ bill, onClose }) {
  const [tab, setTab] = useState('overview');

  if (!bill) return null;

  const typeConfig = BILL_TYPES[bill.typeKey]     ?? BILL_TYPES.OP_CONSULTATION;
  const payConfig  = PAYMENT_STATUSES[bill.payStatusKey] ?? PAYMENT_STATUSES.PENDING;
  const insConfig  = INSURANCE_STATUSES[bill.insKey]     ?? INSURANCE_STATUSES.NOT_APPLICABLE;
  const riskConfig = RISK_LEVELS[bill.riskLevel]         ?? RISK_LEVELS.LOW;
  const paidPct    = Math.min(100, Math.round((bill.paid / bill.net) * 100));

  return (
    <AnimatePresence>
      {bill && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[520px] max-w-full bg-white dark:bg-slate-900 z-50
              shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-700"
          >
            {/* Header */}
            <div className="flex items-start gap-3 p-5 border-b border-slate-200 dark:border-slate-700">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">{bill.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${payConfig.bg} ${payConfig.text}`}>{payConfig.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${riskConfig.badgeBg} ${riskConfig.badgeText}`}>{riskConfig.label} Risk</span>
                </div>
                <h2 className="font-bold text-slate-900 dark:text-slate-50 text-base mt-1">{bill.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">{bill.uhid} · {bill.dept} · {bill.doctor}</p>
              </div>
              <button onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-none">
                <X size={18} />
              </button>
            </div>

            {/* Amount ribbon */}
            <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-slate-700 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              {[
                { label: 'Net Amount',   value: fmtINRFull(bill.net),         cls: 'text-slate-800 dark:text-slate-200' },
                { label: 'Amount Paid',  value: fmtINRFull(bill.paid),         cls: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Outstanding',  value: fmtINRFull(bill.outstanding),  cls: 'text-red-600 dark:text-red-400 font-bold' },
              ].map(r => (
                <div key={r.label} className="px-4 py-3 text-center">
                  <p className={`text-sm font-bold font-mono ${r.cls}`}>{r.value}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.label}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-3">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Payment Progress</span><span>{paidPct}% collected</span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div className="h-full bg-emerald-500 rounded-full"
                  initial={{ width: 0 }} animate={{ width: `${paidPct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 px-5 mt-3 border-b border-slate-200 dark:border-slate-700">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors
                    ${tab === t.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">

              {tab === 'overview' && (
                <>
                  <section>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Bill Details</p>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                      {[
                        ['Bill Date',    fmtDate(bill.date)],
                        ['Branch',       bill.branch],
                        ['Billing Type', typeConfig.label],
                        ['Cashier',      bill.cashier],
                        ['Gross Amount', fmtINRFull(bill.gross)],
                        ['Discount',     bill.disc > 0 ? fmtINRFull(bill.disc) : 'None'],
                        ['Package',      bill.hasPackage ? 'Yes — Procedure Package' : 'No'],
                        ['Aging',        `${bill.agingDays} days`],
                      ].map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-0.5">
                          <span className="text-slate-400">{k}</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Insurance</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${insConfig.dot}`} />
                      <span className={`text-xs font-semibold ${insConfig.text}`}>{insConfig.label}</span>
                      {bill.tpa && <span className="ml-2 text-xs text-slate-500">· {bill.tpa}</span>}
                    </div>
                  </section>

                  {bill.notes && (
                    <section className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                      📌 {bill.notes}
                    </section>
                  )}
                </>
              )}

              {tab === 'services' && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="text-left pb-2">Service</th>
                      <th className="text-right pb-2">Qty</th>
                      <th className="text-right pb-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.services.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2 text-slate-700 dark:text-slate-300">{s.name}</td>
                        <td className="py-2 text-right text-slate-500">{s.qty}</td>
                        <td className="py-2 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINRFull(s.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-300 dark:border-slate-600 font-bold text-sm">
                      <td colSpan={2} className="pt-2 text-slate-700 dark:text-slate-300">Net Payable</td>
                      <td className="pt-2 text-right font-mono text-emerald-600 dark:text-emerald-400">{fmtINRFull(bill.net)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {tab === 'payments' && (
                <>
                  {bill.payments.length ? bill.payments.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-none">
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{p.mode} · {p.ref}</p>
                        <p className="text-slate-400">{fmtDate(p.date)} · by {p.by}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{fmtINRFull(p.amount)}</span>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-slate-400">
                      <Clock size={28} className="mx-auto mb-2 opacity-40" />
                      <p>No payments recorded yet</p>
                    </div>
                  )}
                  {bill.outstanding > 0 && (
                    <button className="w-full py-2.5 mt-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                      <IndianRupee size={14} /> Record Payment
                    </button>
                  )}
                </>
              )}

              {tab === 'insurance' && (
                <div className="space-y-3 text-xs">
                  <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20">
                    <p className="font-bold text-violet-700 dark:text-violet-300 mb-3 flex items-center gap-2">
                      <Shield size={14} /> TPA / Insurance Details
                    </p>
                    {[
                      ['TPA / Insurer',   bill.tpa ?? 'Not Applicable'],
                      ['Claim Status',    insConfig.label],
                      ['Claimed Amount',  fmtINRFull(bill.net * 0.8)],
                      ['Pre-Auth Status', 'Obtained'],
                      ['Aging',          `${bill.agingDays} days`],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-violet-100 dark:border-violet-800/50 last:border-0">
                        <span className="text-slate-500">{k}</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                    <Shield size={14} /> Submit / Resubmit Claim
                  </button>
                </div>
              )}

              {tab === 'audit' && (
                <div className="space-y-2 text-xs">
                  {[
                    { user:'System',      action:'Bill Created',          icon: FileText,    color: 'text-slate-500'   },
                    { user:'Rekha Sharma',action:'Services Added',        icon: CheckCircle2,color: 'text-blue-500'    },
                    { user:'Rekha Sharma',action:'Discount Applied (8%)', icon: Clock,       color: 'text-amber-500'  },
                    { user:'Dr. Mehta S.',action:'Bill Countersigned',    icon: CheckCircle2,color: 'text-violet-500' },
                    { user:'Rekha Sharma',action:'Payment Recorded',      icon: IndianRupee, color: 'text-emerald-500'},
                    { user:'System',      action:'Receipt Generated',     icon: Printer,     color: 'text-slate-400'  },
                  ].map((e, i) => {
                    const Icon = e.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div className={`mt-0.5 flex-none ${e.color}`}><Icon size={13} /></div>
                        <div className="flex-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{e.user}</span>
                          <span className="text-slate-400 ml-2">{e.action}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[10px]">{fmtTime(bill.date)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex gap-2 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
              <button className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors">
                <IndianRupee size={14} /> Record Payment
              </button>
              <button className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                <Printer size={14} /> Print
              </button>
              <button className="py-2 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                <RefreshCcw size={14} /> Refund
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
