import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, MessageSquare, TrendingUp, X, Send, Bot, Copy,
  ShieldX, ShieldAlert, AlertTriangle, CheckCircle2, Zap,
  ChevronRight, RefreshCw, BarChart3,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AI_INSIGHTS, CASHFLOW_FORECAST, AGING_BUCKETS } from './VIConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const QUICK_PROMPTS = [
  'Find duplicate invoices',
  'Which invoices have fraud risk?',
  'Show GST mismatches',
  'Recommend fast-track approvals',
  'Forecast payable impact',
];

const ICON_MAP = { Copy, ShieldX, ShieldAlert, AlertTriangle, CheckCircle2, Zap, TrendingUp };

const SEVERITY_STYLES = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/20',     border: 'border-red-200 dark:border-red-800',     dot: 'bg-red-500',     text: 'text-red-700 dark:text-red-300',     label: 'Critical' },
  warning:  { bg: 'bg-amber-50 dark:bg-amber-900/15', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-300', label: 'Warning'  },
  info:     { bg: 'bg-violet-50 dark:bg-violet-900/15',border:'border-violet-200 dark:border-violet-800',dot: 'bg-violet-500', text: 'text-violet-700 dark:text-violet-300',label: 'Info'     },
};

// ─── Insight Card ─────────────────────────────────────────────────────────────
function InsightCard({ insight, index }) {
  const s = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.info;
  const Icon = ICON_MAP[insight.icon] || Sparkles;
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
      className={`p-3 rounded-xl border ${s.bg} ${s.border}`}
    >
      <div className="flex items-start gap-2 mb-1.5">
        <span className={`w-1.5 h-1.5 rounded-full mt-1 flex-none ${s.dot}`} />
        <p className={`text-[11px] font-bold ${s.text}`}>{insight.title}</p>
      </div>
      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2 ml-3.5">
        {insight.body}
      </p>
      <button className={`ml-3.5 flex items-center gap-1 text-[10px] font-semibold ${s.text} hover:opacity-80 transition-opacity`}>
        {insight.action} <ChevronRight size={10} />
      </button>
    </motion.div>
  );
}

// ─── AI Chat ──────────────────────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    text: "Hi! I'm your Vendor Invoice AI assistant. I can detect duplicate invoices, flag fraud risks, validate GST, and forecast payable impact. How can I help?",
  },
];

const AI_RESPONSES = {
  'find duplicate invoices':           "I've detected **2 near-duplicate invoices** from Sunrise Medical Disposables:\n- VINV-2026-00852 (₹1.275L, no PO)\n- VINV-2026-00858 (₹1.278L, exception match)\n\nPrice variance: 0.23%. Combined exposure: ₹2.55L. Recommend immediate hold pending vendor clarification.",
  'which invoices have fraud risk?':   "**9 invoices** have been flagged with elevated fraud risk:\n- **Critical (2):** VINV-2026-00852 (no PO, OCR 72%) and VINV-2026-00858 (exception match)\n- **High (1):** VINV-2026-00848 (GRN missing, GST mismatch, ₹21.5L)\n\nTotal financial exposure at risk: ₹25.3L.",
  'show gst mismatches':               "**2 GST mismatches** detected:\n1. VINV-2026-00848 — GST declared ₹2.58L, PO GST ₹2.41L (diff: ₹17,000)\n2. VINV-2026-00855 — Invoice ₹9.8L, PO ₹9.68L (diff: ₹12,000)\n\nInput tax credit at risk: ₹29,000. File correction request before GSTR-2A reconciliation deadline.",
  'recommend fast-track approvals':    "**3 invoices** are ready for immediate fast-track approval:\n1. VINV-2026-00850 — Roche Diagnostics ₹12.5L (matched, low risk, approved)\n2. VINV-2026-00857 — PharmEasy ₹5.34L (matched, no duplicate)\n3. VINV-2026-00861 — Carestream Health ₹4.15L (matched, low risk)\n\nTotal: ₹22L. Recommend batch NEFT on 2026-06-01.",
  'forecast payable impact':           "**30-day payable forecast:**\n- Week 3 May: ₹18.5L scheduled, ₹24.2L projected\n- Week 4 May: ₹32.1L scheduled, ₹38.6L projected\n- Week 1 Jun: ₹58.4L scheduled (GE Healthcare ₹58L)\n\nPeak outflow: ₹61.2L in Jun W1. Recommend early cash positioning.",
};

function getResponse(msg) {
  const key = msg.toLowerCase().replace(/[?!]/g, '').trim();
  for (const [k, v] of Object.entries(AI_RESPONSES)) {
    if (key.includes(k.split(' ')[0]) || key === k) return v;
  }
  return "I'll analyze that now. Based on current invoice data, I can see several patterns worth investigating. Could you be more specific about the vendor, branch, or time period you're interested in?";
}

function ChatTab({ ask }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setLoading(true);
    ask(msg).then(response => {
      setMessages(m => [...m, { role: 'assistant', text: response }]);
    }).finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto space-y-2.5 pb-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mr-1.5 flex-none mt-0.5">
                <Bot size={12} className="text-white" />
              </div>
            )}
            <div className={`max-w-[80%] px-3 py-2 rounded-xl text-[11px] leading-relaxed ${
              m.role === 'user'
                ? 'bg-violet-600 text-white rounded-br-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-bl-sm'
            }`} style={{ whiteSpace: 'pre-line' }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-none">
              <Bot size={12} className="text-white" />
            </div>
            <div className="flex gap-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl rounded-bl-sm">
              {[0, 1, 2].map(i => (
                <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-1 flex-wrap mb-2">
        {QUICK_PROMPTS.slice(0, 3).map(p => (
          <button key={p} onClick={() => send(p)} className="text-[10px] px-2 py-1 rounded-full border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors whitespace-nowrap">
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-1.5">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about invoices, risks, duplicates…"
          className="flex-1 px-3 py-2 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400/30"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim()}
          className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 dark:disabled:bg-violet-900 text-white rounded-xl transition-all"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Cash Flow Forecast Tab ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 shadow-xl text-[11px]">
      <p className="text-slate-300 font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ₹{p.value}L
        </p>
      ))}
    </div>
  );
};

function ForecastTab() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">6-Week Payable Forecast (₹ Lakhs)</p>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={CASHFLOW_FORECAST} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
            <defs>
              <linearGradient id="viForecastScheduled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="viForecastProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="scheduled"  name="Scheduled"  stroke="#7c3aed" strokeWidth={1.5} fill="url(#viForecastScheduled)" />
            <Area type="monotone" dataKey="projected"  name="Projected"  stroke="#f97316" strokeWidth={1.5} fill="url(#viForecastProjected)" strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-2">Aging Bucket Exposure</p>
        <div className="space-y-2">
          {AGING_BUCKETS.map((b, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{b.label}</span>
                <span className="text-[11px] font-bold font-mono" style={{ color: b.color }}>₹{b.value}Cr ({b.count})</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(b.value / 2.84) * 100}%` }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: b.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/15 border border-violet-200 dark:border-violet-800">
        <div className="flex items-start gap-2">
          <Zap size={13} className="text-violet-500 flex-none mt-0.5" />
          <div>
            <p className="text-[11px] font-bold text-violet-700 dark:text-violet-300 mb-1">AI Recommendation</p>
            <p className="text-[11px] text-violet-600 dark:text-violet-400 leading-relaxed">
              Peak outflow of ₹61.2L expected in Jun W1 (GE Healthcare). Recommend pre-positioning funds by May 28 and fast-tracking ₹22L batch payment this week.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main AI Panel ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'insights', label: 'Insights',  icon: Sparkles    },
  { id: 'chat',     label: 'AI Chat',   icon: MessageSquare },
  { id: 'forecast', label: 'Forecast',  icon: BarChart3   },
];

export default function VIAIPanel({ onClose }) {
  const [activeTab, setActiveTab] = useState('insights');
  const { insights: liveInsights, ask } = useModuleAI('ap-invoices');

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className="flex-none flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">AI Assistant</span>
          <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-900/30 px-1.5 py-0.5 rounded-full border border-violet-200 dark:border-violet-800">LIVE</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><RefreshCw size={13} /></button>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><X size={13} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 flex-none">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold border-b-2 transition-all ${
                active
                  ? 'border-violet-500 text-violet-700 dark:text-violet-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              <Icon size={11} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className={activeTab === 'chat' ? 'h-full flex flex-col' : 'space-y-2.5'}
          >
            {activeTab === 'insights' && (liveInsights.length > 0 ? liveInsights : AI_INSIGHTS).map((insight, i) => (
              <InsightCard key={insight.id || i} insight={insight} index={i} />
            ))}
            {activeTab === 'chat'     && <ChatTab ask={ask} />}
            {activeTab === 'forecast' && <ForecastTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
