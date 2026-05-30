import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountingAPI } from '@services/api';
import {
  BookOpen, X, CheckCircle2, AlertCircle, Loader2,
  ArrowUpRight, ArrowDownRight, Hash,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

// ─── Plain-English voucher type labels ────────────────────────────────────────
const VOUCHER_LABELS = {
  JOURNAL:    'Journal Entry',
  PAYMENT:    'Payment Voucher',
  RECEIPT:    'Receipt Voucher',
  CONTRA:     'Contra Voucher',
  PURCHASE:   'Purchase Voucher',
  SALES:      'Sales Voucher',
  CREDIT_NOTE:'Credit Note',
  DEBIT_NOTE: 'Debit Note',
};

// ─── Module display names ──────────────────────────────────────────────────────
const MODULE_LABELS = {
  'patient-billing':  'Patient Billing',
  'accounts-payable': 'Accounts Payable',
  'payroll':          'Payroll',
  'insurance-tpa':    'Insurance / TPA',
  'fixed-assets':     'Fixed Assets',
  'doctor-payout':    'Doctor Payout',
  'fcra':             'FCRA',
  'cash-bank':        'Cash & Bank',
};

// ─── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    POSTED:  'bg-green-100 text-green-700',
    DRAFT:   'bg-slate-100 text-slate-600',
    REVERSED:'bg-red-100 text-red-700',
  };
  return (
    <span className={clsx('px-2 py-0.5 rounded text-[10px] font-bold', map[status] || 'bg-slate-100 text-slate-600')}>
      {status}
    </span>
  );
}

// ─── Single journal card ───────────────────────────────────────────────────────
function JournalCard({ entry }) {
  const lines = entry.lines || [];
  const totalDR = lines.reduce((s, l) => s + parseFloat(l.debit || 0), 0);
  const totalCR = lines.reduce((s, l) => s + parseFloat(l.credit || 0), 0);
  const balanced = Math.abs(totalDR - totalCR) < 0.01;

  let dateStr = '—';
  try { dateStr = format(new Date(entry.date), 'dd MMM yyyy'); } catch {}

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      {/* Journal header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Hash className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-sm font-mono font-semibold text-slate-800">{entry.entry_number}</span>
          <StatusBadge status={entry.status} />
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span>{VOUCHER_LABELS[entry.voucher_type] || entry.voucher_type}</span>
          <span>{dateStr}</span>
          {balanced
            ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" title="Balanced" />
            : <AlertCircle className="w-3.5 h-3.5 text-red-500" title="Unbalanced" />
          }
        </div>
      </div>

      {/* Narration */}
      {entry.narration && (
        <div className="px-4 py-1.5 bg-blue-50/40 border-b border-slate-100">
          <p className="text-xs text-slate-600 italic">{entry.narration}</p>
        </div>
      )}

      {/* Lines table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px]">
              <th className="text-left px-4 py-2">Account</th>
              <th className="text-right px-4 py-2">Debit (₹)</th>
              <th className="text-right px-4 py-2">Credit (₹)</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => {
              const isDR = parseFloat(line.debit || 0) > 0;
              return (
                <tr key={i} className={clsx(
                  'border-t border-slate-100',
                  isDR ? 'bg-green-50/30' : 'bg-blue-50/30'
                )}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-1.5">
                      {isDR
                        ? <ArrowUpRight className="w-3 h-3 text-green-500 flex-shrink-0" />
                        : <ArrowDownRight className="w-3 h-3 text-blue-500 flex-shrink-0" />
                      }
                      <span className="font-mono text-slate-500 mr-1">{line.accountCode}</span>
                      <span className="text-slate-800 font-medium">{line.accountName}</span>
                    </div>
                    {line.narration && (
                      <p className="text-[10px] text-slate-400 pl-5 mt-0.5">{line.narration}</p>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-green-700 font-medium">
                    {parseFloat(line.debit || 0) > 0
                      ? `₹${Number(line.debit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-blue-700 font-medium">
                    {parseFloat(line.credit || 0) > 0
                      ? `₹${Number(line.credit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
                      : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-300 bg-slate-50 font-semibold">
              <td className="px-4 py-2 text-slate-700 text-[10px] uppercase tracking-wider">Total</td>
              <td className="px-4 py-2 text-right font-mono text-green-700">
                ₹{totalDR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
              <td className="px-4 py-2 text-right font-mono text-blue-700">
                ₹{totalCR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── AccountingLineage ─────────────────────────────────────────────────────────
/**
 * Slide-in panel showing all GL journal entries linked to a source transaction.
 *
 * Props:
 *   sourceModule  — e.g. 'patient-billing', 'accounts-payable', 'payroll', 'fcra', 'doctor-payout'
 *   sourceId      — UUID of the source document
 *   onClose       — called when the panel should close
 *   title         — optional override for the panel heading
 */
export default function AccountingLineage({ sourceModule, sourceId, onClose, title }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['accounting-lineage', sourceModule, sourceId],
    queryFn: () => accountingAPI.getJournalsBySource(sourceModule, sourceId).then(r => r.data.data),
    enabled: !!(sourceModule && sourceId),
    staleTime: 1000 * 60 * 5,
  });

  const entries = data || [];
  const moduleLabel = MODULE_LABELS[sourceModule] || sourceModule;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm">
            <BookOpen className="w-4.5 h-4.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              {title || 'Accounting Lineage'}
            </h3>
            <p className="text-[11px] text-slate-500">
              {moduleLabel} · {entries.length} journal{entries.length !== 1 ? 's' : ''} posted
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-40 gap-3">
            <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            <p className="text-sm text-slate-500">Loading journal entries…</p>
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center h-40 gap-2">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-sm text-slate-600">Could not load journal entries.</p>
          </div>
        )}

        {!isLoading && !isError && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-center">
            <BookOpen className="w-10 h-10 text-slate-200" />
            <p className="text-sm font-medium text-slate-600">No GL journals found</p>
            <p className="text-xs text-slate-400 max-w-48">
              This transaction has not yet been posted to the general ledger, or accounting integration is not enabled.
            </p>
          </div>
        )}

        {!isLoading && entries.map(entry => (
          <JournalCard key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Footer */}
      {entries.length > 0 && (
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex-shrink-0">
          <p className="text-[11px] text-slate-400 text-center">
            All entries flow to Trial Balance · Ledger · P&amp;L · Balance Sheet
          </p>
        </div>
      )}
    </div>
  );
}
