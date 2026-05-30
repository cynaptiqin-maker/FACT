import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '@services/api';
import { format } from 'date-fns';
import {
  Scale, Download, RefreshCw, FileText,
  CheckCircle2, AlertTriangle, AlertCircle,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatAmt(value) {
  if (value === null || value === undefined || value === 0) return '—';
  const n = Number(value);
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return `₹${Math.abs(n).toLocaleString('en-IN')}`;
}

function toISODate(d) {
  return format(d, 'yyyy-MM-dd');
}

const TYPES = ['ALL', 'ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'];

// ─── Account Row ──────────────────────────────────────────────────────────────
function TBRow({ account }) {
  const indent = (account.level || 0) * 12;
  const isGroup = account.is_group;

  if (isGroup) {
    return (
      <tr className="bg-slate-50/80 border-b border-slate-100">
        <td className="py-2 px-4 text-xs text-slate-400 font-mono w-20">{account.code}</td>
        <td className="py-2 px-4" colSpan={4}>
          <span className="text-sm font-bold text-slate-700" style={{ paddingLeft: `${indent}px` }}>
            {account.name}
          </span>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/40 transition-colors">
      <td className="py-2 px-4 text-xs text-slate-400 font-mono w-20">{account.code}</td>
      <td className="py-2 px-4">
        <span className="text-sm text-slate-600" style={{ paddingLeft: `${indent}px` }}>
          {account.name}
        </span>
      </td>
      <td className="py-2 px-4 text-right font-mono text-sm text-slate-600">
        {formatAmt(account.opening_balance)}
      </td>
      <td className="py-2 px-4 text-right font-mono text-sm text-indigo-600">
        {formatAmt(account.total_debit)}
      </td>
      <td className="py-2 px-4 text-right font-mono text-sm text-rose-600">
        {formatAmt(account.total_credit)}
      </td>
      <td className="py-2 px-4 text-right font-mono text-sm text-slate-800 font-medium">
        {formatAmt(account.closingBalance)}
      </td>
    </tr>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TrialBalance() {
  const today = new Date();
  const [asOf, setAsOf] = useState(toISODate(today));
  const [applied, setApplied] = useState(toISODate(today));
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['reporting-trial-balance', applied],
    queryFn: () => reportAPI.getTrialBalance({ as_of: applied }).then(r => r.data.data || r.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!applied,
  });

  const accounts = data?.accounts || [];
  const totalDebit = data?.totalDebit || 0;
  const totalCredit = data?.totalCredit || 0;
  const isBalanced = data?.isBalanced;

  const filtered = useMemo(() => {
    let result = accounts;
    if (typeFilter !== 'ALL') {
      result = result.filter(a => a.type === typeFilter || a.sub_type === typeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(a =>
        a.name?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [accounts, typeFilter, search]);

  return (
    <div className="max-w-7xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
              <Scale className="w-4 h-4 text-violet-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Trial Balance</h1>
          </div>
          <p className="text-slate-500 text-sm">All accounts with debit and credit totals as of {format(new Date(applied), 'MMMM d, yyyy')}</p>
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
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">As of Date</label>
            <input
              type="date"
              value={asOf}
              onChange={e => setAsOf(e.target.value)}
              max={toISODate(today)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setApplied(asOf)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate
          </button>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-slate-500 mb-1">Search Account</label>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Code or account name..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Failed to load Trial Balance</p>
            <p className="text-xs text-red-500 mt-0.5">{error?.message}</p>
          </div>
          <button onClick={() => refetch()} className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium">Retry</button>
        </div>
      )}

      {/* Balance Check */}
      {!isLoading && data && (
        <div className={clsx(
          'rounded-xl p-4 border flex items-center gap-4 flex-wrap',
          isBalanced ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        )}>
          {isBalanced
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            : <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          }
          <p className={clsx('text-sm font-semibold flex-1', isBalanced ? 'text-green-800' : 'text-red-800')}>
            Trial Balance: {isBalanced ? 'BALANCED ✓' : `UNBALANCED ⚠ (difference: ${formatAmt(Math.abs(totalDebit - totalCredit))})`}
          </p>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Debit</p>
              <p className="text-sm font-bold font-mono text-indigo-700">{formatAmt(totalDebit)}</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="text-right">
              <p className="text-xs text-slate-500">Total Credit</p>
              <p className="text-sm font-bold font-mono text-rose-700">{formatAmt(totalCredit)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Type filter tabs */}
      {!isLoading && data && (
        <div className="flex gap-1 flex-wrap">
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                typeFilter === t
                  ? 'bg-violet-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              {t}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 self-center">
            {filtered.filter(a => !a.is_group).length} accounts shown
          </span>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && !data && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center">
          <Scale className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Select a date to generate the Trial Balance</p>
          <p className="text-slate-400 text-sm mt-1">Choose the "As of" date above and click Generate</p>
        </div>
      )}

      {/* Table */}
      {(isLoading || (data && filtered.length > 0)) && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-20">Code</th>
                  <th className="py-3 px-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Account Name</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Opening Bal.</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-indigo-400 uppercase tracking-wide">Debit</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-rose-400 uppercase tracking-wide">Credit</th>
                  <th className="py-3 px-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Closing Bal.</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 12 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50 animate-pulse">
                        <td className="py-2.5 px-4"><div className="h-3 w-12 bg-slate-100 rounded" /></td>
                        <td className="py-2.5 px-4"><div className="h-3 bg-slate-100 rounded" style={{ width: `${40 + (i % 5) * 15}%` }} /></td>
                        <td className="py-2.5 px-4"><div className="h-3 w-16 bg-slate-100 rounded ml-auto" /></td>
                        <td className="py-2.5 px-4"><div className="h-3 w-16 bg-slate-100 rounded ml-auto" /></td>
                        <td className="py-2.5 px-4"><div className="h-3 w-16 bg-slate-100 rounded ml-auto" /></td>
                        <td className="py-2.5 px-4"><div className="h-3 w-20 bg-slate-100 rounded ml-auto" /></td>
                      </tr>
                    ))
                  : filtered.map((acc, i) => <TBRow key={acc.code || i} account={acc} />)
                }
              </tbody>
              {!isLoading && data && (
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-100">
                    <td className="py-3 px-4" colSpan={2}>
                      <span className="text-sm font-bold text-slate-800">TOTALS</span>
                    </td>
                    <td className="py-3 px-4 text-right" />
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-bold font-mono text-indigo-700">{formatAmt(totalDebit)}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-bold font-mono text-rose-700">{formatAmt(totalCredit)}</span>
                    </td>
                    <td className="py-3 px-4 text-right" />
                  </tr>
                  <tr className="bg-slate-50">
                    <td colSpan={6} className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        {isBalanced
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          : <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                        }
                        <span className={clsx('text-xs font-semibold', isBalanced ? 'text-green-700' : 'text-red-700')}>
                          {isBalanced
                            ? 'Trial Balance is balanced — Total Dr = Total Cr'
                            : `Trial Balance is NOT balanced — difference of ${formatAmt(Math.abs(totalDebit - totalCredit))}`
                          }
                        </span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* No results after filter */}
      {!isLoading && data && filtered.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-12 text-center">
          <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">No accounts match the selected filter</p>
          <button
            onClick={() => { setTypeFilter('ALL'); setSearch(''); }}
            className="mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
