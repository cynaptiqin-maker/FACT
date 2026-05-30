import { motion } from 'framer-motion';
import {
  ShieldAlert, AlertOctagon, AlertTriangle, Eye, ChevronRight, Sparkles,
  TrendingDown, Clock, User, Building,
} from 'lucide-react';
import { MOCK_CASH_TRANSACTIONS, RISK_LEVELS, fmtINR } from './CBConstants';

const HIGH_RISK_TXN = MOCK_CASH_TRANSACTIONS.filter(t =>
  t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL'
).sort((a, b) => b.riskScore - a.riskScore);

const FRAUD_PATTERNS = [
  {
    id: 'ptn-001',
    icon: 'AlertOctagon',
    severity: 'critical',
    title: 'Large cash payment without PO',
    txnId: 'TXN-CB-2026-00128',
    amount: 45000,
    branch: 'Main Hospital',
    user: 'Suresh Padmanabhan',
    detail: '₹45K vendor payment with no purchase order, no GRN reference, and no supporting documents attached.',
    exposure: 45000,
    confidence: 94,
  },
  {
    id: 'ptn-002',
    icon: 'AlertOctagon',
    severity: 'critical',
    title: 'Anomalous night-shift pharmacy cash',
    txnId: 'TXN-CB-2026-00123',
    amount: 62000,
    branch: 'Pharmacy',
    user: 'Pharmacist Rekha',
    detail: '₹62K drug purchase at 11:14 PM by night-shift pharmacist. No standard procurement workflow followed.',
    exposure: 62000,
    confidence: 88,
  },
  {
    id: 'ptn-003',
    icon: 'AlertTriangle',
    severity: 'warning',
    title: 'Consecutive counter shortage pattern',
    txnId: 'ADJ-2026-00089',
    amount: 1200,
    branch: 'North Wing',
    user: 'Harish Babu',
    detail: 'Counter-03 has had 3 consecutive shift shortages (₹800 → ₹1,200 → ₹1,450). Escalating trend.',
    exposure: 3450,
    confidence: 82,
  },
  {
    id: 'ptn-004',
    icon: 'AlertTriangle',
    severity: 'warning',
    title: 'Frequent manual cash reversals',
    txnId: 'REV-2026-00142',
    amount: 5500,
    branch: 'Main Hospital',
    user: 'Krishnan Nambiar',
    detail: '3rd cash reversal in 10 days by same user. Pattern may indicate duplicate receipt entry or refund manipulation.',
    exposure: 16500,
    confidence: 71,
  },
];

const SEV_STYLES = {
  critical: {
    border: 'border-red-200 dark:border-red-900/40',
    bg:     'bg-red-50 dark:bg-red-950/20',
    dot:    'bg-red-500',
    label:  'text-red-700 dark:text-red-400',
    badge:  'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400',
    bar:    'bg-red-500',
  },
  warning: {
    border: 'border-amber-200 dark:border-amber-900/40',
    bg:     'bg-amber-50 dark:bg-amber-950/20',
    dot:    'bg-amber-500',
    label:  'text-amber-700 dark:text-amber-400',
    badge:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    bar:    'bg-amber-500',
  },
};

const ICON_MAP = { AlertOctagon, AlertTriangle, ShieldAlert };

function FraudCard({ pattern, idx }) {
  const sev  = SEV_STYLES[pattern.severity] ?? SEV_STYLES.warning;
  const Icon = ICON_MAP[pattern.icon] ?? AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07, duration: 0.3 }}
      className={`border rounded-xl p-4 ${sev.border} ${sev.bg}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-none ${sev.badge}`}>
          <Icon size={15} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs font-bold ${sev.label}`}>{pattern.title}</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${sev.badge}`}>
              {pattern.severity.toUpperCase()}
            </span>
          </div>

          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-2">
            {pattern.detail}
          </p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
            {[
              { icon: Hash, label: pattern.txnId },
              { icon: User, label: pattern.user },
              { icon: Building, label: pattern.branch },
              { icon: ShieldAlert, label: `Exposure: ${fmtINR(pattern.exposure)}` },
            ].map(({ icon: I, label }) => (
              <div key={label} className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-500">
                <I size={9} />{label}
              </div>
            ))}
          </div>

          {/* AI confidence bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">AI Fraud Confidence</span>
              <span className={`text-[10px] font-bold ${sev.label}`}>{pattern.confidence}%</span>
            </div>
            <div className="h-1.5 bg-white/60 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pattern.confidence}%` }}
                transition={{ delay: 0.4 + idx * 0.1, duration: 0.7 }}
                className={`h-full rounded-full ${sev.bar}`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className={`flex items-center gap-1 text-[11px] font-semibold ${sev.label} hover:underline`}>
              <Eye size={11} />Review Transaction
            </button>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <button className="text-[11px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              Mark False Positive
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Hash({ size }) {
  return <span style={{ fontSize: size, fontWeight: 700, color: 'inherit' }}>#</span>;
}

export default function CBFraudAlerts() {
  const criticalCount = FRAUD_PATTERNS.filter(p => p.severity === 'critical').length;
  const totalExposure = FRAUD_PATTERNS.reduce((s, p) => s + p.exposure, 0);

  return (
    <div className="grid grid-cols-3 gap-5">

      {/* Alert cards */}
      <div className="col-span-2 space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert size={14} className="text-red-500" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Fraud & Anomaly Alerts</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">
            {criticalCount} Critical · Total exposure {fmtINR(totalExposure)}
          </span>
        </div>

        {FRAUD_PATTERNS.map((p, i) => (
          <FraudCard key={p.id} pattern={p} idx={i} />
        ))}
      </div>

      {/* Risk summary sidebar */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-cyan-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Risk Summary</span>
        </div>

        {/* Risk distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-3">
            Transaction Risk Distribution
          </div>
          {Object.entries(RISK_LEVELS).map(([level, cfg]) => {
            const count = MOCK_CASH_TRANSACTIONS.filter(t => t.riskLevel === level).length;
            const pct   = Math.round((count / MOCK_CASH_TRANSACTIONS.length) * 100);
            return (
              <div key={level} className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-medium" style={{ color: cfg.color }}>{cfg.label}</span>
                  <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-400">{count} ({pct}%)</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="h-full rounded-full"
                    style={{ background: cfg.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* High-risk transactions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wide mb-3">
            Top Risk Transactions
          </div>
          <div className="space-y-2">
            {HIGH_RISK_TXN.slice(0, 4).map(t => (
              <div key={t.id} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-none" style={{ background: RISK_LEVELS[t.riskLevel]?.color ?? '#64748b' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-mono text-slate-600 dark:text-slate-400 truncate">{t.id}</div>
                  <div className="text-[10px] text-slate-400 truncate">{t.counter} · {t.branch}</div>
                </div>
                <span className="text-[10px] font-bold font-mono" style={{ color: RISK_LEVELS[t.riskLevel]?.color }}>
                  {t.riskScore}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI action */}
        <div className="bg-gradient-to-br from-slate-900 to-red-950 rounded-xl p-4 text-white">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={12} className="text-red-400" />
            <span className="text-xs font-semibold">AI Risk Recommendation</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Immediately suspend TXN-CB-2026-00128 pending CFO approval. Investigate Counter-03 shortage pattern with a physical cash audit. Schedule pharmacy cash controls review for night shifts.
          </p>
        </div>
      </div>

    </div>
  );
}
