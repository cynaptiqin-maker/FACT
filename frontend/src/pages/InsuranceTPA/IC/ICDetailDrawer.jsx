import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, FileText, IndianRupee, GitBranch, Workflow,
  Landmark, ClipboardList, ChevronRight, ExternalLink, Download,
  Upload, AlertTriangle, CheckCircle2, Clock, Zap, AlertCircle,
  Sparkles, Building2, Stethoscope, Calendar, CreditCard,
  ArrowRight, RefreshCcw, Send, Edit3, BookOpen,
} from 'lucide-react';
import {
  CLAIM_STATUSES, CLAIM_TYPES, RISK_LEVELS, fmtINR, fmtINRFull, fmtDate, fmtDateTime,
} from './ICConstants';
import AccountingLineage from '@components/shared/AccountingLineage';

const TABS = [
  { id: 'overview',   label: 'Overview',       icon: User         },
  { id: 'financial',  label: 'Financials',      icon: IndianRupee  },
  { id: 'documents',  label: 'Documents',       icon: FileText     },
  { id: 'denial',     label: 'Denial / Appeal', icon: AlertTriangle},
  { id: 'workflow',   label: 'Workflow',         icon: Workflow     },
  { id: 'reconcile',  label: 'Reconciliation',  icon: Landmark     },
  { id: 'audit',      label: 'Audit Trail',      icon: ClipboardList},
  { id: 'gl',         label: 'GL Journals',      icon: BookOpen     },
];

// ─── Sub-components ────────────────────────────────────────────────────────────
function Row({ label, value, mono, color, bold }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 dark:border-slate-800/80">
      <span className="text-[11.5px] text-slate-500 dark:text-slate-400 flex-none">{label}</span>
      <span className={`text-[12px] text-right leading-tight ${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : 'font-medium'} ${color ?? 'text-slate-700 dark:text-slate-200'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function SHead({ children }) {
  return (
    <h4 className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-5 mb-2 first:mt-0">
      {children}
    </h4>
  );
}

function StatusBadge({ status }) {
  const cfg = CLAIM_STATUSES[status] ?? CLAIM_STATUSES.DRAFT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ events }) {
  return (
    <div className="relative pl-5">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
      {events.map((e, i) => (
        <div key={i} className="relative mb-4 last:mb-0">
          <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-indigo-400 border-2 border-white dark:border-slate-900" />
          <div className="text-[10.5px] text-slate-400 mb-0.5">{e.ts} · {e.user}</div>
          <div className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{e.event}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────────────────
function OverviewTab({ claim }) {
  const statusCfg  = CLAIM_STATUSES[claim.status]  ?? {};
  const typeCfg    = CLAIM_TYPES[claim.claimType]   ?? {};
  const riskCfg    = RISK_LEVELS[claim.riskLevel]   ?? {};

  return (
    <div className="p-5 space-y-0.5 overflow-y-auto">
      {/* AI Risk Banner */}
      {claim.aiDenialRisk > 50 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 mb-4">
          <Sparkles size={14} className="text-red-500 flex-none mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-red-700 dark:text-red-400">High Denial Risk — {claim.aiDenialRisk}%</p>
            <p className="text-[11px] text-red-600 dark:text-red-400/80 mt-0.5">AI predicts this claim has a {claim.aiDenialRisk}% probability of denial. Recovery probability: {claim.aiRecoveryProb}%.</p>
          </div>
        </div>
      )}
      {claim.leakage && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 mb-4">
          <Zap size={14} className="text-amber-500 flex-none mt-0.5" />
          <p className="text-[11.5px] text-amber-700 dark:text-amber-400">{claim.leakageNote}</p>
        </div>
      )}

      <SHead>Patient Information</SHead>
      <Row label="Patient Name"     value={claim.patientName}  bold />
      <Row label="UHID / MRN"       value={claim.uhid}         mono />
      <Row label="Age / Gender"     value={`${claim.age} yrs · ${claim.gender}`} />
      <Row label="Mobile"           value={claim.mobile}       mono />
      <Row label="Admission"        value={fmtDate(claim.admissionDate)} />
      <Row label="Discharge"        value={fmtDate(claim.dischargeDate)} />
      <Row label="Ward / Bed"       value={claim.ward} />
      <Row label="Diagnosis"        value={claim.diagnosis} />
      <Row label="Department"       value={claim.department} />
      <Row label="Treating Doctor"  value={claim.doctor} />
      <Row label="Branch"           value={claim.branch} />

      <SHead>Claim Information</SHead>
      <Row label="Claim Number"     value={claim.id}           mono color="text-indigo-600 dark:text-indigo-400" bold />
      <Row label="Invoice Number"   value={claim.invoiceNo}    mono color="text-blue-600 dark:text-blue-400" />
      <Row label="Preauth Number"   value={claim.preAuthNo}    mono />
      <Row label="Claim Type"       value={typeCfg.label} />
      <Row label="Insurance / TPA"  value={claim.tpa} />
      <Row label="Submission Date"  value={fmtDate(claim.submissionDate)} />
      <Row label="Aging Days"       value={`${claim.agingDays} days`}
        color={claim.agingDays > 90 ? 'text-red-600 dark:text-red-400' : claim.agingDays > 60 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}
        bold />

      <SHead>Status & Risk</SHead>
      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[11.5px] text-slate-500">Claim Status</span>
        <StatusBadge status={claim.status} />
      </div>
      <Row label="Settlement Status" value={claim.settlementStatus?.replace(/_/g, ' ') ?? '—'} />
      <Row label="Workflow Status"   value={claim.workflowStatus} />
      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[11.5px] text-slate-500">Risk Level</span>
        <span className={`text-[12px] font-bold ${riskCfg.text}`}>{riskCfg.label} — AI {claim.aiDenialRisk}%</span>
      </div>
    </div>
  );
}

function FinancialTab({ claim }) {
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Claim Financials</SHead>
      <Row label="Claim Amount"     value={fmtINRFull(claim.claimAmount)}    mono bold />
      <Row label="Preauth Amount"   value={fmtINRFull(claim.claimAmount)}    mono />
      <Row label="Approved Amount"  value={claim.approvedAmount > 0 ? fmtINRFull(claim.approvedAmount) : 'Pending'}
        mono color={claim.approvedAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'} />
      <Row label="Denied Amount"    value={claim.deniedAmount > 0 ? fmtINRFull(claim.deniedAmount) : 'Nil'}
        mono color={claim.deniedAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'} />
      <div className="flex justify-between items-center py-2.5 border-b-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 -mx-2 px-2 mt-1">
        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Outstanding</span>
        <span className={`text-[14px] font-bold font-mono ${claim.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {claim.outstandingAmount > 0 ? fmtINRFull(claim.outstandingAmount) : 'Settled'}
        </span>
      </div>

      <SHead>Cross-Module Links</SHead>
      {[
        { label: 'AR Entry',      val: claim.arEntry,    color: 'text-blue-600 dark:text-blue-400',   icon: ArrowRight },
        { label: 'GL Posting',    val: claim.glPosting,  color: 'text-violet-600 dark:text-violet-400', icon: BookOpen },
        { label: 'Invoice',       val: claim.invoiceNo,  color: 'text-indigo-600 dark:text-indigo-400', icon: FileText },
      ].map(({ label, val, color, icon: Icon }) => (
        <div key={label} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
          <span className="text-[11.5px] text-slate-500">{label}</span>
          {val
            ? <button className={`flex items-center gap-1 text-[12px] font-mono font-semibold ${color} hover:underline`}>
                {val} <ExternalLink size={10} />
              </button>
            : <span className="text-[11.5px] text-slate-400">Not posted</span>
          }
        </div>
      ))}

      {claim.settlementHistory?.length > 0 && (
        <>
          <SHead>Settlement History</SHead>
          {claim.settlementHistory.map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 mb-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">{fmtINRFull(s.amount)}</div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5">Ref: {s.reference}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{s.mode}</div>
                  <div className="text-[10.5px] text-slate-400">{fmtDate(s.date)}</div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function DocumentsTab({ claim }) {
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Uploaded Documents</SHead>
      {claim.documents.map((doc, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText size={13} className="text-indigo-400 flex-none" />
            <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{doc}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="flex items-center gap-1 text-[10.5px] text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={11} />Uploaded
            </span>
            <button className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500">
              <Download size={12} />
            </button>
          </div>
        </div>
      ))}

      {claim.missingDocs?.length > 0 && (
        <>
          <SHead>Missing Documents</SHead>
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 mb-3">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={13} className="text-amber-500" />
              <span className="text-[12px] font-bold text-amber-700 dark:text-amber-400">
                {claim.missingDocs.length} document(s) required for submission
              </span>
            </div>
            <ul className="space-y-1">
              {claim.missingDocs.map((doc, i) => (
                <li key={i} className="flex items-center gap-2 text-[11.5px] text-amber-700 dark:text-amber-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-none" />
                  {doc}
                </li>
              ))}
            </ul>
          </div>
          <button className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
            <Upload size={14} />
            Upload Missing Documents
          </button>
        </>
      )}
    </div>
  );
}

function DenialTab({ claim }) {
  const hasDenials = claim.denialReasons?.length > 0;

  return (
    <div className="p-5 overflow-y-auto">
      {hasDenials ? (
        <>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 mb-4">
            <AlertTriangle size={14} className="text-red-500 flex-none mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-red-700 dark:text-red-400">Claim Denied / Partially Denied</p>
              <p className="text-[11px] text-red-600 dark:text-red-400/80 mt-0.5">Denied Amount: {fmtINRFull(claim.deniedAmount)}</p>
            </div>
          </div>

          <SHead>Denial Reasons</SHead>
          {claim.denialReasons.map((r, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="w-2 h-2 rounded-full bg-red-400 flex-none" />
              <span className="text-[12px] text-slate-700 dark:text-slate-200">{r}</span>
            </div>
          ))}

          <SHead>Recovery Actions</SHead>
          <div className="space-y-2">
            {[
              { label: 'File Formal Appeal',    icon: Send,       color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Upload Missing Docs',   icon: Upload,     color: 'text-amber-600 dark:text-amber-400'  },
              { label: 'Request Reconsideration', icon: RefreshCcw, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Escalate to Grievance', icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400' },
            ].map(a => {
              const Icon = a.icon;
              return (
                <button key={a.label}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                    hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                  <Icon size={13} className={`flex-none ${a.color}`} />
                  <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{a.label}</span>
                  <ChevronRight size={11} className="ml-auto text-slate-400" />
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <CheckCircle2 size={32} className="text-emerald-400 mb-3" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No denials recorded</p>
          <p className="text-xs mt-1">This claim has no denial or deduction</p>
        </div>
      )}
    </div>
  );
}

function WorkflowTab({ claim }) {
  const steps = [
    'Preauthorization', 'Billing', 'Claim Preparation', 'Submission',
    'TPA Review', 'Approval / Denial', 'Settlement', 'Reconciliation', 'Closure',
  ];

  const stepIndex = claim.status === 'DRAFT' ? 1
    : claim.status === 'PENDING_DOCS' ? 2
    : claim.status === 'SUBMITTED' ? 3
    : claim.status === 'UNDER_REVIEW' ? 4
    : claim.status === 'APPROVED' || claim.status === 'PARTIAL_APPROVED' ? 5
    : claim.status === 'DENIED' ? 5
    : claim.status === 'SETTLED' ? 7
    : claim.status === 'RECONCILED' ? 8
    : claim.status === 'CLOSED' ? 9
    : 3;

  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Claim Lifecycle</SHead>
      <div className="space-y-2 mb-6">
        {steps.map((s, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex - 1;
          return (
            <div key={s} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors
              ${active ? 'bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/40' : ''}
            `}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-none text-[10px] font-bold
                ${done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                  active ? 'bg-indigo-500 text-white' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {done ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className={`text-[12px] font-medium ${
                active ? 'text-indigo-700 dark:text-indigo-300 font-bold' :
                done ? 'text-slate-500 line-through' :
                'text-slate-600 dark:text-slate-300'
              }`}>{s}</span>
              {active && <span className="ml-auto text-[10px] font-semibold text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">Current</span>}
            </div>
          );
        })}
      </div>

      <SHead>Claim Timeline</SHead>
      <Timeline events={claim.timeline ?? []} />
    </div>
  );
}

function ReconcileTab({ claim }) {
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Reconciliation Status</SHead>
      {claim.settlementStatus === 'SETTLED' || claim.status === 'RECONCILED' ? (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 mb-4">
          <CheckCircle2 size={14} className="text-emerald-500 flex-none mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">Claim Reconciled</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400/80 mt-0.5">Settlement receipt matched with AR & GL entries.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 mb-4">
          <Clock size={14} className="text-amber-500 flex-none mt-0.5" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400">Pending settlement — reconciliation not yet initiated.</p>
        </div>
      )}

      <SHead>Linked Financial Records</SHead>
      {[
        { label: 'AR Entry',           val: claim.arEntry,    note: 'Accounts Receivable' },
        { label: 'GL Posting',         val: claim.glPosting,  note: 'General Ledger' },
        { label: 'Invoice',            val: claim.invoiceNo,  note: 'Patient Billing' },
        { label: 'Bank Reconciliation',val: claim.settlementHistory?.[0]?.reference, note: 'Cash & Bank' },
      ].map(({ label, val, note }) => (
        <div key={label} className="flex justify-between items-start py-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="text-[11.5px] text-slate-500">{label}</div>
            <div className="text-[10.5px] text-slate-400">{note}</div>
          </div>
          {val
            ? <button className="flex items-center gap-1 text-[12px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                {val} <ExternalLink size={10} />
              </button>
            : <span className="text-[11.5px] text-slate-400">—</span>
          }
        </div>
      ))}
    </div>
  );
}

function AuditTab({ claim }) {
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Immutable Audit Trail</SHead>
      <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <ClipboardList size={12} />
        All actions on this claim are logged with user, timestamp, and before/after state.
      </div>
      <Timeline events={claim.timeline ?? []} />
    </div>
  );
}

function GLTab({ claim }) {
  return (
    <div className="h-full">
      <AccountingLineage
        sourceModule="insurance-tpa"
        sourceId={claim?.id}
        title={`Claim ${claim?.claimNumber || ''}`}
      />
    </div>
  );
}

const TAB_COMPONENTS = {
  overview:  OverviewTab,
  financial: FinancialTab,
  documents: DocumentsTab,
  denial:    DenialTab,
  workflow:  WorkflowTab,
  reconcile: ReconcileTab,
  audit:     AuditTab,
  gl:        GLTab,
};

export default function ICDetailDrawer({ claim, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const TabContent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  return (
    <AnimatePresence>
      {claim && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-sm"
          />
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-[520px] flex flex-col
              bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            {/* Header */}
            <div className="flex-none px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold text-indigo-500 uppercase tracking-widest">Insurance Claim</span>
                    {claim.leakage && <Zap size={12} className="text-amber-500" />}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 font-mono">{claim.id}</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{claim.patientName} · {claim.tpa}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    <Download size={14} />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-indigo-100 dark:border-indigo-900/40">
                {[
                  { label: 'Claim Amt',    val: fmtINR(claim.claimAmount),    color: 'text-slate-800 dark:text-slate-100' },
                  { label: 'Approved',     val: fmtINR(claim.approvedAmount) || '—', color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Outstanding',  val: fmtINR(claim.outstandingAmount) || 'Nil', color: claim.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400' },
                  { label: 'Aging',        val: `${claim.agingDays}d`,        color: claim.agingDays > 60 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300' },
                ].map(s => (
                  <div key={s.label} className="text-center flex-1">
                    <div className={`text-[13px] font-bold font-mono ${s.color}`}>{s.val}</div>
                    <div className="text-[10px] text-slate-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex-none border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex overflow-x-auto scrollbar-hide">
                {TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-3 text-[11.5px] font-semibold whitespace-nowrap border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                    >
                      <Icon size={12} />
                      {tab.label}
                      {tab.id === 'denial' && claim.denialReasons?.length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          {claim.denialReasons.length}
                        </span>
                      )}
                      {tab.id === 'documents' && claim.missingDocs?.length > 0 && (
                        <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                          {claim.missingDocs.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              <TabContent claim={claim} />
            </div>

            {/* Footer Actions */}
            <div className="flex-none px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
                  <Send size={13} />
                  Submit Claim
                </button>
                <button className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Edit3 size={13} />
                </button>
                <button className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Download size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
