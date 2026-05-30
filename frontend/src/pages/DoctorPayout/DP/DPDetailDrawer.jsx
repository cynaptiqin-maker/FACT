// ─── Doctor Payouts — Detail Drawer (7 Tabs) ──────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, TrendingUp, BookOpen, Award, Landmark, Workflow,
  ClipboardList, FileText, Banknote, GitMerge, ExternalLink,
  CheckCircle2, Clock, AlertTriangle, Shield, Sparkles,
  Activity, CreditCard, ArrowUpRight, ChevronRight,
} from 'lucide-react';
import {
  PAYOUT_STATUSES, APPROVAL_STATUSES, PAYMENT_STATUSES,
  SETTLEMENT_STATUSES, RISK_LEVELS, PAYOUT_TYPES, EMPLOYMENT_TYPES,
  fmtINR, fmtINRFull, fmtDate, fmtDateTime, fmtPct,
} from './DPConstants';

const TABS = [
  { id: 'overview',   label: 'Overview',           icon: User      },
  { id: 'revenue',    label: 'Revenue',            icon: TrendingUp},
  { id: 'financials', label: 'Financials',         icon: BookOpen  },
  { id: 'incentives', label: 'Incentives & Deductions', icon: Award },
  { id: 'treasury',   label: 'Treasury',           icon: Landmark  },
  { id: 'workflow',   label: 'Workflow',           icon: Workflow  },
  { id: 'audit',      label: 'Audit Trail',        icon: ClipboardList },
];

// ─── Shared helpers ───────────────────────────────────────────────────────────
function DataRow({ label, value, mono = false, color, badge }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      {badge ?? (
        <span className={`text-xs font-semibold ${color ?? 'text-slate-800 dark:text-slate-200'} ${mono ? 'font-mono' : ''}`}>
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ children, icon: Icon }) {
  return (
    <h4 className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 mt-1">
      {Icon && <Icon size={11} />}
      {children}
    </h4>
  );
}

function LinkedRecord({ label, id, icon: Icon, onClick }) {
  if (!id) return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-xs text-slate-300 dark:text-slate-600">Not linked</span>
    </div>
  );
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between py-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 rounded-lg px-1 -mx-1 transition-colors"
    >
      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        {Icon && <Icon size={11} />}
        {label}
      </div>
      <div className="flex items-center gap-1 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
        {id} <ExternalLink size={9} />
      </div>
    </button>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ p }) {
  const wfCfg = PAYOUT_STATUSES[p.workflowState] ?? PAYOUT_STATUSES.DRAFT;
  const apCfg = APPROVAL_STATUSES[p.approvalStatus] ?? APPROVAL_STATUSES.PENDING;

  return (
    <div className="space-y-5">
      {/* Doctor Profile */}
      <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-lg font-bold flex-none"
          style={{ background: p.avatarColor }}
        >
          {p.initials}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{p.doctorName}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{p.specialty}</p>
          <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-0.5">{p.qualification}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${EMPLOYMENT_TYPES[p.employmentType]?.bg} ${EMPLOYMENT_TYPES[p.employmentType]?.text}`}>
              {EMPLOYMENT_TYPES[p.employmentType]?.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${PAYOUT_TYPES[p.payoutType]?.lightBg} ${PAYOUT_TYPES[p.payoutType]?.text}`}>
              {PAYOUT_TYPES[p.payoutType]?.label}
            </span>
          </div>
        </div>
        <div className="text-right flex-none">
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{fmtINR(p.netPayout)}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Net Payout — {p.payoutPeriod}</div>
        </div>
      </div>

      {/* AI Insight */}
      {p.aiInsight && (
        <div className="flex items-start gap-2.5 p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl">
          <Sparkles size={14} className="text-cyan-500 flex-none mt-0.5" />
          <div>
            <p className="text-[10.5px] font-semibold text-cyan-700 dark:text-cyan-300 mb-0.5">AI Compensation Intelligence</p>
            <p className="text-[10.5px] text-cyan-700 dark:text-cyan-400 leading-relaxed">{p.aiInsight}</p>
          </div>
        </div>
      )}

      {/* Fraud flags */}
      {p.fraudFlags?.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertTriangle size={14} className="text-red-500 flex-none mt-0.5" />
          <div>
            <p className="text-[10.5px] font-semibold text-red-700 dark:text-red-400 mb-1">Fraud / Risk Flags</p>
            {p.fraudFlags.map(f => (
              <span key={f} className="inline-block mr-1.5 mb-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 text-[10px] font-semibold">{f}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Payout Details */}
        <div>
          <SectionTitle icon={Activity}>Payout Details</SectionTitle>
          <DataRow label="Payout ID"      value={p.id}          mono />
          <DataRow label="Period"          value={p.payoutPeriod} />
          <DataRow label="Department"      value={p.department}  />
          <DataRow label="Branch"          value={p.branch}      />
          <DataRow label="Designation"     value={p.designation} />
        </div>

        {/* Status Summary */}
        <div>
          <SectionTitle icon={CheckCircle2}>Status Summary</SectionTitle>
          <DataRow label="Workflow State" badge={
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${wfCfg.bg} ${wfCfg.text}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: wfCfg.dot }} />{wfCfg.label}
            </span>
          } />
          <DataRow label="Approval" badge={
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${apCfg.bg} ${apCfg.text}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: apCfg.dot }} />{apCfg.label}
            </span>
          } />
          <DataRow label="Risk Level" badge={
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${RISK_LEVELS[p.riskLevel]?.bg} ${RISK_LEVELS[p.riskLevel]?.text}`}>
              {RISK_LEVELS[p.riskLevel]?.label} ({p.riskScore}%)
            </span>
          } />
          <DataRow label="Calculated"  value={fmtDate(p.createdAt)}    />
          <DataRow label="Approved"    value={fmtDate(p.approvedAt) || 'Pending'} />
          <DataRow label="Paid"        value={fmtDate(p.paidAt) || 'Pending'}     />
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <SectionTitle icon={Banknote}>Financial Summary</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Revenue Generated',  val: p.revenueGenerated,    color: '#059669' },
            { label: 'Revenue Share',       val: p.revenueShareAmount,  color: '#3b82f6' },
            { label: 'Incentive',           val: p.incentiveAmount,     color: '#8b5cf6' },
            { label: 'Total Deductions',    val: p.totalDeductions,     color: '#f43f5e' },
            { label: 'Net Payout',          val: p.netPayout,           color: '#059669' },
            { label: 'Insurance Linked',    val: p.insuranceLinkedAmount,color: '#6366f1' },
          ].map(({ label, val, color }) => (
            <div key={label} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-1">{label}</p>
              <p className="font-mono font-bold text-sm" style={{ color }}>{fmtINR(val)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Revenue ─────────────────────────────────────────────────────────────
function RevenueTab({ p }) {
  const segments = [
    { label: 'Consultation',  val: p.consultationRevenue, pct: (p.consultationRevenue / p.revenueGenerated) * 100, color: '#059669', share: 40 },
    { label: 'Procedure',     val: p.procedureRevenue,    pct: (p.procedureRevenue / p.revenueGenerated) * 100,    color: '#0ea5e9', share: p.sharePercent },
    { label: 'OT Procedures', val: p.otRevenue,           pct: (p.otRevenue / p.revenueGenerated) * 100,           color: '#8b5cf6', share: 30 },
    { label: 'ICU / Critical Care', val: p.icuRevenue,    pct: (p.icuRevenue / p.revenueGenerated) * 100,          color: '#f97316', share: 25 },
  ].filter(s => s.val > 0);

  return (
    <div className="space-y-5">
      {/* Revenue waterfall */}
      <div>
        <SectionTitle icon={TrendingUp}>Revenue Contribution Breakdown</SectionTitle>
        <div className="space-y-3">
          {segments.map(s => (
            <div key={s.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-300">{s.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINR(s.val)}</span>
                  <span className="text-[10px] text-slate-400">{s.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${s.pct}%` }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: s.color }}
                />
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-[10px] text-slate-400">Share @{s.share}% = {fmtINR(s.val * s.share / 100)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Collection status */}
      <div>
        <SectionTitle icon={Activity}>Collection Status</SectionTitle>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Billed',   val: p.revenueGenerated,            color: '#3b82f6' },
            { label: 'Collected',      val: p.collectedAmount,             color: '#10b981' },
            { label: 'Pending',        val: p.pendingCollection,           color: p.pendingCollection > 0 ? '#f59e0b' : '#10b981' },
          ].map(({ label, val, color }) => (
            <div key={label} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-1">{label}</p>
              <p className="font-mono font-bold text-sm" style={{ color }}>{fmtINR(val)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[10.5px] text-slate-500 dark:text-slate-400 mb-1">
            <span>Collection Ratio</span>
            <span>{((p.collectedAmount / p.revenueGenerated) * 100).toFixed(1)}%</span>
          </div>
          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(p.collectedAmount / p.revenueGenerated) * 100}%` }}
              transition={{ duration: 0.7 }}
              className="h-full rounded-full"
              style={{ background: p.pendingCollection === 0 ? '#10b981' : '#f59e0b' }}
            />
          </div>
        </div>
      </div>

      {/* Patient invoices */}
      <div>
        <SectionTitle icon={FileText}>Linked Patient Invoices</SectionTitle>
        <div className="space-y-1.5">
          {p.invoiceIds?.map((inv, i) => (
            <div key={inv} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <FileText size={12} className="text-slate-400" />
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{inv}</span>
              </div>
              <button className="flex items-center gap-0.5 text-[10.5px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium">
                View <ExternalLink size={9} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Financials ──────────────────────────────────────────────────────────
function FinancialsTab({ p }) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <SectionTitle icon={BookOpen}>Accounts Payable & GL Postings</SectionTitle>
      <div className="space-y-2">
        <LinkedRecord label="AP Entry"           id={p.apEntryId}        icon={Banknote}   onClick={() => navigate('/ap/vendor-invoices')} />
        <LinkedRecord label="GL Posting"          id={p.glPostingId}      icon={BookOpen}   onClick={() => navigate('/gl')} />
        <LinkedRecord label="Journal Voucher"     id={p.journalVoucherId} icon={FileText}   onClick={() => navigate('/gl/journals')} />
        <LinkedRecord label="Bank Transfer"       id={p.bankTransferId}   icon={Landmark}   onClick={() => navigate('/cash-bank')} />
        <LinkedRecord label="Bank Reconciliation" id={p.reconciliationId} icon={GitMerge}   onClick={() => navigate('/cash-bank/reconciliation')} />
      </div>

      <div>
        <SectionTitle icon={Activity}>GL Entry Simulation</SectionTitle>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 grid grid-cols-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Account</span><span>Account Name</span>
            <span className="text-right">Debit</span><span className="text-right">Credit</span>
          </div>
          {[
            { acct: '5001', name: 'Doctor Compensation Expense',  dr: p.revenueShareAmount + p.incentiveAmount, cr: 0    },
            { acct: '2301', name: 'TDS Payable',                  dr: 0,                                        cr: p.tdsDeduction  },
            { acct: '2302', name: 'Professional Tax Payable',     dr: 0,                                        cr: p.profTaxDeduction },
            { acct: '2101', name: 'Doctor Payout Payable',        dr: 0,                                        cr: p.netPayout    },
          ].map(row => (
            <div key={row.acct} className="px-3 py-2 grid grid-cols-4 text-xs border-b border-slate-100 dark:border-slate-800 last:border-0">
              <span className="font-mono text-slate-600 dark:text-slate-400">{row.acct}</span>
              <span className="text-slate-700 dark:text-slate-300">{row.name}</span>
              <span className="text-right font-mono text-blue-600 dark:text-blue-400">{row.dr > 0 ? fmtINR(row.dr) : '—'}</span>
              <span className="text-right font-mono text-emerald-600 dark:text-emerald-400">{row.cr > 0 ? fmtINR(row.cr) : '—'}</span>
            </div>
          ))}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/40 grid grid-cols-4 text-xs font-bold border-t border-slate-200 dark:border-slate-700">
            <span className="col-span-2 text-slate-600 dark:text-slate-300">Total</span>
            <span className="text-right font-mono text-blue-700 dark:text-blue-300">{fmtINR(p.revenueShareAmount + p.incentiveAmount)}</span>
            <span className="text-right font-mono text-emerald-700 dark:text-emerald-300">{fmtINR(p.revenueShareAmount + p.incentiveAmount)}</span>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle>Payment Timeline</SectionTitle>
        {[
          { label: 'Payout Calculated', at: p.createdAt, done: !!p.createdAt, color: '#3b82f6'  },
          { label: 'Approved',          at: p.approvedAt,done: !!p.approvedAt,color: '#059669'  },
          { label: 'Transfer Initiated',at: p.paidAt,    done: !!p.paidAt,    color: '#8b5cf6'  },
          { label: 'Bank Settled',      at: p.paidAt,    done: !!p.paidAt,    color: '#22c55e'  },
          { label: 'Reconciled',        at: p.reconciledAt,done: !!p.reconciledAt,color: '#14b8a6'},
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-none ${step.done ? '' : 'bg-slate-100 dark:bg-slate-800'}`}
              style={step.done ? { background: `${step.color}20` } : {}}>
              {step.done
                ? <CheckCircle2 size={12} style={{ color: step.color }} />
                : <Clock size={12} className="text-slate-300 dark:text-slate-600" />}
            </div>
            <div className="flex-1">
              <span className={`text-xs font-medium ${step.done ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>{step.label}</span>
            </div>
            <span className="text-[10.5px] text-slate-400">{step.at ? fmtDateTime(step.at) : '—'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Incentives & Deductions ─────────────────────────────────────────────
function IncentivesTab({ p }) {
  return (
    <div className="space-y-5">
      <div>
        <SectionTitle icon={Award}>Incentive Breakdown</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'OT Incentive',           val: p.otRevenue > 0 ? Math.round(p.incentiveAmount * 0.6) : 0, color: '#8b5cf6' },
            { label: 'ICU Bonus',              val: p.icuRevenue > 0 ? Math.round(p.incentiveAmount * 0.3) : 0, color: '#f97316' },
            { label: 'Performance Incentive',  val: Math.round(p.incentiveAmount * 0.1),  color: '#059669' },
            { label: 'Insurance Achievement',  val: p.insuranceLinkedAmount > 0 ? Math.round(p.incentiveAmount * 0.05) : 0, color: '#6366f1' },
          ].filter(r => r.val > 0).map(r => (
            <div key={r.label} className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] text-slate-400 mb-1">{r.label}</p>
              <p className="font-mono font-bold text-sm" style={{ color: r.color }}>{fmtINR(r.val)}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-between text-xs font-bold py-2 px-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
          <span className="text-violet-700 dark:text-violet-400">Total Incentive</span>
          <span className="font-mono text-violet-700 dark:text-violet-400">{fmtINR(p.incentiveAmount)}</span>
        </div>
      </div>

      <div>
        <SectionTitle>Deduction Schedule</SectionTitle>
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {[
            { label: 'TDS @ 10% of Revenue Share', val: p.tdsDeduction,    type: 'STATUTORY' },
            { label: 'Professional Tax',            val: p.profTaxDeduction,type: 'STATUTORY' },
            { label: 'Other Deductions',            val: p.otherDeductions, type: 'OTHER'     },
          ].map((d, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{d.label}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{d.type}</p>
              </div>
              <span className="font-mono text-xs font-bold text-rose-600 dark:text-rose-400">-{fmtINR(d.val)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between px-3 py-2.5 bg-rose-50 dark:bg-rose-900/10 font-bold">
            <span className="text-xs text-rose-700 dark:text-rose-400">Total Deductions</span>
            <span className="font-mono text-xs text-rose-700 dark:text-rose-400">-{fmtINR(p.totalDeductions)}</span>
          </div>
        </div>
      </div>

      <div>
        <SectionTitle icon={Activity}>Payout Summary</SectionTitle>
        <div className="space-y-1 text-xs">
          {[
            { label: 'Revenue Share',   val: p.revenueShareAmount,   sign: '+', color: 'text-blue-600 dark:text-blue-400'   },
            { label: 'Incentive',       val: p.incentiveAmount,      sign: '+', color: 'text-violet-600 dark:text-violet-400'},
            { label: 'Deductions',      val: p.totalDeductions,      sign: '-', color: 'text-rose-600 dark:text-rose-400'   },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
              <span className={`font-mono font-semibold ${row.color}`}>{row.sign}{fmtINR(row.val)}</span>
            </div>
          ))}
          <div className="flex justify-between pt-2 font-bold">
            <span className="text-slate-700 dark:text-slate-200">Net Payout</span>
            <span className="font-mono text-base text-emerald-600 dark:text-emerald-400">{fmtINR(p.netPayout)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Treasury ────────────────────────────────────────────────────────────
function TreasuryTab({ p }) {
  const settleCfg = SETTLEMENT_STATUSES[p.settlementStatus] ?? SETTLEMENT_STATUSES.PENDING;
  const paymentCfg = PAYMENT_STATUSES[p.paymentStatus] ?? PAYMENT_STATUSES.UNPAID;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Settlement Status', badge: <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${settleCfg.bg} ${settleCfg.text}`}>{settleCfg.label}</span> },
          { label: 'Payment Status',    badge: <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${paymentCfg.bg} ${paymentCfg.text}`}>{paymentCfg.label}</span> },
        ].map(r => (
          <div key={r.label} className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">{r.label}</span>
            {r.badge}
          </div>
        ))}
      </div>

      <div>
        <SectionTitle icon={Landmark}>Bank Transfer Details</SectionTitle>
        <DataRow label="Transfer ID"    value={p.bankTransferId ?? 'Not processed'}   mono />
        <DataRow label="Transfer Date"  value={p.paidAt ? fmtDate(p.paidAt) : 'Pending'} />
        <DataRow label="Recon ID"       value={p.reconciliationId ?? 'Not reconciled'} mono />
        <DataRow label="Net Payout Amount" value={fmtINRFull(p.netPayout)} mono color="text-emerald-600 dark:text-emerald-400" />
      </div>

      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={13} className="text-amber-600" />
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Treasury Impact</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-[10px]">Cash Outflow</p>
            <p className="font-mono font-bold text-amber-700 dark:text-amber-400">{fmtINR(p.netPayout)}</p>
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-[10px]">Pending Settlement</p>
            <p className="font-mono font-bold text-rose-600 dark:text-rose-400">{fmtINR(p.pendingCollection)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Workflow ────────────────────────────────────────────────────────────
function WorkflowTab({ p }) {
  const steps = [
    { state: 'DRAFT',            label: 'Draft',            icon: FileText,    done: true,            color: '#64748b' },
    { state: 'CALCULATED',       label: 'Calculated',       icon: Activity,    done: true,            color: '#0ea5e9' },
    { state: 'UNDER_REVIEW',     label: 'Under Review',     icon: Eye,         done: ['APPROVED','PENDING_TRANSFER','PAID','RECONCILED','CLOSED','ESCALATED'].includes(p.workflowState), color: '#8b5cf6' },
    { state: 'APPROVED',         label: 'Approved',         icon: CheckCircle2,done: ['PENDING_TRANSFER','PAID','RECONCILED','CLOSED'].includes(p.workflowState), color: '#059669' },
    { state: 'PENDING_TRANSFER', label: 'Pending Transfer', icon: CreditCard,  done: ['PAID','RECONCILED','CLOSED'].includes(p.workflowState), color: '#f59e0b' },
    { state: 'PAID',             label: 'Paid',             icon: Banknote,    done: ['RECONCILED','CLOSED'].includes(p.workflowState), color: '#22c55e' },
    { state: 'RECONCILED',       label: 'Reconciled',       icon: GitMerge,    done: p.workflowState === 'CLOSED', color: '#14b8a6' },
    { state: 'CLOSED',           label: 'Closed',           icon: Shield,      done: p.workflowState === 'CLOSED', color: '#059669' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <SectionTitle icon={Workflow}>Payout Lifecycle</SectionTitle>
        <div className="relative">
          <div className="absolute left-4 top-4 bottom-4 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="space-y-0.5">
            {steps.map((s, i) => {
              const isCurrent = s.state === p.workflowState;
              const Icon = s.icon;
              return (
                <div key={s.state} className={`relative flex items-start gap-3 pl-2 pr-3 py-2.5 rounded-lg transition-colors ${isCurrent ? 'bg-emerald-50 dark:bg-emerald-900/10' : ''}`}>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center flex-none z-10 ${s.done || isCurrent ? '' : 'bg-slate-100 dark:bg-slate-800'}`}
                    style={s.done || isCurrent ? { background: `${s.color}20` } : {}}
                  >
                    {s.done
                      ? <CheckCircle2 size={13} style={{ color: s.color }} />
                      : isCurrent
                        ? <Icon size={13} style={{ color: s.color }} />
                        : <Clock size={13} className="text-slate-300 dark:text-slate-600" />
                    }
                  </div>
                  <div className="flex-1">
                    <span className={`text-xs font-semibold ${s.done || isCurrent ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'}`}>
                      {s.label}
                    </span>
                    {isCurrent && (
                      <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold">CURRENT</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Audit Trail ─────────────────────────────────────────────────────────
function AuditTab({ p }) {
  const events = [
    { action: 'Payout Calculated',    by: 'System (Auto)',         at: p.createdAt,      note: `Revenue share ${p.sharePercent}% applied on ₹${(p.revenueGenerated/100000).toFixed(2)}L`, icon: Activity,    color: '#0ea5e9' },
    { action: 'AP Entry Created',     by: 'System',                at: p.createdAt,      note: `AP entry ${p.apEntryId} posted`,                                                            icon: Banknote,    color: '#6366f1' },
    { action: 'Sent for Review',      by: 'Finance Manager',       at: p.createdAt,      note: 'Payout forwarded for approval',                                                             icon: ArrowUpRight,color: '#8b5cf6' },
    ...(p.approvedAt ? [{ action: 'Payout Approved', by: 'CFO', at: p.approvedAt, note: 'All calculations verified and approved', icon: CheckCircle2, color: '#059669' }] : []),
    ...(p.paidAt     ? [{ action: 'Bank Transfer Processed', by: 'Treasury', at: p.paidAt, note: `Transfer ${p.bankTransferId} initiated`, icon: Landmark, color: '#22c55e' }] : []),
    ...(p.reconciledAt ? [{ action: 'Reconciled', by: 'System (Auto)', at: p.reconciledAt, note: `Recon ${p.reconciliationId} completed`, icon: GitMerge, color: '#14b8a6' }] : []),
  ].filter(e => e.at);

  return (
    <div className="space-y-1">
      <SectionTitle icon={ClipboardList}>Immutable Audit Log</SectionTitle>
      <div className="space-y-1">
        {events.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-none" style={{ background: `${ev.color}15` }}>
                <Icon size={12} style={{ color: ev.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">{ev.action}</span>
                  <span className="text-[10px] text-slate-400">{fmtDateTime(ev.at)}</span>
                </div>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">{ev.note}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">by {ev.by}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function DPDetailDrawer({ payout, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabContent = {
    overview:   <OverviewTab   p={payout} />,
    revenue:    <RevenueTab    p={payout} />,
    financials: <FinancialsTab p={payout} />,
    incentives: <IncentivesTab p={payout} />,
    treasury:   <TreasuryTab   p={payout} />,
    workflow:   <WorkflowTab   p={payout} />,
    audit:      <AuditTab      p={payout} />,
  };

  return (
    <AnimatePresence>
      {payout && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/20 dark:bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-2xl bg-white dark:bg-slate-950 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex-none">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50">{payout.doctorName}</h2>
                <p className="text-[10.5px] text-slate-400 dark:text-slate-500">{payout.id} · {payout.specialty} · {payout.payoutPeriod}</p>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Tab bar */}
            <div className="flex gap-0 overflow-x-auto border-b border-slate-200 dark:border-slate-800 flex-none px-2">
              {TABS.map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-medium border-b-2 whitespace-nowrap transition-all ${
                      activeTab === t.id
                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon size={12} />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {tabContent[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
