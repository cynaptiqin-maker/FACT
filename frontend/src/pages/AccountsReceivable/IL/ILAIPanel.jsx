import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, AlertOctagon, AlertTriangle, TrendingUp, Copy, RotateCcw } from 'lucide-react';
import { IL_AI_INSIGHTS, IL_AI_PROMPTS } from './ILConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEVERITY_CFG = {
  critical: { bg: 'bg-rose-50 dark:bg-rose-900/20',   border: 'border-rose-200 dark:border-rose-800',   icon: 'text-rose-500',   badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400',   label: 'Critical' },
  warning:  { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400', label: 'Warning'  },
  info:     { bg: 'bg-sky-50 dark:bg-sky-900/20',     border: 'border-sky-200 dark:border-sky-800',     icon: 'text-sky-500',   badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400',         label: 'Insight'  },
};

const ICON_MAP = { AlertOctagon, AlertTriangle, TrendingUp, Sparkles, Copy };

const MOCK_RESPONSES = {
  'overdue': 'Found **7 invoices** overdue by more than 30 days, totalling **₹19.7L**:\n\n• INV-2026-00881 — SRL Diagnostics — ₹1.7L (12d)\n• INV-2026-00874 — Mohammed Irfan — ₹56.3K (16d)\n• INV-2026-00843 — Lakshmi Devi — ₹1.3L (30d)\n\nRecommendation: Send automated reminders and flag 3 accounts for legal review.',
  'gst':     'GST Summary for May 2026:\n\n• **18% slab** — ₹8.2L taxable → ₹1.48L tax\n• **12% slab** — ₹4.1L taxable → ₹49.2K tax\n• **5% slab**  — ₹1.8L taxable → ₹9.0K tax\n\nTotal GST Liability: **₹2.06Cr**\n⚠ 3 East Block invoices have IGST applied instead of CGST+SGST. Requires correction before GSTR-1 filing.',
  'default': "I've analysed the invoice data and identified **3 key actions**:\n\n1. 7 overdue invoices (>30d) worth ₹19.7L need follow-up\n2. GST mismatch on 3 East Block invoices — fix before GSTR-1\n3. Collection efficiency at 67.8% — 4.2% below benchmark\n\nShall I generate a detailed report?",
};

function InsightCard({ insight, index }) {
  const cfg  = SEVERITY_CFG[insight.severity] ?? SEVERITY_CFG.info;
  const Icon = ICON_MAP[insight.icon] ?? Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.3 }}
      className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border}`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-none mt-0.5 ${cfg.bg}`}>
          <Icon size={13} className={cfg.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
          </div>
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">{insight.title}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{insight.detail}</p>
          <button className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
            {insight.action} →
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-none mt-0.5">
          <Sparkles size={11} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
        isUser
          ? 'bg-indigo-600 text-white rounded-br-sm'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm'
      }`}>
        {msg.content.split('\n').map((line, i) => (
          <span key={i}>
            {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
              part.startsWith('**') && part.endsWith('**')
                ? <strong key={j}>{part.slice(2, -2)}</strong>
                : part
            )}
            {i < msg.content.split('\n').length - 1 && <br />}
          </span>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start gap-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-none">
        <Sparkles size={11} className="text-white" />
      </div>
      <div className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.12 }}
              className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ILAIPanel({ onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Invoice Intelligence assistant. I can analyse your invoice data, flag risks, forecast collections, and help with GST compliance. What would you like to know?' },
  ]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const { ask } = useModuleAI('ar-invoices');
  const [view, setView]       = useState('insights'); // 'insights' | 'chat'
  const messagesEndRef         = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    setView('chat');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setTyping(true);
    ask(q).then(response => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }).finally(() => setTyping(false));
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 340, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 250 }}
      className="flex-none overflow-hidden"
    >
      <div className="w-[340px] h-full flex flex-col bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-800">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-none bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Invoice AI</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full font-semibold">LIVE</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setView(v => v === 'insights' ? 'chat' : 'insights')}
              className="h-7 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              {view === 'insights' ? 'Chat' : 'Insights'}
            </button>
            {view === 'chat' && messages.length > 1 && (
              <button onClick={() => setMessages(prev => [prev[0]])}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">
                <RotateCcw size={13} />
              </button>
            )}
            <button onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <AnimatePresence mode="wait">
            {view === 'insights' ? (
              <motion.div key="insights" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">AI-detected issues and opportunities:</p>
                {IL_AI_INSIGHTS.map((ins, i) => (
                  <InsightCard key={ins.id} insight={ins} index={i} />
                ))}
              </motion.div>
            ) : (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
                {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                {typing && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* prompt suggestions */}
        {view === 'chat' && messages.length < 3 && (
          <div className="px-4 pb-2">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-1.5">
              {IL_AI_PROMPTS.slice(0, 4).map(p => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="text-[11px] px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* chat input */}
        {view === 'chat' && (
          <div className="px-4 pb-4 pt-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-none">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask about invoices, GST, overdue…"
                className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:border-indigo-400 dark:focus:border-indigo-500 transition-colors"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim()}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-600 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 hover:bg-indigo-700 transition-colors flex-none"
              >
                <Send size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
