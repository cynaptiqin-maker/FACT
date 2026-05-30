import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, AlertTriangle, RefreshCw, Copy, TrendingDown,
  Shield, X, ChevronRight, Bot, User, Loader2,
  CheckCircle2, ArrowRight, Zap, BrainCircuit,
} from 'lucide-react';
import clsx from 'clsx';
import { AI_INSIGHTS, AI_PROMPTS, fmtCurrency } from './glConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEVERITY_STYLES = {
  critical: { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   dot: 'bg-rose-500',   badge: 'bg-rose-100 text-rose-700'   },
  high:     { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
  medium:   { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500',  badge: 'bg-amber-100 text-amber-700'  },
  low:      { bg: 'bg-blue-50',   border: 'border-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700'    },
};

const ICON_MAP = {
  AlertTriangle, RefreshCw, Copy, TrendingDown, Shield,
};

// ─── AI conversation mock responses ────────────────────────────────────────────
const AI_RESPONSES = {
  default: (q) => `Analyzing "${q}"…\n\nBased on the current ledger data, I've identified relevant entries and patterns. Here's what I found:\n\n**Key findings:**\n• 3 entries match your query criteria\n• Net financial impact: ₹2.4L\n• 1 entry flagged for manual review\n\nWould you like me to drill down further or export these results?`,
  'Why did ICU revenue spike on May 17?': `**ICU Revenue Spike — May 17, 2026**\n\nAnalysis complete. The spike of ₹18.4L (340% above 30-day average) is attributable to:\n\n1. **8 cardiac procedures** posted in a single batch (OT Revenue account)\n2. **Special package billing** for 3 CABG cases — ₹6.2L total\n3. **Delayed posting** of April procedures finally cleared — ₹5.1L\n\n**Risk assessment:** LOW — all entries have valid source documents attached.\n\nRecommendation: The spike is legitimate. Consider flagging for CFO review as a one-time item in MIS reports.`,
  'Find unreconciled insurance entries': `**Unreconciled Insurance Entries**\n\nFound **23 unreconciled TPA entries** across 3 insurers:\n\n| Insurer | Count | Amount |\n|---------|-------|--------|\n| Star Health | 11 | ₹3.8L |\n| United Health | 8 | ₹1.6L |\n| Mediassist | 4 | ₹0.8L |\n\n**Oldest entry:** 47 days (United Health — needs escalation)\n\n**Recommended action:** Run auto-reconciliation for Star Health entries — 94% confidence match found. Manual review needed for United Health.`,
};

function InsightCard({ insight, index }) {
  const [dismissed, setDismissed] = useState(false);
  const sty = SEVERITY_STYLES[insight.severity] || SEVERITY_STYLES.low;
  const Ic  = ICON_MAP[insight.icon] || AlertTriangle;

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className={clsx('rounded-xl border p-3 relative', sty.bg, sty.border)}
    >
      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 opacity-40 hover:opacity-80 transition-opacity"
      >
        <X className="w-3 h-3" />
      </button>

      <div className="flex items-start gap-2.5 pr-4">
        {/* Icon */}
        <div className={clsx(
          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
          sty.bg, 'border', sty.border,
        )}>
          <Ic className={clsx('w-3.5 h-3.5', sty.text)} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Severity badge + title */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={clsx(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide',
              sty.badge,
            )}>
              <span className={clsx('w-1.5 h-1.5 rounded-full', sty.dot)} />
              {insight.severity}
            </span>
            <span className="text-[10px] text-slate-400">{insight.type}</span>
          </div>

          <p className={clsx('text-xs font-semibold mb-1', sty.text)}>{insight.title}</p>
          <p className="text-[11px] text-slate-600 leading-relaxed">{insight.body}</p>

          {insight.amount && (
            <p className="text-[11px] font-mono font-semibold text-slate-700 mt-1.5">
              {insight.amount < 0 ? '-' : ''}{fmtCurrency(Math.abs(insight.amount), true)}
            </p>
          )}

          {/* Action */}
          <button className={clsx(
            'mt-2 flex items-center gap-1 text-[11px] font-semibold transition-colors',
            sty.text, 'hover:opacity-80',
          )}>
            {insight.actionLabel} <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] flex items-end gap-2">
          <div className="bg-brand-800 text-pearl-100 rounded-2xl rounded-br-md px-3 py-2 text-xs leading-relaxed">
            {msg.content}
          </div>
          <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <User className="w-3.5 h-3.5 text-brand-700" />
          </div>
        </div>
      </div>
    );
  }

  // Format AI response (basic markdown)
  const lines = msg.content.split('\n');
  return (
    <div className="flex justify-start">
      <div className="max-w-[92%] flex items-start gap-2">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500
          flex items-center justify-center flex-shrink-0 mt-1">
          <BrainCircuit className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-3 py-2 text-xs
          leading-relaxed text-slate-700 space-y-1">
          {lines.map((line, i) => {
            if (!line) return <br key={i} />;
            if (line.startsWith('**') && line.endsWith('**')) {
              return <p key={i} className="font-semibold text-slate-800">{line.slice(2, -2)}</p>;
            }
            if (line.startsWith('|')) {
              return <p key={i} className="font-mono text-[10px] text-slate-600">{line}</p>;
            }
            if (line.startsWith('•') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.')) {
              return <p key={i} className="pl-2">{line}</p>;
            }
            return <p key={i}>{line}</p>;
          })}
          <p className="text-[10px] text-slate-400 mt-1">{msg.ts}</p>
        </div>
      </div>
    </div>
  );
}

export default function GLAIPanel({ onClose }) {
  const [view,     setView]     = useState('insights'); // 'insights' | 'chat'
  const { ask } = useModuleAI('gl');
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI accounting assistant. I\'ve analyzed the current ledger and found 5 items that need your attention. Ask me anything about your GL data.',
      ts: '09:00 AM',
    },
  ]);
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, thinking]);

  function sendMessage(text) {
    const q = text || input.trim();
    if (!q) return;
    setInput('');
    setView('chat');
    setMessages(p => [...p, { role: 'user', content: q, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setThinking(true);
    ask(q).then(response => {
      setMessages(p => [...p, { role: 'assistant', content: response, ts: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    }).finally(() => setThinking(false));
  }

  const criticalCount = AI_INSIGHTS.filter(i => i.severity === 'critical').length;

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200" style={{ width: 380 }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500
            flex items-center justify-center shadow-sm">
            <BrainCircuit className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">AI Accounting Assistant</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-emerald-600 font-medium">Active · Monitoring GL</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center
          hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── View toggle ──────────────────────────────────────────────────────── */}
      <div className="flex border-b border-slate-100 flex-shrink-0">
        <button
          onClick={() => setView('insights')}
          className={clsx(
            'flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5',
            view === 'insights'
              ? 'border-violet-500 text-violet-700 bg-violet-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          <Zap className="w-3.5 h-3.5" />
          Insights
          {criticalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500 text-white">
              {criticalCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setView('chat')}
          className={clsx(
            'flex-1 py-2.5 text-xs font-semibold transition-all border-b-2 flex items-center justify-center gap-1.5',
            view === 'chat'
              ? 'border-violet-500 text-violet-700 bg-violet-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          <Bot className="w-3.5 h-3.5" />
          Chat
          {messages.length > 1 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-100 text-violet-700">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {view === 'insights' ? (
            <motion.div
              key="insights"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-3 space-y-2"
            >
              {/* Summary bar */}
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-violet-600/10 to-cyan-500/5
                rounded-xl border border-violet-100 mb-3">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <div>
                  <p className="text-xs font-semibold text-violet-800">
                    {AI_INSIGHTS.length} insights detected
                  </p>
                  <p className="text-[10px] text-violet-600/70">
                    {criticalCount} critical · {AI_INSIGHTS.filter(i => i.severity === 'high').length} high priority
                  </p>
                </div>
              </div>

              <AnimatePresence>
                {AI_INSIGHTS.map((ins, i) => (
                  <InsightCard key={ins.id} insight={ins} index={i} />
                ))}
              </AnimatePresence>

              {/* Quick ask prompts */}
              <div className="pt-3 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Quick Ask</p>
                <div className="space-y-1">
                  {AI_PROMPTS.slice(0, 4).map(p => (
                    <button
                      key={p}
                      onClick={() => sendMessage(p)}
                      className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg
                        text-xs text-slate-600 hover:bg-violet-50 hover:text-violet-700 transition-colors group"
                    >
                      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-violet-500 flex-shrink-0" />
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto p-3 space-y-3"
              ref={chatRef}
            >
              {messages.map((m, i) => (
                <ChatMessage key={i} msg={m} />
              ))}

              {thinking && (
                <div className="flex items-center gap-2 pl-8">
                  <div className="flex gap-1 p-2.5 bg-slate-50 rounded-2xl">
                    {[0, 1, 2].map(i => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400"
                        animate={{ scale: [1, 1.4, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Input ──────────────────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-slate-100 flex-shrink-0">
        {/* Quick prompts row */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto pb-1">
          {AI_PROMPTS.slice(0, 3).map(p => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="flex-shrink-0 px-2.5 py-1 text-[10px] font-medium bg-violet-50
                text-violet-700 border border-violet-200 rounded-full hover:bg-violet-100 transition-colors"
            >
              {p.length > 28 ? p.slice(0, 28) + '…' : p}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask about any GL entry or trend…"
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50
              focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-100
              placeholder:text-slate-400 transition-all"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || thinking}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white
              flex items-center justify-center shadow-sm hover:shadow-md transition-all
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {thinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
