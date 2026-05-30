import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { ChevronDown, ChevronUp, BarChart2, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { TYPE_CONFIG, TYPE_ORDER, fmtShort, sumField } from './tbConstants';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#8b5cf6', '#10b981', '#f59e0b'];

// ─── Custom Recharts tooltip ──────────────────────────────────────────────────
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.fill || p.color }} />
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-medium text-slate-800">{fmtShort(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Debit vs Credit bar chart ────────────────────────────────────────────────
function DebitCreditChart({ accounts }) {
  const data = TYPE_ORDER.map((t) => {
    const rows = accounts.filter(a => (a.type || '').toUpperCase() === t);
    return {
      type: TYPE_CONFIG[t]?.label || t,
      Debit:  sumField(rows, 'closing_debit'),
      Credit: sumField(rows, 'closing_credit'),
    };
  }).filter(d => d.Debit || d.Credit);

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-3">Debit vs Credit by Type</p>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2}>
          <XAxis dataKey="type" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip content={<ChartTip />} />
          <Bar dataKey="Debit"  fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="Credit" fill="#8b5cf6" radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Group distribution pie ───────────────────────────────────────────────────
function DistributionPie({ accounts }) {
  const data = TYPE_ORDER.map((t, i) => {
    const rows = accounts.filter(a => (a.type || '').toUpperCase() === t);
    const val  = sumField(rows, 'closing_debit') + sumField(rows, 'closing_credit');
    return { name: TYPE_CONFIG[t]?.label || t, value: val, color: PIE_COLORS[i] };
  }).filter(d => d.value > 0);

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-3">Balance Distribution</p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%" cy="50%"
            innerRadius={42} outerRadius={64}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => fmtShort(v)} />
          <Legend
            formatter={(value) => <span style={{ fontSize: 10, color: '#64748b' }}>{value}</span>}
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Top balances list ────────────────────────────────────────────────────────
function TopBalances({ accounts }) {
  const sorted = [...accounts]
    .map(a => ({ ...a, _total: parseFloat(a.closing_debit || 0) + parseFloat(a.closing_credit || 0) }))
    .sort((a, b) => b._total - a._total)
    .slice(0, 6);

  const max = sorted[0]?._total || 1;

  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-3">Largest Balances</p>
      <div className="space-y-2">
        {sorted.map((acc) => (
          <div key={acc.account_id || acc.code} className="flex items-center gap-2">
            <p className="text-xs text-slate-600 truncate w-28 flex-shrink-0">{acc.name}</p>
            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: `${Math.round((acc._total / max) * 100)}%` }}
              />
            </div>
            <p className="text-xs font-medium text-slate-700 tabular-nums w-16 text-right flex-shrink-0">
              {fmtShort(acc._total)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI insights ──────────────────────────────────────────────────────────────
function AIInsights({ accounts, balanced, diff }) {
  const insights = [];

  const expenses = accounts.filter(a => (a.type || '').toUpperCase() === 'EXPENSE');
  const expenseTotal = sumField(expenses, 'closing_debit');
  const income  = accounts.filter(a => (a.type || '').toUpperCase() === 'INCOME');
  const incomeTotal = sumField(income, 'closing_credit');

  if (!balanced) {
    insights.push({ type: 'error', text: `Books are out of balance by ₹${fmtShort(diff)}. Check unposted or reversed journal entries.` });
  }

  const suspense = accounts.filter(a => (a.name || '').toLowerCase().includes('suspense'));
  if (suspense.length > 0) {
    insights.push({ type: 'warning', text: `${suspense.length} suspense account(s) carry balances. Clear before period close.` });
  }

  if (expenseTotal > incomeTotal * 1.1) {
    insights.push({ type: 'warning', text: 'Expenses exceed income by more than 10% — review cost centres.' });
  } else if (incomeTotal > expenseTotal) {
    insights.push({ type: 'info', text: `Net income position: +${fmtShort(incomeTotal - expenseTotal)}` });
  }

  const inactive = accounts.filter(a => a.is_active === false && (parseFloat(a.closing_debit || 0) + parseFloat(a.closing_credit || 0)) > 0);
  if (inactive.length > 0) {
    insights.push({ type: 'warning', text: `${inactive.length} inactive ledger(s) still carry non-zero balances.` });
  }

  if (insights.length === 0) {
    insights.push({ type: 'success', text: 'No anomalies detected. Books look healthy.' });
  }

  const colors = { error: 'text-red-600 bg-red-50 border-red-200', warning: 'text-amber-700 bg-amber-50 border-amber-200', info: 'text-blue-700 bg-blue-50 border-blue-200', success: 'text-emerald-700 bg-emerald-50 border-emerald-200' };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-violet-500" />
        <p className="text-xs font-semibold text-slate-600">AI Insights</p>
      </div>
      <div className="space-y-2">
        {insights.map((ins, i) => (
          <div key={i} className={clsx('text-xs px-3 py-2 rounded-lg border', colors[ins.type])}>
            {ins.text}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────
export default function TBAnalyticsPanel({ accounts, balanced, diff }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Analytics &amp; Insights</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-4 pb-5 pt-1 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <DebitCreditChart accounts={accounts} />
          <DistributionPie accounts={accounts} />
          <TopBalances accounts={accounts} />
          <AIInsights accounts={accounts} balanced={balanced} diff={diff} />
        </div>
      )}
    </div>
  );
}
