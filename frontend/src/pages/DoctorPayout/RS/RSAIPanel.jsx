// ─── Revenue Sharing — AI Intelligence Panel ──────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, AlertTriangle, TrendingUp, Clock,
  AlertOctagon, BarChart2, X, Loader2, MessageSquare, LineChart, ShieldAlert,
} from 'lucide-react';
import { AI_INSIGHTS, QUICK_PROMPTS, fmtINR } from './RSConstants';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MONTHLY_TREND } from './RSConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const TABS = [
  { id: 'insights', label: 'Insights',  Icon: Sparkles     },
  { id: 'chat',     label: 'AI Chat',   Icon: MessageSquare },
  { id: 'forecast', label: 'Forecast',  Icon: LineChart     },
];

const SEV_BORDER = { HIGH: 'border-orange-300 dark:border-orange-700', CRITICAL: 'border-red-300 dark:border-red-700', MEDIUM: 'border-amber-300 dark:border-amber-700', INFO: 'border-cyan-300 dark:border-cyan-700' };
const SEV_BG     = { HIGH: 'bg-orange-50 dark:bg-orange-950/30', CRITICAL: 'bg-red-50 dark:bg-red-950/30', MEDIUM: 'bg-amber-50 dark:bg-amber-950/30', INFO: 'bg-cyan-50 dark:bg-cyan-950/30' };
const SEV_TEXT   = { HIGH: 'text-orange-700 dark:text-orange-300', CRITICAL: 'text-red-700 dark:text-red-300', MEDIUM: 'text-amber-700 dark:text-amber-300', INFO: 'text-cyan-700 dark:text-cyan-300' };

const AI_RESPONSES = {
  anomaly:    `**Anomaly Detection** (May 2026)\n\n🔴 **Critical:** Dr. Fatima Sheikh (ICU) — billing 3× dept standard. Freeze payout.\n\n🟡 **Warning:** Dr. Priya Nair (Neurology) — insurance realization 45% below benchmark.\n\n🔴 **Critical:** Dr. Samuel Okafor (Oncology) — insurance delayed >90 days on ₹47.25L.\n\n*Confidence: 94% | 18-month baseline*`,
  forecast:   `**Payout Liability Forecast**\n\n💰 **30-day projection: ₹1.23Cr**\n\n• Doctor Payouts: ₹78.4L\n• Insurance-Linked: ₹32.1L\n• Package Settlements: ₹12.5L\n\n**Action:** Pre-position ₹80L in operating account by May 25.\n\n*Confidence: 88%*`,
  insurance:  `**Insurance Delay Analysis**\n\n3 claims with significant delays:\n\n• Star Health | RS-2026-005 | ₹47.25L | 94 days\n• HDFC Ergo | RS-2026-002 | ₹23.10L | 42 days\n• United India | RS-2026-004 | ₹9.38L | 28 days\n\n**Root cause:** Pre-auth documentation gaps. Engage TPA helpdesk within 48 hours.`,
  risk:       `**High-Risk Rules**\n\n8 rules flagged:\n\n1. 🔴 RS-2026-004 (ICU) — Overbilling pattern, exposure ₹9.38L\n2. 🔴 RS-2026-005 (Oncology) — Insurance ₹47.25L uncollected\n3. 🟡 RS-2026-002 (Neurology) — Review required\n\n**Actions:** Audit RS-2026-004 immediately. Escalate RS-2026-005 insurance claim.`,
  optimize:   `**Optimization Recommendations**\n\n1. Move 3 rules from "On Billing" → "On Collection" — reduces exposure by ₹8.2L\n2. Dr. Mehta tier threshold ₹5L → ₹3L improves alignment by 12%\n3. ICU: Replace daily census with procedure complexity scoring\n4. HDFC Ergo: Digital pre-auth cuts settlement from 42 → 12 days`,
  treasury:   `**Treasury Exposure Summary**\n\n💰 Approved Payouts Due: ₹68.4L (3 doctors, 7 days)\n🏦 Insurance Pending: ₹146.25L (5 claims, avg 38 days)\n📊 Total Liability: ₹89.3L\n✅ Scheduled Transfers: ₹32L (HDFC Bulk NEFT — May 22)\n\n**Buffer:** Operating account adequate. No gap funding required.`,
  default:    `I've analyzed your revenue sharing data:\n\n• **7 active rules** — total exposure ₹48.75Cr\n• **3 high-risk patterns** requiring immediate review\n• **Insurance realization** running 23% below Q1 benchmark\n• **Treasury liability** forecast: ₹1.23Cr next 30 days\n\nWhat would you like to explore?`,
};

function getResponse(query) {
  const q = query.toLowerCase();
  if (q.includes('anomal') || q.includes('abnormal') || q.includes('unusual')) return AI_RESPONSES.anomaly;
  if (q.includes('forecast') || q.includes('predict') || q.includes('next month')) return AI_RESPONSES.forecast;
  if (q.includes('insurance') || q.includes('delay') || q.includes('tpa')) return AI_RESPONSES.insurance;
  if (q.includes('risk') || q.includes('high-risk') || q.includes('danger')) return AI_RESPONSES.risk;
  if (q.includes('optim') || q.includes('recommend') || q.includes('improve')) return AI_RESPONSES.optimize;
  if (q.includes('treasury') || q.includes('exposure') || q.includes('cash')) return AI_RESPONSES.treasury;
  return AI_RESPONSES.default;
}

function MsgBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${isUser ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700' : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm'}`}>
        {isUser ? 'U' : <Sparkles size={10} />}
      </div>
      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${isUser ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-sm shadow-sm'}`}>
        <div className="text-[11px] leading-relaxed whitespace-pre-line">
          {msg.content.split('\n').map((line, i) => {
            if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className={`font-bold mt-1 first:mt-0 ${isUser ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>{line.slice(2, -2)}</p>;
            if (line.startsWith('•')) return <p key={i} className={`pl-2 ${isUser ? 'text-white/90' : 'text-slate-600 dark:text-slate-300'}`}>{line}</p>;
            if (line.startsWith('🔴') || line.startsWith('🟡') || line.startsWith('💰') || line.startsWith('🏦') || line.startsWith('📊') || line.startsWith('✅')) return <p key={i} className={`font-medium ${isUser ? 'text-white' : 'text-slate-700 dark:text-slate-200'}`}>{line}</p>;
            if (line.startsWith('*') && !line.startsWith('**')) return <p key={i} className="italic text-slate-400">{line.slice(1, -1)}</p>;
            if (line.trim() === '') return <div key={i} className="h-1" />;
            return <p key={i} className={isUser ? 'text-white' : 'text-slate-600 dark:text-slate-300'}>{line}</p>;
          })}
        </div>
        <p className={`text-[9px] mt-1 ${isUser ? 'text-amber-200 text-right' : 'text-slate-300 dark:text-slate-600'}`}>
          {new Date(msg.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
}

export default function RSAIPanel({ onClose }) {
  const [tab, setTab] = useState('insights');
  const { ask } = useModuleAI('revenue-sharing');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your Revenue Intelligence Assistant. I can analyze compensation rules, detect anomalies, forecast treasury exposure, and optimize revenue allocation. What would you like to explore?', ts: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  const send = (q) => {
    if (!q.trim()) return;
    setMessages(m => [...m, { role: 'user', content: q, ts: new Date().toISOString() }]);
    setInput('');
    setLoading(true);
    ask(q).then(response => {
      setMessages(m => [...m, { role: 'assistant', content: response, ts: new Date().toISOString() }]);
    }).finally(() => setLoading(false));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Revenue Intelligence</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
            </span>
          </div>
          {onClose && <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={14} /></button>}
        </div>
        <div className="flex gap-0.5 bg-white/60 dark:bg-slate-800/60 rounded-lg p-0.5">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1 py-1 text-[10px] font-semibold rounded-md transition-all ${tab === id ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
              <Icon size={10} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Insights Tab */}
      {tab === 'insights' && (
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {AI_INSIGHTS.map(ins => (
            <div key={ins.id} className={`p-2.5 rounded-xl border ${SEV_BORDER[ins.severity]} ${SEV_BG[ins.severity]}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <span className={`text-[10px] font-bold ${SEV_TEXT[ins.severity]}`}>{ins.title}</span>
                <span className="text-[9px] text-slate-400 shrink-0">{ins.confidence}% conf.</span>
              </div>
              <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">{ins.body}</p>
            </div>
          ))}
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200 dark:border-amber-800 mt-3">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 mb-1">✦ AI Summary</p>
            <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Realization running at <strong>64%</strong> vs 78% benchmark. Primary drag: Oncology insurance (₹47.25L delayed) and ICU overbilling. Immediate action recommended.
            </p>
          </div>
        </div>
      )}

      {/* Chat Tab */}
      {tab === 'chat' && (
        <>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-[10px] text-slate-400 mb-1.5">Quick prompts:</p>
            <div className="flex flex-wrap gap-1">
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} className="px-2 py-0.5 text-[10px] rounded-full border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.map((m, i) => <MsgBubble key={i} msg={m} />)}
            {loading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"><Sparkles size={10} className="text-white" /></div>
                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl px-3 py-2.5 shadow-sm">
                  <div className="flex gap-1 items-center">
                    {[0, 150, 300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="px-3 py-2.5 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-end gap-2">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder="Ask about anomalies, forecasts, treasury…" rows={2}
                className="flex-1 text-xs border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none" />
              <button onClick={() => send(input)} disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center disabled:opacity-40 transition-all shadow-sm hover:shadow-md">
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Forecast Tab */}
      {tab === 'forecast' && (
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">6-Month Liability Forecast</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={MONTHLY_TREND} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gAlloc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} /><stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-slate-700/50" />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={v => [`₹${(v / 100000).toFixed(1)}L`]} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              <Area type="monotone" dataKey="allocated" name="Allocated" stroke="#f59e0b" strokeWidth={2} fill="url(#gAlloc)" />
              <Area type="monotone" dataKey="realized" name="Realized" stroke="#10b981" strokeWidth={2} fill="url(#gReal)" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-2">
            {[
              { label: 'Approved payouts (7 days)', value: '₹68.4L', color: 'text-violet-600 dark:text-violet-400' },
              { label: 'Insurance pending exposure', value: '₹146.25L', color: 'text-blue-600 dark:text-blue-400' },
              { label: 'Total treasury liability',  value: '₹89.3L', color: 'text-amber-600 dark:text-amber-400' },
              { label: 'Scheduled transfers',       value: '₹32L', color: 'text-teal-600 dark:text-teal-400' },
            ].map(i => (
              <div key={i.label} className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{i.label}</span>
                <span className={`text-xs font-bold ${i.color}`}>{i.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
