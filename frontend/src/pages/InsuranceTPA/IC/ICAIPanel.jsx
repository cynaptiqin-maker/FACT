import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, AlertCircle, AlertTriangle, Info,
  TrendingUp, RefreshCw, ThumbsUp, ThumbsDown, Copy, ChevronRight,
  Shield, Zap, Clock, TrendingDown,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar,
} from 'recharts';
import { AI_INSIGHTS, AI_MESSAGES_INIT, AI_PROMPTS, SETTLEMENT_FORECAST, CLAIMS_TREND, fmtINR } from './ICConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEVERITY_CFG = {
  critical: {
    icon: AlertCircle, bg: 'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-800/40', text: 'text-red-700 dark:text-red-400',
    badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  info: {
    icon: Info, bg: 'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-700 dark:text-blue-400',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

function InsightCard({ insight, index }) {
  const cfg = SEVERITY_CFG[insight.severity] ?? SEVERITY_CFG.info;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className={`p-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={13} className={`${cfg.text} flex-none mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className={`text-[11.5px] font-bold leading-tight ${cfg.text}`}>{insight.title}</p>
            <span className={`flex-none text-[9.5px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
              {insight.metric}
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{insight.detail}</p>
          <button className={`mt-1.5 flex items-center gap-1 text-[11px] font-semibold ${cfg.text} hover:opacity-80`}>
            {insight.action} <ChevronRight size={9} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-none shadow-md">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div className={`max-w-[88%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed
          ${isUser
            ? 'bg-indigo-500 text-white rounded-tr-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
          }`}>
          {msg.text}
        </div>
        {!isUser && msg.actions && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {msg.actions.map(a => (
              <button key={a}
                className="px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-white dark:bg-slate-800
                  border border-indigo-200 dark:border-indigo-700/40 text-indigo-600 dark:text-indigo-400
                  hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                {a}
              </button>
            ))}
          </div>
        )}
        {!isUser && (
          <div className="flex items-center gap-1.5 px-1">
            <button className="text-slate-300 hover:text-emerald-500 transition-colors"><ThumbsUp size={10} /></button>
            <button className="text-slate-300 hover:text-red-400 transition-colors"><ThumbsDown size={10} /></button>
            <button className="text-slate-300 hover:text-slate-500 transition-colors"><Copy size={10} /></button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-lg text-[10.5px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name?.includes('₹') ? `₹${p.value}L` : p.value}
        </p>
      ))}
    </div>
  );
};

const SECTIONS = [
  { id: 'insights',  label: 'AI Insights'  },
  { id: 'chat',      label: 'AI Chat'       },
  { id: 'forecast',  label: 'Forecast'      },
];

export default function ICAIPanel({ onClose }) {
  const [section, setSection] = useState('insights');
  const { ask } = useModuleAI('insurance-claims');
  const [messages, setMessages] = useState(AI_MESSAGES_INIT);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const AI_RESPONSES = {
    'Predict Denials':          'Analyzing TPA behavioral patterns… 38 claims have >70% denial probability this cycle, worth ₹4.2Cr. Top risk: ICU claims with missing discharge summaries and Star Health Cardiology cases. Recommend immediate documentation review.',
    'Find Leakage':             'Revenue leakage scan complete. Detected ₹28.4L at risk across 5 categories: 14 unsubmitted claims (₹38.4L), 28 doc-incomplete claims (₹21.4L), 7 OT underbilling cases (₹1.9L), 9 near-deadline claims (₹41.2L), 3 unreconciled settlements (₹16.8L).',
    'Forecast Settlements':     'Settlement forecast model updated. Next 4 weeks: Wk24 ₹56.2L, Wk25 ₹61.8L, Wk26 ₹58.4L, Wk27 ₹64.2L. Total: ₹2.4Cr expected. ICICI Lombard and HDFC ERGO fastest — avg 22 days. CGHS slowest — avg 68 days.',
    'default':                  'Processing your claims intelligence query… Based on current data patterns, I recommend prioritising the 38 high-risk claims and immediately uploading the 28 claims with documentation gaps. This could prevent up to ₹6.3Cr in avoidable denials.',
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', text: text.trim() }]);
    setInput('');
    setThinking(true);
    ask(text.trim()).then(response => {
      setMessages(m => [...m, { role: 'ai', text: response, actions: ['View Details', 'Export Report', 'Take Action'] }]);
    }).finally(() => setThinking(false));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex-none px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
              <Sparkles size={13} className="text-white" />
            </div>
            <div>
              <div className="text-[12.5px] font-bold text-slate-800 dark:text-slate-100">Claims AI Engine</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">Revenue recovery intelligence</div>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex bg-white/60 dark:bg-slate-900/60 rounded-xl p-0.5">
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors
                ${section === s.id ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {section === 'insights' && (
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {AI_INSIGHTS.length} Active Insights
              </span>
              <button className="text-[10.5px] text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                <RefreshCw size={10} /> Refresh
              </button>
            </div>
            {AI_INSIGHTS.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} />
            ))}

            {/* Quick prompts */}
            <div className="mt-4">
              <div className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Quick Actions</div>
              <div className="flex flex-col gap-1.5">
                {AI_PROMPTS.slice(0, 4).map(p => (
                  <button key={p} onClick={() => { setSection('chat'); sendMessage(p); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-medium text-left
                      bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30
                      text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                    <Sparkles size={10} className="flex-none text-indigo-400" />
                    {p}
                    <ChevronRight size={10} className="ml-auto text-indigo-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
              {thinking && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-none">
                    <Sparkles size={12} className="text-white animate-pulse" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="flex-none p-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap gap-1 mb-2">
                {AI_PROMPTS.slice(4).map(p => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-medium
                      bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                      hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask about claims, denials, recovery…"
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[12px]
                    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || thinking}
                  className="w-9 h-9 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {section === 'forecast' && (
          <div className="p-3 space-y-4">
            {/* Settlement forecast */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">Settlement Forecast — 4 Weeks</div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mb-3">AI prediction based on TPA processing patterns</div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={SETTLEMENT_FORECAST} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x="Wk 23" stroke="#6366f1" strokeDasharray="3 3" label={{ value: 'Today', fontSize: 9, fill: '#6366f1' }} />
                    <Area type="monotone" dataKey="actual" name="Actual ₹" stroke="#6366f1" fill="#6366f120" strokeWidth={2} connectNulls={false} dot={{ r: 3, fill: '#6366f1' }} />
                    <Area type="monotone" dataKey="forecast" name="Forecast ₹" stroke="#a78bfa" fill="#a78bfa20" strokeWidth={2} strokeDasharray="5 3" connectNulls={false} dot={{ r: 3, fill: '#a78bfa' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Claims trend */}
            <div>
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-1">Claims Trend — 7 Months</div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CLAIMS_TREND} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="submitted" name="Submitted" fill="#6366f1" radius={[2, 2, 0, 0]} stackId="a" />
                    <Bar dataKey="denied"    name="Denied"    fill="#ef4444" radius={[2, 2, 0, 0]} stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Expected Settlement', val: '₹2.4Cr', sub: 'Next 4 weeks', color: 'text-indigo-600 dark:text-indigo-400', icon: TrendingUp },
                { label: 'Denial Prevention',   val: '₹6.3Cr', sub: 'Recoverable',  color: 'text-emerald-600 dark:text-emerald-400', icon: Shield },
                { label: 'Leakage Exposure',    val: '₹28.4L', sub: '5 categories', color: 'text-rose-600 dark:text-rose-400', icon: Zap },
                { label: 'Avg Settlement Time', val: '34d',    sub: 'Target: 30d',   color: 'text-amber-600 dark:text-amber-400', icon: Clock },
              ].map(m => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon size={11} className={m.color} />
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{m.label}</span>
                    </div>
                    <div className={`text-[14px] font-bold font-mono ${m.color}`}>{m.val}</div>
                    <div className="text-[10px] text-slate-400">{m.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
