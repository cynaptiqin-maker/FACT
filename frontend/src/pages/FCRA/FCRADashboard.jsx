import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Globe, TrendingUp, TrendingDown, Wallet, ShieldCheck, Users,
  FolderKanban, AlertTriangle, Calendar, FileText, Bot,
  ChevronRight, RefreshCw, AlertCircle, CheckCircle2, Clock,
  BarChart3, ArrowUpRight, Send, X,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fcraAPI } from '@services/api';

// ─── Design tokens ────────────────────────────────────────────────────────────
const G = {
  primary:  '#16a34a',
  light:    '#dcfce7',
  muted:    '#bbf7d0',
  danger:   '#dc2626',
  warning:  '#d97706',
  bg:       '#f5efe0',
  card:     '#ffffff',
  border:   '#e5e7eb',
  text:     '#111827',
  sub:      '#6b7280',
};

function fmtINR(n) {
  if (n == null) return '₹0';
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000)   return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

// ─── Admin Cap Gauge ──────────────────────────────────────────────────────────
function AdminCapGauge({ pct = 0, amount = 0, limit = 20 }) {
  const r = 60;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(pct, 100);
  const stroke = (capped / 100) * circ * 0.75;
  const color = pct > limit ? G.danger : pct > limit * 0.8 ? G.warning : G.primary;
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <svg width="160" height="120" viewBox="0 0 160 120">
        <circle cx="80" cy="80" r={r} fill="none" stroke="#e5e7eb" strokeWidth="14"
          strokeDasharray={`${circ * 0.75} ${circ}`} strokeDashoffset={-circ * 0.125}
          strokeLinecap="round" />
        <motion.circle cx="80" cy="80" r={r} fill="none" stroke={color} strokeWidth="14"
          strokeDasharray={`${stroke} ${circ}`} strokeDashoffset={-circ * 0.125}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${stroke} ${circ}` }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
        <text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill={color}>{pct.toFixed(1)}%</text>
        <text x="80" y="94" textAnchor="middle" fontSize="10" fill={G.sub}>Admin Cap</text>
      </svg>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs text-gray-500">Used: {fmtINR(amount)}</span>
        <span className="text-xs font-medium" style={{ color }}>
          {pct > limit ? '⚠ Limit Breached' : `${(limit - pct).toFixed(1)}% headroom`}
        </span>
      </div>
      <div className="w-full mt-2 bg-gray-100 rounded-full h-1.5">
        <motion.div className="h-1.5 rounded-full" style={{ backgroundColor: color }}
          initial={{ width: 0 }} animate={{ width: `${Math.min(pct / limit * 100, 100)}%` }}
          transition={{ duration: 1.2 }} />
      </div>
      <p className="text-[10px] text-gray-400 mt-1">FCRA limit: 20% of total receipts</p>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPI({ icon: Icon, label, value, sub, color = G.primary, badge, delay = 0, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      onClick={onClick}
      className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
          <Icon size={18} style={{ color }} />
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: badge.bg, color: badge.fg }}>
            {badge.label}
          </span>
        )}
      </div>
      <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </motion.div>
  );
}

// ─── AI Panel ─────────────────────────────────────────────────────────────────
function AIPanel({ context }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your FCRA compliance assistant. Ask me about admin cap, FC-4 filing, donor reporting, or any FCRA regulation.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const { data } = await fcraAPI.chatAI({ message: userMsg, context });
      setMessages(m => [...m, { role: 'assistant', text: data.data.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Sorry, I couldn\'t process that. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <motion.button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white text-sm font-medium z-50"
        style={{ backgroundColor: G.primary }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
        <Bot size={18} /> FCRA Assistant
      </motion.button>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50"
      style={{ height: 440 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b rounded-t-2xl" style={{ backgroundColor: G.primary }}>
        <div className="flex items-center gap-2 text-white">
          <Bot size={16} />
          <span className="font-semibold text-sm">FCRA Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={`text-xs rounded-xl px-3 py-2 max-w-[85%] ${m.role === 'user' ? 'ml-auto text-white' : 'text-gray-800 bg-green-50 border border-green-100'}`}
            style={m.role === 'user' ? { backgroundColor: G.primary } : {}}>
            {m.text}
          </div>
        ))}
        {loading && <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 w-16">...</div>}
      </div>
      <div className="p-3 border-t flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about FCRA compliance…"
          className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-green-400" />
        <button onClick={send} disabled={loading}
          className="p-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: G.primary }}>
          <Send size={14} />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function FCRADashboard() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [compliance, setCompliance] = useState([]);
  const [utilSummary, setUtilSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiContext, setAiContext] = useState({});

  async function load() {
    setLoading(true);
    try {
      const [dash, rec, proj, comp, util, ctx] = await Promise.all([
        fcraAPI.getDashboard(),
        fcraAPI.getReceipts({ limit: 5, status: 'pending' }),
        fcraAPI.getProjects({ limit: 6, status: 'active' }),
        fcraAPI.getCompliances({ limit: 6, status: 'pending' }),
        fcraAPI.getUtilisationSummary(),
        fcraAPI.getAIContext(),
      ]);
      setKpis(dash.data.data.kpis);
      setReceipts(rec.data.data || []);
      setProjects(proj.data.data || []);
      setCompliance(comp.data.data || []);
      setUtilSummary(util.data.data?.by_category || []);
      setAiContext(ctx.data.data?.context || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const adminCapPct  = kpis?.admin_cap_pct ?? 0;
  const adminAmt     = kpis?.total_utilized ? (adminCapPct / 100) * kpis.total_receipts_inr : 0;

  const pieData = utilSummary.map(u => ({
    name: u.category,
    value: parseFloat(u.total || 0),
  }));
  const PIE_COLORS = ['#16a34a', '#0ea5e9', '#f59e0b', '#8b5cf6'];

  const statusColor = {
    pending: { bg: '#fef9c3', fg: '#854d0e' },
    overdue:  { bg: '#fee2e2', fg: '#991b1b' },
    completed: { bg: '#dcfce7', fg: '#166534' },
    in_progress: { bg: '#dbeafe', fg: '#1e40af' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe size={22} className="text-green-600" /> FCRA Compliance
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Foreign Contribution Regulation Act · FY {new Date().getFullYear()}–{String(new Date().getFullYear() + 1).slice(2)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={() => navigate('/fcra/receipts')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
            style={{ backgroundColor: G.primary }}>
            Record Receipt
          </button>
        </div>
      </div>

      {/* Admin Cap Breach Alert */}
      {kpis?.admin_cap_breach && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Admin Cap Breach Detected</p>
            <p className="text-xs text-red-600">Administrative expenses ({adminCapPct.toFixed(1)}%) exceed the 20% FCRA limit. Immediate action required.</p>
          </div>
        </motion.div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <KPI icon={TrendingUp}    label="Total Receipts (FY)" value={fmtINR(kpis?.total_receipts_inr)}
          color={G.primary} delay={0} onClick={() => navigate('/fcra/receipts')} />
        <KPI icon={TrendingDown}  label="Total Utilised (FY)" value={fmtINR(kpis?.total_utilized)}
          color="#0ea5e9" delay={0.05} onClick={() => navigate('/fcra/utilisation')} />
        <KPI icon={Wallet}        label="Available Balance" value={fmtINR(kpis?.available_balance)}
          color="#10b981" delay={0.1} />
        <KPI icon={ShieldCheck}   label="Admin Cap Used"
          value={`${(kpis?.admin_cap_pct ?? 0).toFixed(1)}%`}
          color={kpis?.admin_cap_breach ? G.danger : G.primary}
          badge={kpis?.admin_cap_breach ? { label: 'BREACH', bg: '#fee2e2', fg: '#991b1b' } : { label: 'OK', bg: '#dcfce7', fg: '#166534' }}
          sub="Max 20% of total FC" delay={0.15} onClick={() => navigate('/fcra/reports')} />
        <KPI icon={FolderKanban}  label="Active Projects" value={kpis?.active_projects ?? 0}
          color="#8b5cf6" delay={0.2} onClick={() => navigate('/fcra/projects')} />
        <KPI icon={Users}         label="Active Donors" value={kpis?.active_donors ?? 0}
          color="#f59e0b" delay={0.25} onClick={() => navigate('/fcra/donors')} />
        <KPI icon={AlertTriangle} label="Overdue Compliance" value={kpis?.overdue_compliance ?? 0}
          color={kpis?.overdue_compliance > 0 ? G.danger : G.primary}
          badge={kpis?.overdue_compliance > 0 ? { label: 'ACTION', bg: '#fee2e2', fg: '#991b1b' } : undefined}
          delay={0.3} onClick={() => navigate('/fcra/compliance')} />
        <KPI icon={Calendar}      label="Upcoming Compliance" value={kpis?.upcoming_compliance ?? 0}
          color="#0ea5e9" delay={0.35} onClick={() => navigate('/fcra/compliance')} />
        <KPI icon={Globe}         label="Registrations" value={kpis?.active_registrations ?? 0}
          color={G.primary} delay={0.4} onClick={() => navigate('/fcra/registration')} />
        <KPI icon={FileText}      label="Last FC-4 Status"
          value={kpis?.fc4_last_year || 'Not Filed'}
          sub={kpis?.fc4_last_status || '—'}
          color={kpis?.fc4_last_status === 'accepted' ? G.primary : '#f59e0b'}
          delay={0.45} onClick={() => navigate('/fcra/fc4')} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-4">

        {/* Admin Cap Gauge */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-800 text-sm">Admin Cap Monitor</h2>
            <span className="text-[10px] text-gray-400">FCRA § 8 — Max 20%</span>
          </div>
          <AdminCapGauge pct={adminCapPct} amount={adminAmt} limit={20} />
          <div className="mt-3 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Total Receipts</span>
              <span className="font-medium">{fmtINR(kpis?.total_receipts_inr)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Admin Utilized</span>
              <span className="font-medium">{fmtINR(adminAmt)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Headroom</span>
              <span className="font-medium text-green-600">{fmtINR(Math.max(0, kpis?.total_receipts_inr * 0.2 - adminAmt))}</span>
            </div>
          </div>
        </motion.div>

        {/* Utilisation by Category */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3">Utilisation by Category</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => fmtINR(v)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">No utilisation data</div>
          )}
          <div className="space-y-1 mt-2">
            {pieData.map((d, i) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="capitalize">{d.name}</span>
                </span>
                <span className="font-medium">{fmtINR(d.value)}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Active Projects */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Active Projects</h2>
            <button onClick={() => navigate('/fcra/projects')} className="text-xs text-green-600 flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {projects.slice(0, 5).map((p) => {
              const pct = p.received_amount > 0 ? Math.min((p.utilized_amount / p.received_amount) * 100, 100) : 0;
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-gray-700 truncate max-w-[60%]">{p.project_name}</span>
                    <span className="text-gray-500">{pct.toFixed(0)}% used</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full">
                    <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {projects.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No active projects</p>}
          </div>
        </motion.div>

        {/* Recent Receipts */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="col-span-12 lg:col-span-7 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Pending Receipts</h2>
            <button onClick={() => navigate('/fcra/receipts')} className="text-xs text-green-600 flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-400 border-b border-gray-100">
                  <th className="text-left pb-2 font-medium">Receipt #</th>
                  <th className="text-left pb-2 font-medium">Date</th>
                  <th className="text-right pb-2 font-medium">Amount (FC)</th>
                  <th className="text-right pb-2 font-medium">INR</th>
                  <th className="text-right pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/fcra/receipts')}>
                    <td className="py-2 font-mono text-green-700">{r.receipt_number}</td>
                    <td className="py-2 text-gray-500">{r.receipt_date}</td>
                    <td className="py-2 text-right">{r.amount?.toLocaleString()} {r.currency}</td>
                    <td className="py-2 text-right font-medium">{fmtINR(r.amount_inr)}</td>
                    <td className="py-2 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: statusColor[r.status]?.bg || '#f3f4f6', color: statusColor[r.status]?.fg || '#374151' }}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {receipts.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-6 text-gray-400">No pending receipts</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Compliance Calendar */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="col-span-12 lg:col-span-5 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-800 text-sm">Compliance Calendar</h2>
            <button onClick={() => navigate('/fcra/compliance')} className="text-xs text-green-600 flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-2">
            {compliance.map((c) => {
              const daysLeft = Math.ceil((new Date(c.due_date) - new Date()) / 86400000);
              const isOverdue = daysLeft < 0;
              const isUrgent  = daysLeft >= 0 && daysLeft <= 14;
              const icon = isOverdue ? AlertCircle : isUrgent ? Clock : CheckCircle2;
              const Icon = icon;
              const clr  = isOverdue ? G.danger : isUrgent ? G.warning : G.primary;
              return (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Icon size={14} style={{ color: clr, shrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{c.title}</p>
                    <p className="text-[10px] text-gray-400">{c.compliance_type?.replace('_', ' ')}</p>
                  </div>
                  <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: clr }}>
                    {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today' : `${daysLeft}d left`}
                  </span>
                </div>
              );
            })}
            {compliance.length === 0 && (
              <div className="text-center py-6 text-xs text-gray-400 flex flex-col items-center gap-2">
                <CheckCircle2 size={24} className="text-green-300" />
                All compliance items up to date
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Record Receipt',  icon: TrendingUp,    path: '/fcra/receipts',    color: G.primary },
          { label: 'New Utilisation', icon: TrendingDown,  path: '/fcra/utilisation', color: '#0ea5e9' },
          { label: 'Add Donor',       icon: Users,         path: '/fcra/donors',      color: '#f59e0b' },
          { label: 'FC-4 Filing',     icon: FileText,      path: '/fcra/fc4',         color: '#8b5cf6' },
        ].map(({ label, icon: Icon, path, color }) => (
          <motion.button key={label} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => navigate(path)}
            className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
              <Icon size={15} style={{ color }} />
            </div>
          </motion.button>
        ))}
      </div>

      <AIPanel context={aiContext} />
    </div>
  );
}
