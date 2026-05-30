// ─── Doctor Payouts — AI Compensation Intelligence Panel ──────────────────────
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, AlertTriangle, TrendingUp, Clock,
  AlertOctagon, BarChart2, ChevronRight, X, Loader2,
  MessageSquare, LineChart, ShieldAlert,
} from 'lucide-react';
import { AI_INSIGHTS, MONTHLY_TREND, fmtINR } from './DPConstants';
import { useModuleAI } from '@hooks/useModuleAI';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';

const TABS = [
  { id: 'insights',  label: 'Insights',  icon: Sparkles    },
  { id: 'chat',      label: 'AI Chat',   icon: MessageSquare},
  { id: 'forecast',  label: 'Forecast',  icon: LineChart   },
];

const RISK_ICON = { anomaly: AlertTriangle, delay: Clock, risk: AlertOctagon, optimization: Sparkles, forecast: TrendingUp };
const SEVERITY_BORDER = { HIGH: 'border-orange-300 dark:border-orange-700', CRITICAL: 'border-red-300 dark:border-red-700', MEDIUM: 'border-amber-300 dark:border-amber-700', INFO: 'border-cyan-300 dark:border-cyan-700' };
const SEVERITY_BG     = { HIGH: 'bg-orange-50 dark:bg-orange-950/30', CRITICAL: 'bg-red-50 dark:bg-red-950/30', MEDIUM: 'bg-amber-50 dark:bg-amber-950/30', INFO: 'bg-cyan-50 dark:bg-cyan-950/30' };

// ─── QUICK PROMPTS ────────────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  'Show abnormal doctor payouts',
  'Forecast next month payout liability',
  'Detect unusual incentive patterns',
  'Which payouts are at treasury risk?',
  'List pending insurance-linked payouts',
  'Recommend payout optimization',
];

// ─── AI CHAT MESSAGES ─────────────────────────────────────────────────────────
const CANNED_RESPONSES = {
  'Show abnormal doctor payouts': `Detected 2 abnormal payout patterns:\n\n1. **Dr. Venkat Rao (Nephrology)** — Insurance deductions 22% above 3-month average. Payout currently on hold.\n2. **Dr. Nandini Reddy (Oncology)** — Incentive 28% above department average. Under compliance review.\n\nRecommendation: Review revenue allocation methodology for both before processing.`,
  'Forecast next month payout liability': `**May 2026 Payout Forecast:**\n\n• Total Liability: **₹91.2L** (+8.2% vs Apr)\n• Incentive Pool: **₹14.8L** (+19% — OT season peak)\n• Insurance-linked: **₹22.1L** (TPA settlement cycle)\n• Treasury Cash Outflow: **₹78.4L** net\n\nTop contributors: Cardiology (₹32L), Oncology (₹26L), Orthopedics (₹18L)\n\n⚠️ Ensure treasury liquidity of ₹1Cr+ for timely settlements.`,
  'Detect unusual incentive patterns': `Incentive anomaly scan complete:\n\n🔴 **Critical**: Dr. Nandini Reddy — Oncology incentive 28% above benchmark. No matching OT log.\n🟡 **Medium**: Dr. Kavitha Iyer — ICU bonus calculated on unconfirmed admissions (3 pending discharge summaries).\n🟢 **Normal**: All other 23 payouts within ±15% of benchmark.\n\nAction: Hold Oncology incentive pending review.`,
};

function InsightCard({ insight, index }) {
  const Icon = RISK_ICON[insight.type] ?? Sparkles;
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className={`rounded-xl border p-3.5 ${SEVERITY_BG[insight.severity]} ${SEVERITY_BORDER[insight.severity]}`}
    >
      <div className="flex items-start gap-2.5 mb-2">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-none" style={{ background: `${insight.color}20` }}>
          <Icon size={12} style={{ color: insight.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{insight.title}</p>
        </div>
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold flex-none ${
          insight.severity === 'CRITICAL' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' :
          insight.severity === 'HIGH'     ? 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400' :
          insight.severity === 'MEDIUM'   ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' :
          'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400'
        }`}>{insight.severity}</span>
      </div>
      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2.5">{insight.body}</p>
      <div className="flex gap-1.5 flex-wrap">
        {insight.actions.map(a => (
          <button key={a} className="px-2.5 py-1 rounded-lg text-[10.5px] font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors">
            {a}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ChatTab({ ask }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your AI Compensation Intelligence assistant. Ask me about payout anomalies, treasury exposure, incentive analysis, or forecasting.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text) => {
    if (!text.trim()) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    ask(text).then(response => {
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    }).finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map(q => (
          <button
            key={q}
            onClick={() => send(q)}
            className="px-2.5 py-1 rounded-lg text-[10.5px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-400 transition-all truncate max-w-[200px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-none mr-2 mt-0.5">
                <Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2.5 rounded-xl text-[11.5px] leading-relaxed whitespace-pre-wrap ${
              m.role === 'user'
                ? 'bg-emerald-600 text-white rounded-br-sm'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-bl-sm'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-none">
              <Sparkles size={10} className="text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex gap-1 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
              {[0,1,2].map(j => (
                <motion.div key={j} animate={{ y: [-2, 2, -2] }} transition={{ repeat: Infinity, duration: 0.8, delay: j * 0.15 }}
                  className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 flex-none">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
          placeholder="Ask about payouts, anomalies, treasury…"
          className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
        <button
          onClick={() => send(input)}
          disabled={!input.trim() || loading}
          className="w-8 h-8 rounded-xl flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-none"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
        </button>
      </div>
    </div>
  );
}

function ForecastTab() {
  const forecastData = [
    ...MONTHLY_TREND,
    { month: 'May', payout: 9120000, incentive: 1480000, insurance: 2210000, forecast: true },
    { month: 'Jun', payout: 9480000, incentive: 1540000, insurance: 2380000, forecast: true },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
        <p className="font-bold text-slate-700 dark:text-slate-200 mb-1.5">{label}</p>
        {payload.map(p => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
              <span className="text-slate-500 dark:text-slate-400 capitalize">{p.dataKey}</span>
            </div>
            <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINR(p.value)}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="p-3 bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={13} className="text-cyan-500" />
          <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400">AI Payout Forecast</span>
        </div>
        <p className="text-[11px] text-cyan-700 dark:text-cyan-400 leading-relaxed">
          May 2026 projected at <strong>₹91.2L</strong> (+8.2%). Peak OT season & insurance settlements drive uplift. Ensure treasury readiness by May 1.
        </p>
      </div>

      <div>
        <p className="text-[10.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">6-Month Payout Trend + 2-Month Forecast</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={forecastData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gpayout" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#059669" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gincentive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b22" />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="payout"    stroke="#059669" fill="url(#gpayout)"    strokeWidth={2} dot={false} strokeDasharray={(d) => d?.forecast ? '4 2' : undefined} />
            <Area type="monotone" dataKey="incentive" stroke="#8b5cf6" fill="url(#gincentive)" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'May Forecast',   val: 9120000,  color: '#059669', trend: '+8.2%' },
          { label: 'Jun Forecast',   val: 9480000,  color: '#0ea5e9', trend: '+4.0%' },
          { label: 'Q2 Exposure',    val: 27032000, color: '#8b5cf6', trend: '+6.3%' },
        ].map(c => (
          <div key={c.label} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-[9.5px] text-slate-400 dark:text-slate-500 mb-0.5">{c.label}</p>
            <p className="font-mono font-bold text-sm" style={{ color: c.color }}>{fmtINR(c.val)}</p>
            <p className="text-[9.5px] text-emerald-500 dark:text-emerald-400 font-semibold">{c.trend}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main AI Panel ────────────────────────────────────────────────────────────
export default function DPAIPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('insights');
  const { ask } = useModuleAI('doctor-payout');

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
            <Sparkles size={13} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">AI Intelligence</p>
            <p className="text-[9.5px] text-slate-400 dark:text-slate-500">Compensation Analysis Engine</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="w-6 h-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 flex-none px-1">
        {TABS.map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 flex-1 justify-center py-2.5 text-[11px] font-medium border-b-2 transition-all ${
                activeTab === t.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={11} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className={`flex-1 overflow-y-auto p-4 ${activeTab === 'chat' ? 'flex flex-col' : ''}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={activeTab === 'chat' ? 'flex flex-col flex-1 gap-3 h-full' : 'space-y-3'}
          >
            {activeTab === 'insights' && AI_INSIGHTS.map((ins, i) => (
              <InsightCard key={ins.id} insight={ins} index={i} />
            ))}
            {activeTab === 'chat'    && <ChatTab ask={ask} />}
            {activeTab === 'forecast'&& <ForecastTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
