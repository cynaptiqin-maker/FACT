import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, LayoutGrid, Droplets, Scale,
  Globe, BarChart2, ChevronRight, Clock,
  FileText, Layers,
} from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

// ─── Report Cards Data ────────────────────────────────────────────────────────
const REPORTS = [
  {
    id: 'pl',
    title: 'P&L Statement',
    description: 'Revenue, expenses, and profitability analysis for a selected period.',
    icon: TrendingUp,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    accentBorder: 'border-l-indigo-500',
    href: '/reports/pl',
    tag: null,
  },
  {
    id: 'balance-sheet',
    title: 'Balance Sheet',
    description: 'Assets, liabilities, and equity snapshot as of a chosen date.',
    icon: LayoutGrid,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    accentBorder: 'border-l-emerald-500',
    href: '/reports/balance-sheet',
    tag: null,
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Statement',
    description: 'Cash inflows and outflows by operating, investing, and financing activities.',
    icon: Droplets,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    accentBorder: 'border-l-cyan-500',
    href: '/reports/cash-flow',
    tag: null,
  },
  {
    id: 'trial-balance',
    title: 'Trial Balance',
    description: 'All accounts with debit and credit totals as of a given date.',
    icon: Scale,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    accentBorder: 'border-l-violet-500',
    href: '/reports/trial-balance',
    tag: null,
  },
  {
    id: 'dept-pl',
    title: 'Department P&L',
    description: 'Profitability analysis broken down by department or cost center.',
    icon: Layers,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    accentBorder: 'border-l-amber-500',
    href: '/reports/pl',
    tag: 'Coming Soon',
  },
  {
    id: 'fcra-fund',
    title: 'FCRA Fund Statement',
    description: 'FCRA receipts vs utilisation by registration — compliance overview.',
    icon: Globe,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    accentBorder: 'border-l-teal-500',
    href: '/reports/fcra-fund-statement',
    tag: null,
  },
];

// ─── Recent Reports (placeholder) ────────────────────────────────────────────
const RECENT = [
  { title: 'P&L Statement', period: 'Apr 2026', generatedAt: '28 May 2026, 10:14', type: 'pl' },
  { title: 'Balance Sheet', period: 'As of 01 May 2026', generatedAt: '27 May 2026, 15:02', type: 'balance-sheet' },
  { title: 'Trial Balance', period: 'As of 25 May 2026', generatedAt: '26 May 2026, 09:33', type: 'trial-balance' },
];

const REPORT_ICONS = { pl: TrendingUp, 'balance-sheet': LayoutGrid, 'trial-balance': Scale, 'cash-flow': Droplets, 'fcra-fund': Globe };

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinancialReports() {
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
          </div>
          <p className="text-slate-500 text-sm">Generate and export financial statements</p>
          <p className="text-slate-400 text-xs mt-0.5">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      {/* Report Cards Grid */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {REPORTS.map((report) => {
            const Icon = report.icon;
            const isComingSoon = report.tag === 'Coming Soon';
            return (
              <div
                key={report.id}
                onClick={() => !isComingSoon && navigate(report.href)}
                className={clsx(
                  'group bg-white border border-slate-200 border-l-4 rounded-xl p-5 shadow-card transition-all duration-200',
                  report.accentBorder,
                  isComingSoon
                    ? 'opacity-70 cursor-default'
                    : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', report.iconBg)}>
                    <Icon className={clsx('w-5 h-5', report.iconColor)} />
                  </div>
                  <div className="flex items-center gap-2">
                    {report.tag && (
                      <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-semibold rounded-full">
                        {report.tag}
                      </span>
                    )}
                    {!isComingSoon && (
                      <ChevronRight className={clsx(
                        'w-4 h-4 text-slate-300 transition-transform',
                        'group-hover:text-slate-500 group-hover:translate-x-0.5'
                      )} />
                    )}
                  </div>
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1">{report.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{report.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">Recent Reports</h2>
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-card">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="py-3 px-5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Report</th>
                <th className="py-3 px-5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Period</th>
                <th className="py-3 px-5 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Generated</th>
                <th className="py-3 px-5 text-right text-xs font-medium text-slate-400 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {RECENT.map((r, i) => {
                const Icon = REPORT_ICONS[r.type] || BarChart2;
                return (
                  <tr key={i} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{r.title}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5">
                      <span className="text-sm text-slate-500">{r.period}</span>
                    </td>
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-1.5 text-sm text-slate-400">
                        <Clock className="w-3 h-3" />
                        {r.generatedAt}
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button className="text-xs text-brand-600 hover:text-brand-700 font-medium">
                        Regenerate
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Report history is retained for 90 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
