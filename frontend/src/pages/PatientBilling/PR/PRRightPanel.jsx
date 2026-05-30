import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Shield, Landmark, GitBranch, Send } from 'lucide-react';
import { AI_PROMPTS, AI_RESPONSES, AI_INIT_MSG, WORKFLOW_STEPS, fmtINR } from './PRConstants';

// ─── Tab config ───────────────────────────────────────────────────────────────
const TABS = [
  { id:'ai',       label:'AI',       Icon: Sparkles  },
  { id:'risk',     label:'Risk',     Icon: Shield    },
  { id:'treasury', label:'Treasury', Icon: Landmark  },
  { id:'workflow', label:'Workflow', Icon: GitBranch },
];

// ─── AI Panel ─────────────────────────────────────────────────────────────────
function AiPanel({ fraudAlerts }) {
  const [messages, setMessages] = useState([AI_INIT_MSG]);
  const [input, setInput]       = useState('');
  const [typing, setTyping]     = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = AI_RESPONSES[text] ?? `I'm analyzing: **"${text}"**\n\nBased on current billing patterns, I'll run a deep analysis and surface relevant insights. One moment…`;
      setMessages(m => [...m, { role: 'assistant', text: reply }]);
      setTyping(false);
    }, 700 + Math.random() * 800);
  };

  const renderText = (text) =>
    text.split('\n').map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-slate-800 dark:text-slate-200">{line.slice(2,-2)}</p>;
      if (line.startsWith('> '))  return <p key={i} className="border-l-2 border-emerald-400 pl-2 text-emerald-700 dark:text-emerald-300 italic text-[10.5px] my-1">{line.slice(2)}</p>;
      if (line.startsWith('- '))  return <p key={i} className="flex gap-1 text-[11px]"><span className="text-slate-400 mt-0.5">•</span><span>{renderBold(line.slice(2))}</span></p>;
      if (line.startsWith('|'))   return null;
      return <p key={i} className="text-[11.5px]">{renderBold(line)}</p>;
    });

  const renderBold = (t) =>
    t.split(/\*\*(.*?)\*\*/g).map((p, i) =>
      i % 2 === 1
        ? <strong key={i} className="font-semibold text-slate-800 dark:text-slate-200">{p}</strong>
        : p
    );

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-none
              ${msg.role === 'assistant' ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' : 'bg-slate-700 text-white'}`}>
              {msg.role === 'assistant' ? '✦' : 'U'}
            </div>
            <div className={`rounded-2xl px-3 py-2 text-[11.5px] leading-relaxed max-w-[86%] space-y-0.5
              ${msg.role === 'assistant'
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                : 'bg-emerald-500 text-white'
              }`}>
              {renderText(msg.text)}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-[10px] text-white flex-none">✦</div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl px-3 py-2.5 flex gap-1 items-center">
              {[0,1,2].map(d => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: `${d*0.12}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 py-2 flex flex-wrap gap-1.5 border-t border-slate-100 dark:border-slate-800">
        {AI_PROMPTS.slice(0, 6).map(p => (
          <button key={p} onClick={() => send(p)}
            className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300
              text-[10px] font-semibold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors">
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <input
          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700
            bg-white dark:bg-slate-800 text-[12px] text-slate-700 dark:text-slate-300
            placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 transition-all"
          placeholder="Ask the AI assistant…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send(input)}
        />
        <button onClick={() => send(input)}
          className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Risk Panel ───────────────────────────────────────────────────────────────
function RiskPanel({ fraudAlerts }) {
  const SEV = {
    HIGH:   'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-300',
    MEDIUM: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300',
    LOW:    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/40 text-blue-600 dark:text-blue-300',
  };
  const dot = { HIGH:'bg-red-500', MEDIUM:'bg-amber-500', LOW:'bg-blue-400' };

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Live Risk Monitor</p>

      {fraudAlerts.map((a, i) => (
        <div key={i} className={`border rounded-xl px-3 py-2.5 text-[11px] ${SEV[a.severity] ?? SEV.LOW}`}>
          <div className="flex items-center gap-2 font-semibold mb-1">
            <span className={`w-2 h-2 rounded-full flex-none ${dot[a.severity] ?? dot.LOW}`} />
            <span className="flex-1">{a.title}</span>
            <span className="opacity-60 font-mono text-[10px]">{a.score}</span>
          </div>
          <p className="opacity-80 leading-relaxed">{a.detail}</p>
        </div>
      ))}

      {/* Cashier summary */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Counter 2 — Today</p>
        {[
          ['Receipts processed',  '16'],
          ['Total collected',      fmtINR(342000)],
          ['Unauthorized discounts','0'],
          ['Reversals',           '0'],
          ['Risk score',          '9 / 100 ✓'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[11px] py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <span className="text-slate-400">{k}</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-3">
        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">Compliance</p>
        <p className="text-[11px] text-amber-600 dark:text-amber-400 leading-relaxed">
          Cash &gt; ₹50,000 requires Form 60/61. Receipts &gt; ₹2L require PAN verification at counter.
        </p>
      </div>
    </div>
  );
}

// ─── Treasury Panel ───────────────────────────────────────────────────────────
function TreasuryPanel() {
  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Treasury Impact</p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label:'Cash in Hand',    value:'₹1,84,200', color:'text-emerald-600' },
          { label:'Bank Balance',    value:'₹42,38,500',color:'text-blue-600'   },
          { label:'Gateway Pending', value:'₹59,500',   color:'text-amber-600'  },
          { label:'Cleared Today',   value:'₹4,21,000', color:'text-teal-600'   },
        ].map(item => (
          <div key={item.label} className="p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-[9.5px] text-slate-400 uppercase tracking-wide">{item.label}</p>
            <p className={`text-[14px] font-bold tabular-nums mt-0.5 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Bank Mapping</p>
        {[
          ['Cash Counter',  'Cash Vault → HDFC 0012'],
          ['UPI / Card',    'Razorpay → ICICI 5289'],
          ['Insurance TPA', 'TPA Pool → SBI 7734'  ],
          ['Corporate',     'Corp. Credit → Axis 3341'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[11px] py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <span className="text-slate-400">{k}</span>
            <span className="font-mono font-semibold text-teal-600 dark:text-teal-400 text-[10.5px]">{v}</span>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Reconciliation Status</p>
        {[
          ['Cash',      'Reconciled',       'text-emerald-600'],
          ['UPI / Card','Gateway Pending',  'text-amber-600'  ],
          ['Cheque',    'Bank Pending 3d',  'text-amber-600'  ],
          ['Insurance', 'TPA Pending 5–7d', 'text-violet-600' ],
        ].map(([m, s, c]) => (
          <div key={m} className="flex justify-between text-[11px] py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <span className="text-slate-400">{m}</span>
            <span className={`font-semibold ${c}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Workflow Panel ───────────────────────────────────────────────────────────
function WorkflowPanel({ receiptStatus }) {
  const DONE_STATES = ['DRAFT','SUBMITTED','APPROVED','ALLOCATED','GL_POSTED','RECONCILED','CLOSED'];
  const doneIdx = DONE_STATES.indexOf(receiptStatus);

  return (
    <div className="p-4 space-y-3 overflow-y-auto h-full">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Receipt Lifecycle</p>

      <div className="space-y-1">
        {WORKFLOW_STEPS.map((step, i) => {
          const isDone    = i < doneIdx;
          const isCurrent = DONE_STATES[doneIdx] === step.id;
          return (
            <div key={step.id}
              className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl transition-colors
                ${isCurrent ? 'bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800/30' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-none mt-0.5
                ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                {isDone ? '✓' : i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11.5px] font-semibold ${isCurrent ? 'text-emerald-700 dark:text-emerald-300' : isDone ? 'text-slate-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-slate-400">{step.desc}</p>
              </div>
              {isCurrent && (
                <span className="text-[9.5px] font-bold text-emerald-500 animate-pulse mt-0.5">● Active</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">SLA Tracking</p>
        {[
          ['Approval SLA',    '4h',   'text-amber-600',   '< 2h remaining' ],
          ['GL Posting',      'Auto', 'text-slate-400',   'On approval'    ],
          ['Reconciliation',  '24h',  'text-blue-600',    'T+1 expected'   ],
        ].map(([k, v, c, sub]) => (
          <div key={k} className="py-1.5 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">{k}</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">{v}</span>
            </div>
            <p className={`text-[10px] ${c}`}>{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Right Panel ─────────────────────────────────────────────────────────
export default function PRRightPanel({ onClose, fraudAlerts, receiptStatus }) {
  const [tab, setTab] = useState('ai');

  return (
    <div className="w-[340px] h-full flex flex-col bg-white dark:bg-slate-900
      border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-none">
        <p className="text-[11px] font-bold text-slate-500">Collections Intelligence</p>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
          <X size={15} />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 flex-none">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-semibold border-b-2 transition-colors
              ${tab === id ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }} className="h-full">
            {tab === 'ai'       && <AiPanel fraudAlerts={fraudAlerts} />}
            {tab === 'risk'     && <RiskPanel fraudAlerts={fraudAlerts} />}
            {tab === 'treasury' && <TreasuryPanel />}
            {tab === 'workflow' && <WorkflowPanel receiptStatus={receiptStatus} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
