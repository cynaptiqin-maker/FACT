import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '@services/api';
import { format, startOfYear } from 'date-fns';
import {
  Globe, Download, RefreshCw, FileText,
  AlertCircle, CheckCircle2, AlertTriangle,
  TrendingUp, Building2, Banknote,
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

// FCRA financial year typically starts April 1
function getFYStart(d) {
  const year = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
  return new Date(year, 3, 1); // April 1
}

// ─── Admin Cap Indicator ──────────────────────────────────────────────────────
function AdminCapIndicator({ adminExp, receipts }) {
  if (!receipts || receipts === 0) return null;
  const pct = (adminExp / receipts) * 100;
  const color = pct <= 15 ? 'green' : pct <= 18 ? 'amber' : 'red';
  const barColor = { green: 'bg-green-500', amber: 'bg-amber-400', red: 'bg-red-500' }[color];
  const textColor = { green: 'text-green-700', amber: 'text-amber-700', red: 'text-red-600' }[color];
  const bgColor = { green: 'bg-green-50', amber: 'bg-amber-50', red: 'bg-red-50' }[color];
  const icon = color === 'green'
    ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
    : <AlertTriangle className={clsx('w-3.5 h-3.5', color === 'amber' ? 'text-amber-500' : 'text-red-500')} />;

  return (
    <div className={clsx('rounded-lg p-3', bgColor)}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          {icon}
          <span className="text-xs font-semibold text-slate-600">Admin Expenditure Cap</span>
        </div>
        <span className={clsx('text-sm font-bold', textColor)}>{pct.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-white rounded-full overflow-hidden">
        <div
          className={clsx('h-full rounded-full transition-all duration-500', barColor)}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-slate-400">0%</span>
        <span className="text-[10px] text-slate-400">Cap: 20%</span>
        <span className="text-[10px] text-slate-400">100%</span>
      </div>
      {pct > 20 && (
        <p className="text-[11px] text-red-600 font-medium mt-1.5">
          Exceeds FCRA admin cap of 20% — compliance risk
        </p>
      )}
    </div>
  );
}

// ─── Registration Card ────────────────────────────────────────────────────────
function RegistrationCard({ reg }) {
  const fundBalance = (reg.receipts || 0)
    - (reg.programme_expenses || 0)
    - (reg.admin_expenses || 0)
    - (reg.asset_value || 0);
  const isPositive = fundBalance >= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      {/* Card Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 text-white">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-teal-100 mb-0.5">Registration No.</p>
            <p className="text-base font-bold">{reg.registration_number || '—'}</p>
          </div>
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <Globe className="w-4.5 h-4.5 text-white" />
          </div>
        </div>
        <p className="text-sm text-teal-100 mt-1.5 font-medium">{reg.organisation_name || 'Organisation'}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-0 border-b border-slate-100">
        {[
          { label: 'Total Receipts', value: reg.receipts, icon: TrendingUp, color: 'text-teal-600' },
          { label: 'Programme Expenses', value: reg.programme_expenses, icon: Building2, color: 'text-indigo-600' },
          { label: 'Admin Expenses', value: reg.admin_expenses, icon: Banknote, color: 'text-amber-600' },
          { label: 'Asset Value', value: reg.asset_value, icon: Globe, color: 'text-violet-600' },
        ].map(({ label, value, icon: Icon, color }, i) => (
          <div
            key={label}
            className={clsx(
              'px-4 py-3',
              i % 2 === 0 && i < 3 ? 'border-r border-slate-100' : '',
              i < 2 ? 'border-b border-slate-100' : ''
            )}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className={clsx('w-3.5 h-3.5', color)} />
              <p className="text-[11px] text-slate-500">{label}</p>
            </div>
            <p className={clsx('text-sm font-bold font-mono', color)}>{formatCr(value)}</p>
          </div>
        ))}
      </div>

      {/* Admin Cap */}
      <div className="px-4 py-3 border-b border-slate-100">
        <AdminCapIndicator adminExp={reg.admin_expenses || 0} receipts={reg.receipts || 0} />
      </div>

      {/* Fund Balance */}
      <div className="px-4 py-3 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 mb-0.5">Fund Balance</p>
            <p className="text-[11px] text-slate-400">Receipts − Programme − Admin − Assets</p>
          </div>
          <div className="text-right">
            <p className={clsx('text-base font-bold font-mono', isPositive ? 'text-green-600' : 'text-red-600')}>
              {formatCr(Math.abs(fundBalance))}
            </p>
            <p className={clsx('text-[11px]', isPositive ? 'text-green-500' : 'text-red-500')}>
              {isPositive ? 'Surplus' : 'Deficit'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden animate-pulse">
      <div className="h-24 bg-teal-100" />
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-12 bg-slate-100 rounded" />)}
        </div>
        <div className="h-14 bg-slate-100 rounded" />
        <div className="h-10 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FCRAFundStatement() {
  const today = new Date();
  const fyStart = getFYStart(today);
  const [fromDate, setFromDate] = useState(toISODate(fyStart));
  const [toDate, setToDate] = useState(toISODate(today));
  const [applied, setApplied] = useState({ from: toISODate(fyStart), to: toISODate(today) });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['fcra-fund-statement', applied.from, applied.to],
    queryFn: () => reportAPI.getFCRAFundStatement({ from: applied.from, to: applied.to }).then(r => r.data.data || r.data),
    staleTime: 1000 * 60 * 5,
    enabled: !!applied.from && !!applied.to,
  });

  const registrations = data?.registrations || [];
  const totalReceipts = registrations.reduce((s, r) => s + (r.receipts || 0), 0);
  const totalProgramme = registrations.reduce((s, r) => s + (r.programme_expenses || 0), 0);
  const totalAdmin = registrations.reduce((s, r) => s + (r.admin_expenses || 0), 0);

  function handleGenerate() {
    setApplied({ from: fromDate, to: toDate });
  }

  return (
    <div className="max-w-6xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">FCRA Fund Statement</h1>
          </div>
          <p className="text-slate-500 text-sm">
            Foreign contribution receipts vs utilisation · {format(new Date(applied.from), 'MMM d')} – {format(new Date(applied.to), 'MMM d, yyyy')}
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
          <button className="flex items-center gap-1.5 px-3 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors">
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
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              max={toISODate(today)}
              onChange={e => setToDate(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            Generate
          </button>
          <div className="text-xs text-slate-400 self-center flex items-center gap-1 ml-1">
            <span>FY start: {format(fyStart, 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700">Failed to load FCRA Fund Statement</p>
            <p className="text-xs text-red-500 mt-0.5">{error?.message}</p>
          </div>
          <button onClick={() => refetch()} className="px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium">Retry</button>
        </div>
      )}

      {/* Summary KPIs */}
      {!isLoading && registrations.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Registrations', value: registrations.length, suffix: '', color: 'text-teal-700' },
            { label: 'Total Receipts', value: formatCr(totalReceipts), suffix: '', color: 'text-teal-700' },
            { label: 'Programme Expenses', value: formatCr(totalProgramme), suffix: '', color: 'text-indigo-700' },
            { label: 'Admin Expenses', value: formatCr(totalAdmin), suffix: '', color: 'text-amber-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-card">
              <p className="text-xs text-slate-500 mb-1">{label}</p>
              <p className={clsx('text-xl font-bold font-mono', color)}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && registrations.length === 0 && (
        <div className="bg-white border border-dashed border-slate-200 rounded-xl p-16 text-center">
          <Globe className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No FCRA registrations found for this period</p>
          <p className="text-slate-400 text-sm mt-1">Ensure FCRA registrations and receipts exist in the system</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      )}

      {/* Registration Cards */}
      {!isLoading && registrations.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
              Registrations ({registrations.length})
            </h2>
            <p className="text-xs text-slate-400">Admin cap threshold: 20% of receipts (FCRA 2020)</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {registrations.map((reg, i) => (
              <RegistrationCard key={reg.reg_id || reg.registration_number || i} reg={reg} />
            ))}
          </div>

          {/* Compliance note */}
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-teal-800">FCRA 2020 Compliance Note</p>
              <p className="text-xs text-teal-600 mt-0.5">
                Under FCRA 2020, administrative expenses must not exceed 20% of total foreign contributions received.
                Organisations must file FC-4 annually within 9 months of financial year-end.
                All foreign contributions must be received only in the designated FCRA bank account at SBI, New Delhi (Main Branch).
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
