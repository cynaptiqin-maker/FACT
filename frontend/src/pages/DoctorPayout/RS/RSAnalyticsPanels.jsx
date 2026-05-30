// ─── Revenue Sharing — Analytics Bottom Panels ────────────────────────────────
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import { fmtINR, DEPT_DATA, MONTHLY_TREND, TREASURY_FORECAST, UPCOMING_TRANSFERS, AUDIT_EVENTS, FRAUD_ALERTS, RISK_LEVELS } from './RSConstants';
import { Sparkles } from 'lucide-react';

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-2.5 shadow-xl text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 dark:text-slate-400">{p.name}:</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">{typeof p.value === 'number' ? fmtINR(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Revenue Analytics ─────────────────────────────────────────────────────────
export function RSRevenuePanel() {
  const COLORS = ['#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#0ea5e9', '#14b8a6', '#f97316'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Trend chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Revenue Allocation Trends</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">6-month allocated vs realized breakdown</p>
          </div>
          <div className="flex items-center gap-3">
            {[{ c: '#f59e0b', l: 'Allocated' }, { c: '#10b981', l: 'Realized' }, { c: '#f43f5e', l: 'Unrealized' }].map(x => (
              <span key={x.l} className="flex items-center gap-1 text-[10px] text-slate-400">
                <span className="w-2 h-2 rounded-full" style={{ background: x.c }} />{x.l}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              {[['ga', '#f59e0b'], ['gb', '#10b981'], ['gc', '#f43f5e']].map(([id, c]) => (
                <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={c} stopOpacity={0.25} /><stop offset="95%" stopColor={c} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700/50" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} />
            <Tooltip content={<TIP />} />
            <Area type="monotone" dataKey="allocated"  name="Allocated"  stroke="#f59e0b" strokeWidth={2} fill="url(#ga)" />
            <Area type="monotone" dataKey="realized"   name="Realized"   stroke="#10b981" strokeWidth={2} fill="url(#gb)" />
            <Area type="monotone" dataKey="unrealized" name="Unrealized" stroke="#f43f5e" strokeWidth={2} fill="url(#gc)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Dept profitability */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Dept Performance</h4>
        <p className="text-[10px] text-slate-400 mb-3">Realization by department</p>
        <div className="space-y-2">
          {DEPT_DATA.map((d, i) => {
            const pct = Math.round((d.realized / d.allocated) * 100);
            const rCfg = RISK_LEVELS[d.risk];
            return (
              <div key={d.dept}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-medium text-slate-700 dark:text-slate-300">{d.dept}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${rCfg.bg} ${rCfg.text}`}>{rCfg.label}</span>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 tabular-nums">{pct}%</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Realized vs unrealized bar */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">Realized vs Unrealized by Department</h4>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={DEPT_DATA} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700/50" vertical={false} />
            <XAxis dataKey="dept" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} />
            <Tooltip content={<TIP />} />
            <Bar dataKey="realized"  name="Realized"  fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="allocated" name="Allocated" fill="#f59e0b" radius={[3, 3, 0, 0]} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Treasury Panel ────────────────────────────────────────────────────────────
export function RSTreasuryPanel() {
  const statusColor = {
    'Scheduled':        'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
    'Pending Approval': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'Forecasted':       'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-1">6-Month Liability Forecast</h4>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={TREASURY_FORECAST} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700/50" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => fmtINR(v)} />
            <Tooltip content={<TIP />} />
            <Bar dataKey="liability"  name="Total Liability" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            <Bar dataKey="scheduled"  name="Scheduled"       fill="#10b981" radius={[3, 3, 0, 0]} />
            <Bar dataKey="insurance"  name="Insurance"       fill="#8b5cf6" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-3">Upcoming Bank Transfers</h4>
        <div className="space-y-2.5">
          {UPCOMING_TRANSFERS.map((t, i) => (
            <div key={i} className="flex items-center gap-2.5 py-1.5 border-b border-slate-50 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 w-12 shrink-0">{t.date}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{t.doctor}</p>
                <p className="text-[9px] text-slate-400">{t.bank}</p>
              </div>
              <span className="text-xs font-bold tabular-nums text-slate-800 dark:text-slate-100">{fmtINR(t.amount)}</span>
              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${statusColor[t.status]}`}>{t.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1">
          {[
            { l: 'Total Treasury Exposure', v: '₹89.3L', c: 'text-amber-600 dark:text-amber-400' },
            { l: 'Insurance Pending',        v: '₹146.25L', c: 'text-blue-600 dark:text-blue-400' },
          ].map(x => (
            <div key={x.l} className="flex justify-between">
              <span className="text-[10px] text-slate-400">{x.l}</span>
              <span className={`text-xs font-bold ${x.c}`}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Fraud Monitor ─────────────────────────────────────────────────────────────
export function RSFraudMonitor() {
  const SEV = {
    CRITICAL: { border: 'border-red-200 dark:border-red-800',    bg: 'bg-red-50 dark:bg-red-900/10',    badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',    dot: 'bg-red-500'    },
    HIGH:     { border: 'border-orange-200 dark:border-orange-800', bg: 'bg-orange-50 dark:bg-orange-900/10', badge: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
    MEDIUM:   { border: 'border-amber-200 dark:border-amber-800',  bg: 'bg-amber-50 dark:bg-amber-900/10',   badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',   dot: 'bg-amber-500'  },
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Fraud & Risk Monitor</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">AI-powered compensation anomaly detection</p>
        </div>
        <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> AI Active
        </span>
      </div>
      {FRAUD_ALERTS.map(alert => {
        const c = SEV[alert.severity];
        return (
          <div key={alert.id} className={`border rounded-xl p-3 ${c.border} ${c.bg}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${c.dot} shrink-0 mt-0.5`} />
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{alert.type}</p>
                  <p className="text-[10px] text-slate-400">{alert.ruleId} · {alert.doctor} · {alert.dept}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.badge}`}>{alert.severity}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">{alert.confidence}% conf.</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">{alert.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Exposure: {fmtINR(alert.exposure)}</span>
              <button className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 hover:underline">Take Action →</button>
            </div>
            <div className="mt-2 p-1.5 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-400"><strong>Recommended:</strong> {alert.recommendation}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Audit Timeline ────────────────────────────────────────────────────────────
export function RSAuditTimeline() {
  const TYPE_CFG = {
    create:    { icon: '✚', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-500'    },
    calculate: { icon: '⟳', color: 'bg-amber-50 dark:bg-amber-900/20 text-amber-500' },
    approve:   { icon: '✓', color: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500' },
    alert:     { icon: '⚠', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-500'   },
    escalate:  { icon: '↑', color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-500'    },
    gl:        { icon: '📒', color: 'bg-violet-50 dark:bg-violet-900/20 text-violet-500'   },
    payment:   { icon: '₹', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-500'    },
    reconcile: { icon: '⟺', color: 'bg-sky-50 dark:bg-sky-900/20 text-sky-500'       },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">Audit & Activity Timeline</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">Immutable audit trail for all revenue-sharing events</p>
        </div>
        <button className="text-xs text-amber-600 dark:text-amber-400 hover:underline">Export →</button>
      </div>
      <div className="relative">
        <div className="absolute left-[13px] top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-800" />
        <div className="space-y-4">
          {AUDIT_EVENTS.map(ev => {
            const c = TYPE_CFG[ev.type] ?? TYPE_CFG.create;
            return (
              <div key={ev.id} className="flex gap-3 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 z-10 ${c.color}`}>{c.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">{ev.action}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ev.detail}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">{ev.ruleId} · {ev.actor}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 shrink-0 whitespace-nowrap">
                      {new Date(ev.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
