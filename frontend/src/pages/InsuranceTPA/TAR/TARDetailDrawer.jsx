import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, User, FileText, IndianRupee, History, Phone,
  Workflow, Landmark, ClipboardList, ExternalLink, Download,
  AlertTriangle, CheckCircle2, Clock, AlertCircle,
  Sparkles, Calendar, CreditCard, ChevronRight, Send,
  Edit3, BookOpen, ArrowRight, RefreshCcw, Upload, Plus,
} from 'lucide-react';
import {
  CLAIM_STATUSES, CLAIM_TYPES, RISK_LEVELS,
  fmtINR, fmtINRFull, fmtDate,
  FOLLOWUP_STATUSES, SETTLEMENT_STATUSES, WORKFLOW_STATUSES,
} from './TARConstants';

const TABS = [
  { id: 'overview',    label: 'Overview',       icon: User          },
  { id: 'history',     label: 'Claim History',   icon: History       },
  { id: 'financial',   label: 'Financials',      icon: IndianRupee   },
  { id: 'followups',   label: 'Follow-ups',      icon: Phone         },
  { id: 'workflow',    label: 'Workflow',         icon: Workflow      },
  { id: 'reconcile',   label: 'Reconciliation',  icon: Landmark      },
  { id: 'audit',       label: 'Audit Trail',     icon: ClipboardList },
];

function Row({ label, value, mono, color, bold }) {
  return (
    <div className="flex justify-between items-start gap-3 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
      <span className="text-[11.5px] text-slate-500 dark:text-slate-400 flex-none">{label}</span>
      <span className={`text-[12px] text-right leading-tight ${mono ? 'font-mono' : ''} ${bold ? 'font-bold' : 'font-medium'} ${color ?? 'text-slate-700 dark:text-slate-200'}`}>
        {value ?? '—'}
      </span>
    </div>
  );
}

function SHead({ children }) {
  return (
    <h4 className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-5 mb-3 first:mt-0">
      {children}
    </h4>
  );
}

function StatusBadge({ status }) {
  const cfg = CLAIM_STATUSES[status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: '#94a3b8', label: status };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function Timeline({ events }) {
  return (
    <div className="relative pl-5">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />
      {events.map((e, i) => (
        <div key={i} className="relative mb-4 last:mb-0">
          <div className="absolute -left-3 top-1.5 w-2 h-2 rounded-full bg-amber-400 border-2 border-white dark:border-slate-900" />
          <div className="text-[10.5px] text-slate-400 mb-0.5">{e.date} · {e.user}</div>
          <div className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{e.event}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Tab Components ───────────────────────────────────────────────────────────

function OverviewTab({ claim }) {
  const typeCfg = CLAIM_TYPES[claim.claimType]  ?? {};
  const riskCfg = RISK_LEVELS[claim.riskLevel]  ?? {};
  const agingColor = claim.agingDays > 180 ? '#dc2626' : claim.agingDays > 90 ? '#ef4444' : claim.agingDays > 60 ? '#f97316' : claim.agingDays > 30 ? '#f59e0b' : '#10b981';

  return (
    <div className="p-5 overflow-y-auto">
      {/* Aging alert */}
      {claim.agingDays > 90 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/15 border border-red-200 dark:border-red-700/40 mb-4">
          <AlertTriangle size={14} className="text-red-500 flex-none mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-red-700 dark:text-red-400">Critical Aging — {claim.agingDays} Days Overdue</p>
            <p className="text-[11px] text-red-600 dark:text-red-400/80 mt-0.5">This claim has been outstanding for {claim.agingDays} days. Immediate escalation and recovery action required. AI recovery probability: {claim.recoveryProbability}%.</p>
          </div>
        </div>
      )}
      {claim.denialReason && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/40 mb-4">
          <AlertCircle size={14} className="text-amber-500 flex-none mt-0.5" />
          <p className="text-[11.5px] text-amber-700 dark:text-amber-400">Denial reason: {claim.denialReason}</p>
        </div>
      )}

      <SHead>Patient Information</SHead>
      <Row label="Patient Name"    value={claim.patientName}   bold />
      <Row label="UHID / MRN"      value={claim.uhid}          mono />
      <Row label="Admission"       value={fmtDate(claim.admissionDate)} />
      <Row label="Discharge"       value={fmtDate(claim.dischargeDate)} />
      <Row label="Diagnosis"       value={claim.diagnosis} />
      <Row label="Department"      value={claim.department} />
      <Row label="Treating Doctor" value={claim.doctor} />
      <Row label="Branch"          value={claim.branch} />

      <SHead>Claim Information</SHead>
      <Row label="Claim Number"    value={claim.id}            mono color="text-amber-600 dark:text-amber-400" bold />
      <Row label="Invoice Number"  value={claim.invoiceNo}     mono color="text-blue-600 dark:text-blue-400" />
      <Row label="AR Entry"        value={claim.arEntryNo}     mono color="text-indigo-600 dark:text-indigo-400" />
      <Row label="Claim Type"      value={typeCfg.label} />
      <Row label="TPA / Insurer"   value={claim.tpa} />
      <Row label="Submitted"       value={fmtDate(claim.claimSubmitDate)} />
      <Row label="Aging"           value={`${claim.agingDays} days`}
        color={claim.agingDays > 90 ? 'text-red-600 dark:text-red-400' : claim.agingDays > 60 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-700 dark:text-slate-200'}
        bold />
      <Row label="Follow-up Count" value={`${claim.followUpCount} follow-ups`} />

      <SHead>Status</SHead>
      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[11.5px] text-slate-500">Claim Status</span>
        <StatusBadge status={claim.status} />
      </div>
      <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[11.5px] text-slate-500">Risk Level</span>
        <span className={`text-[12px] font-bold ${riskCfg.text}`}>{riskCfg.label} — {claim.recoveryProbability}% recovery</span>
      </div>
      <div className="flex justify-between items-center py-2">
        <span className="text-[11.5px] text-slate-500">GL Posted</span>
        <span className={`text-[11px] font-bold ${claim.glPosted ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
          {claim.glPosted ? '✓ Posted' : 'Not Posted'}
        </span>
      </div>
    </div>
  );
}

function HistoryTab({ claim }) {
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Claim Submission History</SHead>
      <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-700/40 mb-4">
        <div className="text-[12px] font-bold text-indigo-700 dark:text-indigo-400 mb-1">Submitted on {fmtDate(claim.claimSubmitDate)}</div>
        <div className="text-[11px] text-slate-500">Claim Type: {CLAIM_TYPES[claim.claimType]?.label ?? claim.claimType}</div>
      </div>

      {claim.denialReason && (
        <>
          <SHead>Denial Information</SHead>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-700/40 mb-4">
            <AlertTriangle size={14} className="text-red-500 flex-none mt-0.5" />
            <div>
              <p className="text-[12px] font-bold text-red-700 dark:text-red-400">Denial Reason</p>
              <p className="text-[11.5px] text-red-600 dark:text-red-400/80 mt-0.5">{claim.denialReason}</p>
            </div>
          </div>

          <SHead>Recovery Actions</SHead>
          <div className="space-y-2">
            {[
              { label: 'File Formal Appeal', icon: Send,         color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Upload Documents',   icon: Upload,       color: 'text-amber-600 dark:text-amber-400'  },
              { label: 'Request Reconsideration', icon: RefreshCcw, color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Escalate to IRDAI',  icon: AlertTriangle, color: 'text-rose-600 dark:text-rose-400' },
            ].map(a => {
              const Icon = a.icon;
              return (
                <button key={a.label}
                  className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Icon size={13} className={`flex-none ${a.color}`} />
                  <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{a.label}</span>
                  <ChevronRight size={11} className="ml-auto text-slate-400" />
                </button>
              );
            })}
          </div>
        </>
      )}

      <SHead>Full Timeline</SHead>
      <Timeline events={claim.timeline ?? []} />
    </div>
  );
}

function FinancialTab({ claim }) {
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Claim Financials</SHead>
      <Row label="Claim Amount"    value={fmtINRFull(claim.claimAmount)}    mono bold />
      <Row label="Approved Amount" value={claim.approvedAmount > 0 ? fmtINRFull(claim.approvedAmount) : 'Pending'}
        mono color={claim.approvedAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'} />
      <Row label="Denied Amount"   value={claim.deniedAmount > 0 ? fmtINRFull(claim.deniedAmount) : 'Nil'}
        mono color={claim.deniedAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400'} />
      <Row label="Settled Amount"  value={claim.settledAmount > 0 ? fmtINRFull(claim.settledAmount) : 'Nil'}
        mono color="text-emerald-600 dark:text-emerald-400" />
      <div className="flex justify-between items-center py-2.5 border-b-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 -mx-2 px-2 mt-1 rounded">
        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Outstanding</span>
        <span className={`text-[15px] font-bold font-mono ${claim.outstandingAmount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {claim.outstandingAmount > 0 ? fmtINRFull(claim.outstandingAmount) : 'Settled'}
        </span>
      </div>
      <Row label="Recovery Probability" value={`${claim.recoveryProbability}%`}
        mono color={claim.recoveryProbability >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'} bold />

      <SHead>Linked Records</SHead>
      {[
        { label: 'AR Entry',   val: claim.arEntryNo,  color: 'text-blue-600 dark:text-blue-400',    icon: ArrowRight },
        { label: 'GL Posting', val: claim.glPosted ? `GL-${claim.id.replace('CLM-', '')}` : null, color: 'text-violet-600 dark:text-violet-400', icon: BookOpen },
        { label: 'Invoice',    val: claim.invoiceNo,  color: 'text-indigo-600 dark:text-indigo-400', icon: FileText },
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
    </div>
  );
}

function FollowUpsTab({ claim }) {
  const [newNote, setNewNote] = useState('');

  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Follow-up Activity — {claim.followUpCount} total</SHead>
      {claim.followUpCount === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Phone size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No follow-ups recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {(claim.timeline ?? []).filter(e => e.type === 'followup').map((f, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start justify-between mb-1">
                <span className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{f.event}</span>
                <span className="text-[10px] text-slate-400 flex-none ml-2">{f.date}</span>
              </div>
              <span className="text-[10.5px] text-slate-500">By: {f.user}</span>
            </div>
          ))}
        </div>
      )}

      <SHead>Add Follow-up Note</SHead>
      <div className="space-y-3">
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          rows={3}
          placeholder="Enter follow-up note or TPA response details…"
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 resize-none"
        />
        <div className="flex gap-2">
          <select className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[12px] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/30">
            <option value="call">Phone Call</option>
            <option value="email">Email</option>
            <option value="portal">TPA Portal</option>
            <option value="visit">Personal Visit</option>
          </select>
          <button
            disabled={!newNote.trim()}
            className="flex items-center gap-2 px-4 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white text-[12px] font-semibold transition-colors"
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function WorkflowTab({ claim }) {
  const steps = [
    'Preauthorization', 'Billing & Documentation', 'Claim Submission',
    'TPA Review', 'Approval / Denial', 'Follow-up', 'Settlement', 'Reconciliation',
  ];
  const workflowCfg = WORKFLOW_STATUSES[claim.workflowStatus];
  const stepIndex = claim.status === 'SUBMITTED' ? 2
    : claim.status === 'UNDER_REVIEW' ? 3
    : claim.status === 'APPROVED' || claim.status === 'PARTIAL_APPROVED' ? 4
    : claim.status === 'DENIED' ? 4
    : claim.status === 'SETTLED' ? 6
    : claim.status === 'RECONCILED' ? 7
    : 2;

  return (
    <div className="p-5 overflow-y-auto">
      {workflowCfg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl mb-4 ${workflowCfg.bg} border ${workflowCfg.text}`}
          style={{ borderColor: workflowCfg.dot + '60' }}>
          <span className="w-2 h-2 rounded-full" style={{ background: workflowCfg.dot }} />
          <span className="text-[12px] font-bold">{workflowCfg.label}</span>
        </div>
      )}

      <SHead>Claim Lifecycle</SHead>
      <div className="space-y-1.5 mb-6">
        {steps.map((s, i) => {
          const done   = i < stepIndex;
          const active = i === stepIndex - 1;
          return (
            <div key={s} className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors
              ${active ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-none text-[10px] font-bold
                ${done ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' :
                  active ? 'bg-amber-500 text-white' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                {done ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span className={`text-[12px] font-medium ${
                active ? 'text-amber-700 dark:text-amber-300 font-bold' :
                done   ? 'text-slate-400 line-through' :
                'text-slate-600 dark:text-slate-300'
              }`}>{s}</span>
              {active && <span className="ml-auto text-[10px] font-bold text-amber-500 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">Current</span>}
            </div>
          );
        })}
      </div>

      <SHead>SLA Status</SHead>
      {[
        { label: 'Submission SLA', target: 30, actual: claim.agingDays },
        { label: 'Settlement SLA', target: 60, actual: Math.max(0, claim.agingDays - 15) },
      ].map(sla => {
        const ok = sla.actual <= sla.target;
        return (
          <div key={sla.label} className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-[11.5px] text-slate-500">{sla.label}</span>
            <span className={`text-[11.5px] font-bold ${ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {ok ? `✓ Within ${sla.target}d` : `⚠ ${sla.actual - sla.target}d overdue`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function ReconcileTab({ claim }) {
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Reconciliation Status</SHead>
      {claim.reconciled ? (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/40 mb-4">
          <CheckCircle2 size={14} className="text-emerald-500 flex-none mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-emerald-700 dark:text-emerald-400">Fully Reconciled</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">Settlement matched in AR & GL.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/40 mb-4">
          <Clock size={14} className="text-amber-500 flex-none mt-0.5" />
          <p className="text-[12px] text-amber-700 dark:text-amber-400">
            {claim.settlementStatus === 'PARTIAL' ? 'Partially reconciled — balance outstanding.' : 'Pending settlement — reconciliation not yet initiated.'}
          </p>
        </div>
      )}

      <SHead>Settlement Breakdown</SHead>
      <Row label="Claim Amount"   value={fmtINRFull(claim.claimAmount)}     mono bold />
      <Row label="Approved"       value={claim.approvedAmount > 0 ? fmtINRFull(claim.approvedAmount) : 'Pending'} mono
        color={claim.approvedAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'} />
      <Row label="Settled to Date" value={claim.settledAmount > 0 ? fmtINRFull(claim.settledAmount) : 'Nil'} mono
        color="text-emerald-600 dark:text-emerald-400" />
      <Row label="Balance Due"    value={fmtINRFull(claim.outstandingAmount)} mono bold
        color="text-amber-600 dark:text-amber-400" />

      <SHead>Linked Financial Records</SHead>
      {[
        { label: 'AR Entry',  val: claim.arEntryNo,  note: 'Accounts Receivable' },
        { label: 'Invoice',   val: claim.invoiceNo,  note: 'Patient Billing'     },
        { label: 'GL Posting',val: claim.glPosted ? `GL-${claim.id.slice(-5)}` : null, note: 'General Ledger' },
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
  const auditEvents = (claim.timeline ?? []).map((e, i) => ({
    ...e,
    action: i === 0 ? 'CREATE' : e.type === 'approval' ? 'UPDATE' : e.type === 'followup' ? 'FOLLOW_UP' : 'SYSTEM',
  }));
  return (
    <div className="p-5 overflow-y-auto">
      <SHead>Immutable Audit Trail</SHead>
      <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <ClipboardList size={12} />
        All claim actions are permanently logged with user, timestamp, and event type.
      </div>
      <div className="space-y-2">
        {auditEvents.map((e, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className={`flex-none px-1.5 py-0.5 rounded text-[9.5px] font-bold mt-0.5
              ${e.action === 'CREATE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' :
                e.action === 'UPDATE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                e.action === 'FOLLOW_UP' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                'bg-slate-200 text-slate-600'}`}>
              {e.action}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium text-slate-700 dark:text-slate-200">{e.event}</div>
              <div className="text-[10.5px] text-slate-400 mt-0.5">{e.date} · {e.user}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const TAB_COMPONENTS = {
  overview:  OverviewTab,
  history:   HistoryTab,
  financial: FinancialTab,
  followups: FollowUpsTab,
  workflow:  WorkflowTab,
  reconcile: ReconcileTab,
  audit:     AuditTab,
};

export default function TARDetailDrawer({ claim, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const TabContent = TAB_COMPONENTS[activeTab] ?? OverviewTab;

  const agingColor = (claim?.agingDays ?? 0) > 180 ? '#dc2626'
    : (claim?.agingDays ?? 0) > 90  ? '#ef4444'
    : (claim?.agingDays ?? 0) > 60  ? '#f97316'
    : (claim?.agingDays ?? 0) > 30  ? '#f59e0b'
    : '#10b981';

  return (
    <AnimatePresence>
      {claim && (
        <>
          <motion.div
            key="bd"
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
            className="fixed right-0 top-0 bottom-0 z-50 w-[580px] flex flex-col bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl"
          >
            {/* Header */}
            <div className="flex-none px-5 py-4 border-b border-slate-200 dark:border-slate-800"
              style={{ background: `linear-gradient(135deg, ${agingColor}0d 0%, transparent 60%)` }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: agingColor }}>
                      TPA Aging Claim · {claim.agingDays}d Overdue
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 font-mono">{claim.id}</h3>
                  <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">{claim.patientName} · {claim.tpa}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    <Download size={14} />
                  </button>
                  <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    <X size={15} />
                  </button>
                </div>
              </div>
              {/* Quick stats */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                {[
                  { l: 'Claim Amt',    v: fmtINR(claim.claimAmount),      c: 'text-slate-800 dark:text-slate-100' },
                  { l: 'Outstanding',  v: fmtINR(claim.outstandingAmount), c: 'text-amber-600 dark:text-amber-400' },
                  { l: 'Approved',     v: claim.approvedAmount > 0 ? fmtINR(claim.approvedAmount) : '—', c: 'text-emerald-600 dark:text-emerald-400' },
                  { l: 'Recovery',     v: `${claim.recoveryProbability}%`, c: claim.recoveryProbability >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400' },
                ].map(s => (
                  <div key={s.l} className="text-center flex-1">
                    <div className={`text-[13px] font-bold font-mono ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-slate-400">{s.l}</div>
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
                      className={`flex items-center gap-1.5 px-3 py-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors
                        ${activeTab === tab.id
                          ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                    >
                      <Icon size={11} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
              <TabContent claim={claim} />
            </div>

            {/* Footer */}
            <div className="flex-none px-4 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <div className="flex items-center gap-2 flex-wrap">
                <button className="flex items-center gap-1.5 flex-1 justify-center py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors">
                  <Phone size={13} />
                  Start Follow-up
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 text-sm font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                  <CreditCard size={13} />
                  Settle
                </button>
                <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-700/40 text-red-700 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <AlertTriangle size={13} />
                  Escalate
                </button>
                <button className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
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
