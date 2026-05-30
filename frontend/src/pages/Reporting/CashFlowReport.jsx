import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '@services/api';
import { format, startOfMonth } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';
import {
  Droplets, Download, RefreshCw, TrendingUp,
  TrendingDown, FileText, AlertCircle, ArrowUp, ArrowDown,
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

// ─── Statement Row ────────────────────────────────────────────────────────────
function StatRow({ label, value, indent = 0, bold = false, color, borderTop = false, borderBottom = false }) {
  return (
    <div className={clsx(
      'flex items-center justify-between py-2.5 px-5',
      borderTop && 'border-t-2 border-slate-200',
      borderBottom && 'border-b border-slate-100',
      bold && 'bg-slate-50',
    )}>
      <span
        className={clsx('text-sm', bold ? 'font-semibold text-slate-800' : 'text-slate-600')}
        style={{ paddingLeft: `${indent * 20}px` }}
      >
        {label}
      </span>
      <span className={clsx('text-sm font-mono', bold ? 'font-bold text-slate-900' : 'text-slate-700', color)}>
        {formatCr(value)}
      </span>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }) {
  return (
    <div className="px-5 py-3 bg-slate-100 border-y border-slate-200">
      <p className="text-xs font-bold text-slate-600 uppercase tracking-wide">{title}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CashFlowReport() {
  const today = new Date();
  const [fromDate, setFromDate] = useState(toISODate(startOfMonth(today)));
  const [toDate, setToDate] = useState(toISODate(today));
  const [applied, setApplied] = useState({ from: toISODate(startOfMonth(today)), to: toISODate(today) });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['cash-flow', applied.from, applied.to],
    queryFn: () => reportAPI.getCashFlow({ from: applied.from, to: applied.to }).then(r => r.data.data || r.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!applied.from && !!applied.to,
  });

  const opening = data?.openingCashBalance ?? null;
  const operating = data?.operatingActivities || {};
  const receipts = operating.receipts ?? null;
  const payments = operating.payments ?? null;
  const netOps = operating.netCashFromOperations ?? null;
  const investing = data?.investingActivities || {};
  const financing = data?.financingActivities || {};
  const netCashFlow = data?.netCashFlow ?? null;
  const closingBalance = opening != null && netCashFlow != null ? opening + netCashFlow : null;

  // Chart data
  const chartData = [
    { name: 'Operating Receipts', value: receipts || 0, fill: '#10b981' },
    { name: 'Operating Payments', value: payments || 0, fill: '#f43f5e' },
    ...(investing.receipts ? [{ name: 'Investing Receipts', value: investing.receipts, fill: '#6366f1' }] : []),
    ...(investing.payments ? [{ name: 'Investing Payments', value: investing.payments, fill: '#8b5cf6' }] : []),
    ...(financing.receipts ? [{ name: 'Financing Receipts', value: financing.receipts, fill: '#06b6d4' }] : []),
    ...(financing.payments ? [{ name: 'Financing Payments', value: financing.payments, fill: '#0ea5e9' }] : []),
  ];

  const isPositive = netCashFlow != null && netCashFlow >= 0;

  return (
    <div className="max-w-5xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-cyan-100 rounded-lg flex items-center justify-center">
              <Droplets className="w-4 h-4 text-cyan-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Cash Flow Statement</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Period: {format(new Date(applied.from), 'MMM d')} – {format(new Date(applied.to), 'MMM d, yyyy')}
          </p>
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
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Select Period</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              max={toISODate(today)}
              onChange={e => setToDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setApplied({ from: fromDate, to: toDate })}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
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
            <p className="text-sm font-medium text-red-700">Failed to load Cash Flow Statement</p>
            <p className="text-xs text-red-500 mt-0.5">{error?.message}</p>
          </div>
          <button onClick={() => refetch()} className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium">Retry</button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && !data && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center">
          <Droplets className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Select a period to generate the Cash Flow statement</p>
          <p className="text-slate-400 text-sm mt-1">Choose dates above and click Generate</p>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card animate-pulse">
          <div className="px-5 py-3 bg-slate-100 h-10" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-50">
              <div className="h-3 w-48 bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Main Statement + Chart side by side */}
      {!isLoading && data && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Statement (left, 2 cols) */}
          <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-800 text-sm">Cash Flow Statement</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {format(new Date(applied.from), 'MMM d')} – {format(new Date(applied.to), 'MMM d, yyyy')}
              </p>
            </div>

            {/* Opening Balance */}
            <StatRow label="Opening Cash Balance" value={opening} bold borderBottom />

            {/* Operating Activities */}
            <SectionHeader title="A. Operating Activities" />
            <StatRow label="Collections from patients" value={receipts} indent={1} borderBottom />
            {operating.otherReceipts != null && (
              <StatRow label="Other operating receipts" value={operating.otherReceipts} indent={1} borderBottom />
            )}
            <StatRow label="Payments to staff & suppliers" value={payments ? -Math.abs(payments) : null} indent={1} color="text-red-600" borderBottom />
            {operating.otherPayments != null && (
              <StatRow label="Other operating payments" value={-Math.abs(operating.otherPayments)} indent={1} color="text-red-600" borderBottom />
            )}
            <StatRow label="Net Cash from Operations" value={netOps} bold borderTop borderBottom
              color={netOps != null && netOps >= 0 ? 'text-green-600' : 'text-red-600'}
            />

            {/* Investing Activities */}
            {(investing.receipts != null || investing.payments != null) && (
              <>
                <SectionHeader title="B. Investing Activities" />
                {investing.receipts != null && (
                  <StatRow label="Proceeds from asset sales" value={investing.receipts} indent={1} borderBottom />
                )}
                {investing.payments != null && (
                  <StatRow label="Capital expenditure" value={-Math.abs(investing.payments)} indent={1} color="text-red-600" borderBottom />
                )}
                <StatRow
                  label="Net Cash from Investing"
                  value={investing.net ?? null}
                  bold borderTop borderBottom
                  color={(investing.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
                />
              </>
            )}

            {/* Financing Activities */}
            {(financing.receipts != null || financing.payments != null) && (
              <>
                <SectionHeader title="C. Financing Activities" />
                {financing.receipts != null && (
                  <StatRow label="Loan proceeds" value={financing.receipts} indent={1} borderBottom />
                )}
                {financing.payments != null && (
                  <StatRow label="Loan repayments" value={-Math.abs(financing.payments)} indent={1} color="text-red-600" borderBottom />
                )}
                <StatRow
                  label="Net Cash from Financing"
                  value={financing.net ?? null}
                  bold borderTop borderBottom
                  color={(financing.net ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}
                />
              </>
            )}

            {/* Net Cash Flow */}
            <div className={clsx(
              'flex items-center justify-between px-5 py-4 border-t-2 border-slate-300',
              isPositive ? 'bg-green-50' : 'bg-red-50'
            )}>
              <div className="flex items-center gap-2">
                {isPositive
                  ? <TrendingUp className="w-4 h-4 text-green-600" />
                  : <TrendingDown className="w-4 h-4 text-red-600" />
                }
                <span className={clsx('text-sm font-bold', isPositive ? 'text-green-800' : 'text-red-800')}>
                  Net Cash Flow
                </span>
              </div>
              <span className={clsx('text-sm font-bold font-mono', isPositive ? 'text-green-700' : 'text-red-700')}>
                {formatCr(netCashFlow)}
              </span>
            </div>

            {/* Closing Balance */}
            <StatRow label="Closing Cash Balance" value={closingBalance} bold borderTop />
          </div>

          {/* Right panel: Chart + KPIs */}
          <div className="flex flex-col gap-5">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Total Receipts', value: receipts, icon: ArrowUp, color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Total Payments', value: payments, icon: ArrowDown, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={clsx('rounded-xl p-4 border border-slate-200 bg-white shadow-card')}>
                  <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', bg)}>
                    <Icon className={clsx('w-3.5 h-3.5', color)} />
                  </div>
                  <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                  <p className={clsx('text-base font-bold font-mono', color)}>{formatCr(value)}</p>
                </div>
              ))}
            </div>

            {/* Bar Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Receipts vs Payments</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={v => `₹${(v/100000).toFixed(0)}L`}
                  />
                  <Tooltip
                    formatter={v => [formatCr(v), 'Amount']}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Net position pill */}
            <div className={clsx(
              'rounded-xl p-4 border shadow-card text-center',
              isPositive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
            )}>
              <p className="text-xs text-slate-500 mb-1">Net Cash Position</p>
              <div className="flex items-center justify-center gap-2">
                {isPositive
                  ? <TrendingUp className="w-4 h-4 text-green-600" />
                  : <TrendingDown className="w-4 h-4 text-red-600" />
                }
                <span className={clsx('text-xl font-bold font-mono', isPositive ? 'text-green-700' : 'text-red-700')}>
                  {formatCr(netCashFlow)}
                </span>
              </div>
              <p className={clsx('text-xs mt-1', isPositive ? 'text-green-600' : 'text-red-600')}>
                {isPositive ? 'Cash surplus for the period' : 'Cash deficit for the period'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
