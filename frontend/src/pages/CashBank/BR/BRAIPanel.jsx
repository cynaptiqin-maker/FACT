import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, ChevronRight, AlertOctagon, AlertTriangle,
  Info, TrendingUp, ShieldAlert, Clock, X, BarChart3,
} from 'lucide-react';
import { AI_INSIGHTS, AI_RESPONSES, fmtINR } from './BRConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEV_STYLES = {
  critical: { icon: AlertOctagon,  bg: 'bg-red-500/8 dark:bg-red-500/12',     border: 'border-red-200 dark:border-red-500/25',    tag: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',    act: 'text-red-600 dark:text-red-400' },
  high:     { icon: AlertTriangle, bg: 'bg-orange-500/8 dark:bg-orange-500/12',border: 'border-orange-200 dark:border-orange-500/25',tag: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300', act: 'text-orange-600 dark:text-orange-400' },
  warning:  { icon: AlertTriangle, bg: 'bg-amber-500/8 dark:bg-amber-500/12',  border: 'border-amber-200 dark:border-amber-500/25',  tag: 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300',  act: 'text-amber-600 dark:text-amber-400' },
  info:     { icon: Info,          bg: 'bg-blue-500/8 dark:bg-blue-500/12',    border: 'border-blue-200 dark:border-blue-500/25',    tag: 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',    act: 'text-blue-600 dark:text-blue-400' },
};

const TYPE_ICONS = { FRAUD_RISK: ShieldAlert, UNMATCHED: AlertTriangle, SETTLEMENT: Clock, MATCH_SUGGESTION: Sparkles, BANK_CHARGE: BarChart3, LIQUIDITY: TrendingUp };

const QUICK_PROMPTS = [
  'Show unmatched UPI settlements',
  'Delayed insurance settlements',
  'Duplicate transactions',
  'Suspicious activity',
  'Fraud summary',
  'Liquidity forecast',
];

function InsightCard({ ins, index }) {
  const sev = SEV_STYLES[ins.severity] || SEV_STYLES.info;
  const Icon = TYPE_ICONS[ins.type] || Info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-xl border ${sev.border} ${sev.bg} p-3.5 space-y-2`}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${sev.bg} ${sev.border} border`}>
          <Icon className={`w-3.5 h-3.5 ${sev.act}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{ins.title}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0 ${sev.tag}`}>{ins.severity.toUpperCase()}</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{ins.body}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Confidence:</span>
          <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${ins.confidence}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400">{ins.confidence}%</span>
        </div>
        <button className={`text-[11px] font-semibold hover:underline ${sev.act} flex items-center gap-0.5`}>
          {ins.action} <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      {msg.role === 'ai' && (
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
          msg.role === 'user'
            ? 'bg-indigo-500 text-white'
            : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
        }`}
      >
        {msg.text}
      </div>
    </motion.div>
  );
}

export default function BRAIPanel({ onClose }) {
  const [tab, setTab] = useState('insights');
  const { ask } = useModuleAI('bank-reconciliation');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: AI_RESPONSES.default },
  ]);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = (text) => {
    const query = text || input.trim();
    if (!query) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', text: query }]);
    setThinking(true);
    ask(query).then(response => {
      setMessages(m => [...m, { role: 'ai', text: response }]);
    }).finally(() => setThinking(false));
  };

  const TABS = [
    { id: 'insights', label: 'Insights' },
    { id: 'chat',     label: 'AI Chat' },
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 dark:text-white">AI Treasury Assistant</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-500 font-medium">Live analysis · {AI_INSIGHTS.filter(i => i.severity === 'critical' || i.severity === 'high').length} risk alerts</span>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
            {t.id === 'insights' && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold">
                {AI_INSIGHTS.filter(i => i.severity === 'critical' || i.severity === 'high').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {tab === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-3 space-y-2"
            >
              {AI_INSIGHTS.map((ins, i) => (
                <InsightCard key={ins.id} ins={ins} index={i} />
              ))}
            </motion.div>
          )}

          {tab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col"
            >
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                <AnimatePresence>
                  {messages.map((msg, i) => (
                    <ChatMessage key={i} msg={msg} />
                  ))}
                  {thinking && (
                    <motion.div
                      key="thinking"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2"
                    >
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-white animate-pulse" />
                      </div>
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* Quick prompts */}
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="text-[10px] px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors whitespace-nowrap"
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="px-3 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-indigo-300/50 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-500/8 focus-within:border-indigo-400 dark:focus-within:border-indigo-500/60 transition-colors">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Ask about reconciliation…"
                    className="flex-1 bg-transparent text-xs text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || thinking}
                    className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-600 disabled:opacity-40 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
