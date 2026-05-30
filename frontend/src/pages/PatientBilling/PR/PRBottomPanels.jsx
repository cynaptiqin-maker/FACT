// ─── Bottom Panel Tabs: Audit / Reconciliation / Analytics / Activity ─────────
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { AUDIT_EVENTS_SAMPLE, MOCK_ACTIVITY, COLLECTION_TREND, PAYMENT_MODE_PIE, DEPT_COLLECTION, DEPT_COLORS, fmtINR, fmtDateTime, fmtTime } from './PRConstants';

// ─── Audit Timeline ───────────────────────────────────────────────────────────
const TYPE_CFG = {
  create:   { bg: 'bg-emerald-500', icon: '✚' },
  update:   { bg: 'bg-blue-500',    icon: '✎' },
  ai:       { bg: 'bg-purple-500',  icon: '✦' },
  workflow: { bg: 'bg-teal-500',    icon: '⟳' },
  system:   { bg: 'bg-slate-400',   icon: '⚙' },
};

export function AuditPanel() {
  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="max-w-2xl space-y-0">
        {AUDIT_EVENTS_SAMPLE.map((ev, i) => {
          const cfg = TYPE_CFG[ev.type] ?? TYPE_CFG.system;
          return (
            <div key={ev.id} className="flex gap-3 items-start">
              <div className="flex flex-col items-center flex-none">
                <div className={`w-6 h-6 rounded-full ${cfg.bg} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {cfg.icon}
                </div>
                {i < AUDIT_EVENTS_SAMPLE.length - 1 && <div className="w-px bg-slate-200 dark:bg-slate-700 flex-1 mt-1" style={{minHeight:20}} />}
              </div>
              <div className="pb-4 min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-200">{ev.action}</p>
                  <span className="text-[10px] text-slate-400 flex-none font-mono">{fmtTime(ev.ts)}</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">{ev.detail}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{ev.actor}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Reconciliation Panel ──────────────────────────────────────────────────────
const RECON_ROWS = [
  { mode:'Cash',           status:'Reconciled',       color:'#10b981', amount:'₹2,12,000' },
  { mode:'UPI (Razorpay)', status:'Gateway T+0',      color:'#f59e0b', amount:'₹98,000'  },
  { mode:'Card / POS',     status:'POS Settlement T+1',color:'#f59e0b',amount:'₹1,10,000'},
  { mode:'Cheque / DD',    status:'Bank Clearing 3d', color:'#8b5cf6', amount:'₹9,000'   },
  { mode:'NEFT / RTGS',    status:'Reconciled',       color:'#10b981', amount:'₹62,000'  },
  { mode:'Insurance TPA',  status:'Claim Processing 5–7d',color:'#6366f1',amount:'₹1,21,000'},
  { mode:'Corporate',      status:'Invoice Matching', color:'#0284c7', amount:'₹34,000'  },
  { mode:'Advance Adj.',   status:'Reconciled',       color:'#10b981', amount:'₹28,000'  },
];

export function ReconciliationPanel() {
  return (
    <div className="p-4 overflow-y-auto h-full space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label:'Total Collected',     value:'₹6.84L', color:'text-emerald-600' },
          { label:'Reconciled',          value:'₹3.02L', color:'text-emerald-600' },
          { label:'Pending Recon.',      value:'₹59,500',color:'text-amber-600'   },
          { label:'TPA Claims Pending',  value:'₹1.21L', color:'text-violet-600'  },
        ].map(item => (
          <div key={item.label} className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-[9.5px] text-slate-400 uppercase tracking-wide">{item.label}</p>
            <p className={`text-[14px] font-bold tabular-nums mt-0.5 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              {['Payment Mode','Amount','Status','Expected Clearance'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[9.5px] font-bold text-slate-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECON_ROWS.map(row => (
              <tr key={row.mode} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="px-4 py-2.5 text-[12px] font-semibold text-slate-700 dark:text-slate-300">{row.mode}</td>
                <td className="px-4 py-2.5 text-[12px] font-mono font-semibold text-slate-600 dark:text-slate-400">{row.amount}</td>
                <td className="px-4 py-2.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: row.color }}>
                    <span className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: row.color }} />
                    {row.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-[11px] text-slate-400">
                  {row.status === 'Reconciled' ? 'Completed' : row.status.includes('T+0') ? 'Today' : row.status.includes('T+1') ? 'Tomorrow' : row.status.split(' ').slice(-1)[0]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Analytics Panel ──────────────────────────────────────────────────────────
export function AnalyticsPanel() {
  return (
    <div className="p-4 overflow-y-auto h-full space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* 7-day area chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">7-Day Collection Trend (₹)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={COLLECTION_TREND} margin={{ top:4, right:8, left:-20, bottom:0 }}>
              <defs>
                {[['cash','#10b981'],['card','#6366f1'],['upi','#8b5cf6'],['insurance','#e11d48']].map(([k,c]) => (
                  <linearGradient key={k} id={`g_${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={c} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={c} stopOpacity={0}    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill:'#94a3b8' }} />
              <YAxis tick={{ fontSize: 10, fill:'#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={v => [fmtINR(v)]} contentStyle={{ fontSize:11, borderRadius:10, border:'1px solid #e2e8f0' }} />
              <Area type="monotone" dataKey="insurance" stroke="#e11d48" fill="url(#g_insurance)" strokeWidth={1.5} name="Insurance" />
              <Area type="monotone" dataKey="cash"      stroke="#10b981" fill="url(#g_cash)"      strokeWidth={1.5} name="Cash" />
              <Area type="monotone" dataKey="card"      stroke="#6366f1" fill="url(#g_card)"      strokeWidth={1.5} name="Card" />
              <Area type="monotone" dataKey="upi"       stroke="#8b5cf6" fill="url(#g_upi)"       strokeWidth={1.5} name="UPI" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment mix pie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Payment Mix Today</p>
          <ResponsiveContainer width="100%" height={120}>
            <PieChart>
              <Pie data={PAYMENT_MODE_PIE} cx="50%" cy="50%" innerRadius={36} outerRadius={55} paddingAngle={2} dataKey="value">
                {PAYMENT_MODE_PIE.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={v => [`${v}%`]} contentStyle={{ fontSize:11, borderRadius:10 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-2">
            {PAYMENT_MODE_PIE.map(item => (
              <div key={item.name} className="flex items-center gap-2 text-[10.5px]">
                <span className="w-2 h-2 rounded-sm flex-none" style={{ background: item.color }} />
                <span className="flex-1 text-slate-500">{item.name}</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dept bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Department-Wise Collections (₹)</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={DEPT_COLLECTION} margin={{ top:4, right:8, left:-20, bottom:0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dept" tick={{ fontSize: 10, fill:'#94a3b8' }} />
            <YAxis tick={{ fontSize: 10, fill:'#94a3b8' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
            <Tooltip formatter={v => [fmtINR(v), 'Collected']} contentStyle={{ fontSize:11, borderRadius:10 }} />
            <Bar dataKey="amount" radius={[4,4,0,0]}>
              {DEPT_COLLECTION.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Activity Feed ─────────────────────────────────────────────────────────────
const ACT_COLORS = { 'Payment Received':'#10b981','Insurance Settled':'#6366f1','Refund Processed':'#8b5cf6','Advance Adjusted':'#f97316','Receipt Reversed':'#e11d48' };
const ACT_STATUS_CFG = {
  APPROVED:   'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  RECONCILED: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300',
  ALLOCATED:  'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  REVERSED:   'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
};

export function ActivityPanel() {
  const ago = (ts) => {
    const diff = Date.now() - ts;
    if (diff < 60_000)   return 'Just now';
    if (diff < 3_600_000) return `${Math.floor(diff/60_000)}m ago`;
    return `${Math.floor(diff/3_600_000)}h ago`;
  };

  return (
    <div className="p-4 overflow-y-auto h-full space-y-2">
      {MOCK_ACTIVITY.map(ev => (
        <div key={ev.id}
          className="flex items-start gap-3 p-3 rounded-xl bg-white dark:bg-slate-800
            border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-none text-white text-[11px] font-bold"
            style={{ background: ACT_COLORS[ev.action] ?? '#64748b' }}>
            {ev.patient[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">{ev.action}</p>
              <span className="text-[10px] text-slate-400 flex-none">{ago(ev.ts)}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{ev.patient}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold tabular-nums" style={{ color: ACT_COLORS[ev.action] ?? '#64748b' }}>{fmtINR(ev.amount)}</span>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 font-semibold">{ev.mode}</span>
              <span className={`text-[9.5px] px-1.5 py-0.5 rounded font-bold ${ACT_STATUS_CFG[ev.status] ?? ''}`}>{ev.status}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
