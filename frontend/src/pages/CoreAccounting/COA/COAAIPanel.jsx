import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Sparkles, Send, Loader2, AlertTriangle,
  CheckCircle, Info, Lightbulb, RefreshCw, Copy,
  BookOpen, TrendingUp, GitMerge, FileSearch,
} from 'lucide-react';
import clsx from 'clsx';
import { AI_PROMPTS, AI_INSIGHT_EXAMPLES } from './coaConstants';
import { useModuleAI } from '@hooks/useModuleAI';

// Insight card component
function InsightCard({ insight }) {
  const config = {
    warning: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-600' },
    info: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', iconColor: 'text-blue-600' },
    success: { icon: CheckCircle, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', iconColor: 'text-emerald-600' },
    idea: { icon: Lightbulb, bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-800', iconColor: 'text-violet-600' },
  };
  const c = config[insight.type] || config.info;
  const Icon = c.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx('rounded-xl border p-3.5 space-y-2', c.bg, c.border)}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={clsx('w-4 h-4 flex-shrink-0 mt-0.5', c.iconColor)} />
        <div className="flex-1 min-w-0">
          <p className={clsx('text-xs font-semibold', c.text)}>{insight.title}</p>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{insight.body}</p>
        </div>
      </div>
      {insight.action && (
        <button className="ml-6.5 text-xs font-medium text-blue-600 hover:underline">
          {insight.action} →
        </button>
      )}
    </motion.div>
  );
}

// Chat message bubble
function ChatMessage({ message }) {
  const isAI = message.role === 'assistant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={clsx('flex gap-2.5', isAI ? 'justify-start' : 'justify-end')}
    >
      {isAI && (
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={clsx(
        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed',
        isAI
          ? 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
          : 'bg-blue-600 text-white rounded-tr-sm',
      )}>
        {message.content}
        {message.loading && (
          <span className="inline-flex gap-1 ml-1">
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
      {!isAI && (
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-bold text-slate-600">
          U
        </div>
      )}
    </motion.div>
  );
}

const QUICK_ACTIONS = [
  { icon: FileSearch, label: 'Find unmapped accounts', prompt: 'Find all unmapped expense ledgers' },
  { icon: GitMerge, label: 'Detect duplicates', prompt: 'Detect duplicate ledger accounts' },
  { icon: TrendingUp, label: 'Optimize structure', prompt: 'Suggest optimizations for account hierarchy' },
  { icon: BookOpen, label: 'Healthcare mappings', prompt: 'Recommend healthcare module mappings for this COA' },
];

const INITIAL_MESSAGES = [
  {
    id: 0,
    role: 'assistant',
    content: "Hi! I'm your FinOS AI assistant. I can help you optimize your Chart of Accounts, detect issues, suggest mappings, and answer financial structure questions. What would you like to explore?",
  },
];

export default function COAAIPanel({ onClose, accountCount, onSearchSuggestion }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const { ask } = useModuleAI('coa');
  const [activeView, setActiveView] = useState('insights'); // 'insights' | 'chat'
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const simulateAIResponse = (userMsg) => {
    const responses = {
      default: "I've analyzed your Chart of Accounts structure. I found 3 accounts that might benefit from better categorization, and 2 potential duplicate ledgers. Would you like me to show you the details?",
      unmapped: `I found **12 unmapped expense ledgers** in your COA. The most critical ones are in the Pharmacy and ICU departments. Here's what I recommend:\n\n• Map "Drug Expenses" → Pharmacy dept\n• Map "ICU Consumables" → ICU dept\n• Map "Lab Reagents" → Laboratory dept\n\nThis will fix cost-centre reporting gaps.`,
      duplicate: "I detected **2 potential duplicate accounts**: 'Consultation Income' (3110) and 'Consultation Revenue' (3115). These appear to track the same revenue type. I recommend merging them into a single ledger.",
      optimize: "Your account hierarchy looks mostly healthy! I suggest:\n\n✅ Move 3 pharmacy accounts under a 'Pharmacy Revenue' group\n✅ Create a 'TPA Receivables' group for all insurance accounts\n⚠️ 'Miscellaneous Income' should be split into specific categories",
      healthcare: "For a hospital COA, I recommend these key account groups:\n\n📋 Revenue: OPD Consultations, IPD Charges, OT Revenue, Lab Income, Pharmacy Sales\n💰 Receivables: Patient AR, TPA/Insurance AR, Corporate AR\n💸 Expenses: Medical Consumables, Doctor Fees, Nursing Costs, Admin Overheads",
    };

    const lower = userMsg.toLowerCase();
    if (lower.includes('unmapped')) return responses.unmapped;
    if (lower.includes('duplicate')) return responses.duplicate;
    if (lower.includes('optim') || lower.includes('structur')) return responses.optimize;
    if (lower.includes('healthcare') || lower.includes('hospital') || lower.includes('mapping')) return responses.healthcare;
    return responses.default;
  };

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText) return;

    setInput('');
    setActiveView('chat');
    setMessages((prev) => [...prev, { id: Date.now(), role: 'user', content: userText }]);
    setIsThinking(true);

    const thinkingId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: thinkingId, role: 'assistant', content: '', loading: true }]);

    const content = await ask(userText);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === thinkingId ? { ...m, content, loading: false } : m
      )
    );
    setIsThinking(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="w-full flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 bg-gradient-to-r from-violet-50 to-cyan-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">FinOS AI</p>
            <p className="text-[10px] text-slate-400">Accounting Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Active
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View switcher */}
      <div className="flex border-b border-slate-200">
        {[
          { id: 'insights', label: 'Insights' },
          { id: 'chat', label: 'Ask AI' },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setActiveView(v.id)}
            className={clsx(
              'flex-1 py-2.5 text-xs font-semibold transition-colors border-b-2',
              activeView === v.id
                ? 'border-violet-600 text-violet-700 bg-violet-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'insights' ? (
          <div className="p-4 space-y-4">
            {/* Auto insights */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Auto-detected insights ({accountCount} accounts)
              </p>
              <div className="space-y-2.5">
                {AI_INSIGHT_EXAMPLES.map((ins, i) => (
                  <InsightCard key={i} insight={ins} />
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
                Quick Actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map((qa) => (
                  <button
                    key={qa.label}
                    onClick={() => { setActiveView('chat'); sendMessage(qa.prompt); }}
                    className="flex flex-col items-start gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-violet-300 hover:bg-violet-50/30 transition-all text-left group"
                  >
                    <qa.icon className="w-4 h-4 text-slate-400 group-hover:text-violet-600 transition-colors" />
                    <span className="text-[11px] font-medium text-slate-600 group-hover:text-violet-700 leading-tight">
                      {qa.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Prompt suggestions */}
            {messages.length <= 1 && (
              <div className="px-4 pb-2">
                <p className="text-[10px] text-slate-400 mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-1.5">
                  {AI_PROMPTS.slice(0, 4).map((p) => (
                    <button
                      key={p.text}
                      onClick={() => sendMessage(p.text)}
                      className="text-[11px] text-slate-600 bg-slate-100 hover:bg-violet-100 hover:text-violet-700 border border-slate-200 hover:border-violet-300 px-2.5 py-1.5 rounded-lg transition-all"
                    >
                      {p.icon} {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar (always visible in chat mode) */}
      {activeView === 'chat' && (
        <div className="border-t border-slate-200 p-3 bg-white">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your accounts…"
              rows={1}
              className="flex-1 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none resize-none leading-relaxed"
              style={{ minHeight: '20px', maxHeight: '80px' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isThinking}
              className={clsx(
                'flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all',
                input.trim() && !isThinking
                  ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-sm'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed',
              )}
            >
              {isThinking
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Send className="w-3.5 h-3.5" />
              }
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 text-center">
            AI responses are advisory. Always verify before acting.
          </p>
        </div>
      )}
    </motion.div>
  );
}
