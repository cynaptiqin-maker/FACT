// ─── Depreciation Runs — AI Intelligence Panel ───────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Zap, MessageSquare, BarChart2, Lightbulb, Send, RefreshCw,
  AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, Landmark,
  Clock, CheckCircle, ChevronRight, Bot, User, Sparkles, Activity,
} from 'lucide-react';
import {
  AI_INSIGHTS, AI_RESPONSES, TREND_DATA, CATEGORY_DATA,
  MULTIBOOK_DATA, fmtINR, fmtPct,
} from './DRConstants';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import { useModuleAI } from '@hooks/useModuleAI';

// ── severity config ──────────────────────────────────────────────────────────
// severity keys are uppercase in constants (CRITICAL, HIGH, MEDIUM, INFO)
const SEV = {
  CRITICAL: { bg: 'bg-red-50 dark:bg-red-900/20',   border: 'border-red-200 dark:border-red-800/50',   text: 'text-red-700 dark:text-red-400',   badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',   dot: 'bg-red-500' },
  HIGH:     { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/50', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  MEDIUM:   { bg: 'bg-blue-50 dark:bg-blue-900/20',  border: 'border-blue-200 dark:border-blue-800/50',  text: 'text-blue-700 dark:text-blue-400',  badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400',  dot: 'bg-blue-500' },
  LOW:      { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/50', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  INFO:     { bg: 'bg-slate-50 dark:bg-slate-800',   border: 'border-slate-200 dark:border-slate-700',   text: 'text-slate-600 dark:text-slate-400', badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400', dot: 'bg-slate-400' },
};

const ICON_MAP = {
  AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, Landmark, Clock, CheckCircle,
};

// ── InsightCard ──────────────────────────────────────────────────────────────
function InsightCard({ insight, index }) {
  const s = SEV[insight.severity] || SEV.INFO;
  const Icon = ICON_MAP[insight.icon] || Lightbulb;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      className={`rounded-xl border ${s.bg} ${s.border} p-3.5 cursor-pointer hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`p-1.5 rounded-lg ${s.badge} flex-shrink-0`}>
          <Icon size={13} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <p className={`text-[11px] font-bold ${s.text}`}>{insight.title}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${s.badge}`}>
              {insight.severity.toLowerCase()}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{insight.body}</p>
          {insight.action && (
            <button className={`mt-1.5 flex items-center gap-0.5 text-[10px] font-semibold ${s.text} hover:underline`}>
              {insight.action} <ChevronRight size={10} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── TypingIndicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-2xl rounded-bl-sm w-fit">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ── ChatBubble ───────────────────────────────────────────────────────────────
function ChatBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] mt-0.5 ${
        isUser ? 'bg-violet-500' : 'bg-gradient-to-br from-purple-500 to-indigo-600'
      }`}>
        {isUser ? <User size={12} /> : <Bot size={12} />}
      </div>
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed ${
        isUser
          ? 'bg-violet-500 text-white rounded-tr-sm'
          : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'
      }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

// ── MiniMetric ───────────────────────────────────────────────────────────────
function MiniMetric({ label, value, sub, color = 'violet' }) {
  const colors = {
    violet: 'text-violet-600 dark:text-violet-400',
    emerald: 'text-emerald-600 dark:text-emerald-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
    blue: 'text-blue-600 dark:text-blue-400',
  };
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-slate-200 dark:border-slate-700">
      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-0.5">{label}</p>
      <p className={`text-[15px] font-bold tabular-nums ${colors[color]}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── VIEWS ────────────────────────────────────────────────────────────────────
const VIEWS = [
  { id: 'insights', label: 'Insights', icon: Lightbulb },
  { id: 'chat',     label: 'Chat',     icon: MessageSquare },
  { id: 'metrics',  label: 'Metrics',  icon: BarChart2 },
];

// ── Main Panel ───────────────────────────────────────────────────────────────
export default function DRAIPanel({ onClose }) {
  const [view, setView] = useState('insights');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm Jean AI, your depreciation intelligence assistant. I can help you analyse runs, identify anomalies, check compliance across books, and forecast treasury impact. What would you like to know?" },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const { ask } = useModuleAI('depreciation');
  const [refreshing, setRefreshing] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (view === 'chat') chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, view]);

  function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setMessages(m => [...m, { role: 'user', content: text }]);
    setInput('');
    setTyping(true);
    ask(text).then(response => {
      setMessages(m => [...m, { role: 'assistant', content: response }]);
    }).finally(() => setTyping(false));
  }

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  const criticalCount = AI_INSIGHTS.filter(i => i.severity === 'CRITICAL').length;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex-shrink-0 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-700 px-4 py-3.5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
              <Sparkles size={14} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Jean AI</p>
              <p className="text-violet-200 text-[10px]">Depreciation Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        {/* Live status strip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-white/15 rounded-lg px-2.5 py-1.5 flex-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-white text-[11px] font-medium">Live monitoring active</span>
          </div>
          {criticalCount > 0 && (
            <div className="flex items-center gap-1 bg-red-500/30 border border-red-400/40 rounded-lg px-2 py-1">
              <AlertTriangle size={11} className="text-red-300" />
              <span className="text-red-200 text-[11px] font-bold">{criticalCount} critical</span>
            </div>
          )}
        </div>

        {/* View tabs */}
        <div className="flex gap-0.5 mt-3 bg-black/20 rounded-lg p-0.5">
          {VIEWS.map(v => (
            <button
              key={v.id}
              onClick={() => setView(v.id)}
              className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${
                view === v.id
                  ? 'bg-white text-violet-700'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <v.icon size={11} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ── INSIGHTS VIEW ── */}
          {view === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-3.5 space-y-2.5"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  AI Insights · {AI_INSIGHTS.length} alerts
                </p>
                <span className="text-[10px] text-slate-400">Updated just now</span>
              </div>
              {AI_INSIGHTS.map((ins, i) => (
                <InsightCard key={ins.id} insight={ins} index={i} />
              ))}

              {/* Quick prompts */}
              <div className="mt-4">
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Ask Jean AI
                </p>
                {[
                  'Show runs with IAS 36 exposure this quarter',
                  'Compare IFRS vs IT Act variance for Q1',
                  'Which assets need component depreciation review?',
                  'Forecast treasury impact for next 6 months',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => { setView('chat'); setInput(q); }}
                    className="w-full text-left mb-1.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all text-[11.5px] text-slate-600 dark:text-slate-400 group"
                  >
                    <Zap size={11} className="text-violet-400 flex-shrink-0 group-hover:text-violet-600" />
                    {q}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── CHAT VIEW ── */}
          {view === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
                {messages.map((msg, i) => (
                  <ChatBubble key={i} msg={msg} />
                ))}
                {typing && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={12} className="text-white" />
                    </div>
                    <TypingIndicator />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested questions */}
              {messages.length === 1 && (
                <div className="px-3.5 pb-2 flex flex-wrap gap-1.5">
                  {[
                    'Anomalies this month?',
                    'Multi-book variance?',
                    'Deferred tax exposure?',
                    'Impairment risks?',
                  ].map(q => (
                    <button
                      key={q}
                      onClick={() => { setInput(q); }}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <div className="flex-shrink-0 p-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <div className="flex gap-2 items-end">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Ask about depreciation runs, compliance, forecasts…"
                    rows={2}
                    className="flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[12px] text-slate-800 dark:text-slate-200 px-3 py-2 focus:outline-none focus:border-violet-400 dark:focus:border-violet-600 placeholder:text-slate-400"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || typing}
                    className="p-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors flex-shrink-0"
                  >
                    <Send size={14} />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                  Powered by GPT-4o · Responses are AI-generated
                </p>
              </div>
            </motion.div>
          )}

          {/* ── METRICS VIEW ── */}
          {view === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-3.5 space-y-4"
            >
              {/* KPI grid */}
              <div>
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                  Run Metrics
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <MiniMetric label="Total Depreciation" value={fmtINR(14280000)} sub="FY 2025–26" color="violet" />
                  <MiniMetric label="Assets Processed" value="847" sub="this month" color="blue" />
                  <MiniMetric label="IFRS vs Statutory" value={fmtINR(420000)} sub="variance" color="amber" />
                  <MiniMetric label="Deferred Tax" value={fmtINR(138600)} sub="exposure @ 33%" color="rose" />
                </div>
              </div>

              {/* Trend mini-chart */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">Monthly Trend</p>
                <ResponsiveContainer width="100%" height={100}>
                  <AreaChart data={TREND_DATA} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v/100000).toFixed(0)}L`} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', background: '#1e293b', color: '#f1f5f9' }}
                      formatter={v => [fmtINR(v)]}
                    />
                    <Area type="monotone" dataKey="ifrs" stroke="#7c3aed" fill="url(#aiGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Category mini-chart */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2">By Category</p>
                <ResponsiveContainer width="100%" height={100}>
                  <BarChart data={CATEGORY_DATA.slice(0, 5)} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v/100000).toFixed(0)}L`} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', background: '#1e293b', color: '#f1f5f9' }}
                      formatter={v => [fmtINR(v)]}
                    />
                    <Bar dataKey="amount" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* AI Activity */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <Activity size={11} className="text-violet-500" /> AI Activity Log
                </p>
                {[
                  { time: '09:14', event: 'Anomaly detected in DR-2026-0089', sev: 'critical' },
                  { time: '08:55', event: 'IAS 36 impairment flag raised', sev: 'high' },
                  { time: '08:30', event: 'Multi-book variance recalculated', sev: 'medium' },
                  { time: '07:45', event: 'Q4 treasury forecast updated', sev: 'low' },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2 py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEV[a.sev].dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">{a.event}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0 tabular-nums">{a.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
