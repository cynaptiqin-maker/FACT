import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, X, ChevronRight, Bot, User, RefreshCw,
} from 'lucide-react';
import { useModuleAI } from '@hooks/useModuleAI';

const SEV = {
  critical: { bg: 'bg-red-50 dark:bg-red-900/10',    border: 'border-red-200 dark:border-red-800/40',    text: 'text-red-700 dark:text-red-400'    },
  warning:  { bg: 'bg-amber-50 dark:bg-amber-900/10', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400' },
  info:     { bg: 'bg-orange-50 dark:bg-orange-900/10',border:'border-orange-200 dark:border-orange-800/40',text: 'text-orange-700 dark:text-orange-400'},
};

const FALLBACK_INSIGHTS = [
  { title: 'GSTR-1 Apr 2026 due in 10 days', detail: 'Estimated output tax: ₹34.19L based on invoice data. 3 HSN codes not yet validated. File before May 11.', severity: 'critical', action: 'File Now' },
  { title: 'ITC utilisation at 53.9%', detail: 'Available ITC ₹34.2L, utilised ₹18.4L. Consider reversing unclaimed credits for Oct–Dec 2025 before deadline.', severity: 'warning', action: 'Optimise ITC' },
  { title: 'HSN 9993 — healthcare GST-exempt', detail: 'Medical services under HSN 9993 (₹2.18Cr) are exempt. Segregate from taxable supplies before GSTR-1 upload.', severity: 'info', action: 'Review Mapping' },
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

export default function TaxAIPanel({ onClose }) {
  const [tab, setTab] = useState('insights');
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your Tax AI assistant. I can check GST filing compliance, compute TDS liabilities, validate ITC claims, flag late filings, and prepare return summaries. How can I help?" },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const { insights: liveInsights, suggestedPrompts, ask } = useModuleAI('taxation');
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
      initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
      className="flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-white" />
          <span className="text-sm font-bold text-white">GST AI Assistant</span>
          <span className="text-[9px] font-bold text-amber-100 bg-white/20 px-1.5 py-0.5 rounded-full">LIVE</span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded text-white/70 hover:text-white transition-colors"><RefreshCw size={12} /></button>
          <button onClick={onClose} className="p-1 rounded text-white/70 hover:text-white transition-colors"><X size={14} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 flex-none">
        {[{ id: 'insights', label: 'Insights' }, { id: 'chat', label: 'AI Chat' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-[10px] font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-amber-500 text-amber-700 dark:text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
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
                <div className="flex gap-1 flex-wrap mb-3">
                  {suggestedPrompts.slice(0, 3).map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="text-[10px] px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors whitespace-nowrap">
                      {p}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5 mb-3 max-h-64 overflow-y-auto">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex items-start gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-none mt-0.5 ${m.role === 'assistant' ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-slate-100 dark:bg-slate-700'}`}>
                        {m.role === 'assistant' ? <Bot size={10} className="text-amber-600 dark:text-amber-400" /> : <User size={10} className="text-slate-500" />}
                      </div>
                      <div className={`max-w-[82%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                        m.role === 'user' ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm'
                      }`} style={{ whiteSpace: 'pre-line' }}>{m.text}</div>
                    </div>
                  ))}
                  {thinking && (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-none">
                        <Bot size={10} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex gap-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                        {[0, 1, 2].map(i => (
                          <motion.span key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                            className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={endRef} />
                </div>

                <div className="flex gap-1.5">
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
                    placeholder="Ask about GST, TDS, ITC…"
                    className="flex-1 px-3 py-2 text-[11px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30" />
                  <button onClick={() => send()} disabled={!input.trim()}
                    className="px-3 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-200 dark:disabled:bg-amber-900 text-white rounded-xl transition-all">
                    <Send size={13} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex-none px-3 py-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Sparkles size={8} className="text-amber-400" />
          Powered by FACT AI · Tax Compliance Engine
        </p>
      </div>
    </motion.div>
  );
}
