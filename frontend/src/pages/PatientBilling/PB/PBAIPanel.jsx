import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, X, TrendingUp, AlertOctagon, AlertTriangle, TrendingDown,
  ChevronRight, RefreshCw, MessageCircle,
} from 'lucide-react';
import { PB_AI_INSIGHTS, PB_PROMPT_SUGGESTIONS, PB_AI_RESPONSES } from './PBConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const INSIGHT_ICONS = { AlertOctagon, TrendingUp, AlertTriangle, TrendingDown };

const SEV = {
  critical: { border:'border-red-200 dark:border-red-900/50',   bg:'bg-red-50 dark:bg-red-950/20',    dot:'bg-red-500',   text:'text-red-700 dark:text-red-400'   },
  warning:  { border:'border-amber-200 dark:border-amber-900/50',bg:'bg-amber-50 dark:bg-amber-950/20',dot:'bg-amber-500', text:'text-amber-700 dark:text-amber-400'},
  info:     { border:'border-blue-200 dark:border-blue-900/50',  bg:'bg-blue-50 dark:bg-blue-950/20',  dot:'bg-blue-500',  text:'text-blue-700 dark:text-blue-400' },
};

function InsightCard({ insight, idx, onSend }) {
  const Icon = INSIGHT_ICONS[insight.icon] ?? Sparkles;
  const sev  = SEV[insight.severity] ?? SEV.info;
  return (
    <motion.div
      initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}
      transition={{ delay: idx * 0.07, duration: 0.3 }}
      className={`border rounded-xl p-3 ${sev.border} ${sev.bg} cursor-pointer`}
      onClick={() => onSend(insight.title)}
    >
      <div className="flex items-start gap-2.5">
        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-none ${sev.dot}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-[11px] font-semibold mb-1 ${sev.text}`}>{insight.title}</div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">{insight.detail}</p>
          <button className={`mt-1.5 text-[11px] font-semibold flex items-center gap-1 hover:underline ${sev.text}`}>
            {insight.action} <ChevronRight size={10} />
          </button>
        </div>
        <Icon size={14} className={sev.text} />
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
    >
      {msg.role === 'assistant' && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-none shadow-sm">
          <Sparkles size={12} className="text-white" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-relaxed
        ${msg.role === 'user'
          ? 'bg-indigo-600 text-white rounded-tr-sm'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm shadow-sm'}
      `}>
        {msg.text}
      </div>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-none">
        <Sparkles size={12} className="text-white" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function getAIResponse(q) {
  const ql = q.toLowerCase();
  if (ql.includes('leakage'))                     return PB_AI_RESPONSES.leakage;
  if (ql.includes('denied') || ql.includes('denial')) return PB_AI_RESPONSES.denied;
  if (ql.includes('forecast') || ql.includes('predict')) return PB_AI_RESPONSES.forecast;
  if (ql.includes('discount'))                    return PB_AI_RESPONSES.discount;
  if (ql.includes('outstanding') || ql.includes('dues')) return PB_AI_RESPONSES.outstanding;
  if (ql.includes('cashier') || ql.includes('performance')) return PB_AI_RESPONSES.cashier;
  return PB_AI_RESPONSES.default;
}

export default function PBAIPanel({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role:'assistant', text:'👋 Hello! I\'m your AI Revenue Intelligence assistant. I can detect billing leakage, analyze claim risks, forecast collections, and audit billing patterns. How can I help?', ts: Date.now() },
  ]);
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);
  const { ask } = useModuleAI('billing');
  const [activeTab, setActiveTab] = useState('insights');
  const endRef                  = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  function send(text) {
    const msg = text ?? input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role:'user', text: msg, ts: Date.now() }]);
    setInput('');
    setThinking(true);
    ask(msg).then(response => {
      setMessages(m => [...m, { role:'assistant', text: response, ts: Date.now() }]);
    }).finally(() => setThinking(false));
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="ai-panel"
          initial={{ opacity:0, x:32 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:32 }}
          transition={{ type:'spring', damping:28, stiffness:280 }}
          className="flex flex-col w-72 min-w-[288px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-xl h-full"
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 to-violet-600 flex-none">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-none">
              <Sparkles size={15} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-white">AI Revenue Intelligence</p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-indigo-200">Live Analysis</span>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors flex-none">
              <X size={16} />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 flex-none">
            {[
              { id:'insights', icon: AlertOctagon, label:'Insights' },
              { id:'chat',     icon: MessageCircle,label:'Chat'     },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold border-b-2 transition-colors
                    ${activeTab === t.id
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                  <Icon size={12} />{t.label}
                </button>
              );
            })}
          </div>

          {/* Insights tab */}
          {activeTab === 'insights' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide px-1">Live AI Insights</p>
              {PB_AI_INSIGHTS.map((ins, i) => (
                <InsightCard key={ins.id} insight={ins} idx={i} onSend={(t) => { setActiveTab('chat'); send(t); }} />
              ))}
            </div>
          )}

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {messages.map((m, i) => <ChatMessage key={i} msg={m} />)}
                {thinking && <TypingIndicator />}
                <div ref={endRef} />
              </div>

              {/* Quick prompts */}
              <div className="px-3 py-2 border-t border-slate-100 dark:border-slate-800 flex-none">
                <div className="flex flex-wrap gap-1 mb-2">
                  {PB_PROMPT_SUGGESTIONS.map(p => (
                    <button key={p} onClick={() => send(p)}
                      className="px-2 py-1 text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-900/20
                        border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400
                        rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors cursor-pointer">
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                    placeholder="Ask about billing…"
                    className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700
                      rounded-xl px-3 py-2 text-[12px] text-slate-800 dark:text-slate-200 placeholder-slate-400
                      focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  />
                  <button onClick={() => send()} disabled={!input.trim() || thinking}
                    className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl transition-colors flex-none">
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
