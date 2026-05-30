import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, X, Send, AlertTriangle, Info, AlertCircle,
  TrendingUp, RefreshCw, ThumbsUp, ThumbsDown, Copy, ChevronRight,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import {
  AI_INSIGHTS, AI_MESSAGES_INIT, AI_PROMPTS, COLLECTION_TREND, fmtINR,
} from './PIConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEVERITY_CFG = {
  critical: { icon: AlertCircle,  bg: 'bg-red-50 dark:bg-red-900/10',     border: 'border-red-200 dark:border-red-800/40',   text: 'text-red-700 dark:text-red-400',   badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'   },
  warning:  { icon: AlertTriangle,bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40',text: 'text-amber-700 dark:text-amber-400',badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  info:     { icon: Info,         bg: 'bg-blue-50 dark:bg-blue-900/10',   border: 'border-blue-200 dark:border-blue-800/40',  text: 'text-blue-700 dark:text-blue-400',  badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'   },
};

function AIInsightCard({ insight, index }) {
  const cfg = SEVERITY_CFG[insight.severity] ?? SEVERITY_CFG.info;
  const Icon = cfg.icon;
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className={`p-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon size={14} className={`${cfg.text} flex-none mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[12px] font-bold leading-tight ${cfg.text}`}>{insight.title}</p>
          <p className="text-[11.5px] text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">{insight.detail}</p>
          <button className={`mt-2 flex items-center gap-1 text-[11px] font-semibold ${cfg.text} hover:opacity-80 transition-opacity`}>
            {insight.action}
            <ChevronRight size={10} />
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
      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-none">
          <Sparkles size={13} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-3.5 py-2.5 rounded-2xl text-[12.5px] leading-relaxed
          ${isUser
            ? 'bg-rose-500 text-white rounded-tr-sm'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-sm border border-slate-200 dark:border-slate-700'
          }`}>
          {msg.text}
        </div>
        {!isUser && msg.actions && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {msg.actions.map(a => (
              <button key={a}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-800
                  border border-rose-200 dark:border-rose-700/40 text-rose-600 dark:text-rose-400
                  hover:bg-rose-50 dark:hover:bg-rose-900/15 transition-colors">
                {a}
              </button>
            ))}
          </div>
        )}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            <button className="text-slate-300 hover:text-emerald-500 transition-colors"><ThumbsUp size={11} /></button>
            <button className="text-slate-300 hover:text-red-400 transition-colors"><ThumbsDown size={11} /></button>
            <button className="text-slate-300 hover:text-slate-500 transition-colors"><Copy size={11} /></button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-lg text-[11px]">
      <p className="font-bold text-slate-600 dark:text-slate-300 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: ₹{p.value}L
        </p>
      ))}
    </div>
  );
};

export default function PIAIPanel({ onClose }) {
  const [messages, setMessages] = useState(AI_MESSAGES_INIT);
  const [input, setInput]       = useState('');
  const [thinking, setThinking] = useState(false);
  const { ask } = useModuleAI('billing-invoices');
  const [activeSection, setActiveSection] = useState('insights');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim(), ts: Date.now() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setThinking(true);
    ask(text.trim()).then(response => {
      setMessages(m => [...m, { role: 'assistant', text: response, ts: Date.now() }]);
    }).finally(() => setThinking(false));
  };

  const sections = [
    { id:'insights', label:'Insights' },
    { id:'chat',     label:'Chat'     },
    { id:'forecast', label:'Forecast' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-none
        bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/10 dark:to-pink-900/10">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-none">
          <Sparkles size={15} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">AI Revenue Intelligence</p>
          <p className="text-[10.5px] text-slate-500 dark:text-slate-400">Real-time billing analytics & predictions</p>
        </div>
        <div className="flex items-center gap-1">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold ml-1">Live</span>
        </div>
        {onClose && (
          <button onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 flex-none">
        {sections.map(s => (
          <button key={s.id} onClick={() => setActiveSection(s.id)}
            className={`flex-1 py-2 text-[11.5px] font-semibold border-b-2 transition-colors
              ${activeSection === s.id
                ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ── Insights ── */}
        {activeSection === 'insights' && (
          <div className="p-3 space-y-2.5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide">
                {AI_INSIGHTS.filter(x => x.severity === 'critical').length} Critical · {AI_INSIGHTS.filter(x => x.severity === 'warning').length} Warning · {AI_INSIGHTS.filter(x => x.severity === 'info').length} Info
              </p>
              <button className="text-[10.5px] text-rose-500 font-semibold hover:opacity-70 flex items-center gap-1">
                <RefreshCw size={10} />
                Refresh
              </button>
            </div>
            {AI_INSIGHTS.map((insight, i) => (
              <AIInsightCard key={insight.id} insight={insight} index={i} />
            ))}
          </div>
        )}

        {/* ── Chat ── */}
        {activeSection === 'chat' && (
          <div className="flex flex-col h-full">
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {thinking && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center flex-none">
                    <Sparkles size={13} className="text-white" />
                  </div>
                  <div className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.div key={i}
                          className="w-1.5 h-1.5 rounded-full bg-rose-400"
                          animate={{ y: ['0%', '-40%', '0%'] }}
                          transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            <div className="px-3 pt-2 pb-1 border-t border-slate-100 dark:border-slate-800">
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {AI_PROMPTS.slice(0, 4).map(p => (
                  <button key={p} onClick={() => sendMessage(p)}
                    className="flex-none px-2.5 py-1.5 rounded-lg text-[10.5px] font-medium whitespace-nowrap
                      bg-rose-50 dark:bg-rose-900/15 text-rose-600 dark:text-rose-400
                      border border-rose-200 dark:border-rose-700/40 hover:bg-rose-100 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="flex gap-2 p-3 border-t border-slate-200 dark:border-slate-700">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
                placeholder="Ask about revenue, claims, leakage..."
                className="flex-1 px-3 py-2 rounded-xl text-[12px] border border-slate-200 dark:border-slate-700
                  bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200
                  placeholder-slate-400 outline-none focus:border-rose-400 transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || thinking}
                className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-40
                  disabled:cursor-not-allowed transition-colors flex-none"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Forecast ── */}
        {activeSection === 'forecast' && (
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label:'This Week',  value:'₹18.4L', trend:'+12%', ok:true  },
                { label:'This Month', value:'₹74.8L', trend:'+9%',  ok:true  },
                { label:'Outstanding',value:'₹24.2L', trend:'Aging',ok:false },
                { label:'TPA Pending',value:'₹18.6L', trend:'38d',  ok:false },
              ].map(({ label, value, trend, ok }) => (
                <div key={label}
                  className={`p-3 rounded-xl border ${ok ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">{label}</p>
                  <p className={`text-[15px] font-bold ${ok ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'}`}>{value}</p>
                  <p className={`text-[10.5px] font-semibold mt-0.5 ${ok ? 'text-emerald-600' : 'text-amber-600 dark:text-amber-400'}`}>{trend}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">6-Month Collection Trend (₹L)</p>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={COLLECTION_TREND} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={18} stroke="#f43f5e" strokeDasharray="4 4" strokeOpacity={0.7} />
                  <Line dataKey="collected"   name="Collected"   stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line dataKey="invoiced"    name="Invoiced"    stroke="#f43f5e" strokeWidth={2} dot={false} strokeDasharray="4 4" />
                  <Line dataKey="outstanding" name="Outstanding" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">AI Collection Confidence</p>
              {[
                { label:'ICU Collections',      pct:82, color:'#10b981' },
                { label:'Insurance Settlements', pct:68, color:'#6366f1' },
                { label:'OPD Collections',       pct:91, color:'#0284c7' },
                { label:'Corporate Billing',     pct:74, color:'#f59e0b' },
              ].map(({ label, pct, color }) => (
                <div key={label} className="flex items-center gap-2.5 mb-2">
                  <span className="text-[11px] text-slate-500 w-36 flex-none truncate">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="h-full rounded-full"
                      style={{ background: color }}
                    />
                  </div>
                  <span className="text-[11px] font-bold w-8 text-right" style={{ color }}>{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
