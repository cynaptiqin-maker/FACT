import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { commandCenterAPI } from '@services/api';
import { aiAPI } from '@services/api';
import {
  Brain, Send, Loader2, RefreshCw, Sparkles,
  ChevronRight, TrendingUp, AlertTriangle, Clock, Lightbulb,
} from 'lucide-react';
import clsx from 'clsx';

// ─── Suggested prompts ────────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { label: 'Cash flow risk?',           query: 'Are we at risk of a cash flow crunch in the next 14 days?' },
  { label: 'AR collections summary',    query: 'Summarize our AR collections performance this month.' },
  { label: 'Which TPA is slowest?',     query: 'Which TPA or insurer is taking the longest to settle claims?' },
  { label: 'Revenue vs last month',     query: 'How does this month\'s revenue compare to last month?' },
  { label: 'Top overdue vendors',       query: 'Which vendors are we most overdue in paying?' },
  { label: 'Payroll anomalies?',        query: 'Are there any unusual spikes in payroll this month?' },
];

// ─── Message types ────────────────────────────────────────────────────────────
function UserMessage({ text }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[85%] bg-brand-600 text-white px-3.5 py-2.5 rounded-2xl rounded-br-md text-sm leading-relaxed shadow-sm">
        {text}
      </div>
    </div>
  );
}

function AIMessage({ text, isLoading }) {
  return (
    <div className="flex items-start gap-2.5 mb-3">
      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <Brain className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 max-w-[88%] bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-2xl rounded-tl-md text-sm text-slate-700 leading-relaxed shadow-sm">
        {isLoading ? (
          <span className="flex items-center gap-2 text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Thinking…</span>
          </span>
        ) : text}
      </div>
    </div>
  );
}

// ─── Proactive Insight Card ───────────────────────────────────────────────────
function InsightCard({ icon: Icon, text, severity = 'info' }) {
  const cfg = {
    info:    { bg: 'bg-blue-50 border-blue-100',   icon: 'text-blue-500' },
    warning: { bg: 'bg-amber-50 border-amber-100', icon: 'text-amber-500' },
    alert:   { bg: 'bg-red-50 border-red-100',     icon: 'text-red-500' },
    success: { bg: 'bg-green-50 border-green-100', icon: 'text-green-500' },
  };
  const c = cfg[severity] || cfg.info;

  return (
    <div className={clsx('flex items-start gap-2.5 rounded-xl border p-3 mb-2', c.bg)}>
      <Icon className={clsx('w-4 h-4 mt-0.5 flex-shrink-0', c.icon)} />
      <p className="text-xs text-slate-700 leading-relaxed">{text}</p>
    </div>
  );
}

// ─── AICommandCopilot ─────────────────────────────────────────────────────────
export default function AICommandCopilot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Proactive insights from summary data
  const { data: summaryData } = useQuery({
    queryKey: ['command-center-summary'],
    queryFn: () => commandCenterAPI.getSummary().then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const kpis = summaryData?.kpis || {};
  const taskCounts = summaryData?.taskCounts || {};

  // Derive proactive insights from live data
  const insights = [];
  if (Number(kpis.arOverdue) > 500000) {
    insights.push({
      icon: AlertTriangle,
      severity: 'alert',
      text: `₹${(Number(kpis.arOverdue) / 100000).toFixed(1)}L in AR is overdue >30 days. These invoices are at risk — consider sending reminders today.`,
    });
  }
  if (Number(taskCounts.pendingApprovals) > 3) {
    insights.push({
      icon: Clock,
      severity: 'warning',
      text: `${taskCounts.pendingApprovals} vendor invoices are awaiting your approval. Delayed approvals affect vendor relationships and early-payment discounts.`,
    });
  }
  if (Number(kpis.cashPosition) < 200000) {
    insights.push({
      icon: TrendingUp,
      severity: 'alert',
      text: 'Cash position is low. Consider accelerating AR collections or arranging short-term credit before payroll run.',
    });
  }
  if (Number(taskCounts.claimsRejected) > 2) {
    insights.push({
      icon: AlertTriangle,
      severity: 'warning',
      text: `${taskCounts.claimsRejected} insurance claims were rejected this month. Review denial reasons for pattern — radiology and package claims are common rejection targets.`,
    });
  }
  if (insights.length === 0) {
    insights.push({
      icon: Lightbulb,
      severity: 'success',
      text: 'Financial position looks stable. No urgent alerts detected. Consider reviewing next month\'s cash flow forecast.',
    });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  async function sendQuery(query) {
    if (!query.trim() || isQuerying) return;

    setShowSuggestions(false);
    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInput('');
    setIsQuerying(true);

    try {
      // Try real AI endpoint; fall back to contextual mock if unavailable
      let response;
      try {
        const res = await aiAPI.queryWithContext(query, 'command-center', { ...kpis, ...taskCounts });
        response = res.data?.data?.answer || res.data?.data?.response || 'Analysis complete.';
      } catch {
        // Contextual fallback responses
        const q = query.toLowerCase();
        if (q.includes('cash') || q.includes('liquidity')) {
          response = `Based on current data, your cash position stands at ₹${(Number(kpis.cashPosition)/100000).toFixed(1)}L across all bank accounts. ${Number(kpis.apDueThisWeek) > Number(kpis.cashPosition) * 0.3 ? 'AP due this week represents a significant outflow — monitor closely.' : 'Liquidity appears adequate for the near term.'}`;
        } else if (q.includes('ar') || q.includes('receivable') || q.includes('collection')) {
          response = `AR outstanding is ₹${(Number(kpis.arOutstanding)/100000).toFixed(1)}L, with ₹${(Number(kpis.arOverdue)/100000).toFixed(1)}L overdue >30 days. ${Number(kpis.arOverdue)/Math.max(Number(kpis.arOutstanding), 1) > 0.3 ? 'This is a concerning ratio — over 30% of AR is aging. Prioritize collection calls.' : 'Collection ratio is within acceptable range.'}`;
        } else if (q.includes('claim') || q.includes('tpa') || q.includes('insurance')) {
          response = `You have ₹${(Number(kpis.claimsPendingValue)/100000).toFixed(1)}L in insurance claims pending settlement. ${taskCounts.claimsRejected > 0 ? `${taskCounts.claimsRejected} claims were rejected this month — review denial reasons for systemic issues.` : 'Claim rejection rate looks normal.'}`;
        } else if (q.includes('payroll') || q.includes('salary')) {
          response = `MTD payroll processed: ₹${(Number(kpis.mtdPayroll)/100000).toFixed(1)}L. ${taskCounts.payrollRuns > 0 ? `${taskCounts.payrollRuns} payroll run(s) are in draft — process before month-end to avoid statutory penalties.` : 'Current payroll runs are up to date.'}`;
        } else {
          response = `Based on your current financial data: Revenue today ₹${(Number(kpis.todayRevenue)/100000).toFixed(1)}L, Cash ₹${(Number(kpis.cashPosition)/100000).toFixed(1)}L, AR Overdue ₹${(Number(kpis.arOverdue)/100000).toFixed(1)}L. You have ${taskCounts.total || 0} pending tasks requiring attention. Would you like me to drill down into any specific area?`;
        }
      }

      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } finally {
      setIsQuerying(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendQuery(input);
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-purple-50">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">AI Finance Copilot</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <p className="text-[11px] text-slate-500">Context-aware · FACT data</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setShowSuggestions(true); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/60 transition-colors"
            title="Clear conversation"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Proactive insights (shown before first message) */}
        {showSuggestions && messages.length === 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Proactive Insights</p>
            </div>
            {insights.map((ins, i) => (
              <InsightCard key={i} icon={ins.icon} text={ins.text} severity={ins.severity} />
            ))}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          msg.role === 'user'
            ? <UserMessage key={i} text={msg.text} />
            : <AIMessage key={i} text={msg.text} />
        ))}

        {/* Loading state */}
        {isQuerying && <AIMessage text="" isLoading />}

        <div ref={bottomRef} />
      </div>

      {/* Suggested prompts */}
      {showSuggestions && messages.length === 0 && (
        <div className="px-4 pb-3">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Ask me anything</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p.label}
                onClick={() => sendQuery(p.query)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-brand-50 hover:text-brand-700 rounded-lg transition-colors border border-slate-200 hover:border-brand-200"
              >
                {p.label}
                <ChevronRight className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-t border-slate-100 bg-slate-50">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about finances, trends, or risks…"
          disabled={isQuerying}
          className="flex-1 text-sm bg-white border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-slate-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isQuerying}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center disabled:opacity-40 hover:shadow-md transition-all flex-shrink-0"
        >
          {isQuerying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
