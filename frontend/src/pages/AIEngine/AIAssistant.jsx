// ─── AI Financial Assistant — Enterprise Intelligence Chat Workspace ────────────
// Violet/Purple theme · GPT-4o · Real-time chat · Insights panel
import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Bot, User, ChevronDown, RefreshCw,
  AlertTriangle, TrendingUp, TrendingDown, Info, Zap,
  BarChart2, DollarSign, Clock, CheckCircle, XCircle,
  Lightbulb, Target, Shield, Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_MESSAGES = [
  {
    id: 'm1', role: 'user', ts: '10:31 AM',
    text: 'What is our current cash position across all accounts?',
  },
  {
    id: 'm2', role: 'ai', ts: '10:31 AM',
    text: `**Cash Position Summary — as of today**\n\nYour consolidated cash position stands at **₹4.82 Crore** across 6 active bank accounts.\n\n• **HDFC Current A/c (Primary):** ₹2.14 Cr ↑ 8.3% WoW\n• **SBI OD Account:** ₹0.87 Cr (limit: ₹1.5 Cr utilised 58%)\n• **ICICI Escrow (Insurance):** ₹1.21 Cr (restricted)\n• **Petty Cash Pools (3 branches):** ₹0.60 Cr\n\n**Key Alerts:**\n- SBI OD utilisation is trending up — review by Friday\n- ₹38L cheques issued pending clearance (2–3 days)\n- Projected shortfall of ₹12L on 28 May based on payroll run\n\n*Confidence: 97% — data sourced from Cash Book as of 10:28 AM today.*`,
  },
];

const QUICK_PROMPTS = [
  { id: 'q1', label: 'Show me aging summary', icon: Clock },
  { id: 'q2', label: 'Flag overdue invoices', icon: AlertTriangle },
  { id: 'q3', label: 'Summarize P&L', icon: BarChart2 },
  { id: 'q4', label: 'Detect anomalies', icon: Zap },
];

const AI_RESPONSES = {
  'Show me aging summary': `**AR Aging Summary — Current Period**\n\n| Bucket | Amount | Count |\n|---|---|---|\n| 0–30 days | ₹1.84 Cr | 142 invoices |\n| 31–60 days | ₹0.63 Cr | 54 invoices |\n| 61–90 days | ₹0.29 Cr | 31 invoices |\n| 90+ days | ₹0.41 Cr | 28 invoices |\n\n**Total Outstanding:** ₹3.17 Cr\n\n⚠ 28 invoices over 90 days require immediate escalation. Top overdue: Reliance Medicare (₹12.4L), Star Health (₹8.7L).\n\n*Collection efficiency this month: 74.3% — below target of 85%.*`,
  'Flag overdue invoices': `**Overdue Invoice Flags — High Priority**\n\nI've identified **31 invoices** requiring immediate action:\n\n🔴 **Critical (90+ days):** 8 invoices totaling ₹22.1L\n• INV-2026-00142 — Reliance Medicare — ₹12.4L (97 days)\n• INV-2026-00089 — Apollo Insurance — ₹6.2L (104 days)\n\n🟠 **High (60–90 days):** 11 invoices totaling ₹18.7L\n• INV-2026-00198 — Star Health TPA — ₹8.7L (72 days)\n\n🟡 **Medium (30–60 days):** 12 invoices totaling ₹9.4L\n\n**Recommended action:** Send automated reminders to 8 critical debtors. Escalate Reliance Medicare to collections team.\n\n*Estimated recovery probability: 68% within 30 days if action taken today.*`,
  'Summarize P&L': `**Profit & Loss Summary — April 2026**\n\n**Revenue:** ₹8.47 Cr (+12.3% YoY)\n• Patient Billing: ₹4.21 Cr\n• Insurance Collections: ₹2.84 Cr\n• Other Income: ₹1.42 Cr\n\n**Expenses:** ₹6.82 Cr (+8.1% YoY)\n• Staff & Payroll: ₹2.94 Cr (34.7%)\n• Medical Supplies: ₹1.83 Cr (21.6%)\n• Overheads: ₹2.05 Cr (24.2%)\n\n**EBITDA:** ₹1.65 Cr (19.5% margin)\n**Net Profit:** ₹1.24 Cr (14.6% margin)\n\n📈 Net margin improved 1.8pp vs March. Cost-per-patient-day reduced to ₹1,847 (-3.2%). \n\n*Forecast for May 2026: ₹8.9–9.1 Cr revenue, ₹1.3–1.5 Cr net profit.*`,
  'Detect anomalies': `**Anomaly Detection Report — Last 24 Hours**\n\nAI has detected **7 anomalies** requiring review:\n\n🔴 **Critical (2):**\n• GL Entry 4782: ₹4.2L duplicate debit in Sundry Creditors — possible double-payment\n• Journal 1923: Backdated entry (5 days) in Payroll ledger without approval\n\n🟠 **High (3):**\n• 3 invoices with identical amounts (₹48,500) from different vendors — potential fraud signal\n• TDS deduction rate on vendor PAN AAABM1234P differs from registered rate\n\n🟡 **Medium (2):**\n• Petty cash variance ₹3,200 at Branch 3 — unreconciled for 8 days\n• Unusual spike in write-offs at 2x normal rate this week\n\n*Auto-resolution available for 2 medium anomalies. Critical items require manual review.*`,
};

const RECENT_INSIGHTS = [
  { id: 'i1', text: 'AR collection rate dropped 6.2% this week vs last week', severity: 'high', time: '2h ago', icon: TrendingDown },
  { id: 'i2', text: 'Cash flow forecast shows ₹12L shortfall on 28 May', severity: 'medium', time: '3h ago', icon: AlertTriangle },
  { id: 'i3', text: 'TDS filing deadline in 4 days — ₹8.4L pending', severity: 'high', time: '4h ago', icon: Clock },
  { id: 'i4', text: 'Insurance claim settlement rate improved to 78.3%', severity: 'low', time: '5h ago', icon: TrendingUp },
  { id: 'i5', text: 'Duplicate vendor payment detected: ₹4.2L flagged', severity: 'critical', time: '6h ago', icon: Shield },
];

const MODELS = ['GPT-4o', 'GPT-4 Turbo', 'GPT-3.5 Turbo'];

// ─── Severity Badge ───────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const cfg = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
    high:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
    medium:   'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    low:      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  };
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${cfg[severity] || cfg.low}`}>
      {severity}
    </span>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isAI = msg.role === 'ai';

  // Simple markdown-like renderer
  const renderText = (text) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} className="flex gap-1.5 ml-2" dangerouslySetInnerHTML={{
            __html: `<span class="mt-1 text-violet-400">•</span><span>${line.slice(2)}</span>`
          }} />
        );
      }
      if (line.startsWith('🔴 ') || line.startsWith('🟠 ') || line.startsWith('🟡 ') || line.startsWith('📈 ') || line.startsWith('⚠ ')) {
        return <p key={i} className="mt-1" dangerouslySetInnerHTML={{ __html: line }} />;
      }
      if (line.startsWith('|')) return null; // skip table lines for simplicity
      if (!line.trim()) return <div key={i} className="h-1" />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: line }} />;
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
        isAI
          ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
          : 'bg-gradient-to-br from-slate-500 to-slate-700 text-white'
      }`}>
        {isAI ? <Bot size={14} /> : <User size={14} />}
      </div>
      <div className={`max-w-[85%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isAI
            ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-tl-sm'
            : 'bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-tr-sm'
        }`}>
          {renderText(msg.text)}
        </div>
        <p className="text-[10px] text-slate-400 mt-1 px-1">{msg.ts}</p>
      </div>
    </motion.div>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [model, setModel] = useState('GPT-4o');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(2847);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const addAIResponse = useCallback((text) => {
    const aiMsg = {
      id: `m${Date.now()}`,
      role: 'ai',
      ts: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      text,
    };
    setMessages(prev => [...prev, aiMsg]);
    setTyping(false);
    setTokensUsed(t => t + Math.floor(Math.random() * 400 + 150));
  }, []);

  const handleSend = useCallback((text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = {
      id: `m${Date.now()}`,
      role: 'user',
      ts: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      text: trimmed,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    const responseText = AI_RESPONSES[trimmed]
      || `I've analysed your query: **"${trimmed}"**\n\nBased on current financial data, here is my assessment:\n\n• Cross-module analysis initiated across GL, AR, AP, and Cash Book\n• No critical anomalies detected for this specific query\n• Confidence level: 91%\n\n*For deeper analysis, please specify a date range or module. I can drill into GL entries, aging reports, or cash flow forecasts as needed.*`;

    setTimeout(() => addAIResponse(responseText), 800);
  }, [input, addAIResponse]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ height: 'calc(100vh - 80px)' }}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">AI Financial Assistant</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Powered by {model} · Real-time financial intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Model selector */}
          <div className="relative">
            <button
              onClick={() => setShowModelMenu(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors"
            >
              <Bot size={12} />
              {model}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showModelMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute right-0 top-9 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden min-w-[160px]"
                >
                  {MODELS.map(m => (
                    <button
                      key={m}
                      onClick={() => { setModel(m); setShowModelMenu(false); toast.success(`Switched to ${m}`); }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors ${m === model ? 'text-violet-700 dark:text-violet-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => { setMessages(INITIAL_MESSAGES); toast.success('Conversation cleared'); }}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* ── Main Split Layout ── */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* ── Left: Chat Panel (65%) ── */}
        <div className="flex flex-col w-[65%] min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 min-h-0">
            {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
            {typing && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 font-medium uppercase tracking-wide">Quick Prompts</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map(q => (
                <button
                  key={q.id}
                  onClick={() => handleSend(q.label)}
                  disabled={typing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 text-xs font-medium hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <q.icon size={11} />
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about cash position, aging, P&L, anomalies…"
                rows={2}
                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || typing}
                className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Press Enter to send · Shift+Enter for new line · Tokens used: {tokensUsed.toLocaleString()}
            </p>
          </div>
        </div>

        {/* ── Right: Insights Panel (35%) ── */}
        <div className="w-[35%] flex flex-col gap-4 min-h-0 overflow-y-auto">

          {/* AI Model Info */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} />
              <span className="font-semibold text-sm">AI Engine Status</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Model', value: model },
                { label: 'Status', value: 'Online' },
                { label: 'Tokens Used', value: tokensUsed.toLocaleString() },
                { label: 'Latency', value: '420ms' },
                { label: 'Accuracy', value: '96.4%' },
                { label: 'Context', value: '128K' },
              ].map(item => (
                <div key={item.label}>
                  <p className="text-violet-200 text-[10px] uppercase tracking-wide">{item.label}</p>
                  <p className="font-mono font-bold text-sm mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Insights */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lightbulb size={15} className="text-amber-500" />
                <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Recent Insights</h3>
              </div>
              <span className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full font-semibold">
                {RECENT_INSIGHTS.length} new
              </span>
            </div>
            <div className="space-y-3">
              {RECENT_INSIGHTS.map(insight => (
                <div key={insight.id} className="flex gap-3 group cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                  <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    insight.severity === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : insight.severity === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                    : insight.severity === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    <insight.icon size={11} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">{insight.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <SeverityBadge severity={insight.severity} />
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">{insight.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <Target size={15} className="text-violet-500" />
              <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100">Suggested Actions</h3>
            </div>
            <div className="space-y-2.5">
              {[
                { text: 'Review 8 critical AR invoices before EOD', color: 'red' },
                { text: 'Approve ₹38L pending payroll disbursements', color: 'amber' },
                { text: 'Reconcile SBI OD account — 3-day delay', color: 'orange' },
                { text: 'File TDS by 31 May (4 days remaining)', color: 'blue' },
              ].map((action, i) => (
                <div key={i} className={`flex items-start gap-2.5 p-2.5 rounded-lg bg-${action.color}-50 dark:bg-${action.color}-900/10 border border-${action.color}-100 dark:border-${action.color}-900/30`}>
                  <Activity size={12} className={`mt-0.5 text-${action.color}-500 flex-shrink-0`} />
                  <p className={`text-xs text-${action.color}-700 dark:text-${action.color}-400`}>{action.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
