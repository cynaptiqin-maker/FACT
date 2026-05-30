import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, FileText, Activity, ShieldCheck, Clock, CheckCircle2,
  IndianRupee, Link2, Tag, Download, Edit, Printer, ExternalLink,
  Package, AlertTriangle, ChevronRight, User, Calendar, Sparkles,
  TrendingUp, Copy, ShieldX, CheckSquare, Building2, RefreshCw, Landmark,
} from 'lucide-react';
import {
  PAYMENT_STATUS_STYLES, APPROVAL_STATUS_STYLES, MATCHING_STATUS_STYLES,
  RISK_STYLES, fmtINR, fmtDate,
} from './VIConstants';
import AccountingLineage from '@components/shared/AccountingLineage';

const TABS = [
  { id: 'overview',  label: 'Overview',    icon: FileText    },
  { id: 'lineitems', label: 'Line Items',   icon: Activity    },
  { id: 'matching',  label: 'PO / GRN',    icon: Link2       },
  { id: 'approval',  label: 'Approval',     icon: CheckSquare },
  { id: 'tax',       label: 'Tax & GST',    icon: ShieldCheck },
  { id: 'audit',     label: 'Audit Trail',  icon: Clock       },
  { id: 'gl',        label: 'GL Journals',  icon: Landmark    },
];

function StatusPill({ status, styleMap }) {
  const s = styleMap[status] || {};
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg || ''} ${s.text || ''}`}>
      <span className={`w-2 h-2 rounded-full ${s.dot || ''}`} />
      {s.label || status}
    </span>
  );
}

function InfoRow({ label, value, mono = false, accent = false }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-slate-100 dark:border-slate-800">
      <span className="text-xs text-slate-500 dark:text-slate-400 flex-none mr-4">{label}</span>
      <span className={`text-xs text-right flex-1 ${mono ? 'font-mono' : ''} ${accent ? 'font-semibold text-violet-700 dark:text-violet-400' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
        {value || '—'}
      </span>
    </div>
  );
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ inv }) {
  return (
    <div className="space-y-4">
      {/* Status strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <StatusPill status={inv.paymentStatus}  styleMap={PAYMENT_STATUS_STYLES}  />
        <StatusPill status={inv.approvalStatus} styleMap={APPROVAL_STATUS_STYLES} />
        <StatusPill status={inv.matchingStatus} styleMap={MATCHING_STATUS_STYLES} />
        {inv.riskScore >= 70 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            <AlertTriangle size={11} /> High Risk
          </span>
        )}
      </div>

      {/* Financial summary cards */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Invoice Total', value: fmtINR(inv.invoiceAmount), color: 'text-slate-800 dark:text-slate-100' },
          { label: 'Tax Amount',    value: fmtINR(inv.taxAmount),     color: 'text-violet-700 dark:text-violet-300' },
          { label: 'Outstanding',   value: fmtINR(inv.outstandingAmount), color: inv.outstandingAmount > 0 ? 'text-orange-600' : 'text-emerald-600' },
        ].map(c => (
          <div key={c.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 text-center">
            <p className="text-[10px] text-slate-400 mb-1">{c.label}</p>
            <p className={`text-base font-bold font-mono ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Details */}
      <div>
        <InfoRow label="Invoice Number"   value={inv.invoiceNo}       mono   accent />
        <InfoRow label="Vendor"           value={`${inv.vendorName} (${inv.vendorCode})`} />
        <InfoRow label="Category"         value={inv.vendorCategory}   />
        <InfoRow label="Branch"           value={inv.branch}           />
        <InfoRow label="Department"       value={inv.department}       />
        <InfoRow label="Invoice Date"     value={fmtDate(inv.invoiceDate)} mono />
        <InfoRow label="Due Date"         value={fmtDate(inv.dueDate)}     mono />
        <InfoRow label="Aging"            value={`${inv.agingDays} days`} />
        <InfoRow label="Assigned Approver" value={inv.assignedApprover} />
        <InfoRow label="OCR Confidence"   value={`${inv.ocrConfidence}%`} />
        <InfoRow label="Last Updated"     value={inv.lastUpdated}    mono />
      </div>

      {/* Notes */}
      {inv.notes && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-800">
          <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-1 uppercase tracking-wide">Notes</p>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{inv.notes}</p>
        </div>
      )}

      {/* Risk indicator */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Risk Score</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${inv.riskScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-full rounded-full ${RISK_STYLES[inv.riskLevel]?.barColor || 'bg-emerald-500'}`}
            />
          </div>
          <span className="text-xs font-bold font-mono" style={{ color: RISK_STYLES[inv.riskLevel]?.color }}>
            {inv.riskScore}/100
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Line Items ──────────────────────────────────────────────────────────
function LineItemsTab({ inv }) {
  return (
    <div className="space-y-3">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            <th className="text-left px-3 py-2 rounded-tl-lg">#</th>
            <th className="text-left px-3 py-2">Description</th>
            <th className="text-right px-3 py-2">Qty</th>
            <th className="text-right px-3 py-2">Rate</th>
            <th className="text-right px-3 py-2">GST%</th>
            <th className="text-right px-3 py-2 rounded-tr-lg">Amount</th>
          </tr>
        </thead>
        <tbody>
          {(inv.lineItems || []).map((li, i) => (
            <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
              <td className="px-3 py-2.5 text-slate-400">{i + 1}</td>
              <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300">{li.desc}</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{li.qty}</td>
              <td className="px-3 py-2.5 text-right font-mono text-slate-700 dark:text-slate-300">{fmtINR(li.rate)}</td>
              <td className="px-3 py-2.5 text-right">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
                  {li.taxPct}%
                </span>
              </td>
              <td className="px-3 py-2.5 text-right font-mono font-semibold text-slate-800 dark:text-slate-100">{fmtINR(li.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 dark:bg-slate-800 font-bold">
            <td colSpan={5} className="px-3 py-2.5 text-right text-xs text-slate-600 dark:text-slate-300">Subtotal</td>
            <td className="px-3 py-2.5 text-right font-mono text-slate-800 dark:text-slate-100">{fmtINR(inv.invoiceAmount - inv.taxAmount)}</td>
          </tr>
          <tr className="bg-slate-50 dark:bg-slate-800">
            <td colSpan={5} className="px-3 py-2 text-right text-xs text-slate-500 dark:text-slate-400">Tax (GST)</td>
            <td className="px-3 py-2 text-right font-mono text-xs text-violet-600 dark:text-violet-400">{fmtINR(inv.taxAmount)}</td>
          </tr>
          <tr className="bg-slate-50 dark:bg-slate-800 border-t-2 border-slate-200 dark:border-slate-600">
            <td colSpan={5} className="px-3 py-2.5 text-right text-sm font-bold text-slate-700 dark:text-slate-200">Total</td>
            <td className="px-3 py-2.5 text-right font-mono text-sm font-bold text-slate-900 dark:text-white">{fmtINR(inv.invoiceAmount)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

// ─── Tab: PO/GRN Matching ─────────────────────────────────────────────────────
function MatchingTab({ inv }) {
  const steps = [
    { label: 'Purchase Order Linked',    done: !!inv.poNumber,                      value: inv.poNumber         },
    { label: 'GRN Received',             done: !!inv.grnNumber,                     value: inv.grnNumber        },
    { label: '3-Way Match Completed',    done: inv.matchingStatus === 'matched',    value: inv.matchingStatus   },
    { label: 'Quantity Verified',        done: inv.matchingStatus !== 'exception',  value: 'Within tolerance'   },
    { label: 'Price Variance Cleared',   done: inv.matchingStatus !== 'exception',  value: '< 0.5% threshold'   },
    { label: 'Ready for Payment',        done: inv.approvalStatus === 'approved',   value: inv.approvalStatus   },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-none ${s.done ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-50 dark:bg-red-900/20'}`}>
              {s.done
                ? <CheckCircle2 size={14} className="text-emerald-600" />
                : <X            size={14} className="text-red-500"     />}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{s.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{s.value || 'Not completed'}</p>
            </div>
          </div>
        ))}
      </div>

      {inv.matchingStatus === 'exception' && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-2">
            <AlertTriangle size={13} className="text-red-500 mt-0.5 flex-none" />
            <div>
              <p className="text-xs font-bold text-red-700 dark:text-red-300 mb-1">Matching Exception</p>
              <p className="text-[11px] text-red-600 dark:text-red-400">This invoice has been flagged with a matching exception. Manual override with approver sign-off is required.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Approval Workflow ───────────────────────────────────────────────────
function ApprovalTab({ inv }) {
  const steps = [
    { level: 'L1 — Dept Head',       status: 'approved',    by: 'Ms. Anita Patel',    date: '2026-05-11 09:15', done: true  },
    { level: 'L2 — Finance Manager', status: inv.approvalStatus === 'approved' ? 'approved' : 'pending', by: inv.assignedApprover, date: inv.approvalStatus === 'approved' ? inv.lastUpdated : null, done: inv.approvalStatus === 'approved' },
    { level: 'L3 — CFO Sign-off',    status: inv.invoiceAmount >= 1000000 ? 'pending' : 'n/a', by: 'Dr. Rajeev Nair', date: null, done: false },
  ];

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="relative flex items-start gap-3 pl-10">
              <div className={`absolute left-3.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-none ${
                s.done      ? 'bg-emerald-500 border-emerald-500' :
                s.status === 'n/a' ? 'bg-slate-200 dark:bg-slate-700 border-slate-200 dark:border-slate-700' :
                'bg-white dark:bg-slate-900 border-violet-400'
              }`}>
                {s.done && <CheckCircle2 size={10} className="text-white" />}
              </div>
              <div className="flex-1 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{s.level}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    s.done        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
                    s.status === 'n/a' ? 'bg-slate-100 dark:bg-slate-700 text-slate-400' :
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  }`}>
                    {s.status === 'n/a' ? 'N/A' : s.done ? 'Approved' : 'Pending'}
                  </span>
                </div>
                {s.by && <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.by}</p>}
                {s.date && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.date}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Tax & GST ───────────────────────────────────────────────────────────
function TaxTab({ inv }) {
  const taxOk = inv.taxStatus === 'valid';
  return (
    <div className="space-y-3">
      <div className={`p-3 rounded-xl border ${taxOk ? 'bg-emerald-50 dark:bg-emerald-900/15 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/15 border-red-200 dark:border-red-800'}`}>
        <div className="flex items-center gap-2">
          {taxOk ? <ShieldCheck size={14} className="text-emerald-600" /> : <AlertTriangle size={14} className="text-red-500" />}
          <span className={`text-xs font-bold ${taxOk ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
            {taxOk ? 'GST Validation Passed' : 'GST Mismatch Detected'}
          </span>
        </div>
        {!taxOk && (
          <p className="text-[11px] text-red-600 dark:text-red-400 mt-1 ml-5">
            Invoice GST amount does not match PO reference. Input tax credit may be at risk.
          </p>
        )}
      </div>

      <div>
        <InfoRow label="Tax Status"       value={inv.taxStatus === 'valid' ? 'Valid' : inv.taxStatus === 'mismatch' ? 'Mismatch' : 'Pending Validation'} />
        <InfoRow label="Tax Amount"       value={fmtINR(inv.taxAmount)} mono />
        <InfoRow label="Taxable Value"    value={fmtINR(inv.invoiceAmount - inv.taxAmount)} mono />
        <InfoRow label="Effective GST %"  value={`${((inv.taxAmount / (inv.invoiceAmount - inv.taxAmount)) * 100).toFixed(1)}%`} mono />
        <InfoRow label="E-Invoice Status" value="Verified" />
        <InfoRow label="GSTIN Vendor"     value="29AAACM1544K1Z3" mono />
        <InfoRow label="TDS Applicable"   value="Yes — 2% (Sec. 194C)" />
        <InfoRow label="Reverse Charge"   value="Not Applicable" />
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">GST Filing Readiness</p>
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div className={`h-full rounded-full ${taxOk ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: taxOk ? '100%' : '40%' }} />
          </div>
          <span className={`text-[10px] font-semibold ${taxOk ? 'text-emerald-600' : 'text-red-500'}`}>
            {taxOk ? 'Ready' : 'Action Required'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Audit Trail ─────────────────────────────────────────────────────────
function AuditTab({ inv }) {
  const events = [
    { time: inv.lastUpdated,          user: 'System (AI)',   action: 'OCR extraction completed',          color: 'bg-violet-500' },
    { time: '2026-05-11 09:15',       user: 'Anita Patel',  action: 'L1 approval granted',               color: 'bg-emerald-500' },
    { time: '2026-05-10 16:30',       user: 'System',       action: `Matching status set to ${inv.matchingStatus}`, color: 'bg-blue-500' },
    { time: '2026-05-10 14:32',       user: 'Rohan Sharma', action: 'Invoice uploaded via PDF scan',      color: 'bg-slate-400' },
    { time: inv.invoiceDate + ' 00:00', user: 'Vendor Portal', action: 'Invoice received via email ingestion', color: 'bg-slate-300' },
  ].sort((a, b) => b.time.localeCompare(a.time));

  return (
    <div className="relative">
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
      <div className="space-y-3">
        {events.map((e, i) => (
          <div key={i} className="relative flex items-start gap-3 pl-9">
            <span className={`absolute left-3 w-3 h-3 rounded-full mt-0.5 flex-none ${e.color}`} />
            <div>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{e.action}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{e.user} · <span className="font-mono">{e.time}</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Drawer ──────────────────────────────────────────────────────────────
export default function VIDetailDrawer({ invoice, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const tabContent = {
    overview:  <OverviewTab  inv={invoice} />,
    lineitems: <LineItemsTab inv={invoice} />,
    matching:  <MatchingTab  inv={invoice} />,
    approval:  <ApprovalTab  inv={invoice} />,
    tax:       <TaxTab       inv={invoice} />,
    audit:     <AuditTab     inv={invoice} />,
    gl:        <AccountingLineage sourceModule="accounts-payable" sourceId={invoice?.id} />,
  };

  return (
    <AnimatePresence>
      {invoice && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-[540px] bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="w-6 h-6 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                    <FileText size={13} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-50 font-mono">{invoice.invoiceNo}</h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{invoice.vendorName} · {invoice.branch}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button title="Print"    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Printer      size={15} /></button>
                <button title="Download" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><Download     size={15} /></button>
                <button title="Edit"     className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"><Edit      size={15} /></button>
                <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><X size={15} /></button>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="flex items-center gap-1.5 px-5 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-all">
                <CheckCircle2 size={11} /> Approve
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all">
                <Link2 size={11} /> Match PO
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all">
                <Calendar size={11} /> Schedule
              </button>
              <button className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-violet-300 rounded-lg transition-all">
                <ExternalLink size={11} /> Journal
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 border-b border-slate-200 dark:border-slate-800 px-5">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold border-b-2 transition-all whitespace-nowrap ${
                      active
                        ? 'border-violet-500 text-violet-700 dark:text-violet-400'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    <Icon size={12} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                >
                  {tabContent[activeTab]}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>Last updated: <span className="font-mono">{invoice.lastUpdated}</span></span>
                <span>Created by OCR · Score: {invoice.ocrConfidence}%</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
