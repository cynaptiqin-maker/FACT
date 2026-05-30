// ─── Asset Register — AI Intelligence Panel ───────────────────────────────────
// Predictive asset intelligence · Risk forecasting · Fraud detection
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, AlertTriangle, TrendingDown, RefreshCw, Wrench,
  Shield, RotateCcw, ChevronRight, Send, Bot, User, X,
  AlertCircle, TrendingUp, PauseCircle, Eye, CheckCircle2,
  Flame, Zap,
} from 'lucide-react';
import { AI_INSIGHTS, fmtINR } from './ARConstants';
import { useModuleAI } from '@hooks/useModuleAI';

const SEVERITY_CONFIG = {
  HIGH:    { color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20',    border: 'border-red-200 dark:border-red-800/60',    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'   },
  MEDIUM:  { color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20',border: 'border-amber-200 dark:border-amber-800/60',badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'},
  INFO:    { color: '#0ea5e9', bg: 'bg-sky-50 dark:bg-sky-900/20',    border: 'border-sky-200 dark:border-sky-800/60',    badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400'   },
  LOW:     { color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/60', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' },
};

const TYPE_ICONS = {
  REPLACEMENT_ALERT:  RotateCcw,
  MAINTENANCE_ANOMALY:Wrench,
  INSURANCE_EXPIRY:   Shield,
  IDLE_ASSET_DETECTED:PauseCircle,
  DEPRECIATION_FORECAST: TrendingDown,
  FRAUD_RISK:         AlertTriangle,
};

const QUICK_PROMPTS = [
  'Show assets nearing replacement',
  'Detect underutilized ICU equipment',
  'Forecast FY 2026-27 depreciation',
  'Identify fraud risks',
  'Which assets have expired AMC?',
  'Show maintenance cost trends',
];

const CANNED_RESPONSES = {
  'Show assets nearing replacement': `Based on current WDV analysis and age-profile data, **14 assets** are approaching end-of-useful-life within the next 24 months:

**Critical Priority:**
• PET-CT Scanner (FA-2026-000015) — 7 yrs old · NBV ₹14.4Cr · Replacement cost ₹38Cr
• Cath Lab System (FA-2026-000011) — 5 yrs old · NBV ₹6.7Cr

**Medium Priority:**
• 8× ICU Ventilators · Combined replacement cost ₹1.5Cr
• 3× IT Servers · Useful life < 1 year remaining

**Recommended Action:** Initiate CapEx planning for FY 2027-28 with a budget of ₹62.5Cr. Present to CFO and Finance Committee by Q2 FY 2026-27.`,

  'Detect underutilized ICU equipment': `AI utilization analysis for ICU / Critical Care assets shows **3 assets below 60% utilization threshold:**

• Anesthesia Workstation (ICU Block B) — 38% utilization · Recommend redeployment to OT-3
• Infusion Pump Set (12 units) — 51% utilization · Consider sharing with NICU
• Portable X-Ray (ICU Wing) — 44% utilization · Redeploy to Emergency Bay

**Financial Impact:** ₹2.8Cr in tied capital with suboptimal ROA. Redeployment can improve asset ROA by ~18%.`,

  'Forecast FY 2026-27 depreciation': `**Depreciation Forecast — FY 2026-27**

| Method | Asset Count | Gross Value | Depreciation Charge |
|--------|-------------|-------------|---------------------|
| WDV    | 142 assets  | ₹289.4Cr    | ₹31.2Cr             |
| SLM    | 105 assets  | ₹139.3Cr    | ₹17.0Cr             |
| **Total** | **247** | **₹428.7Cr** | **₹48.2Cr** |

YoY increase of **₹6.8Cr (+16.4%)** driven by new Robotic Surgery System and PET-CT high-value WDV charges.

**P&L Impact:** 6.8% increase in depreciation expense line. Recommend reviewing component accounting under Ind AS 16 for Cath Lab and PET-CT.`,
};

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: `Hello! I'm your **Asset Intelligence Assistant** for the FACT Fixed Asset Register.

I can help you with:
• 🔮 **Replacement forecasting** — predict when assets need replacement
• 🔍 **Anomaly detection** — identify underutilized or at-risk assets
• 📊 **Depreciation analysis** — forecast P&L impact
• 🚨 **Fraud risk alerts** — detect procurement and capitalization anomalies
• 🛡️ **Compliance monitoring** — CDSCO, AERB, NABH coverage gaps

Try one of the quick prompts below, or ask me anything about your asset portfolio.`,
    ts: new Date().toISOString(),
  },
];

function InsightCard({ insight, onAction }) {
  const cfg = SEVERITY_CONFIG[insight.severity] ?? SEVERITY_CONFIG.INFO;
  const Icon = TYPE_ICONS[insight.type] ?? AlertCircle;
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className={`rounded-xl border p-3 ${cfg.bg} ${cfg.border} relative`}
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={10} />
      </button>
      <div className="flex items-start gap-2.5 pr-4">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-none mt-0.5" style={{ background: `${cfg.color}20` }}>
          <Icon size={12} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className={`text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
              {insight.severity}
            </span>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">{insight.type.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">{insight.title}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{insight.summary}</p>
          {insight.financialImpact > 0 && (
            <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mt-1">
              Financial exposure: <span style={{ color: cfg.color }}>{fmtINR(insight.financialImpact)}</span>
            </p>
          )}
          <button
            onClick={() => onAction(insight)}
            className="mt-2 flex items-center gap-1 text-[10.5px] font-semibold transition-colors"
            style={{ color: cfg.color }}
          >
            {insight.action} <ChevronRight size={10} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg }) {
  const isAssistant = msg.role === 'assistant';
  return (
    <div className={`flex gap-2 ${isAssistant ? '' : 'flex-row-reverse'}`}>
      <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-none mt-0.5 ${isAssistant ? 'bg-violet-100 dark:bg-violet-900/40' : 'bg-sky-100 dark:bg-sky-900/40'}`}>
        {isAssistant ? <Bot size={10} className="text-violet-600 dark:text-violet-400" /> : <User size={10} className="text-sky-600 dark:text-sky-400" />}
      </div>
      <div className={`max-w-[85%] rounded-xl px-3 py-2 ${isAssistant ? 'bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600' : 'bg-sky-600 text-white'}`}>
        <div className={`text-[10.5px] leading-relaxed whitespace-pre-wrap ${isAssistant ? 'text-slate-700 dark:text-slate-300' : 'text-white'}`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

export default function ARAIPanel({ onClose }) {
  const [tab, setTab] = useState('insights');
  const { ask } = useModuleAI('fixed-assets');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    const userMsg = text ?? input.trim();
    if (!userMsg) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg, ts: new Date().toISOString() }]);
    setLoading(true);
    ask(userMsg).then(response => {
      setMessages(prev => [...prev, { role: 'assistant', content: response, ts: new Date().toISOString() }]);
    }).finally(() => setLoading(false));
  };

  const highCount = AI_INSIGHTS.filter(i => i.severity === 'HIGH').length;

  return (
    <div className="flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-none">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 flex items-center justify-center">
            <Sparkles size={14} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Asset Intelligence</p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">AI-Powered · Real-time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {highCount > 0 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-[9px] font-bold">
              <Flame size={8} /> {highCount} urgent
            </span>
          )}
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 flex-none">
        {[{ id: 'insights', label: 'Insights', count: AI_INSIGHTS.length }, { id: 'chat', label: 'AI Chat' }].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-semibold transition-colors border-b-2 -mb-px ${
              tab === t.id
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {t.label}
            {t.count && <span className="bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full px-1.5 py-0.5 text-[9px] font-bold">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'insights' && (
          <div className="p-3 space-y-2.5">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2.5 text-center">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Risk Score</p>
                <p className="text-lg font-bold text-amber-500">68</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">/ 100 · Moderate</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-2.5 text-center">
                <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">Exposure</p>
                <p className="text-lg font-bold text-rose-500">₹62.4Cr</p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">Total risk exposure</p>
              </div>
            </div>

            {/* AI Insight Cards */}
            <AnimatePresence>
              {AI_INSIGHTS.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAction={(i) => console.log('Action on insight:', i.id)}
                />
              ))}
            </AnimatePresence>

            {/* Refresh */}
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-[11px] text-slate-400 hover:text-slate-600 hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
              <RefreshCw size={11} />
              Refresh AI Insights
            </button>
          </div>
        )}

        {tab === 'chat' && (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
              {messages.map((msg, i) => (
                <ChatMessage key={i} msg={msg} />
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-none">
                    <Bot size={10} className="text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="bg-white dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2">
                    <div className="flex gap-1 items-center h-4">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-violet-400"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            <div className="px-3 pb-2">
              <div className="flex gap-1.5 flex-wrap">
                {QUICK_PROMPTS.slice(0, 3).map(p => (
                  <button
                    key={p}
                    onClick={() => sendMessage(p)}
                    className="px-2 py-1 text-[9.5px] bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 rounded-full border border-violet-100 dark:border-violet-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-colors font-medium"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-700 flex-none">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600 px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Ask about assets, risks, depreciation..."
                  className="flex-1 bg-transparent text-[11px] text-slate-700 dark:text-slate-300 placeholder:text-slate-400 focus:outline-none"
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-6 h-6 rounded-lg bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-none"
                >
                  <Send size={11} className="text-white" />
                </button>
              </div>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 text-center">
                Powered by FACT AI · Asset Intelligence Engine
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
