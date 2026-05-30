/**
 * ReconciliationWorkbench.jsx
 * Enterprise Reconciliation Workbench — FACT Hospital Finance System
 * Route: /reconciliation
 * Theme: Indigo / Blue
 * Connects to /api/recon/workbench for live data.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';
import {
  GitMerge, CheckCircle2, XCircle, AlertTriangle, Clock, RefreshCw,
  Sparkles, Download, Filter, ChevronDown, ChevronUp, X, Send,
  TrendingUp, TrendingDown, Minus, Search, Calendar, Play,
  ArrowRight, RotateCcw, Flag, Eye, Info, ShieldCheck,
  Layers, FileText, Landmark, CreditCard, DollarSign,
  BarChart3, Activity, Zap, Hash, ArrowLeftRight, Check,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

const fmtINR = (val) => {
  if (val === null || val === undefined) return '—';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 10_000_000) return `${sign}₹${(abs / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000)    return `${sign}₹${(abs / 100_000).toFixed(2)}L`;
  return `${sign}₹${abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS — RECON TYPES
// ─────────────────────────────────────────────────────────────────────────────

const RECON_TYPES = [
  {
    id: 'AR_GL',
    label: 'AR vs GL',
    shortLabel: 'AR/GL',
    icon: CreditCard,
    leftTitle: 'Unmatched GL Entries',
    rightTitle: 'Unmatched AR Invoices',
    color: 'blue',
  },
  {
    id: 'AP_GL',
    label: 'AP vs GL',
    shortLabel: 'AP/GL',
    icon: FileText,
    leftTitle: 'Unmatched GL Entries',
    rightTitle: 'Unmatched Vendor Invoices',
    color: 'violet',
  },
  {
    id: 'BANK_CASH',
    label: 'Bank vs Cash Book',
    shortLabel: 'Bank/Cash',
    icon: Landmark,
    leftTitle: 'Unmatched GL Entries',
    rightTitle: 'Unmatched Bank Transactions',
    color: 'indigo',
  },
  {
    id: 'FCRA_DBA',
    label: 'FCRA DBA vs FC Ledger',
    shortLabel: 'FCRA DBA',
    icon: ShieldCheck,
    leftTitle: 'FCRA Bank Account Entries',
    rightTitle: 'Unmatched FC Ledger Entries',
    color: 'purple',
  },
  {
    id: 'PAYROLL_GL',
    label: 'Payroll Payable vs GL',
    shortLabel: 'Payroll/GL',
    icon: DollarSign,
    leftTitle: 'Unmatched GL Entries',
    rightTitle: 'Unmatched Payroll Runs',
    color: 'cyan',
  },
  {
    id: 'FCRA_UTIL',
    label: 'FCRA Utilisation vs GL',
    shortLabel: 'FCRA Util',
    icon: Activity,
    leftTitle: 'FCRA Utilisation Records',
    rightTitle: 'Unmatched GL Entries',
    color: 'teal',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// API HELPERS
// ─────────────────────────────────────────────────────────────────────────────

// Component tab IDs → API type param (FCRA_DBA → FCRA_FUNDS)
const TAB_TO_API_TYPE = {
  AR_GL: 'AR_GL', AP_GL: 'AP_GL', BANK_CASH: 'BANK_CASH',
  FCRA_DBA: 'FCRA_FUNDS', PAYROLL_GL: 'PAYROLL_GL', FCRA_UTIL: 'FCRA_UTIL',
};

function fmtPeriod(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function normalizeGLItem(row) {
  const amt = parseFloat(row.amount ?? row.dr ?? row.cr ?? 0);
  return {
    id:            row.id,
    date:          row.date ?? row.created_at,
    narration:     row.narration ?? row.description ?? row.entry_number ?? row.id,
    dr:            amt >= 0 ? amt : 0,
    cr:            amt < 0 ? Math.abs(amt) : 0,
    source_module: row.source_module ?? '',
    fund_type:     row.fund_type ?? null,
  };
}

function normalizeSourceItem(row) {
  return {
    id:          row.id,
    date:        row.date ?? row.created_at ?? row.transaction_date,
    description: row.description ?? row.narration ?? row.invoice_number
                 ?? row.patient_name ?? row.vendor_name ?? row.id,
    amount:      parseFloat(row.amount ?? row.net_amount ?? row.debit_amount ?? row.credit_amount ?? 0),
    type:        row.type ?? row.billing_type ?? row.transaction_type ?? '',
    status:      row.status ?? row.recon_status ?? '',
  };
}

function normalizeSummary(apiRows) {
  const TYPE_MAP = { FCRA_FUNDS: 'FCRA_DBA' };
  return (apiRows ?? []).map(r => ({
    type:      TYPE_MAP[r.type] ?? r.type,
    label:     r.label ?? r.type,
    status:    r.status ?? 'RUNNING',
    variance:  parseFloat(r.detail?.variance ?? 0),
    matched:   parseInt(r.detail?.matched ?? 0, 10),
    unmatched: parseInt(r.detail?.unmatched ?? 0, 10),
  }));
}

const AI_SUGGESTIONS = [
  { id: 1, text: 'GL-2026-04821 (₹18,500) closely matches INV-2026-04812 (₹18,500). Exact amount, same date. High confidence auto-match candidate.', confidence: 98 },
  { id: 2, text: 'GL-2026-04863 and INV-2026-04840 differ by ₹0. Suggest immediate match for IP admission entry.', confidence: 96 },
  { id: 3, text: 'BTX-2026-00892 NEFT credit and GL-2026-05342 show ₹0 variance. Match confirmed via reference number cross-check.', confidence: 94 },
  { id: 4, text: 'Variance of ₹8,750 in AR/GL is likely a partial payment from PT-00412. Consider creating a credit note for the balance.', confidence: 82 },
  { id: 5, text: 'FCRA DBA variance of ₹2,000 may be bank charges. Recommend posting a journal adjustment entry.', confidence: 78 },
];

const AI_CHAT_INIT = [
  { role: 'assistant', text: 'Reconciliation AI ready. I can help analyse variances, suggest matches, flag anomalies, and draft adjustment entries. What would you like to investigate?' },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status, size = 'sm' }) {
  const cfg = {
    PASSED:  { label: 'Passed',  bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-400' },
    FAILED:  { label: 'Failed',  bg: 'bg-red-100 dark:bg-red-500/20',         text: 'text-red-700 dark:text-red-300',          dot: 'bg-red-400' },
    PARTIAL: { label: 'Partial', bg: 'bg-amber-100 dark:bg-amber-500/20',     text: 'text-amber-700 dark:text-amber-300',      dot: 'bg-amber-400' },
    RUNNING: { label: 'Running', bg: 'bg-blue-100 dark:bg-blue-500/20',       text: 'text-blue-700 dark:text-blue-300',         dot: 'bg-blue-400 animate-pulse' },
  }[status] || { label: status, bg: 'bg-slate-100 dark:bg-slate-700', text: 'text-slate-600 dark:text-slate-300', dot: 'bg-slate-400' };

  const px = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${cfg.bg} ${cfg.text} ${px}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FUND TYPE BADGE
// ─────────────────────────────────────────────────────────────────────────────

function FundBadge({ type }) {
  if (!type) return null;
  const cfg = {
    Foreign:   'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    Admin:     'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    Programme: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    Capital:   'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
  }[type] || 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${cfg}`}>{type}</span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY TILE
// ─────────────────────────────────────────────────────────────────────────────

function SummaryTile({ item, activeTab, onClick, isRunning }) {
  const reconType = RECON_TYPES.find(r => r.id === item.type);
  const Icon = reconType?.icon || GitMerge;
  const isActive = activeTab === item.type;
  const colorMap = {
    blue: 'border-blue-400/60 bg-blue-50 dark:bg-blue-500/10',
    violet: 'border-violet-400/60 bg-violet-50 dark:bg-violet-500/10',
    indigo: 'border-indigo-400/60 bg-indigo-50 dark:bg-indigo-500/10',
    purple: 'border-purple-400/60 bg-purple-50 dark:bg-purple-500/10',
    cyan: 'border-cyan-400/60 bg-cyan-50 dark:bg-cyan-500/10',
    teal: 'border-teal-400/60 bg-teal-50 dark:bg-teal-500/10',
  };
  const iconColorMap = {
    blue: 'text-blue-600 dark:text-blue-400',
    violet: 'text-violet-600 dark:text-violet-400',
    indigo: 'text-indigo-600 dark:text-indigo-400',
    purple: 'text-purple-600 dark:text-purple-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
    teal: 'text-teal-600 dark:text-teal-400',
  };
  const color = reconType?.color || 'indigo';

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(item.type)}
      className={`flex-1 min-w-[150px] relative p-3.5 rounded-xl border-2 text-left transition-all ${
        isActive
          ? `${colorMap[color]} border-${color}-400/60 shadow-md`
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isActive ? iconColorMap[color] : 'text-slate-400 dark:text-slate-500'}`} />
        {isRunning ? <StatusBadge status="RUNNING" size="xs" /> : <StatusBadge status={item.status} size="xs" />}
      </div>
      <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1.5">{item.label}</div>
      <div className="flex items-center gap-3">
        <div className="text-[10px] text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.matched}</span> matched
        </div>
        {item.unmatched > 0 && (
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-amber-600 dark:text-amber-400">{item.unmatched}</span> open
          </div>
        )}
      </div>
      {item.variance !== 0 && (
        <div className={`mt-1.5 text-[10px] font-bold ${item.variance > 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
          Δ {fmtINR(Math.abs(item.variance))}
        </div>
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GL ENTRY ROW (left panel)
// ─────────────────────────────────────────────────────────────────────────────

function GLRow({ entry, isSelected, onClick }) {
  const amount = entry.dr > 0 ? entry.dr : entry.cr;
  const isDr = entry.dr > 0;
  return (
    <motion.tr
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onClick(entry.id)}
      className={`cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors ${
        isSelected
          ? 'bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200 dark:border-indigo-500/30'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${
            isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300 dark:border-slate-600'
          }`}>
            {isSelected && <Check className="w-3 h-3 text-white m-0.5" />}
          </span>
          <span className="text-[11px] font-mono font-semibold text-indigo-700 dark:text-indigo-300">{entry.id}</span>
        </div>
      </td>
      <td className="py-2 px-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(entry.date)}</td>
      <td className="py-2 px-2 text-[11px] text-slate-700 dark:text-slate-300 max-w-[200px]">
        <span className="line-clamp-1">{entry.narration}</span>
      </td>
      <td className="py-2 px-2 text-right">
        <span className={`text-[11px] font-semibold ${isDr ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
          {isDr ? 'DR' : 'CR'} {fmtINR(amount)}
        </span>
      </td>
      <td className="py-2 px-2 text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">{entry.source_module}</td>
      <td className="py-2 px-2"><FundBadge type={entry.fund_type} /></td>
    </motion.tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE RECORD ROW (right panel)
// ─────────────────────────────────────────────────────────────────────────────

function SourceRow({ record, isSelected, onClick }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: 4 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => onClick(record.id)}
      className={`cursor-pointer border-b border-slate-100 dark:border-slate-800 transition-colors ${
        isSelected
          ? 'bg-blue-50 dark:bg-blue-500/15 border-blue-200 dark:border-blue-500/30'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
      }`}
    >
      <td className="py-2 px-3">
        <div className="flex items-center gap-2">
          <span className={`w-4 h-4 rounded border-2 flex-shrink-0 transition-colors ${
            isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'
          }`}>
            {isSelected && <Check className="w-3 h-3 text-white m-0.5" />}
          </span>
          <span className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300">{record.id}</span>
        </div>
      </td>
      <td className="py-2 px-2 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">{fmtDate(record.date)}</td>
      <td className="py-2 px-2 text-[11px] text-slate-700 dark:text-slate-300 max-w-[200px]">
        <span className="line-clamp-1">{record.description}</span>
      </td>
      <td className="py-2 px-2 text-right text-[11px] font-semibold text-slate-700 dark:text-slate-200">
        {fmtINR(record.amount)}
      </td>
      <td className="py-2 px-2">
        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
          {record.type || record.mode || record.department || '—'}
        </span>
      </td>
      <td className="py-2 px-2"><FundBadge type={record.fund_type} /></td>
    </motion.tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHED PAIR ROW
// ─────────────────────────────────────────────────────────────────────────────

function MatchedPairRow({ pair, onUnmatch, onDispute }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="border border-emerald-200 dark:border-emerald-500/30 rounded-xl overflow-hidden bg-emerald-50/50 dark:bg-emerald-500/5 mb-2"
    >
      <div
        className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-semibold text-indigo-700 dark:text-indigo-300">{pair.leftId}</span>
            <ArrowLeftRight className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] font-mono font-semibold text-blue-700 dark:text-blue-300">{pair.rightId}</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{pair.narration}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{fmtINR(pair.amount)}</span>
          {pair.variance !== 0 && (
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">Δ{fmtINR(Math.abs(pair.variance))}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDispute(pair); }}
            className="p-1 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-500/20 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            title="Flag for dispute"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onUnmatch(pair); }}
            className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            title="Unmatch"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </div>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-emerald-200 dark:border-emerald-500/20 px-3 py-2"
          >
            <div className="grid grid-cols-2 gap-4 text-[11px]">
              <div>
                <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-semibold">GL Entry</div>
                <div className="text-slate-700 dark:text-slate-300">{pair.leftId} · {pair.leftDate}</div>
                <div className="text-slate-500 dark:text-slate-400">{pair.leftNarration}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wide font-semibold">Source Record</div>
                <div className="text-slate-700 dark:text-slate-300">{pair.rightId} · {pair.rightDate}</div>
                <div className="text-slate-500 dark:text-slate-400">{pair.rightDescription}</div>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Matched by: <span className="font-semibold text-slate-600 dark:text-slate-300">{pair.matchedBy}</span> on {pair.matchedAt}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPUTED ITEM ROW
// ─────────────────────────────────────────────────────────────────────────────

function DisputedRow({ item, onResolve }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="border border-amber-200 dark:border-amber-500/30 rounded-xl bg-amber-50/50 dark:bg-amber-500/5 px-3 py-2 mb-2 flex items-start gap-3"
    >
      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono font-semibold text-amber-700 dark:text-amber-300">{item.id}</span>
          <span className="text-[10px] text-slate-400">{fmtDate(item.date)}</span>
          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 ml-auto">{fmtINR(item.amount)}</span>
        </div>
        <div className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5 line-clamp-1">{item.narration}</div>
        <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
          Reason: <span className="font-semibold">{item.reason}</span>
        </div>
      </div>
      <button
        onClick={() => onResolve(item)}
        className="flex-shrink-0 px-2 py-1 text-[10px] font-semibold rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
      >
        Resolve
      </button>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPUTE MODAL
// ─────────────────────────────────────────────────────────────────────────────

function DisputeModal({ item, onSubmit, onClose }) {
  const [reason, setReason] = useState('');
  if (!item) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-800 dark:text-white">Flag for Dispute</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-5 py-4">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1">Entry / Record</div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{item.id}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-4">{item.narration || item.description || ''}</div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for dispute <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Describe the discrepancy or reason for flagging…"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 resize-none"
            />
          </div>
          <div className="flex gap-2 px-5 pb-5">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => reason.trim() && onSubmit(item, reason)}
              disabled={!reason.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Flag Item
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AI PANEL
// ─────────────────────────────────────────────────────────────────────────────

function AIPanel({ onClose, activeType }) {
  const [messages, setMessages] = useState(AI_CHAT_INIT);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    const aiReply = {
      role: 'assistant',
      text: `Analysing ${activeType || 'reconciliation'} data… Based on the current period, I can see ${
        Math.floor(Math.random() * 3) + 1
      } potential matches. Would you like me to auto-approve them or review individually?`,
    };
    setMessages(m => [...m, userMsg, aiReply]);
    setInput('');
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  return (
    <div className="w-[300px] h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 dark:text-white">Recon AI</div>
            <div className="text-[10px] text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Suggestions */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-slate-100 dark:border-slate-800">
        <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1.5">AI Match Suggestions</div>
        <div className="space-y-1.5">
          {AI_SUGGESTIONS.slice(0, 3).map(s => (
            <div key={s.id} className="flex items-start gap-2 p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <Zap className="w-3 h-3 text-indigo-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight line-clamp-2">{s.text}</div>
                <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{s.confidence}% confidence</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] text-[11px] px-3 py-2 rounded-xl leading-relaxed ${
              m.role === 'user'
                ? 'bg-indigo-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask about variances…"
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/50"
          />
          <button
            onClick={send}
            className="w-7 h-7 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS PANEL (bottom tab)
// ─────────────────────────────────────────────────────────────────────────────

function AnalyticsPanel({ summary }) {
  const pieData = summary.map(s => ({
    name: s.label,
    value: s.matched,
    status: s.status,
  }));
  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#a855f7', '#14b8a6', '#3b82f6'];

  const barData = summary.map(s => ({
    name: RECON_TYPES.find(r => r.id === s.type)?.shortLabel || s.type,
    matched: s.matched,
    unmatched: s.unmatched,
    variance: Math.abs(s.variance) / 1000,
  }));

  return (
    <div className="h-full overflow-y-auto p-4 grid grid-cols-2 gap-4">
      <div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">Match Distribution</div>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" outerRadius={60} dataKey="value" label={false}>
              {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={(v) => [v, 'Matched']} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div>
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-3">Matched vs Unmatched by Type</div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={barData} barSize={10}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 9 }} />
            <YAxis tick={{ fontSize: 9 }} />
            <Tooltip />
            <Bar dataKey="matched" fill="#6366f1" name="Matched" radius={[2,2,0,0]} />
            <Bar dataKey="unmatched" fill="#f59e0b" name="Unmatched" radius={[2,2,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ReconciliationWorkbench() {
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [period, setPeriod] = useState({ year: 2026, month: 5 });
  const [activeTab, setActiveTab] = useState('AR_GL');
  const [showAI, setShowAI] = useState(true);
  const [showBottom, setShowBottom] = useState(true);
  const [bottomTab, setBottomTab] = useState('matched');
  const [searchLeft, setSearchLeft] = useState('');
  const [searchRight, setSearchRight] = useState('');
  const [selectedLeft, setSelectedLeft] = useState(null);
  const [selectedRight, setSelectedRight] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runningType, setRunningType] = useState(null);
  const [disputeTarget, setDisputeTarget] = useState(null);

  // Per-type state: unmatched GL, unmatched source, matched pairs, disputed
  const [workbenchState, setWorkbenchState] = useState(() => {
    const state = {};
    RECON_TYPES.forEach(rt => {
      state[rt.id] = { glEntries: [], sourceRecords: [], matchedPairs: [], disputedItems: [] };
    });
    return state;
  });
  const [loadedTabs, setLoadedTabs] = useState(new Set());

  const [summary, setSummary] = useState([]);

  const periodStr = fmtPeriod(period.year, period.month);

  // ── API queries ────────────────────────────────────────────────────────────
  const summaryQuery = useQuery({
    queryKey: ['recon-summary', periodStr],
    queryFn: () => api.get('/api/recon/workbench/summary', { params: { period: periodStr } }).then(r => r.data),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const workbenchQuery = useQuery({
    queryKey: ['recon-workbench', activeTab, periodStr],
    queryFn: () => api.get('/api/recon/workbench', {
      params: { type: TAB_TO_API_TYPE[activeTab], period: periodStr },
    }).then(r => r.data),
    staleTime: 1000 * 60 * 2,
    retry: 1,
    enabled: !loadedTabs.has(`${activeTab}::${periodStr}`),
  });

  // Seed workbench state from API when query succeeds for this tab
  useEffect(() => {
    if (!workbenchQuery.data) return;
    const key = `${activeTab}::${periodStr}`;
    if (loadedTabs.has(key)) return;
    const { glItems = [], sourceItems = [] } = workbenchQuery.data;
    setWorkbenchState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        glEntries:    glItems.map(normalizeGLItem),
        sourceRecords: sourceItems.map(normalizeSourceItem),
      },
    }));
    setLoadedTabs(prev => new Set([...prev, key]));
  }, [workbenchQuery.data, activeTab, periodStr]); // eslint-disable-line

  // Seed summary from API
  useEffect(() => {
    if (!summaryQuery.data?.data) return;
    setSummary(normalizeSummary(summaryQuery.data.data));
  }, [summaryQuery.data]);

  // Reset loaded tabs when period changes so fresh data is fetched
  useEffect(() => {
    setLoadedTabs(new Set());
    setSummary([]);
    setWorkbenchState(() => {
      const state = {};
      RECON_TYPES.forEach(rt => {
        state[rt.id] = { glEntries: [], sourceRecords: [], matchedPairs: [], disputedItems: [] };
      });
      return state;
    });
  }, [periodStr]); // eslint-disable-line

  // ── Derived state ──────────────────────────────────────────────────────────
  const currentState = workbenchState[activeTab] || { glEntries: [], sourceRecords: [], matchedPairs: [], disputedItems: [] };

  const filteredGL = useMemo(() =>
    currentState.glEntries.filter(e =>
      !searchLeft ||
      e.id.toLowerCase().includes(searchLeft.toLowerCase()) ||
      e.narration.toLowerCase().includes(searchLeft.toLowerCase())
    ),
    [currentState.glEntries, searchLeft]
  );

  const filteredSource = useMemo(() =>
    currentState.sourceRecords.filter(r =>
      !searchRight ||
      r.id.toLowerCase().includes(searchRight.toLowerCase()) ||
      r.description.toLowerCase().includes(searchRight.toLowerCase())
    ),
    [currentState.sourceRecords, searchRight]
  );

  const canMatch = selectedLeft !== null && selectedRight !== null;

  const activeReconType = RECON_TYPES.find(r => r.id === activeTab);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleMatch = useCallback(() => {
    if (!canMatch) return;
    const glEntry = currentState.glEntries.find(e => e.id === selectedLeft);
    const sourceRecord = currentState.sourceRecords.find(r => r.id === selectedRight);
    if (!glEntry || !sourceRecord) return;

    const glAmount = glEntry.dr > 0 ? glEntry.dr : glEntry.cr;
    const variance = glAmount - sourceRecord.amount;

    const newPair = {
      id: `MATCH-${Date.now()}`,
      leftId: glEntry.id,
      rightId: sourceRecord.id,
      leftDate: fmtDate(glEntry.date),
      rightDate: fmtDate(sourceRecord.date),
      leftNarration: glEntry.narration,
      rightDescription: sourceRecord.description,
      narration: `${glEntry.narration} ↔ ${sourceRecord.description}`,
      amount: glAmount,
      variance,
      matchedBy: 'Current User',
      matchedAt: new Date().toLocaleDateString('en-IN'),
    };

    setWorkbenchState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        glEntries: prev[activeTab].glEntries.filter(e => e.id !== selectedLeft),
        sourceRecords: prev[activeTab].sourceRecords.filter(r => r.id !== selectedRight),
        matchedPairs: [...prev[activeTab].matchedPairs, newPair],
      },
    }));

    // Update summary
    setSummary(prev => prev.map(s => s.type === activeTab
      ? { ...s, matched: s.matched + 1, unmatched: Math.max(0, s.unmatched - 1) }
      : s
    ));

    setSelectedLeft(null);
    setSelectedRight(null);
  }, [canMatch, currentState, activeTab, selectedLeft, selectedRight]);

  const handleUnmatch = useCallback((pair) => {
    // Reconstruct minimal entries from the saved pair data
    const glEntry = {
      id: pair.leftId, date: pair.leftDate, narration: pair.leftNarration,
      dr: pair.amount > 0 ? pair.amount : 0, cr: pair.amount < 0 ? Math.abs(pair.amount) : 0,
      source_module: '', fund_type: null,
    };
    const sourceRecord = {
      id: pair.rightId, date: pair.rightDate, description: pair.rightDescription,
      amount: pair.amount - pair.variance, type: '', status: '',
    };

    setWorkbenchState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        glEntries: [...prev[activeTab].glEntries, glEntry],
        sourceRecords: [...prev[activeTab].sourceRecords, sourceRecord],
        matchedPairs: prev[activeTab].matchedPairs.filter(p => p.id !== pair.id),
      },
    }));

    setSummary(prev => prev.map(s => s.type === activeTab
      ? { ...s, matched: Math.max(0, s.matched - 1), unmatched: s.unmatched + 1 }
      : s
    ));
  }, [activeTab]);

  const handleDispute = useCallback((item) => {
    setDisputeTarget(item);
  }, []);

  const handleDisputeSubmit = useCallback((item, reason) => {
    const disputeEntry = {
      id: item.id || item.leftId,
      date: item.date || new Date().toISOString().slice(0, 10),
      narration: item.narration || item.description || 'Disputed item',
      amount: item.amount || 0,
      reason,
      flaggedAt: new Date().toLocaleDateString('en-IN'),
    };

    // If it's a matched pair, unmatch it first
    if (item.leftId) {
      handleUnmatch(item);
    } else {
      // Remove from unmatched GL
      setWorkbenchState(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          glEntries: prev[activeTab].glEntries.filter(e => e.id !== item.id),
          disputedItems: [...prev[activeTab].disputedItems, disputeEntry],
        },
      }));
    }

    if (item.leftId) {
      setWorkbenchState(prev => ({
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          disputedItems: [...prev[activeTab].disputedItems, { ...disputeEntry, id: item.leftId }],
        },
      }));
    }

    setDisputeTarget(null);
    setBottomTab('disputed');
    setShowBottom(true);
  }, [activeTab, handleUnmatch]);

  const handleResolveDispute = useCallback((item) => {
    setWorkbenchState(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        disputedItems: prev[activeTab].disputedItems.filter(d => d.id !== item.id),
      },
    }));
  }, [activeTab]);

  const handleRunAll = useCallback(() => {
    setIsRunning(true);
    let idx = 0;
    const types = RECON_TYPES.map(r => r.id);
    const tick = () => {
      if (idx >= types.length) {
        setIsRunning(false);
        setRunningType(null);
        return;
      }
      setRunningType(types[idx]);
      idx++;
      setTimeout(tick, 600);
    };
    tick();
  }, []);

  const handleRunSingle = useCallback((typeId) => {
    setRunningType(typeId);
    setTimeout(() => setRunningType(null), 1200);
  }, []);

  const handleTabChange = useCallback((typeId) => {
    setActiveTab(typeId);
    setSelectedLeft(null);
    setSelectedRight(null);
    setSearchLeft('');
    setSearchRight('');
  }, []);

  // ── Summary stats ──────────────────────────────────────────────────────────
  const totalMatched   = summary.reduce((s, i) => s + i.matched, 0);
  const totalUnmatched = summary.reduce((s, i) => s + i.unmatched, 0);
  const totalDisputed  = Object.values(workbenchState).reduce((s, v) => s + v.disputedItems.length, 0);
  const totalVariance  = summary.reduce((s, i) => s + i.variance, 0);

  const BOTTOM_TABS = [
    { id: 'matched',  label: 'Matched Pairs',   icon: CheckCircle2,  badge: currentState.matchedPairs.length },
    { id: 'disputed', label: 'Disputed Items',   icon: Flag,          badge: currentState.disputedItems.length, badgeCrit: currentState.disputedItems.length > 0 },
    { id: 'analytics',label: 'Analytics',        icon: BarChart3,     badge: null },
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-['Open_Sans',system-ui,sans-serif]">

      {/* ── PAGE HEADER ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-start justify-between gap-4 px-5 pt-4 pb-3">
          {/* Title */}
          <div>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                <ArrowLeftRight className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">Reconciliation Workbench</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enterprise multi-module reconciliation — GL vs AR, AP, Bank, FCRA, Payroll
                </p>
              </div>
            </div>

            {/* Quick stats */}
            <div className="flex items-center gap-4 mt-3 pl-12 flex-wrap">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Matched:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{totalMatched}</span>
              </div>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Unmatched:</span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">{totalUnmatched}</span>
              </div>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Disputed:</span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">{totalDisputed}</span>
              </div>
              <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Net Variance:</span>
                <span className={`text-xs font-bold ${totalVariance === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {totalVariance === 0 ? 'NIL' : fmtINR(Math.abs(totalVariance))}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-start gap-2 flex-shrink-0 flex-wrap">
            {/* Period selector */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <select
                value={period.month}
                onChange={e => setPeriod(p => ({ ...p, month: +e.target.value }))}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={period.year}
                onChange={e => setPeriod(p => ({ ...p, year: +e.target.value }))}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleRunAll}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {isRunning ? 'Running…' : 'Run All Reconciliations'}
            </motion.button>

            <button
              onClick={() => setShowAI(s => !s)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                showAI
                  ? 'bg-violet-500/10 border-violet-400/40 text-violet-600 dark:text-violet-400'
                  : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-violet-400/40 hover:text-violet-500'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Assistant
            </button>

            <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ── SUMMARY TILES ROW ─────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {summary.map(item => (
            <SummaryTile
              key={item.type}
              item={item}
              activeTab={activeTab}
              onClick={handleTabChange}
              isRunning={runningType === item.type}
            />
          ))}
        </div>
      </div>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left + right + bottom column */}
        <div className="flex flex-col flex-1 overflow-hidden min-w-0">

          {/* Recon type tab bar */}
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <div className="flex h-9">
              {RECON_TYPES.map(rt => {
                const typeSum = summary.find(s => s.type === rt.id);
                return (
                  <button
                    key={rt.id}
                    onClick={() => handleTabChange(rt.id)}
                    className={`flex items-center gap-1.5 px-4 h-9 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                      activeTab === rt.id
                        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5'
                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <rt.icon className="w-3.5 h-3.5" />
                    {rt.shortLabel}
                    {typeSum && typeSum.unmatched > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        typeSum.status === 'FAILED'
                          ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300'
                          : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                      }`}>
                        {typeSum.unmatched}
                      </span>
                    )}
                    {typeSum && typeSum.status === 'PASSED' && (
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dual panel + match button */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="flex flex-1 overflow-hidden min-h-0"
              >
                {/* LEFT — GL Entries */}
                <div className="flex flex-col flex-1 border-r border-slate-200 dark:border-slate-800 min-w-0 overflow-hidden">
                  {/* Panel header */}
                  <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{activeReconType?.leftTitle}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{filteredGL.length} entries</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input
                          value={searchLeft}
                          onChange={e => setSearchLeft(e.target.value)}
                          placeholder="Search GL…"
                          className="pl-6 pr-3 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/50 w-36"
                        />
                      </div>
                      <button
                        onClick={() => handleRunSingle(activeTab)}
                        className="p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        title="Refresh"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${runningType === activeTab ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  {/* Table */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredGL.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-600">
                        <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                        <span className="text-xs font-medium">All GL entries matched</span>
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm">
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Entry #</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Narration</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">Amount</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Module</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Fund</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredGL.map(entry => (
                            <GLRow
                              key={entry.id}
                              entry={entry}
                              isSelected={selectedLeft === entry.id}
                              onClick={id => setSelectedLeft(prev => prev === id ? null : id)}
                            />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* MIDDLE — Match button */}
                <div className="flex-shrink-0 w-14 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 py-4">
                  <motion.button
                    whileHover={canMatch ? { scale: 1.08 } : {}}
                    whileTap={canMatch ? { scale: 0.94 } : {}}
                    onClick={handleMatch}
                    disabled={!canMatch}
                    className={`relative flex flex-col items-center gap-1 px-1.5 py-3 rounded-xl text-[10px] font-bold transition-all ${
                      canMatch
                        ? 'bg-gradient-to-b from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 cursor-pointer'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed'
                    }`}
                    title={canMatch ? 'Match selected entries (Ctrl+M)' : 'Select one entry from each side to match'}
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span style={{ writingMode: 'vertical-rl', fontSize: 9, letterSpacing: '0.05em' }}>MATCH</span>
                    {canMatch && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950"
                      />
                    )}
                  </motion.button>

                  {/* Variance indicator */}
                  {canMatch && (() => {
                    const glEntry = currentState.glEntries.find(e => e.id === selectedLeft);
                    const srcRecord = currentState.sourceRecords.find(r => r.id === selectedRight);
                    if (!glEntry || !srcRecord) return null;
                    const glAmt = glEntry.dr > 0 ? glEntry.dr : glEntry.cr;
                    const diff = glAmt - srcRecord.amount;
                    return (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`text-[9px] font-bold text-center px-1 py-0.5 rounded-md ${
                          diff === 0
                            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {diff === 0 ? 'Exact' : `Δ${fmtINR(Math.abs(diff))}`}
                      </motion.div>
                    );
                  })()}
                </div>

                {/* RIGHT — Source Records */}
                <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                  {/* Panel header */}
                  <div className="flex-shrink-0 flex items-center justify-between gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{activeReconType?.rightTitle}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500">{filteredSource.length} records</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <input
                          value={searchRight}
                          onChange={e => setSearchRight(e.target.value)}
                          placeholder="Search records…"
                          className="pl-6 pr-3 py-1 text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-400/50 w-36"
                        />
                      </div>
                      <button
                        onClick={() => {
                          const glEntry = currentState.glEntries.find(e => e.id === selectedLeft);
                          const srcRecord = currentState.sourceRecords.find(r => r.id === selectedRight);
                          const target = glEntry || srcRecord;
                          if (target) handleDispute({ ...target, narration: target.narration || target.description || target.id });
                        }}
                        disabled={!selectedLeft && !selectedRight}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        title="Flag selected item as disputed"
                      >
                        <Flag className="w-3 h-3" />
                        Dispute
                      </button>
                    </div>
                  </div>
                  {/* Table */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredSource.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-400 dark:text-slate-600">
                        <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-400" />
                        <span className="text-xs font-medium">All source records matched</span>
                      </div>
                    ) : (
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/80 backdrop-blur-sm">
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="py-2 px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Record #</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Date</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Description</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-right">Amount</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Type</th>
                            <th className="py-2 px-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Fund</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSource.map(record => (
                            <SourceRow
                              key={record.id}
                              record={record}
                              isSelected={selectedRight === record.id}
                              onClick={id => setSelectedRight(prev => prev === id ? null : id)}
                            />
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ── BOTTOM PANEL ─────────────────────────────────────────────── */}
            <div className={`flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 ${showBottom ? 'h-64' : 'h-9'}`}>
              {/* Tab bar */}
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 h-9 flex-shrink-0">
                <div className="flex flex-1 overflow-x-auto">
                  {BOTTOM_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setBottomTab(tab.id); setShowBottom(true); }}
                      className={`flex items-center gap-1.5 px-3 h-9 text-xs font-semibold whitespace-nowrap border-b-2 transition-colors flex-shrink-0 ${
                        bottomTab === tab.id && showBottom
                          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                      {tab.badge !== null && tab.badge !== undefined && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          tab.badgeCrit && tab.badge > 0
                            ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}>
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Summary status bar */}
                <div className="hidden lg:flex items-center gap-3 px-4 text-[10px] text-slate-400 dark:text-slate-500 border-l border-slate-200 dark:border-slate-800 h-full flex-shrink-0">
                  <span><span className="font-bold text-emerald-600 dark:text-emerald-400">{currentState.matchedPairs.length}</span> matched</span>
                  <span><span className="font-bold text-amber-600 dark:text-amber-400">{filteredGL.length}</span> unmatched GL</span>
                  <span><span className="font-bold text-blue-600 dark:text-blue-400">{filteredSource.length}</span> unmatched source</span>
                  {currentState.disputedItems.length > 0 && (
                    <span><span className="font-bold text-red-600 dark:text-red-400">{currentState.disputedItems.length}</span> disputed</span>
                  )}
                  {(() => {
                    const typeSum = summary.find(s => s.type === activeTab);
                    if (!typeSum || typeSum.variance === 0) return <span className="font-bold text-emerald-600 dark:text-emerald-400">Variance: NIL</span>;
                    return <span className="font-bold text-amber-600 dark:text-amber-400">Variance: {fmtINR(Math.abs(typeSum.variance))}</span>;
                  })()}
                </div>

                <button
                  onClick={() => setShowBottom(s => !s)}
                  className="px-3 h-9 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border-l border-slate-200 dark:border-slate-800 transition-colors flex-shrink-0"
                >
                  {showBottom ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Tab content */}
              <AnimatePresence mode="wait">
                {showBottom && (
                  <motion.div
                    key={bottomTab + activeTab}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="h-[calc(100%-36px)] overflow-y-auto px-4 py-3"
                  >
                    {/* Matched pairs */}
                    {bottomTab === 'matched' && (
                      <div>
                        {currentState.matchedPairs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-24 text-slate-400 dark:text-slate-600">
                            <Layers className="w-6 h-6 mb-1.5" />
                            <span className="text-xs">No matched pairs yet. Select entries from both panels and click Match.</span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">
                              {currentState.matchedPairs.length} Matched Pair{currentState.matchedPairs.length !== 1 ? 's' : ''}
                            </div>
                            <AnimatePresence>
                              {currentState.matchedPairs.map(pair => (
                                <MatchedPairRow
                                  key={pair.id}
                                  pair={pair}
                                  onUnmatch={handleUnmatch}
                                  onDispute={handleDispute}
                                />
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Disputed items */}
                    {bottomTab === 'disputed' && (
                      <div>
                        {currentState.disputedItems.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-24 text-slate-400 dark:text-slate-600">
                            <ShieldCheck className="w-6 h-6 mb-1.5 text-emerald-400" />
                            <span className="text-xs">No disputed items. All clear.</span>
                          </div>
                        ) : (
                          <div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-2">
                              {currentState.disputedItems.length} Disputed Item{currentState.disputedItems.length !== 1 ? 's' : ''}
                            </div>
                            <AnimatePresence>
                              {currentState.disputedItems.map(item => (
                                <DisputedRow key={item.id} item={item} onResolve={handleResolveDispute} />
                              ))}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Analytics */}
                    {bottomTab === 'analytics' && <AnalyticsPanel summary={summary} />}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── AI PANEL ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {showAI && (
            <motion.div
              key="ai-panel"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 300, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              className="flex-shrink-0 overflow-hidden border-l border-slate-200 dark:border-slate-800"
            >
              <AIPanel onClose={() => setShowAI(false)} activeType={activeTab} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── DISPUTE MODAL ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {disputeTarget && (
          <DisputeModal
            item={disputeTarget}
            onSubmit={handleDisputeSubmit}
            onClose={() => setDisputeTarget(null)}
          />
        )}
      </AnimatePresence>

      {/* ── FLOATING MATCH CTA (when both sides selected) ─────────────────── */}
      <AnimatePresence>
        {canMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20"
          >
            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-mono font-semibold text-indigo-700 dark:text-indigo-300">{selectedLeft}</span>
              <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono font-semibold text-blue-700 dark:text-blue-300">{selectedRight}</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleMatch}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Confirm Match
            </motion.button>
            <button
              onClick={() => { setSelectedLeft(null); setSelectedRight(null); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
