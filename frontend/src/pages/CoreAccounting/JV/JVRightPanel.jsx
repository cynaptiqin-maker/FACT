import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, Paperclip, Clock, X, Send,
  AlertTriangle, Lightbulb, Info, Upload, FileText,
  ChevronRight, Bot,
} from 'lucide-react';
import clsx from 'clsx';
import { AI_INSIGHTS, AI_PROMPTS, APPROVAL_STEPS, AUDIT_LOG } from './jvConstants';

const TABS = [
  { id: 'ai',       label: 'AI',       icon: Sparkles    },
  { id: 'approval', label: 'Approval', icon: CheckCircle2},
  { id: 'docs',     label: 'Docs',     icon: Paperclip   },
  { id: 'audit',    label: 'Audit',    icon: Clock       },
];

// ── AI Assistant tab ──────────────────────────────────────────────────────────
function AITab({ totalDebit, totalCredit }) {
  const [chat, setChat] = useState([
    {
      role: 'ai',
      text: "Hi! I'm your AI accounting assistant. I can suggest ledger accounts, generate narrations, detect anomalies, and explain posting impacts.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat]);

  const RESPONSES = {
    default: "Based on your journal entry structure, I recommend verifying cost center assignments for all expense lines. For entries above ₹5L, ensure CFO approval is in the workflow. Would you like me to auto-generate a compliance checklist?",
    depreciation: "For depreciation, post: DR 'Depreciation Expense — Medical Equipment' (5210) and CR 'Accumulated Depreciation' (1810). Use the straight-line method. Monthly amount = Asset Cost ÷ Useful Life ÷ 12.",
    accrual: "For ICU revenue accrual: DR 'Accrued Income Receivable' (1120) and CR 'ICU Revenue — Inpatient' (4110). This recognizes revenue in the correct period per accrual accounting.",
    tpa: "TPA adjustment entry: DR 'TPA Receivable' (1130) and CR 'Patient Revenue — Insurance' (4120). Attach the TPA settlement letter as a supporting document.",
    impact: `This entry will impact: P&L — Expense increases by ₹${(totalDebit || 0).toLocaleString('en-IN')}. Balance Sheet — Asset/Liability adjusted accordingly. No direct cash flow impact (non-cash entry).`,
  };

  const getResponse = (q) => {
    const lower = q.toLowerCase();
    if (lower.includes('depreciation')) return RESPONSES.depreciation;
    if (lower.includes('accrual') || lower.includes('icu')) return RESPONSES.accrual;
    if (lower.includes('tpa')) return RESPONSES.tpa;
    if (lower.includes('impact') || lower.includes('p&l')) return RESPONSES.impact;
    return RESPONSES.default;
  };

  const send = (text) => {
    const q = (text || input).trim();
    if (!q) return;
    setChat(c => [...c, { role: 'user', text: q }]);
    setInput('');
    setLoading(true);
    setTimeout(() => {
      setChat(c => [...c, { role: 'ai', text: getResponse(q) }]);
      setLoading(false);
    }, 900);
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Insight cards */}
      <div className="flex-shrink-0 p-3 space-y-2 border-b border-slate-100 max-h-48 overflow-y-auto">
        {AI_INSIGHTS.map(ins => (
          <InsightCard key={ins.id} insight={ins} />
        ))}
      </div>

      {/* Chat */}
      <div ref={chatRef} className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
        {chat.map((msg, i) => (
          <div key={i} className={clsx('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'ai' && (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3 h-3 text-white" />
              </div>
            )}
            <div className={clsx(
              'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
              msg.role === 'user'
                ? 'bg-brand-700 text-white rounded-br-sm'
                : 'bg-slate-100 text-slate-700 rounded-bl-sm',
            )}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div className="bg-slate-100 rounded-xl px-3 py-2 flex gap-1">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="flex-shrink-0 px-3 py-2 border-t border-slate-100 flex flex-wrap gap-1.5">
        {AI_PROMPTS.slice(0, 3).map((p, i) => (
          <button
            key={i}
            onClick={() => send(p)}
            className="text-[10px] px-2 py-1 bg-brand-50 text-brand-700 border border-brand-200 rounded-full hover:bg-brand-100 transition-colors font-medium"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Ask AI assistant…"
            className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || loading}
            className="p-2 bg-brand-700 text-white rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ insight }) {
  const styles = {
    warning:    { bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle, iconColor: 'text-amber-500' },
    suggestion: { bg: 'bg-blue-50 border-blue-200',   icon: Lightbulb,     iconColor: 'text-blue-500'  },
    info:       { bg: 'bg-slate-50 border-slate-200', icon: Info,          iconColor: 'text-slate-400' },
  };
  const s = styles[insight.type] || styles.info;
  return (
    <div className={clsx('rounded-lg p-2.5 border text-xs', s.bg)}>
      <div className="flex items-start gap-2">
        <s.icon className={clsx('w-3.5 h-3.5 flex-shrink-0 mt-0.5', s.iconColor)} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-700">{insight.title}</p>
          <p className="text-slate-500 mt-0.5 text-[11px]">{insight.body}</p>
          <button className="text-brand-600 font-semibold mt-1.5 text-[11px] hover:text-brand-700 flex items-center gap-0.5">
            {insight.action} <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approval tab ──────────────────────────────────────────────────────────────
function ApprovalTab() {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600">Approval Workflow</p>
        <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
          Step 2 of 3
        </span>
      </div>

      <div className="relative">
        {/* Connector line */}
        <div className="absolute left-[15px] top-6 bottom-2 w-px bg-slate-200" />

        {APPROVAL_STEPS.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3 relative mb-5 last:mb-0">
            <div className={clsx(
              'w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold',
              step.status === 'approved'
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                : step.status === 'pending'
                  ? 'bg-amber-400 border-amber-400 text-white shadow-sm ring-2 ring-amber-200'
                  : 'bg-white border-slate-300 text-slate-400',
            )}>
              {step.status === 'approved' ? '✓' : i + 1}
            </div>

            <div className="flex-1 pt-0.5">
              <p className="text-xs font-bold text-slate-700">{step.role}</p>
              <p className="text-[11px] text-slate-500">{step.user}</p>
              {step.status === 'approved' && (
                <p className="text-[10px] text-emerald-600 mt-0.5 font-semibold">✓ Approved at {step.time}</p>
              )}
              {step.status === 'pending' && (
                <div className="mt-1">
                  <p className="text-[10px] text-amber-600 font-semibold">Awaiting approval</p>
                  <button className="mt-1.5 text-[10px] px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md hover:bg-amber-100 transition-colors font-semibold">
                    Send Reminder
                  </button>
                </div>
              )}
              {step.status === 'waiting' && (
                <p className="text-[10px] text-slate-400 mt-0.5">Waiting for previous step</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500 border border-slate-200">
        <p className="font-semibold text-slate-600 mb-1">Add Approval Comment</p>
        <textarea rows={2} placeholder="Optional note for approvers…" className="w-full text-xs bg-white border border-slate-200 rounded-md px-2 py-1.5 resize-none focus:outline-none focus:ring-1 focus:ring-brand-500" />
        <button className="mt-2 text-[11px] font-semibold text-brand-600 hover:text-brand-700">Add Comment →</button>
      </div>
    </div>
  );
}

// ── Documents tab ─────────────────────────────────────────────────────────────
function DocsTab() {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles(f => [...f, ...dropped]);
  };

  return (
    <div className="p-3 space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors',
          dragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 hover:border-brand-300 hover:bg-brand-50/30',
        )}
      >
        <input ref={inputRef} type="file" multiple className="hidden" onChange={e => setFiles(f => [...f, ...Array.from(e.target.files)])} />
        <Upload className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-xs text-slate-500 font-medium">Drop files or click to upload</p>
        <p className="text-[10px] text-slate-400 mt-1">PDF · JPG · PNG · Excel · Max 10MB each</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-brand-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{f.name}</p>
                <p className="text-[10px] text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
              </div>
              <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="p-0.5 text-slate-300 hover:text-red-400 transition-colors">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length === 0 && (
        <p className="text-xs text-slate-400 text-center">No documents attached</p>
      )}
    </div>
  );
}

// ── Audit tab ─────────────────────────────────────────────────────────────────
function AuditTab() {
  const typeStyle = {
    create: 'bg-emerald-100 text-emerald-700',
    edit:   'bg-blue-100 text-blue-700',
    system: 'bg-slate-100 text-slate-500',
  };

  return (
    <div className="p-3">
      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Activity Log</p>
      <div className="relative space-y-0">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-100" />
        {AUDIT_LOG.map((entry) => (
          <div key={entry.id} className="flex items-start gap-3 relative pb-3 last:pb-0">
            <div className={clsx(
              'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 z-10',
              typeStyle[entry.type] || 'bg-slate-100 text-slate-500',
            )}>
              {entry.avatar}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="text-xs text-slate-700">
                <span className="font-semibold">{entry.user}</span> {entry.action}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{entry.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Panel shell ───────────────────────────────────────────────────────────────
export default function JVRightPanel({ onClose, totalDebit, totalCredit }) {
  const [activeTab, setActiveTab] = useState('ai');

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0  }}
      exit={{ opacity: 0, x: 16  }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="w-72 flex-shrink-0 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden"
      style={{ maxHeight: 'calc(100vh - 120px)', position: 'sticky', top: '76px' }}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 flex-shrink-0">
        <div className="flex gap-0.5 bg-slate-100 p-0.5 rounded-lg">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all',
                activeTab === tab.id
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="flex-1 overflow-hidden flex flex-col min-h-0"
          >
            {activeTab === 'ai'       && <AITab totalDebit={totalDebit} totalCredit={totalCredit} />}
            {activeTab === 'approval' && <ApprovalTab />}
            {activeTab === 'docs'     && <DocsTab />}
            {activeTab === 'audit'    && <AuditTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
