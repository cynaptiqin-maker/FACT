import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '@services/api';
import { format } from 'date-fns';
import {
  LayoutGrid, Download, RefreshCw, CheckCircle2,
  AlertTriangle, FileText, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCr(value) {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function toISODate(d) {
  return format(d, 'yyyy-MM-dd');
}

// ─── Account Row ──────────────────────────────────────────────────────────────
function BSAccountRow({ account }) {
  const indent = (account.level || 0) * 16;
  return (
    <tr className={clsx(
      'border-b border-slate-50 hover:bg-slate-50/50 transition-colors',
      account.is_group && 'bg-slate-50/80'
    )}>
      <td className="py-2 px-4 text-xs text-slate-400 font-mono w-20">{account.code}</td>
      <td className="py-2 px-4">
        <span
          className={clsx('text-sm', account.is_group ? 'font-semibold text-slate-800' : 'text-slate-600')}
          style={{ paddingLeft: `${indent}px` }}
        >
          {account.name}
        </span>
      </td>
      <td className="py-2 px-4 text-right">
        {!account.is_group && (
          <span className="text-sm font-mono text-slate-700">{formatCr(account.net_amount)}</span>
        )}
      </td>
    </tr>
  );
}

// ─── Section Panel ────────────────────────────────────────────────────────────
function SectionPanel({ title, accounts = [], total, accentClass, icon: Icon, iconClass }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card flex flex-col">
      <div className={clsx('px-5 py-3 border-b border-slate-200 flex items-center gap-2', accentClass)}>
        {Icon && <Icon className={clsx('w-4 h-4', iconClass)} />}
        <div>
          <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
          <p className="text-xs text-slate-500">{accounts.filter(a => !a.is_group).length} accounts</p>
        </div>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="py-2 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide w-20">Code</th>
              <th className="py-2 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Account Name</th>
              <th className="py-2 px-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => <BSAccountRow key={acc.code || i} account={acc} />)}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-slate-200 bg-slate-50">
              <td className="py-3 px-4" colSpan={2}>
                <span className="text-sm font-bold text-slate-800">Total {title}</span>
              </td>
              <td className="py-3 px-4 text-right">
                <span className="text-sm font-bold font-mono text-slate-900">{formatCr(total)}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonPanel() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card animate-pulse">
      <div className="h-4 w-20 bg-slate-100 rounded mb-4" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2.5 border-b border-slate-50">
          <div className="w-14 h-3 bg-slate-100 rounded" />
          <div className="flex-1 h-3 bg-slate-100 rounded" />
          <div className="w-20 h-3 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BalanceSheet() {
  const today = new Date();
  const [asOf, setAsOf] = useState(toISODate(today));
  const [applied, setApplied] = useState(toISODate(today));

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['balance-sheet', applied],
    queryFn: () => reportAPI.getBalanceSheet({ as_of: applied }).then(r => r.data.data || r.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!applied,
  });

  const assets = data?.assets || {};
  const liabilities = data?.liabilities || {};
  const equity = data?.equity || {};
  const isBalanced = data?.isBalanced;
  const difference = data?.difference;
  const totalLiaEq = data?.totalLiabilitiesAndEquity;

  return (
    <div className="max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Balance Sheet</h1>
          </div>
          <p className="text-slate-500 text-sm">As of {format(new Date(applied), 'MMMM d, yyyy')}</p>
          {data && (
            <p className="text-slate-400 text-xs mt-0.5">Generated {format(new Date(), 'MMM d, yyyy HH:mm')}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 disabled:opacity-50"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Picker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Report Date</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">As of Date</label>
            <input
              type="date"
              value={asOf}
              onChange={e => setAsOf(e.target.value)}
              max={toISODate(today)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setApplied(asOf)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate
          </button>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Failed to load Balance Sheet</p>
            <p className="text-xs text-red-500 mt-0.5">{error?.message || 'Unknown error'}</p>
          </div>
          <button onClick={() => refetch()} className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Balance Check Banner */}
      {!isLoading && data && (
        <div className={clsx(
          'rounded-xl p-4 border flex items-center gap-3',
          isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        )}>
          {isBalanced
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          }
          <div className="flex-1">
            <p className={clsx('text-sm font-semibold', isBalanced ? 'text-green-800' : 'text-red-800')}>
              {isBalanced ? 'Balance Sheet is Balanced' : 'Balance Sheet is Unbalanced'}
            </p>
            {!isBalanced && difference != null && (
              <p className="text-xs text-red-600 mt-0.5">Difference: {formatCr(Math.abs(difference))}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Assets</p>
            <p className="text-sm font-bold font-mono text-slate-800">{formatCr(assets.total)}</p>
          </div>
          <div className="w-px h-8 bg-slate-200" />
          <div className="text-right">
            <p className="text-xs text-slate-500">Liabilities + Equity</p>
            <p className="text-sm font-bold font-mono text-slate-800">{formatCr(totalLiaEq)}</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && !data && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center">
          <LayoutGrid className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Select a date to generate the Balance Sheet</p>
          <p className="text-slate-400 text-sm mt-1">Choose the "As of" date above, then click Generate</p>
        </div>
      )}

      {/* Two-column layout: Assets | Liabilities + Equity */}
      {isLoading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SkeletonPanel /> <SkeletonPanel />
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          {/* Left: Assets */}
          <SectionPanel
            title="Assets"
            accounts={assets.accounts || []}
            total={assets.total}
            accentClass="bg-emerald-50"
            icon={LayoutGrid}
            iconClass="text-emerald-600"
          />

          {/* Right: Liabilities + Equity stacked */}
          <div className="flex flex-col gap-6">
            <SectionPanel
              title="Liabilities"
              accounts={liabilities.accounts || []}
              total={liabilities.total}
              accentClass="bg-rose-50"
              icon={AlertTriangle}
              iconClass="text-rose-500"
            />
            <SectionPanel
              title="Equity"
              accounts={equity.accounts || []}
              total={equity.total}
              accentClass="bg-violet-50"
              icon={CheckCircle2}
              iconClass="text-violet-600"
            />

            {/* Combined total */}
            <div className="bg-white border-2 border-slate-200 rounded-xl p-4 shadow-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-700">Total Liabilities &amp; Equity</span>
                <span className="text-lg font-bold font-mono text-slate-900">{formatCr(totalLiaEq)}</span>
              </div>
              {isBalanced && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Matches Total Assets — sheet is balanced
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
