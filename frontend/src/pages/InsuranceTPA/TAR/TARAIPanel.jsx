import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, AlertCircle, AlertTriangle, Info,
  TrendingUp, RefreshCw, ThumbsUp, ThumbsDown, Copy, ChevronRight,
  Shield, Clock, TrendingDown, IndianRupee,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TAR_AI_INSIGHTS, TAR_AI_PROMPTS, TAR_SETTLEMENT_FORECAST, fmtINR } from './TARConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEVERITY_CFG = {
  critical: {
    icon: AlertCircle,
    bg:     'bg-red-50 dark:bg-red-900/10',
    border: 'border-red-200 dark:border-red-800/40',
    text:   'text-red-700 dark:text-red-400',
    badge:  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg:     'bg-amber-50 dark:bg-amber-900/10',
    border: 'border-amber-200 dark:border-amber-800/40',
    text:   'text-amber-700 dark:text-amber-400',
    badge:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  info: {
    icon: Info,
    bg:     'bg-blue-50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800/40',
    text:   'text-blue-700 dark:text-blue-400',
    badge:  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

const AI_INIT_MESSAGES = [
  {
    role: 'ai',
    text: 'TPA Aging Recovery AI ready. I can analyze overdue claims, predict write-off risk, forecast settlements, identify non-responsive TPAs, and recommend escalation priorities across your entire aging portfolio.',
    actions: ['Predict Write-offs', 'Recovery Forecast', 'Escalation Priority'],
  },
];

const AI_RESPONSES = {
  'Predict Write-offs':
    'Write-off risk analysis complete. 4 claims aged >180 days (₹11.88Cr) are at critical write-off threshold: CLM-2026-00601, 00602, 00603, 00604. National Insurance and New India Assurance have zero settlement velocity. Recommend IRDAI escalation within 48 hours.',
  'Recovery Forecast':
    'Settlement forecast updated. Next 4 weeks: ₹5.84Cr (Wk22), ₹6.28Cr (Wk23), ₹5.96Cr (Wk24), ₹6.64Cr (Wk25). Total expected: ₹2.47Cr over 30 days. ICICI Lombard and HDFC ERGO lead the pipeline with 96% and 91% probability respectively.',
  'Escalation Priority':
    'Priority escalation list: (1) CLM-2026-00702 — Star Health ICU ₹16.40L, 83d overdue, (2) CLM-2026-00705 — Aditya Birla Oncology ₹18.60L, 105d overdue, (3) CLM-2026-00601 — National Insurance ₹32L, 196d — IRDAI filing recommended. Batch escalation available.',
  'Which claims are closest to write-off?':
    'Closest to write-off: CLM-2026-00603 (224d, ₹19.60L, IRDAI hearing scheduled), CLM-2026-00604 (218d, ₹12L, Star Health), CLM-2026-00602 (209d, ₹12L, Oriental — partial), CLM-2026-00601 (196d, ₹32L, National). Collectively ₹75.6L at risk.',
  'Show all >180 day overdue claims':
    'Found 4 claims aged >180 days totalling ₹11.88Cr outstanding. TPAs: National Insurance (₹3.2Cr), Oriental Insurance (₹1.2Cr balance), New India Assurance (₹1.96Cr), Star Health (₹1.2Cr balance). All have IRDAI-level escalations in progress.',
  'Forecast settlement inflow next month':
    'Next 30-day settlement forecast: ₹2.57Cr total. Breakdown: ICICI Lombard ₹48.2L (98% prob), HDFC ERGO ₹68.4L (91% prob), Bajaj Allianz ₹32.4L (84% prob), Medi Assist ₹41.8L (76% prob). High-risk gap: ₹84.2L from Star Health and New India (combined 55% probability).',
  'default':
    'Analyzing TPA aging portfolio… Based on current data, I recommend: (1) Immediate IRDAI escalation for 4 critical claims >180d, (2) Batch follow-up for 14 claims approaching 90d threshold, (3) Documentation upload for 6 pending claims to avoid further denial risk. Total portfolio at risk: ₹11.88Cr.',
};

const SECTIONS = [
  { id: 'insights',  label: 'AI Insights' },
  { id: 'chat',      label: 'Chat'        },
  { id: 'forecast',  label: 'Forecast'    },
];

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
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-none shadow-md">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div className={`max-w-[88%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`px-3 py-2 rounded-2xl text-[12px] leading-relaxed
          ${isUser
            ? 'bg-amber-500 text-white rounded-tr-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
          }`}>
          {msg.text}
        </div>
        {!isUser && msg.actions && (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {msg.actions.map(a => (
              <button key={a}
                className="px-2 py-0.5 rounded-lg text-[10.5px] font-medium bg-white dark:bg-slate-800
                  border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400
                  hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
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
          {p.name}: {typeof p.value === 'number' ? `₹${p.value}L` : p.value}
        </p>
      ))}
    </div>
  );
};

// Recovery score ring
function RecoveryScoreRing({ score = 73 }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';
  const dash = score * 0.942;
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800/40 mb-3">
      <div className="relative w-16 h-16 flex-none">
        <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3.5"
            strokeDasharray={`${dash} 100`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[14px] font-bold" style={{ color }}>{score}%</span>
        </div>
      </div>
      <div>
        <div className="text-[12px] font-bold text-slate-700 dark:text-slate-200">Portfolio Recovery Score</div>
        <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">AI confidence in full TPA recovery</div>
        <div className="text-[10px] font-bold mt-1" style={{ color }}>
          {score >= 75 ? 'On track' : score >= 50 ? 'At risk' : 'Critical intervention needed'}
        </div>
      </div>
    </div>
  );
}

export default function TARAIPanel({ onClose }) {
  const [section, setSection] = useState('insights');
  const { ask } = useModuleAI('insurance-aging');
  const [messages, setMessages] = useState(AI_INIT_MESSAGES);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', text: text.trim() }]);
    setInput('');
    setThinking(true);
    ask(text.trim()).then(response => {
      setMessages(m => [...m, { role: 'ai', text: response, actions: ['View Claims', 'Bulk Action', 'Export Report'] }]);
    }).finally(() => setThinking(false));
  };

  const forecastData = [
    { week: 'Wk18', actual: 48, forecast: null },
    { week: 'Wk19', actual: 51, forecast: null },
    { week: 'Wk20', actual: 50, forecast: null },
    { week: 'Wk21', actual: 53, forecast: null },
    { week: 'Wk22', actual: null, forecast: 58 },
    { week: 'Wk23', actual: null, forecast: 63 },
    { week: 'Wk24', actual: null, forecast: 60 },
    { week: 'Wk25', actual: null, forecast: 66 },
  ];

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 280 }}
      className="w-80 flex-none flex flex-col h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 overflow-hidden"
    >
      {/* Header */}
      <div className="flex-none px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
              <Sparkles size={13} className="text-white" />
            </div>
            <div>
              <div className="text-[12px] font-bold text-slate-800 dark:text-slate-100">AI Recovery Intelligence</div>
              <div className="flex items-center gap-1 text-[10px] text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live analysis
              </div>
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
                ${section === s.id
                  ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* ── INSIGHTS ── */}
        {section === 'insights' && (
          <div className="p-3 space-y-2.5">
            <RecoveryScoreRing score={73} />

            <div className="flex items-center justify-between mb-1">
              <span className="text-[10.5px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                {TAR_AI_INSIGHTS.length} Active Insights
              </span>
              <button className="text-[10.5px] text-amber-500 hover:text-amber-600 flex items-center gap-1">
                <RefreshCw size={10} /> Refresh
              </button>
            </div>
            {TAR_AI_INSIGHTS.map((insight, i) => (
              <InsightCard key={insight.id} insight={insight} index={i} />
            ))}

            <div className="mt-4">
              <div className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Quick Actions</div>
              <div className="flex flex-col gap-1.5">
                {TAR_AI_PROMPTS.slice(0, 4).map(p => (
                  <button key={p} onClick={() => { setSection('chat'); sendMessage(p); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11.5px] font-medium text-left
                      bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30
                      text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                    <Sparkles size={10} className="flex-none text-amber-400" />
                    {p}
                    <ChevronRight size={10} className="ml-auto text-amber-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CHAT ── */}
        {section === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-3 space-y-3 overflow-y-auto" style={{ minHeight: 0 }}>
              {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
              {thinking && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-none">
                    <Sparkles size={12} className="text-white animate-pulse" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1 items-center">
                      {[0, 1, 2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            <div className="flex-none p-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap gap-1 mb-2">
                {TAR_AI_PROMPTS.slice(4).map(p => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-medium
                      bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300
                      hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                  placeholder="Ask about aging, recovery, TPAs…"
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-[12px]
                    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || thinking}
                  className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 flex items-center justify-center text-white transition-colors"
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── FORECAST ── */}
        {section === 'forecast' && (
          <div className="p-3 space-y-4">
            <div>
              <div className="text-[11px] font-bold text-slate-700 dark:text-slate-200 mb-0.5">Settlement Forecast — 8 Weeks</div>
              <div className="text-[10.5px] text-slate-500 dark:text-slate-400 mb-3">AI prediction based on TPA processing velocity (₹L)</div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={forecastData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                    <defs>
                      <linearGradient id="actualG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="forecastG" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#a78bfa" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}L`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="actual"   name="Actual ₹"   stroke="#f59e0b" fill="url(#actualG)"   strokeWidth={2} connectNulls={false} dot={{ r: 3, fill: '#f59e0b' }} />
                    <Area type="monotone" dataKey="forecast" name="Forecast ₹" stroke="#a78bfa" fill="url(#forecastG)" strokeWidth={2} strokeDasharray="5 3" connectNulls={false} dot={{ r: 3, fill: '#a78bfa' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Expected (30d)',   val: '₹2.57Cr', sub: 'AI forecast',          color: 'text-amber-600 dark:text-amber-400',   icon: TrendingUp   },
                { label: 'Recovery Rate',    val: '87.3%',   sub: 'vs 85.2% target',      color: 'text-emerald-600 dark:text-emerald-400',icon: Shield       },
                { label: 'Write-off Risk',   val: '₹11.88Cr',sub: '4 critical claims',     color: 'text-red-600 dark:text-red-400',        icon: TrendingDown },
                { label: 'Avg Settlement',   val: '34d',     sub: 'Target: 30d',           color: 'text-indigo-600 dark:text-indigo-400',  icon: Clock        },
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
    </motion.div>
  );
}
