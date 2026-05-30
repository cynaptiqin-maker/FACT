import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Bot, User, TrendingUp, Shield,
  AlertTriangle, Zap, RefreshCw, ThumbsUp, ThumbsDown,
  ChevronRight, CheckCircle2, Copy, Clock,
} from 'lucide-react';
import { NI_AI_PROMPTS, NI_INITIAL_AI_MESSAGES, fmt } from './NIConstants';
import { useModuleAI } from '@hooks/useModuleAI';

// ─── AI insight score cards ───────────────────────────────────────────────────
function InsightCard({ icon: Icon, label, value, sub, color, trend }) {
  const colors = {
    green:  { bg:'bg-emerald-50', border:'border-emerald-200', icon:'text-emerald-600', val:'text-emerald-700', trend:'text-emerald-500' },
    amber:  { bg:'bg-amber-50',   border:'border-amber-200',   icon:'text-amber-600',   val:'text-amber-700',   trend:'text-amber-500'  },
    blue:   { bg:'bg-sky-50',     border:'border-sky-200',     icon:'text-sky-600',     val:'text-sky-700',     trend:'text-sky-500'    },
    violet: { bg:'bg-violet-50',  border:'border-violet-200',  icon:'text-violet-600',  val:'text-violet-700',  trend:'text-violet-500' },
    red:    { bg:'bg-rose-50',    border:'border-rose-200',    icon:'text-rose-600',    val:'text-rose-700',    trend:'text-rose-500'   },
  };
  const c = colors[color] ?? colors.blue;
  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${c.bg} ${c.border}`}>
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg bg-white shadow-sm shrink-0`}>
        <Icon className={`w-4 h-4 ${c.icon}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-slate-500 font-medium">{label}</div>
        <div className={`text-sm font-bold ${c.val}`}>{value}</div>
        {sub && <div className={`text-[10px] ${c.trend}`}>{sub}</div>}
      </div>
      {trend && <TrendingUp className={`w-3.5 h-3.5 ${c.trend} shrink-0`} />}
    </div>
  );
}

// ─── AI response renderer ─────────────────────────────────────────────────────
function AIResponse({ msg }) {
  function renderText(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
      className="flex items-start gap-2"
    >
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 shrink-0 mt-0.5">
        <Bot className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 rounded-xl rounded-tl-sm px-3 py-2.5 shadow-sm"
          dangerouslySetInnerHTML={{ __html: renderText(msg.text) }}
        />
        {msg.actions && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {msg.actions.map(a => (
              <button key={a} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-[10px] font-semibold border border-indigo-200 hover:bg-indigo-100 transition-colors">
                {a} <ChevronRight className="w-2.5 h-2.5" />
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] text-slate-400">{new Date(msg.ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
          <button className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"><ThumbsUp className="w-2.5 h-2.5" /></button>
          <button className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"><ThumbsDown className="w-2.5 h-2.5" /></button>
          <button className="p-0.5 rounded hover:bg-slate-100 text-slate-300 hover:text-slate-500 transition-colors"><Copy className="w-2.5 h-2.5" /></button>
        </div>
      </div>
    </motion.div>
  );
}

function UserMessage({ msg }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.2 }}
      className="flex items-start gap-2 flex-row-reverse"
    >
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-sky-100 text-sky-600 shrink-0 mt-0.5">
        <User className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0 flex flex-col items-end">
        <div className="text-xs text-slate-700 bg-sky-50 border border-sky-200 rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%]">
          {msg.text}
        </div>
        <span className="text-[10px] text-slate-400 mt-1">{new Date(msg.ts).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
      </div>
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 shrink-0">
        <Bot className="w-4 h-4" />
      </div>
      <div className="bg-white border border-slate-200 rounded-xl rounded-tl-sm px-3 py-2 shadow-sm">
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 block"
              animate={{ y:[0,-4,0] }}
              transition={{ duration:0.6, repeat:Infinity, delay:i*0.12 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AI response generation (mock) ───────────────────────────────────────────
function generateAIResponse(prompt, lineItems, patient, totals) {
  const q = prompt.toLowerCase();

  if (q.includes('missing') || q.includes('detect')) {
    const hasSurgery = lineItems.some(li => li.category === 'SURGERY');
    const hasICU     = patient?.type === 'ICU';
    const gaps       = [];
    if (hasSurgery && !lineItems.some(li => li.code?.startsWith('PHR-')))
      gaps.push('**Surgical consumables** not billed (PHR-CONSUME-01 — ₹2,500 impact)');
    if (hasICU && !lineItems.some(li => li.code === 'ICU-VENT-01'))
      gaps.push('**Ventilator charges** missing for ICU patient (ICU-VENT-01 — ₹4,500/day)');
    if (!lineItems.some(li => li.category === 'LAB'))
      gaps.push('No lab investigations detected — possible unbilled panel tests');
    return {
      text: gaps.length > 0
        ? `I found **${gaps.length} potential missing charges**:\n\n${gaps.map(g => `• ${g}`).join('\n\n')}`
        : 'No obvious missing charges detected. Bill looks complete for the current context.',
      actions: gaps.length > 0 ? ['Add Missing Items', 'View Leakage Report'] : ['View Full Analysis'],
    };
  }

  if (q.includes('insurance') || q.includes('eligibility')) {
    const ins = patient?.insurance;
    return {
      text: ins
        ? `**${ins.tpa}** policy is active and valid till **${ins.validity}**.\n\nCoverage: ₹${(ins.coverageAmt/100000).toFixed(1)}L | Co-pay: ${ins.copay}%${ins.preAuthStatus === 'APPROVED' ? '\n\n✓ Pre-authorisation **APPROVED** (Ref: ' + ins.preAuthNo + ')' : ins.preAuthNo ? '\n\n⚠ Pre-auth is **PENDING** — follow up required.' : '\n\n⚠ No pre-authorisation on file. Initiate request for smooth claim processing.'}`
        : 'No insurance linked to this patient. This will be a self-pay invoice.',
      actions: ins ? ['View Policy Details', 'Request Pre-Auth'] : ['Check Insurance Eligibility'],
    };
  }

  if (q.includes('leakage') || q.includes('risk')) {
    const est = lineItems.length > 0 ? 3200 : 0;
    return {
      text: est > 0
        ? `Estimated revenue leakage: **${fmt(est)}** on this invoice.\n\nTop risks:\n• **Missing consumables** for surgical items: ₹2,500\n• **Package overlap** — 2 services billed outside package scope: ₹700`
        : 'Add line items first so I can analyse leakage risks.',
      actions: ['Show All Alerts', 'Fix Automatically'],
    };
  }

  if (q.includes('gst') || q.includes('tax')) {
    const taxAmt = totals.totalTax ?? 0;
    return {
      text: `GST analysis:\n\n• **Exempt services**: Clinical consultation, basic lab tests\n• **5% GST**: CT Scan, MRI, X-Ray (diagnostic imaging)\n• **12% GST**: Surgical consumables, devices\n• **18% GST**: Room upgrades (private/luxury), non-clinical services\n\nTotal GST on this invoice: **${fmt(taxAmt)}**`,
      actions: ['View GST Breakdown', 'Generate GSTR Data'],
    };
  }

  if (q.includes('optimis') || q.includes('optim')) {
    return {
      text: 'Billing optimisation suggestions:\n\n• **Package upgrade**: Patient qualifies for Dengue Package (₹12,000) — saves ₹2,400 vs individual billing\n• **Insurance routing**: All eligible items should be routed through TPA for faster realisation\n• **Bulk lab discount**: 5+ lab tests qualify for panel discount — apply 8% off',
      actions: ['Apply Package', 'Enable Insurance Routing'],
    };
  }

  if (q.includes('claim') || q.includes('approval') || q.includes('probability')) {
    const ins = patient?.insurance;
    const tpaRate = ins ? (100 - (8 + Math.random() * 10)).toFixed(0) : null;
    return {
      text: ins
        ? `Estimated claim approval probability: **${tpaRate}%**\n\nFactors:\n✓ Valid policy & pre-auth\n✓ All services are insurance-eligible\n⚠ 1 non-payable item detected (room upgrade)\n⚠ Discharge summary not yet uploaded`
        : 'No insurance on record. This invoice will be patient self-pay.',
      actions: ins ? ['Upload Documents', 'Submit Pre-Claim'] : [],
    };
  }

  return {
    text: `I've analysed the current invoice state:\n\n• **${lineItems.length}** line items | Net payable: **${fmt(totals.netPayable ?? 0)}**\n• Insurance coverage: ${patient?.insurance ? `Active (${patient.insurance.tpa})` : 'None'}\n\nAsk me about missing charges, insurance eligibility, GST validation, or billing optimisation.`,
    actions: ['Detect Missing Items', 'Check Insurance', 'Validate GST'],
  };
}

// ─── Main AI Panel ─────────────────────────────────────────────────────────────
export default function NIAIPanel({ lineItems, patient, totals }) {
  const [messages, setMessages] = useState(NI_INITIAL_AI_MESSAGES);
  const [input,    setInput]    = useState('');
  const [thinking, setThinking] = useState(false);
  const { ask } = useModuleAI('new-invoice');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, thinking]);

  async function sendMessage(text) {
    if (!text.trim()) return;
    const userMsg = { id:`u-${Date.now()}`, role:'user', text, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    const responseText = await ask(text);
    setMessages(prev => [...prev, { id:`a-${Date.now()}`, role:'assistant', text: responseText, ts: new Date().toISOString() }]);
    setThinking(false);
  }

  // Dynamic insight cards based on current state
  const billingScore = lineItems.length > 0 ? Math.min(98, 62 + lineItems.length * 5) : 0;
  const leakageRisk  = patient?.type === 'ICU' ? 'High' : lineItems.length > 3 ? 'Medium' : 'Low';
  const leakageColor = leakageRisk === 'High' ? 'red' : leakageRisk === 'Medium' ? 'amber' : 'green';
  const insMatch     = patient?.insurance ? '87%' : 'N/A';
  const optimScore   = lineItems.length > 0 ? `${Math.min(95, 55 + lineItems.length * 6)}%` : '—';

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-sky-50">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-600 text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-indigo-900">AI Billing Assistant</h3>
            <div className="flex items-center gap-1 text-[10px] text-indigo-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Live · analysing invoice
            </div>
          </div>
        </div>
      </div>

      {/* Insight score cards */}
      <div className="px-3 py-3 grid grid-cols-2 gap-2 border-b border-slate-100 bg-slate-50/50">
        <InsightCard
          icon={Zap}
          label="Billing Score"
          value={billingScore > 0 ? `${billingScore}/100` : '—'}
          sub={billingScore > 80 ? 'Excellent coverage' : billingScore > 0 ? 'Add more items' : 'No items yet'}
          color={billingScore > 80 ? 'green' : billingScore > 0 ? 'amber' : 'blue'}
          trend={billingScore > 0}
        />
        <InsightCard
          icon={AlertTriangle}
          label="Leakage Risk"
          value={lineItems.length > 0 ? leakageRisk : '—'}
          sub={lineItems.length > 0 ? 'est. ₹3,200 at risk' : 'No items yet'}
          color={leakageColor}
        />
        <InsightCard
          icon={Shield}
          label="Insurance Match"
          value={insMatch}
          sub={patient?.insurance ? `${patient.insurance.tpa}` : 'No TPA linked'}
          color={patient?.insurance ? 'green' : 'blue'}
        />
        <InsightCard
          icon={TrendingUp}
          label="Optimisation"
          value={optimScore}
          sub={lineItems.length > 0 ? 'Package available' : '—'}
          color="violet"
          trend={lineItems.length > 0}
        />
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.map(msg =>
          msg.role === 'user'
            ? <UserMessage key={msg.id} msg={msg} />
            : <AIResponse key={msg.id} msg={msg} />
        )}
        {thinking && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/50">
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {NI_AI_PROMPTS.slice(0,4).map(prompt => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={thinking}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-indigo-200 text-[10px] font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Sparkles className="w-2.5 h-2.5" />
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }}}
            placeholder="Ask about billing, insurance, GST…"
            disabled={thinking}
            className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white placeholder:text-slate-400 disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || thinking}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {thinking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
