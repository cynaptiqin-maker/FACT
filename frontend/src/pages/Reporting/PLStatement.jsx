import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '@services/api';
import { format, startOfMonth } from 'date-fns';
import {
  TrendingUp, TrendingDown, Download, RefreshCw,
  FileText, AlertCircle, BarChart2,
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function TableSkeleton({ rows = 8 }) {
  return (
    <div className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2.5 border-b border-slate-100">
          <div className="w-16 h-3 bg-slate-100 rounded" />
          <div className="flex-1 h-3 bg-slate-100 rounded" style={{ marginLeft: `${(i % 3) * 16}px` }} />
          <div className="w-24 h-3 bg-slate-100 rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Account Row ──────────────────────────────────────────────────────────────
function AccountRow({ account }) {
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
          <span className="text-sm font-mono text-slate-700">
            {formatCr(account.net_amount)}
          </span>
        )}
      </td>
    </tr>
  );
}

// ─── Section Table ────────────────────────────────────────────────────────────
function SectionTable({ title, accounts = [], total, accentClass }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
      <div className={clsx('px-5 py-3 border-b border-slate-200', accentClass)}>
        <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{accounts.filter(a => !a.is_group).length} accounts</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="py-2 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide w-20">Code</th>
              <th className="py-2 px-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Account Name</th>
              <th className="py-2 px-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Amount</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => <AccountRow key={acc.code || i} account={acc} />)}
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

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={clsx('text-xl font-bold font-mono', color)}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PLStatement() {
  const today = new Date();
  const [fromDate, setFromDate] = useState(toISODate(startOfMonth(today)));
  const [toDate, setToDate] = useState(toISODate(today));
  const [applied, setApplied] = useState({ from: toISODate(startOfMonth(today)), to: toISODate(today) });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['pl', applied.from, applied.to],
    queryFn: () => reportAPI.getPLStatement({ from: applied.from, to: applied.to }).then(r => r.data.data || r.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!applied.from && !!applied.to,
  });

  function handleGenerate() {
    setApplied({ from: fromDate, to: toDate });
  }

  const income = data?.income || {};
  const expense = data?.expense || {};
  const netProfit = data?.netProfit ?? null;
  const isProfitable = data?.isProfitable;
  const profitMargin = data?.profitMargin;
  const incomeAccounts = income.accounts || [];
  const expenseAccounts = expense.accounts || [];

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">P&L Statement</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Profit &amp; Loss for {format(new Date(applied.from), 'MMM d, yyyy')} – {format(new Date(applied.to), 'MMM d, yyyy')}
          </p>
          {data && (
            <p className="text-slate-400 text-xs mt-0.5">
              Generated {format(new Date(), 'MMM d, yyyy HH:mm')}
            </p>
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
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Select Period</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              max={toISODate(today)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-700">Failed to load P&L Statement</p>
            <p className="text-xs text-red-500 mt-0.5">{error?.message || 'Unknown error'}</p>
          </div>
          <button
            onClick={() => refetch()}
            className="ml-auto px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading KPIs */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 h-20">
              <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
              <div className="h-6 w-28 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* KPI Row */}
      {!isLoading && data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPI label="Total Revenue" value={formatCr(income.total)} color="text-indigo-700" />
          <KPI label="Total Expenses" value={formatCr(expense.total)} color="text-slate-800" />
          <KPI
            label="Net Profit / Loss"
            value={formatCr(netProfit)}
            color={isProfitable ? 'text-green-600' : 'text-red-600'}
          />
          <KPI
            label="Profit Margin"
            value={profitMargin != null ? `${Number(profitMargin).toFixed(1)}%` : '—'}
            sub={isProfitable ? 'Profitable' : 'Loss Making'}
            color={isProfitable ? 'text-green-600' : 'text-red-600'}
          />
        </div>
      )}

      {/* Empty / waiting state */}
      {!isLoading && !isError && !data && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center">
          <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Select a period to generate the P&L statement</p>
          <p className="text-slate-400 text-sm mt-1">Choose from and to dates above, then click Generate</p>
        </div>
      )}

      {/* Income Section */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="h-4 w-24 bg-slate-100 rounded mb-4 animate-pulse" />
          <TableSkeleton rows={6} />
        </div>
      )}
      {!isLoading && incomeAccounts.length > 0 && (
        <SectionTable
          title="Income"
          accounts={incomeAccounts}
          total={income.total}
          accentClass="bg-indigo-50"
        />
      )}

      {/* Expense Section */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-card">
          <div className="h-4 w-24 bg-slate-100 rounded mb-4 animate-pulse" />
          <TableSkeleton rows={8} />
        </div>
      )}
      {!isLoading && expenseAccounts.length > 0 && (
        <SectionTable
          title="Expenses"
          accounts={expenseAccounts}
          total={expense.total}
          accentClass="bg-slate-50"
        />
      )}

      {/* Net Profit Summary */}
      {!isLoading && data && netProfit !== null && (
        <div className={clsx(
          'rounded-xl p-5 border-2 shadow-card',
          isProfitable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isProfitable
                ? <TrendingUp className="w-6 h-6 text-green-600" />
                : <TrendingDown className="w-6 h-6 text-red-600" />
              }
              <div>
                <p className={clsx('text-lg font-bold', isProfitable ? 'text-green-800' : 'text-red-800')}>
                  {isProfitable ? 'Net Profit' : 'Net Loss'}
                </p>
                <p className={clsx('text-xs', isProfitable ? 'text-green-600' : 'text-red-600')}>
                  For period {format(new Date(applied.from), 'MMM d')} – {format(new Date(applied.to), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={clsx('text-2xl font-bold font-mono', isProfitable ? 'text-green-700' : 'text-red-700')}>
                {formatCr(Math.abs(netProfit))}
              </p>
              {profitMargin != null && (
                <p className={clsx('text-sm', isProfitable ? 'text-green-600' : 'text-red-600')}>
                  {Number(profitMargin).toFixed(1)}% margin
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
