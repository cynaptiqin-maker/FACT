import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, X, TrendingDown, AlertOctagon, AlertTriangle,
  TrendingUp, ShieldAlert, ChevronRight, RefreshCw, Zap,
  BarChart2, MessageCircle, Lightbulb,
} from 'lucide-react';
import { AP_AI_INSIGHTS, AP_PROMPT_SUGGESTIONS, CASH_OUTFLOW_FORECAST } from './APConstants';
import { useModuleAI } from '@hooks/useModuleAI';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area } from 'recharts';

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
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-none">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed
        ${msg.role === 'user'
          ? 'bg-amber-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm'
        }`}>
        {msg.content}
      </div>
    </motion.div>
  );
}

function CashOutflowForecast() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={13} className="text-amber-500" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cash Outflow Forecast</span>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-semibold">AI</span>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={CASH_OUTFLOW_FORECAST} margin={{ top: 2, right: 2, bottom: 2, left: -24 }}>
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: 'none', borderRadius: 8, fontSize: 11, color: '#e2e8f0' }}
            formatter={v => v ? [`₹${v.toLocaleString()}K`, ''] : ['Projected', '']}
          />
          <defs>
            <linearGradient id="ambGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="scheduled" name="Scheduled" stroke="#e2e8f0" strokeWidth={1.5} fill="none" strokeDasharray="4 2" dot={false} />
          <Area type="monotone" dataKey="actual"    name="Actual"    stroke="#f59e0b" strokeWidth={2}   fill="url(#ambGrad)" dot={{ r: 3, fill: '#f59e0b' }} connectNulls={false} />
          <ReferenceLine x="May" stroke="#f97316" strokeDasharray="3 3" label={{ value: 'Now', fill: '#f97316', fontSize: 10 }} />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <div className="w-6 h-0.5 rounded" style={{ borderTop: '1.5px dashed #cbd5e1' }} />Scheduled
        </div>
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
          <div className="w-6 h-0.5 bg-amber-500 rounded" />Actual / Forecast
        </div>
      </div>
    </div>
  );
}

const AI_RESPONSES = {
  'Find duplicate vendor invoices this month': 'AI analysis of invoice data reveals 3 potential duplicate pairs:\n\n• VIN-2026-00342 & VIN-2026-00298 (Apollo Diagnostics) — same amount ₹1.78L, 18-day gap\n• VIN-2026-00281 is flagged as split billing — same vendor, 3 invoices below ₹2L threshold\n\nCombined fraud exposure: ₹5.76L. Recommend immediate review before payment.',
  'Which overdue payments carry supply risk?': '4 overdue payables pose critical supply chain risk:\n\n1. KIMS Biomedical (91d, ₹5.8L) — equipment maintenance stopped\n2. Abbott Diagnostics (84d, ₹4.2L) — reagent supply threatened\n3. Dr. Reddy\'s Labs (73d, ₹9.24L) — pharma supply at risk\n4. 3M Healthcare (58d, ₹2.64L) — OT consumables pending\n\nEstimated operational impact if not cleared: ₹18.4L/day disruption.',
  default: 'I\'ve analysed the current payables portfolio. Total outstanding: ₹14.86Cr across 20 active invoices. 6 payables (₹7.46Cr) are overdue — immediate attention required. 4 high-risk fraud alerts are open. Recommend clearing critical vendor payments within 48 hours to avoid supply disruption.',
};

export default function APAIPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AP Intelligence Assistant. I can detect duplicate invoices, identify fraud risks, forecast cash outflows, prioritise payments, and analyse vendor risk. What would you like to analyse?' },
  ]);
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [activeTab,  setActiveTab]  = useState('insights');
  const { insights: liveInsights, ask } = useModuleAI('ap');
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
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-50">AP Intelligence</div>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-slate-400">Live analysis · 7 risk alerts</span>
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 flex-none">
        {[
          { id: 'insights', label: 'Insights',    icon: Lightbulb     },
          { id: 'chat',     label: 'AI Chat',     icon: MessageCircle },
          { id: 'forecast', label: 'Forecast',    icon: TrendingDown  },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium border-b-2 transition-colors
              ${activeTab === t.id
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            <t.icon size={11} />{t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">

          {activeTab === 'insights' && (
            <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide">AP Risk Insights</span>
                <button className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-amber-500 transition-colors">
                  <RefreshCw size={10} />Refresh
                </button>
              </div>
              {(liveInsights.length > 0 ? liveInsights : AP_AI_INSIGHTS).map((insight, i) => (
                <InsightCard key={insight.id} insight={insight} idx={i} />
              ))}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full">
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                {loading && (
                  <div className="flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center flex-none">
                      <Sparkles size={12} className="text-white animate-spin" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3 py-2">
                      <div className="flex items-center gap-1">
                        {[0,1,2].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 bg-amber-400 rounded-full"
                            animate={{ y: [-2,2,-2] }} transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Prompt suggestions */}
              <div className="px-3 pb-2">
                <div className="text-[10px] text-slate-400 dark:text-slate-600 mb-1.5">Quick prompts:</div>
                <div className="flex flex-wrap gap-1.5">
                  {AP_PROMPT_SUGGESTIONS.slice(0, 4).map((p, i) => (
                    <button key={i} onClick={() => handleSend(p)}
                      className="text-[11px] px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-400 transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-slate-200 dark:border-slate-800 p-3 flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about payables, risks, vendors…"
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-300 outline-none focus:border-amber-400 dark:focus:border-amber-600 placeholder:text-slate-400"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Send size={13} />
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'forecast' && (
            <motion.div key="forecast" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 space-y-3">
              <CashOutflowForecast />

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-3">
                  <Zap size={13} className="text-amber-500" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">May Outflow Forecast</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Critical Overdue (clear now)',  amount: 7460000, confidence: 95 },
                    { label: 'Scheduled Batch Payments',      amount: 2895000, confidence: 88 },
                    { label: 'Procurement Liabilities',       amount: 4820000, confidence: 72 },
                    { label: 'Disputed / On Hold',            amount: 6030000, confidence: 45 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-semibold text-slate-800 dark:text-slate-200">
                            ₹{(item.amount/100000).toFixed(1)}L
                          </span>
                          <span className={`text-[10px] font-medium ${item.confidence >= 80 ? 'text-emerald-500' : item.confidence >= 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {item.confidence}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${item.confidence}%` }}
                          transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
                          className={`h-full rounded-full ${item.confidence >= 80 ? 'bg-emerald-400' : item.confidence >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">May Outflow (Projected)</span>
                  <span className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400">₹21.2Cr</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-amber-950 rounded-xl p-3 text-white">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles size={12} className="text-amber-400" />
                  <span className="text-xs font-semibold">AI Payment Recommendation</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Prioritise clearing KIMS Biomedical, Abbott Diagnostics, and Dr. Reddy's (₹19.4L combined) immediately to restore vendor services. Schedule remaining overdue in the 22 May batch. This avoids ₹18.4L/day operational disruption cost.
                </p>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
