import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, LayoutDashboard, List, BookOpen, Shield, IndianRupee,
  GitBranch, FileSearch, Printer, Download, ExternalLink,
  User, Building2, Stethoscope, Calendar, CheckCircle2,
  AlertTriangle, Clock, Send, Edit3, RefreshCcw, FileText,
  ChevronRight, Zap, Landmark,
} from 'lucide-react';
import {
  BILL_TYPES, INV_STATUSES, CLAIM_STATUSES, RISK_LEVELS, WORKFLOW_STATES, DRAWER_TABS,
  fmtINR, fmtINRFull, fmtDate, fmtDateTime,
} from './PIConstants';
import AccountingLineage from '@components/shared/AccountingLineage';

// ─── Helpers ───────────────────────────────────────────────────────────────────
function DetailRow({ label, value, mono, colorClass }) {
  return (
    <div className="flex justify-between items-start gap-4 py-2 border-b border-slate-100 dark:border-slate-800">
      <span className="text-[12px] text-slate-500 dark:text-slate-400 flex-none">{label}</span>
      <span className={`text-[12px] font-semibold text-right ${mono ? 'font-mono' : ''} ${colorClass ?? 'text-slate-700 dark:text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 mt-5 first:mt-0">
      {children}
    </h4>
  );
}

const ICON_MAP = {
  LayoutDashboard, List, BookOpen, Shield, IndianRupee, GitBranch, FileSearch, Landmark,
};

// ─── Tab: Overview ─────────────────────────────────────────────────────────────
function OverviewTab({ inv }) {
  return (
    <div className="p-5 space-y-1">
      <SectionHead>Patient Information</SectionHead>
      <DetailRow label="Patient Name"  value={inv.patientName} />
      <DetailRow label="UHID / MRN"    value={inv.uhid} mono />
      <DetailRow label="Age / Gender"  value={`${inv.age} yrs · ${inv.gender}`} />
      <DetailRow label="Mobile"        value={inv.mobile} mono />
      {inv.admissionDate && <DetailRow label="Admission Date" value={inv.admissionDate} />}
      {inv.dischargeDate && <DetailRow label="Discharge Date" value={inv.dischargeDate} />}
      {inv.ward         && <DetailRow label="Ward / Bed"     value={inv.ward} />}

      <SectionHead>Invoice Information</SectionHead>
      <DetailRow label="Invoice Number" value={inv.invoiceNo} mono colorClass="text-rose-600 dark:text-rose-400 font-bold" />
      <DetailRow label="Invoice Date"   value={fmtDate(inv.invoiceDate)} />
      <DetailRow label="Due Date"       value={fmtDate(inv.dueDate)} />
      <DetailRow label="Branch"         value={inv.branch} />
      <DetailRow label="Department"     value={inv.department} />
      <DetailRow label="Treating Doctor" value={inv.doctor} />
      <DetailRow label="Billing Type"   value={BILL_TYPES[inv.billType]?.label ?? inv.billType} />
      <DetailRow label="Cashier"        value={inv.cashier} />
      <DetailRow label="Invoice Status" value={INV_STATUSES[inv.status]?.label ?? inv.status}
        colorClass={`font-bold ${
          inv.status === 'PAID' ? 'text-emerald-600 dark:text-emerald-400' :
          inv.status === 'OVERDUE' ? 'text-red-600 dark:text-red-400' :
          'text-amber-600 dark:text-amber-400'
        }`} />
      <DetailRow label="Risk Level"     value={RISK_LEVELS[inv.riskLevel]?.label ?? inv.riskLevel}
        colorClass={`font-bold ${
          inv.riskLevel === 'HIGH' ? 'text-red-600 dark:text-red-400' :
          inv.riskLevel === 'MEDIUM' ? 'text-amber-600 dark:text-amber-400' :
          'text-emerald-600 dark:text-emerald-400'
        }`} />

      <SectionHead>Financial Summary</SectionHead>
      <DetailRow label="Gross Amount"   value={fmtINRFull(inv.gross)} mono />
      <DetailRow label="Discount"       value={inv.discAmt > 0 ? `- ${fmtINRFull(inv.discAmt)} (${inv.discPct}%)` : 'Nil'}
        colorClass={inv.discAmt > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
      <DetailRow label="Taxable Amount" value={fmtINRFull(inv.taxable)} mono />
      <DetailRow label="CGST 2.5%"      value={fmtINRFull(inv.cgst)} mono colorClass="text-slate-500 dark:text-slate-400" />
      <DetailRow label="SGST 2.5%"      value={fmtINRFull(inv.sgst)} mono colorClass="text-slate-500 dark:text-slate-400" />
      <div className="flex justify-between items-center py-2.5 border-b-2 border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 -mx-2 px-2">
        <span className="text-[13px] font-bold text-slate-700 dark:text-slate-200">Net Amount</span>
        <span className="text-[15px] font-bold text-slate-900 dark:text-white font-mono">{fmtINRFull(inv.net)}</span>
      </div>
      {inv.isInsurance && (
        <>
          <DetailRow label="Insurance Share" value={fmtINRFull(inv.insShare)} mono colorClass="text-blue-600 dark:text-blue-400" />
          <DetailRow label="Patient Share"   value={fmtINRFull(inv.patShare)} mono colorClass="text-violet-600 dark:text-violet-400" />
        </>
      )}
      <DetailRow label="Amount Collected" value={fmtINRFull(inv.collected)} mono colorClass="text-emerald-600 dark:text-emerald-400 font-bold" />
      <DetailRow label="Outstanding"      value={inv.outstanding > 0 ? fmtINRFull(inv.outstanding) : 'Nil'}
        mono colorClass={inv.outstanding > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-400'} />

      {inv.leakage && (
        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-700/40">
          <Zap size={15} className="text-rose-500 flex-none mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-rose-700 dark:text-rose-400">Revenue Leakage Detected</p>
            <p className="text-[11.5px] text-rose-600 dark:text-rose-400/80 mt-0.5">
              Estimated impact: {fmtINRFull(inv.leakageAmt)} — Unbilled charges suspected. AI review recommended.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Services ─────────────────────────────────────────────────────────────
function ServicesTab({ inv }) {
  return (
    <div className="p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200 dark:border-slate-700">
              <th className="text-left pb-2.5 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Service Name</th>
              <th className="text-left pb-2.5 font-bold text-slate-500 uppercase text-[10px] tracking-wide pl-3">Code</th>
              <th className="text-right pb-2.5 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Qty</th>
              <th className="text-right pb-2.5 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Rate</th>
              <th className="text-right pb-2.5 font-bold text-slate-500 uppercase text-[10px] tracking-wide">GST</th>
              <th className="text-right pb-2.5 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.services.map((s, i) => (
              <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                <td className="py-2.5 text-slate-700 dark:text-slate-200 font-medium">{s.name}</td>
                <td className="py-2.5 pl-3 font-mono text-[11px] text-slate-400">{s.code}</td>
                <td className="py-2.5 text-right text-slate-500">{s.qty}</td>
                <td className="py-2.5 text-right font-mono text-slate-500">{fmtINRFull(s.amount / s.qty)}</td>
                <td className="py-2.5 text-right text-slate-400">{s.taxRate}%</td>
                <td className="py-2.5 text-right font-mono font-bold text-slate-800 dark:text-white">{fmtINRFull(s.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {[
              ['Gross Total',     fmtINRFull(inv.gross),   false, ''],
              ['Discount',        `- ${fmtINRFull(inv.discAmt)}`, false, 'text-amber-600'],
              ['CGST 2.5%',       fmtINRFull(inv.cgst),    false, 'text-slate-500'],
              ['SGST 2.5%',       fmtINRFull(inv.sgst),    false, 'text-slate-500'],
              ['Net Payable',     fmtINRFull(inv.net),     true,  'text-slate-900 dark:text-white text-[14px]'],
            ].map(([label, value, bold, colorClass]) => (
              <tr key={label} className={`${bold ? 'border-t-2 border-slate-300 dark:border-slate-600' : ''}`}>
                <td colSpan={5} className={`pt-2 pb-1 text-right pr-4 ${bold ? 'font-bold text-slate-700 dark:text-slate-200' : 'text-slate-500'}`}>
                  {label}
                </td>
                <td className={`pt-2 pb-1 text-right font-mono ${bold ? 'font-bold text-[14px]' : 'font-semibold'} ${colorClass}`}>
                  {value}
                </td>
              </tr>
            ))}
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Financial (AR/GL/JV links) ──────────────────────────────────────────
function FinancialTab({ inv }) {
  const entries = [
    { account:'Accounts Receivable — Patient', code:'1100', dr: inv.net, cr: 0,  ref: inv.arEntry ?? '—' },
    { account:'Revenue — ' + (BILL_TYPES[inv.billType]?.label ?? 'OP'), code:'4001', dr: 0, cr: inv.taxable, ref: inv.jvNo ?? '—' },
    { account:'Output CGST 2.5%',              code:'2201', dr: 0, cr: inv.cgst,    ref: inv.jvNo ?? '—' },
    { account:'Output SGST 2.5%',              code:'2202', dr: 0, cr: inv.sgst,    ref: inv.jvNo ?? '—' },
    ...(inv.discAmt > 0 ? [
      { account:'Discount Allowed',            code:'5100', dr: inv.discAmt, cr: 0, ref: inv.jvNo ?? '—' },
    ] : []),
  ];

  return (
    <div className="p-5 space-y-5">
      {/* Status grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'GL Posted',    value: inv.glPosted ? 'Yes' : 'Pending', ok: inv.glPosted },
          { label:'JV Number',    value: inv.jvNo ?? 'Not Generated',       ok: !!inv.jvNo   },
          { label:'AR Entry',     value: inv.arEntry ?? 'Not Created',      ok: !!inv.arEntry},
        ].map(({ label, value, ok }) => (
          <div key={label}
            className={`p-3 rounded-xl border ${ok ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/40' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1">{label}</p>
            <p className={`text-[13px] font-bold font-mono ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Journal Entries */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Journal Entries — {inv.jvNo ?? 'Not yet posted'}</p>
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left px-3 py-2 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Account</th>
                <th className="text-left px-3 py-2 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Code</th>
                <th className="text-right px-3 py-2 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Debit ₹</th>
                <th className="text-right px-3 py-2 font-bold text-slate-500 uppercase text-[10px] tracking-wide">Credit ₹</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                  <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{e.account}</td>
                  <td className="px-3 py-2 font-mono text-slate-400">{e.code}</td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {e.dr > 0 ? fmtINRFull(e.dr) : ''}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {e.cr > 0 ? fmtINRFull(e.cr) : ''}
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-300 dark:border-slate-600 font-bold">
                <td colSpan={2} className="px-3 py-2 text-slate-600 dark:text-slate-300 uppercase text-[11px] tracking-wide">Total</td>
                <td className="px-3 py-2 text-right font-mono text-blue-600">{fmtINRFull(inv.net + (inv.discAmt > 0 ? inv.discAmt : 0))}</td>
                <td className="px-3 py-2 text-right font-mono text-emerald-600">{fmtINRFull(inv.net + (inv.discAmt > 0 ? inv.discAmt : 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-module links */}
      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Cross-Module Navigation</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label:'AR Entry',         sub: inv.arEntry ?? '—', icon:FileText,   color:'text-blue-500'   },
            { label:'GL Ledger',        sub:'General Ledger',    icon:BookOpen,   color:'text-violet-500' },
            { label:'Journal Voucher',  sub: inv.jvNo ?? '—',   icon:FileText,   color:'text-cyan-500'   },
            { label:'Bank Reconciliation', sub:'Cash & Bank',   icon:Building2,  color:'text-indigo-500' },
            { label:'Cash Book',        sub:'Collection Entry',  icon:IndianRupee,color:'text-emerald-500' },
            { label:'Revenue Dashboard',sub:'Finance Analytics', icon:GitBranch,  color:'text-amber-500'  },
          ].map(({ label, sub, icon: Icon, color }) => (
            <button key={label}
              className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700
                bg-white dark:bg-slate-800 hover:shadow-md hover:-translate-y-0.5 transition-all text-left group">
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-none">
                <Icon size={13} className={color} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200 truncate">{label}</p>
                <p className="text-[10.5px] text-slate-400 font-mono truncate">{sub}</p>
              </div>
              <ExternalLink size={10} className="flex-none text-slate-300 group-hover:text-slate-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Insurance ────────────────────────────────────────────────────────────
function InsuranceTab({ inv }) {
  if (!inv.isInsurance) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
          <Shield size={22} className="text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-[13px] font-semibold text-slate-500">No Insurance / TPA Associated</p>
        <p className="text-[12px] text-slate-400">This is a self-pay invoice.</p>
        <button className="mt-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors">
          Link to Insurance
        </button>
      </div>
    );
  }

  const stages = [
    'Pre-Authorization Requested',
    'Pre-Authorization Approved',
    'Claim Submitted to TPA',
    'Under Review',
    'Query Resolved',
    'Settlement Received',
  ];
  const stageIdx = inv.claimStatus === 'SETTLED' ? 5
    : inv.claimStatus === 'PARTIAL_SETTLEMENT' ? 4
    : inv.claimStatus === 'QUERY_RAISED' ? 3
    : inv.claimStatus === 'UNDER_REVIEW' ? 3
    : inv.claimStatus === 'SUBMITTED' ? 2
    : inv.claimStatus === 'PRE_AUTH_APPROVED' ? 1
    : 0;

  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionHead>Insurance Details</SectionHead>
          <DetailRow label="TPA"           value={inv.tpa ?? '—'} />
          <DetailRow label="Insurer"        value={inv.insurer ?? '—'} />
          <DetailRow label="Policy Number"  value={inv.policyNo ?? '—'} mono />
          <DetailRow label="Claim Status"   value={CLAIM_STATUSES[inv.claimStatus]?.label ?? '—'}
            colorClass={inv.claimStatus === 'SETTLED' ? 'text-emerald-600' : inv.claimStatus === 'REJECTED' ? 'text-red-600' : 'text-blue-600'} />
          <DetailRow label="Claimed Amount" value={fmtINRFull(inv.insShare)} mono />
          <DetailRow label="Patient Share"  value={fmtINRFull(inv.patShare)} mono />
        </div>
        <div>
          <SectionHead>Claim Timeline</SectionHead>
          <div className="space-y-2">
            {stages.map((stage, idx) => {
              const done   = idx <= stageIdx;
              const active = idx === stageIdx;
              return (
                <div key={stage} className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full flex-none transition-colors
                    ${done ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'}
                    ${active ? 'ring-2 ring-emerald-300 ring-offset-1' : ''}`} />
                  <span className={`text-[11.5px] ${done ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-400'}`}>
                    {stage}
                  </span>
                  {active && (
                    <span className="ml-auto text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {inv.claimStatus === 'REJECTED' && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
          <AlertTriangle size={15} className="text-red-500 flex-none mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-red-700 dark:text-red-400">Claim Rejected</p>
            <p className="text-[11.5px] text-red-600 dark:text-red-400/80 mt-0.5">
              Review rejection reason and resubmit with supporting documentation. AI analysis can predict approval likelihood.
            </p>
            <button className="mt-2 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
              Resubmit Claim
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Payments ─────────────────────────────────────────────────────────────
function PaymentsTab({ inv }) {
  return (
    <div className="p-5">
      {inv.payments.length > 0 ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label:'Total Invoiced', value:fmtINRFull(inv.net),         color:'text-slate-800 dark:text-white'              },
              { label:'Collected',      value:fmtINRFull(inv.collected),   color:'text-emerald-600 dark:text-emerald-400'      },
              { label:'Outstanding',    value:fmtINRFull(inv.outstanding), color: inv.outstanding > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                <p className={`text-[14px] font-bold font-mono ${color}`}>{value}</p>
              </div>
            ))}
          </div>
          {inv.payments.map((p, i) => (
            <div key={i}
              className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/25 flex items-center justify-center flex-none">
                <IndianRupee size={16} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[13px] font-bold text-slate-800 dark:text-white font-mono">{fmtINRFull(p.amount)}</span>
                  <span className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full">
                    {p.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 mt-1.5">
                  <p className="text-[11.5px] text-slate-500">{p.date}</p>
                  <p className="text-[11.5px] text-slate-500">Mode: <span className="font-semibold text-slate-700 dark:text-slate-200">{p.mode}</span></p>
                  <p className="text-[11.5px] text-slate-400 font-mono truncate">{p.ref}</p>
                  <p className="text-[11.5px] text-slate-500">By: {p.cashier}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <IndianRupee size={18} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-[13px] font-semibold text-slate-500">No payments recorded</p>
          <button className="px-4 py-2 rounded-xl text-[12px] font-semibold text-white bg-rose-500 hover:bg-rose-600 transition-colors">
            Record Payment
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Workflow ─────────────────────────────────────────────────────────────
function WorkflowTab({ inv }) {
  const wf = WORKFLOW_STATES[inv.workflowState];
  const states = Object.entries(WORKFLOW_STATES);

  return (
    <div className="p-5 space-y-5">
      <div className="flex items-center gap-3 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900"
        style={{ borderColor: wf?.color + '44' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: wf?.color + '20' }}>
          <GitBranch size={18} style={{ color: wf?.color }} />
        </div>
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Current Workflow State</p>
          <p className="text-[15px] font-bold mt-0.5" style={{ color: wf?.color }}>{wf?.label ?? inv.workflowState}</p>
        </div>
      </div>

      <div>
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-3">Workflow Progress</p>
        <div className="grid grid-cols-2 gap-2">
          {states.map(([key, cfg]) => {
            const active = key === inv.workflowState;
            return (
              <div key={key}
                className={`flex items-center gap-2 p-2.5 rounded-lg border transition-colors
                  ${active ? 'border-opacity-60' : 'border-slate-100 dark:border-slate-800'}`}
                style={active ? { borderColor: cfg.color + '80', background: cfg.color + '10' } : {}}>
                <div className="w-2 h-2 rounded-full flex-none" style={{ background: active ? cfg.color : '#cbd5e1' }} />
                <span className={`text-[11.5px] font-medium ${active ? 'font-bold' : 'text-slate-500'}`}
                  style={active ? { color: cfg.color } : {}}>
                  {cfg.label}
                </span>
                {active && <span className="ml-auto text-[9px] font-bold" style={{ color: cfg.color }}>ACTIVE</span>}
              </div>
            );
          })}
        </div>
      </div>

      {inv.workflowState === 'ESCALATED' && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/40">
          <AlertTriangle size={15} className="text-red-500 flex-none mt-0.5" />
          <div>
            <p className="text-[12px] font-bold text-red-700 dark:text-red-400">Invoice Escalated</p>
            <p className="text-[11.5px] text-red-600/80 mt-0.5">
              This invoice has been escalated due to overdue outstanding of {fmtINRFull(inv.outstanding)}.
              Finance manager action required.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Audit ────────────────────────────────────────────────────────────────
function AuditTab({ inv }) {
  return (
    <div className="p-5">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-4">
        Complete Audit Trail — {inv.invoiceNo}
      </p>
      <div className="relative">
        {inv.auditTrail.map((entry, idx) => (
          <div key={idx} className="flex gap-4 pb-5 relative">
            <div className="flex flex-col items-center flex-none">
              <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white dark:border-slate-800 z-10 flex-none mt-0.5" />
              {idx < inv.auditTrail.length - 1 && (
                <div className="flex-1 w-0.5 bg-slate-200 dark:bg-slate-700 mt-1.5" />
              )}
            </div>
            <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">{entry.action}</p>
                <span className="text-[10.5px] text-slate-400 font-mono whitespace-nowrap flex-none">{entry.time}</span>
              </div>
              <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1">{entry.note}</p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                by <span className="font-semibold text-slate-500 dark:text-slate-300">{entry.user}</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Drawer Shell ──────────────────────────────────────────────────────────────
export default function PIDetailDrawer({ inv, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const TAB_CONTENT = {
    overview:  <OverviewTab  inv={inv} />,
    services:  <ServicesTab  inv={inv} />,
    financial: <FinancialTab inv={inv} />,
    insurance: <InsuranceTab inv={inv} />,
    payments:  <PaymentsTab  inv={inv} />,
    workflow:  <WorkflowTab  inv={inv} />,
    audit:     <AuditTab     inv={inv} />,
    gl:        <AccountingLineage sourceModule="patient-billing" sourceId={inv.id} />,
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="flex-1 bg-black/40 backdrop-blur-sm"
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 280 }}
          className="w-[680px] max-w-full h-full flex flex-col bg-white dark:bg-slate-900 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex-none">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold font-mono text-rose-600 dark:text-rose-400">{inv.invoiceNo}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold
                  ${INV_STATUSES[inv.status]?.bg} ${INV_STATUSES[inv.status]?.text}`}>
                  {INV_STATUSES[inv.status]?.label}
                </span>
                {inv.riskLevel === 'HIGH' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold bg-red-100 text-red-600 dark:bg-red-900/25 dark:text-red-400">
                    <AlertTriangle size={9} /> High Risk
                  </span>
                )}
              </div>
              <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                {inv.patientName} · {inv.uhid} · {inv.department}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-none">
              {[
                { icon: Printer,  tip: 'Print'    },
                { icon: Download, tip: 'Export'   },
                { icon: Edit3,    tip: 'Edit'     },
                { icon: Send,     tip: 'Submit'   },
              ].map(({ icon: Icon, tip }) => (
                <button key={tip} title={tip}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors">
                  <Icon size={15} />
                </button>
              ))}
              <button onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-rose-600 transition-colors ml-1">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-none flex-none">
            {DRAWER_TABS.map(({ id, label, icon }) => {
              const Icon = ICON_MAP[icon] ?? FileText;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-[12px] font-semibold whitespace-nowrap
                    border-b-2 transition-colors flex-none
                    ${activeTab === id
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-900/5'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}>
                  <Icon size={13} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {TAB_CONTENT[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2 px-5 py-3.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex-none">
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold
              bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-sm">
              <IndianRupee size={13} />
              Record Payment
            </button>
            {inv.isInsurance && (
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold
                bg-blue-500 hover:bg-blue-600 text-white transition-colors shadow-sm">
                <Send size={13} />
                Submit Claim
              </button>
            )}
            <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold
              border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300
              bg-white dark:bg-slate-800 hover:bg-slate-50 transition-colors">
              <RefreshCcw size={13} />
              Refund
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
