import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Brain, TrendingUp, AlertTriangle, Flame, Zap,
  ArrowRight, Send, X, MessageSquare, BarChart2, RefreshCw,
  ChevronDown, ChevronUp, Bot, User,
} from 'lucide-react';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis,
} from 'recharts';
import { AI_INSIGHTS, FORECAST_DATA, PRIORITY_QUEUE } from './AgingConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const URGENCY_META = {
  critical: { icon: Flame,         color: 'text-red-500 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/10',      border: 'border-red-200 dark:border-red-900/40'   },
  warning:  { icon: AlertTriangle, color: 'text-amber-500 dark:text-amber-400',bg: 'bg-amber-50 dark:bg-amber-900/10',  border: 'border-amber-200 dark:border-amber-900/40'},
  high:     { icon: Zap,           color: 'text-orange-500 dark:text-orange-400',bg:'bg-orange-50 dark:bg-orange-900/10',border: 'border-orange-200 dark:border-orange-900/40'},
  info:     { icon: TrendingUp,    color: 'text-blue-500 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-900/10',    border: 'border-blue-200 dark:border-blue-900/40'  },
};

const AI_TABS = [
  { id: 'insights',   label: 'Insights',    icon: Brain       },
  { id: 'chat',       label: 'AI Chat',     icon: MessageSquare },
  { id: 'priority',   label: 'Priority',    icon: Flame       },
];

const SUGGESTED_PROMPTS = [
  'Which accounts are likely to default?',
  'Forecast next 30 days collections',
  'Identify departments with worsening aging',
  'Recommend collector reassignments',
  'Find denied claims with recovery potential',
];

// ── Insights Tab ─────────────────────────────────────────────────────────────
function InsightsTab() {
  const [expanded, setExpanded] = useState('AI-001');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          {AI_INSIGHTS.length} AI Insights
        </span>
        <button className="flex items-center gap-1 text-[10px] text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 transition-colors">
          <RefreshCw size={9} />Refresh
        </button>
      </div>

      {AI_INSIGHTS.map((ins, i) => {
        const meta = URGENCY_META[ins.urgency] ?? URGENCY_META.info;
        const Icon = meta.icon;
        const isOpen = expanded === ins.id;

        return (
          <motion.div
            key={ins.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`rounded-xl border ${meta.border} ${meta.bg} overflow-hidden`}
          >
            <button
              onClick={() => setExpanded(p => p === ins.id ? null : ins.id)}
              className="w-full flex items-start gap-2.5 p-3 text-left"
            >
              <div className={`mt-0.5 flex-none ${meta.color}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[11px] font-semibold leading-tight ${meta.color}`}>{ins.title}</div>
              </div>
              <div className={`flex-none text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                <ChevronDown size={12} />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2.5 border-t border-current/10">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-2">{ins.body}</p>
                    {ins.action && (
                      <button className={`flex items-center gap-1 h-7 px-3 rounded-lg text-[11px] font-semibold border ${meta.border} ${meta.color} hover:opacity-80 transition-opacity`}>
                        {ins.action} <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Forecast mini chart */}
      <div className="mt-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-800">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">12-Week Cash Flow Forecast</div>
          <div className="text-[10px] text-slate-400">AI-predicted collections — ₹ thousands</div>
        </div>
        <div className="p-2">
          <ResponsiveContainer width="100%" height={90}>
            <AreaChart data={FORECAST_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="aifc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" strokeOpacity={0.4} />
              <XAxis dataKey="week" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [`₹${v}K`, 'Expected']}
                contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Area type="monotone" dataKey="expected" stroke="#06b6d4" fill="url(#aifc)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Chat Tab ─────────────────────────────────────────────────────────────────
const MOCK_RESPONSES = {
  default: 'Based on current aging data, I recommend prioritizing 3 critical accounts totalling ₹17.2L. ICU and Oncology show the highest overdue acceleration at +38% and +22% MoM respectively. Would you like a detailed breakdown or action plan?',
  'which accounts are likely to default': 'Based on payment-avoidance signals and aging patterns, accounts REC-006 (Mohammed Irfan, ₹62K, 97d), REC-027 (Oriental Insurance Legacy, ₹84K, 141d), and REC-019 (CGHS ICU Bundle, ₹16.8L, 113d) have the highest default probability. Recommend immediate escalation for REC-006 and resubmission for REC-027.',
  'forecast next 30 days collections': 'AI forecast predicts ₹1.23Cr in collections over the next 30 days (confidence: 74%). Key contributors: HDFC ERGO settlement ₹58L (Week 4), Bajaj Allianz processing ₹42L (Week 2), and patient collections ₹23L from promised-payment queue.',
  'identify departments with worsening aging': 'ICU aging has increased +38% MoM, Oncology +22%, and Neurology +15%. Root causes: ECHS/CGHS pre-auth delays for ICU, chemotherapy billing complexity in Oncology. Recommend dedicated TPA liaison for these departments.',
};

function getChatResponse(msg) {
  const key = Object.keys(MOCK_RESPONSES).find(k => k !== 'default' && msg.toLowerCase().includes(k));
  return MOCK_RESPONSES[key ?? 'default'];
}

function ChatTab({ ask }) {
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I\'m your AR collections intelligence assistant. Ask me anything about aging, risks, forecasts, or collection priorities.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  const send = () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', text: userMsg }]);
    setLoading(true);
    ask(userMsg).then(response => {
      setMessages(m => [...m, { role: 'ai', text: response }]);
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }).finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Suggested prompts */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {SUGGESTED_PROMPTS.slice(0, 3).map((p, i) => (
          <button key={i} onClick={() => { setInput(p); }}
            className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 transition-colors leading-none">
            {p}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto max-h-64 mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-none text-white
              ${m.role === 'ai' ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-slate-500 to-slate-700'}`}>
              {m.role === 'ai' ? <Bot size={12} /> : <User size={10} />}
            </div>
            <div className={`rounded-xl px-3 py-2 max-w-[85%] text-[11px] leading-relaxed
              ${m.role === 'ai'
                ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                : 'bg-blue-600 text-white'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-none">
              <Bot size={12} className="text-white" />
            </div>
            <div className="rounded-xl px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-1">
                {[0,1,2].map(i => (
                  <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask about risks, forecasts, priorities…"
          className="flex-1 h-8 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        />
        <button onClick={send}
          className="h-8 w-8 rounded-xl bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 transition-colors flex-none disabled:opacity-50"
          disabled={!input.trim() || loading}>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Priority Tab ─────────────────────────────────────────────────────────────
const RISK_DOT = {
  CRITICAL: 'bg-red-500',
  HIGH:     'bg-orange-500',
  MEDIUM:   'bg-amber-500',
  LOW:      'bg-emerald-500',
};

function PriorityTab() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Collections Priority Queue</span>
        <span className="text-[10px] text-slate-400">{PRIORITY_QUEUE.length} accounts</span>
      </div>

      {PRIORITY_QUEUE.map((item, i) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors group cursor-pointer"
        >
          {/* Rank */}
          <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-none">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">{item.rank}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
              <div className={`w-2 h-2 rounded-full flex-none mt-1 ${RISK_DOT[item.risk]}`} title={item.risk} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold">
                ₹{item.amount.toLocaleString('en-IN')}
              </span>
              <span className={`text-[9px] font-semibold px-1.5 rounded-full
                ${item.dueIn === 'Overdue' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                {item.dueIn}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.action}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Panel Shell ───────────────────────────────────────────────────────────────
export default function AgingAIPanel({ onClose }) {
  const [tab, setTab] = useState('insights');
  const { ask } = useModuleAI('ar-aging');

  return (
    <div className="h-full flex flex-col border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
      {/* Panel header */}
      <div className="flex-none px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-100">AR Intelligence</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="AI active" />
          </div>
          <button onClick={onClose}
            className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-none flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        {AI_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-[10px] font-semibold border-b-2 transition-colors
              ${tab === t.id
                ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>
            <t.icon size={11} />{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="h-full"
          >
            {tab === 'insights'  && <InsightsTab />}
            {tab === 'chat'      && <ChatTab ask={ask} />}
            {tab === 'priority'  && <PriorityTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer badge */}
      <div className="flex-none px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-400 dark:text-slate-500">
          <Sparkles size={9} className="text-cyan-400" />
          Powered by FACT AI — GPT-4o + real-time AR data
        </div>
      </div>
    </div>
  );
}
