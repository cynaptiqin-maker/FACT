import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, X, TrendingDown, TrendingUp, AlertOctagon, AlertTriangle,
  ShieldAlert, ChevronRight, RefreshCw, Zap, BarChart2, MessageCircle, Lightbulb,
} from 'lucide-react';
import { CB_AI_INSIGHTS, CB_PROMPT_SUGGESTIONS, CB_AI_RESPONSES, CASH_FLOW_FORECAST } from './CBConstants';
import { useModuleAI } from '@hooks/useModuleAI';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend } from 'recharts';

const INSIGHT_ICONS = { AlertOctagon, TrendingDown, AlertTriangle, TrendingUp, ShieldAlert };

const SEVERITY_STYLES = {
  critical: { border: 'border-red-200 dark:border-red-900/50',    bg: 'bg-red-50 dark:bg-red-950/20',     dot: 'bg-red-500',    label: 'text-red-700 dark:text-red-400'    },
  warning:  { border: 'border-amber-200 dark:border-amber-900/50', bg: 'bg-amber-50 dark:bg-amber-950/20', dot: 'bg-amber-500',  label: 'text-amber-700 dark:text-amber-400' },
  info:     { border: 'border-blue-200 dark:border-blue-900/50',   bg: 'bg-blue-50 dark:bg-blue-950/20',   dot: 'bg-blue-500',   label: 'text-blue-700 dark:text-blue-400'   },
};

function InsightCard({ insight, idx }) {
  const Icon = INSIGHT_ICONS[insight.icon] ?? Sparkles;
  const sev  = SEVERITY_STYLES[insight.severity] ?? SEVERITY_STYLES.info;
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.3 }}
      className={`border rounded-xl p-3 ${sev.border} ${sev.bg}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-none ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold mb-1 ${sev.label}`}>{insight.title}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{insight.detail}</p>
          <button className={`mt-2 text-[11px] font-semibold flex items-center gap-1 hover:underline ${sev.label}`}>
            {insight.action} <ChevronRight size={10} />
          </button>
        </div>
        <Icon size={14} className={sev.label} />
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
    >
      {msg.role === 'assistant' && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-none">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed
        ${msg.role === 'user'
          ? 'bg-teal-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm'
        }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

function CashFlowForecast() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={13} className="text-teal-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Weekly Cash Forecast</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-semibold">AI</span>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <BarChart data={CASH_FLOW_FORECAST} margin={{ top: 2, right: 2, bottom: 2, left: -24 }}>
          <XAxis dataKey="day" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="L" />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }}
            formatter={(v, name) => v != null ? [`₹${v}L`, name] : ['Forecast', name]}
          />
          <defs>
            <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0d9488" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0d9488" stopOpacity={0.2} />
            </linearGradient>
          </defs>
          <Bar dataKey="inflow"  name="Inflow"  fill="url(#tealGrad)" radius={[3,3,0,0]} maxBarSize={14} />
          <Bar dataKey="outflow" name="Outflow" fill="#ef4444" opacity={0.6} radius={[3,3,0,0]} maxBarSize={14} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-3 mt-1 text-[10px]">
        <div className="flex items-center gap-1 text-teal-600 dark:text-teal-400">
          <div className="w-6 h-2 rounded-sm bg-teal-500" />Inflow
        </div>
        <div className="flex items-center gap-1 text-red-500">
          <div className="w-6 h-2 rounded-sm bg-red-400 opacity-70" />Outflow
        </div>
        <span className="text-slate-400 ml-auto">* Forecast</span>
      </div>
    </div>
  );
}

export default function CBAIPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Cash Treasury Intelligence Assistant. I can detect anomalies, forecast liquidity, identify unreconciled entries, monitor counter risk, and analyze daily cash flow. What would you like to analyze?' },
  ]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [activeTab, setActiveTab] = useState('insights');
  const { insights: liveInsights, ask } = useModuleAI('cash-bank');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    setLoading(true);
    try {
      const response = await ask(msg);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-50">Treasury AI</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400">Live analysis · 6 risk alerts</span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 flex-none">
        {[
          { id: 'insights', label: 'Insights',  icon: Lightbulb     },
          { id: 'chat',     label: 'AI Chat',   icon: MessageCircle },
          { id: 'forecast', label: 'Forecast',  icon: TrendingUp    },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-b-2 transition-colors
              ${activeTab === t.id
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <t.icon size={11} />{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* Insights tab */}
          {activeTab === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">Cash Risk Insights</span>
                <button className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-teal-500 transition-colors">
                  <RefreshCw size={10} />Refresh
                </button>
              </div>
              {(liveInsights.length > 0 ? liveInsights : CB_AI_INSIGHTS).map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} idx={i} />
              ))}
            </motion.div>
          )}

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center flex-none">
                      <Sparkles size={12} className="text-white animate-spin" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3 py-2">
                      <div className="flex items-center gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-teal-400 rounded-full"
                            animate={{ y: [-2, 2, -2] }} transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-3 pb-2">
                <div className="text-[10px] text-slate-400 dark:text-slate-600 mb-1.5">Quick prompts:</div>
                <div className="flex flex-wrap gap-1.5">
                  {CB_PROMPT_SUGGESTIONS.slice(0, 4).map((p, i) => (
                    <button key={i} onClick={() => handleSend(p)}
                      className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-400 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about cash, counters, risk…"
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-teal-400 dark:focus:border-teal-600 placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Send size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {/* Forecast tab */}
          {activeTab === 'forecast' && (
            <motion.div key="forecast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-3">
              <CashFlowForecast />

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Zap size={13} className="text-teal-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tomorrow's Cash Forecast</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'OP Collections (est.)',  amount: 5200000, confidence: 91 },
                    { label: 'IP Advances (3 planned)',amount: 1800000, confidence: 84 },
                    { label: 'Pharmacy Cash Sales',    amount: 1400000, confidence: 78 },
                    { label: 'Payments Due',           amount: 3100000, confidence: 88 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                            ₹{(item.amount / 100000).toFixed(1)}L
                          </span>
                          <span className={`text-[10px] font-medium ${item.confidence >= 85 ? 'text-emerald-500' : item.confidence >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {item.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.confidence}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                          className={`h-full rounded-full ${item.confidence >= 85 ? 'bg-emerald-400' : item.confidence >= 70 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Net Projected Position</span>
                  <span className="text-sm font-bold font-mono text-teal-600 dark:text-teal-400">+₹53.0L</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-teal-950 rounded-xl p-3 text-white">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} className="text-teal-400" />
                  <span className="text-xs font-semibold">AI Liquidity Recommendation</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Maintain minimum ₹8L float across all counters. Transfer ₹4L from Main Hospital to North Wing by 8 AM (low float risk). Counter-03 shortage trend — assign senior cashier for tomorrow's morning shift.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
