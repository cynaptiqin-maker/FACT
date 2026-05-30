import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Send, AlertTriangle, Clock,
  ShieldAlert, TrendingUp, ChevronRight,
} from 'lucide-react';
import { AI_INSIGHTS, AI_QUICK_PROMPTS } from './jvlConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEVERITY_CONFIG = {
  high:   { cls: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10',   icon: ShieldAlert, iconCls: 'text-red-500 dark:text-red-400',    badge: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300' },
  medium: { cls: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10', icon: AlertTriangle, iconCls: 'text-amber-500 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300' },
  low:    { cls: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10',  icon: TrendingUp,    iconCls: 'text-blue-500 dark:text-blue-400',   badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300' },
};

const TYPE_LABELS = {
  anomaly: 'Anomaly',
  duplicate: 'Duplicate Risk',
  delay: 'SLA Breach',
  risk: 'Audit Risk',
  recon: 'Reconciliation',
};

const MOCK_RESPONSES = {
  'Show unapproved ICU adjustments': 'I found **6 unapproved ICU adjustments** in the current period:\n\n- JV-2025-05006 (₹48,750) — OT consumables, pending L1 since 2 days\n- JV-2025-05012 (₹67,500) — Ventilator rental, in draft\n\nWould you like me to filter the grid to show these?',
  'Find pharmacy journals above ₹5 lakh': 'Located **1 pharmacy journal** exceeding ₹5,00,000:\n\n- **JV-2025-05005** — Retail counter revenue recognition, ₹6,21,400, posted and approved.\n\nNo anomalies detected in this entry.',
  'Detect duplicate postings this month': 'Detected **2 potential duplicate patterns**:\n\n1. ICU accrual entries on May 13–15 share identical narration and amounts\n2. TPA adjustment entries have near-identical amounts across branches\n\nRecommend cross-checking with source module before posting.',
  default: 'Analyzing your query against the current journal dataset... I\'ll check posting patterns, approval states, and flag any anomalies relevant to your question.',
};

export default function JVLAIPanel({ filters, onClose }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const { ask } = useModuleAI('journal-voucher');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    const q = text || query.trim();
    if (!q) return;
    setQuery('');
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsTyping(true);
    ask(q).then(response => {
      setMessages((prev) => [...prev, { role: 'ai', text: response }]);
    }).finally(() => setIsTyping(false));
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="w-[400px] flex-shrink-0 border-l border-gray-200 dark:border-[#1e3045] bg-white dark:bg-[#162030] flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white">AI Accounting Assistant</p>
            <p className="text-[10px] text-violet-500 dark:text-violet-400 font-medium">Powered by FinOS Intelligence</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* Insights */}
        {messages.length === 0 && (
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
              Live Insights — {AI_INSIGHTS.length} findings
            </p>
            <div className="space-y-2.5">
              {AI_INSIGHTS.map((insight) => {
                const cfg = SEVERITY_CONFIG[insight.severity];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: insight.id * 0.07 }}
                    className={`rounded-xl border p-3 ${cfg.cls}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${cfg.iconCls}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cfg.badge}`}>
                            {TYPE_LABELS[insight.type]}
                          </span>
                          <span className={`text-[10px] font-semibold uppercase ${cfg.iconCls}`}>{insight.severity}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-0.5">{insight.title}</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">{insight.body}</p>
                        {insight.action && (
                          <button className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#1C3741] dark:text-sky-300 hover:underline">
                            {insight.action} <ChevronRight className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick prompts */}
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mt-5 mb-2">Quick Analysis</p>
            <div className="flex flex-wrap gap-1.5">
              {AI_QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => sendMessage(p)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-violet-200 dark:border-violet-800 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Conversation */}
        {messages.length > 0 && (
          <div className="px-5 pt-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 mr-2">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
                <div className={[
                  'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-[#1C3741] text-white rounded-tr-sm'
                    : 'bg-gray-50 dark:bg-[#1a2840] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-sm',
                ].join(' ')}>
                  {msg.text.split('\n').map((line, i) => (
                    <span key={i}>
                      {line.replace(/\*\*(.*?)\*\*/g, (_, m) => m)}
                      {i < msg.text.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
                <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#1a2840] border border-gray-200 dark:border-gray-700 px-3.5 py-2.5 rounded-2xl rounded-tl-sm">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
                    />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-5 py-3 border-t border-gray-100 dark:border-gray-800">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {AI_QUICK_PROMPTS.slice(0, 3).map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium border border-violet-200 dark:border-violet-800 text-violet-500 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors truncate max-w-[150px]"
              >
                {p}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a2840] rounded-xl border border-gray-200 dark:border-gray-700 px-3 py-2 focus-within:border-violet-300 dark:focus-within:border-violet-700 focus-within:ring-1 focus-within:ring-violet-200 dark:focus-within:ring-violet-800 transition-all">
          <Sparkles className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about journals, anomalies, approvals…"
            className="flex-1 bg-transparent text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!query.trim() && !isTyping}
            className="p-1 rounded-lg text-violet-500 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300 disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
          AI analysis is advisory — always verify before action
        </p>
      </div>
    </motion.div>
  );
}
