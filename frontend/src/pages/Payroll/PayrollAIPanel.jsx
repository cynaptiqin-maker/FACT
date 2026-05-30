import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, X, ChevronRight, Bot, User,
  AlertTriangle, TrendingUp, Info, RefreshCw,
} from 'lucide-react';
import { useModuleAI } from '@hooks/useModuleAI';

const SEV = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/10',    border: 'border-red-200 dark:border-red-800/40',    text: 'text-red-700 dark:text-red-400'    },
  warning:  { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400' },
  info:     { bg: 'bg-indigo-50 dark:bg-indigo-900/10',border:'border-indigo-200 dark:border-indigo-800/40',text: 'text-indigo-700 dark:text-indigo-400'},
};

const FALLBACK_INSIGHTS = [
  { title: '6 payroll runs pending approval', detail: 'Awaiting CFO sign-off for May 2026 cycle. Total gross liability: ₹38.42L. SLA breach in 2 hours.', severity: 'warning', action: 'Review & Approve' },
  { title: 'TDS slab mismatch — 2 employees', detail: 'Employees EMP-0241 and EMP-0318 have outdated Form 16 declarations. Deduction may be incorrect.', severity: 'critical', action: 'Fix Now' },
  { title: 'PF/ESI projections on track', detail: 'Employer PF ₹11.48L and ESI ₹5.92L computed correctly. Challan filing due June 15, 2026.', severity: 'info', action: 'View Challan' },
];

function InsightCard({ insight, index }) {
  const s = SEV[insight.severity?.toLowerCase()] ?? SEV.info;
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.25 }}
      className={`p-3 rounded-xl border ${s.bg} ${s.border}`}
    >
      <p className={`text-[11px] font-bold mb-1 ${s.text}`}>{insight.title}</p>
      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
        {insight.detail || insight.body}
      </p>
      {insight.action && (
        <button className={`flex items-center gap-1 text-[10px] font-semibold ${s.text} hover:opacity-80`}>
          {insight.action} <ChevronRight size={10} />
        </button>
      )}
    </motion.div>
  );
}

export default function PayrollAIPanel({ onClose }) {
  const [tab, setTab] = useState('insights');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your Payroll AI assistant. I can analyse salary anomalies, flag PF/ESI/TDS issues, forecast payroll liability, and review compliance. How can I help?" },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const { insights: liveInsights, suggestedPrompts, ask } = useModuleAI('payroll');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setThinking(true);
    ask(msg).then(response => {
      setMessages(m => [...m, { role: 'assistant', text: response }]);
    }).finally(() => setThinking(false));
  };

  const insights = liveInsights.length > 0 ? liveInsights : FALLBACK_INSIGHTS;

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className="flex-none flex flex-col border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Payroll AI</span>
          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">LIVE</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><RefreshCw size={12} /></button>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><X size={13} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 flex-none">
        {[{ id: 'insights', label: 'Insights' }, { id: 'chat', label: 'AI Chat' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[10px] font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-indigo-500 text-indigo-700 dark:text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}>
            {tab === 'insights' && (
              <div className="space-y-2.5">
                {insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
              </div>
            )}

            {tab === 'chat' && (
              <div className="flex flex-col h-full">
                {/* Quick prompts */}
                <div className="flex gap-1 flex-wrap mb-3">
                  {suggestedPrompts.slice(0, 3).map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="text-[10px] px-2 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors whitespace-nowrap">
                      {p}
                    </button>
                  ))}
                </div>

                {/* Messages */}
                <div className="space-y-2.5 mb-3 max-h-64 overflow-y-auto">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-none mt-0.5 ${m.role === 'assistant' ? 'bg-indigo-100 dark:bg-indigo-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {m.role === 'assistant' ? <Bot size={10} className="text-indigo-600 dark:text-indigo-400" /> : <User size={10} className="text-slate-500" />}
                      </div>
                      <div className={`max-w-[82%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                        m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                      }`} style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-none">
                        <Bot size={10} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex gap-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl rounded-tl-sm">
                        {[0, 1, 2].map(i => (
                          <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                {/* Input */}
                <div className="flex gap-1.5">
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Ask about payroll, PF, TDS…"
                    className="flex-1 px-3 py-2 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30" />
                  <button onClick={() => send()} disabled={!input.trim()}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white rounded-xl transition-all">
                    <Send size={13} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-none px-3 py-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Sparkles size={8} className="text-indigo-400" />
          Powered by FACT AI · Payroll Intelligence Engine
        </p>
      </div>
    </motion.div>
  );
}
