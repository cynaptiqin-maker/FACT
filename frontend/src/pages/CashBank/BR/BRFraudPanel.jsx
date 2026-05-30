import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertOctagon, AlertTriangle, ShieldAlert, ShieldCheck,
  TrendingUp, User, FileText, ExternalLink,
} from 'lucide-react';
import { FRAUD_ALERTS, MOCK_SYSTEM_TXNS, MOCK_BANK_TXNS, fmtINR } from './BRConstants';

const SEV = {
  critical: { Icon: AlertOctagon,  ring: 'ring-red-500/30',    bg: 'bg-red-500/8 dark:bg-red-500/12',     border: 'border-red-200 dark:border-red-500/25',    badge: 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300',    icon: 'text-red-500' },
  high:     { Icon: AlertTriangle, ring: 'ring-orange-500/30', bg: 'bg-orange-500/8 dark:bg-orange-500/12', border: 'border-orange-200 dark:border-orange-500/25', badge: 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300', icon: 'text-orange-500' },
};

const TYPE_LABELS = {
  DUPLICATE_PAYMENT:   'Duplicate Payment',
  UNAUTHORIZED_DEBIT:  'Unauthorized Debit',
  UNIDENTIFIED_CREDIT: 'Unknown Credit',
  REFUND_ANOMALY:      'Refund Anomaly',
};

const TOP_RISK = [...MOCK_SYSTEM_TXNS, ...MOCK_BANK_TXNS]
  .filter(t => t.riskScore >= 60 || t.riskFlag)
  .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
  .slice(0, 5);

const RISK_DIST = {
  CRITICAL: MOCK_SYSTEM_TXNS.filter(t => t.riskLevel === 'CRITICAL').length,
  HIGH:     MOCK_SYSTEM_TXNS.filter(t => t.riskLevel === 'HIGH').length,
  MEDIUM:   MOCK_SYSTEM_TXNS.filter(t => t.riskLevel === 'MEDIUM').length,
  LOW:      MOCK_SYSTEM_TXNS.filter(t => t.riskLevel === 'LOW').length,
};

const totalExposure = FRAUD_ALERTS.reduce((s, a) => s + a.exposure, 0);

function FraudCard({ alert, index }) {
  const [status, setStatus] = useState(alert.status);
  const s = SEV[alert.severity] || SEV.high;
  const { Icon } = s;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`rounded-xl border ${s.border} ${s.bg} p-4 space-y-3`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${s.bg} ${s.border} border`}>
          <Icon className={`w-4 h-4 ${s.icon}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800 dark:text-white">{alert.title}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${s.badge}`}>{alert.severity.toUpperCase()}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              status === 'ESCALATED' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
            }`}>{status}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{alert.detail}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <FileText className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400">Ref:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200 font-mono text-[11px]">{alert.txnId}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User className="w-3 h-3 text-slate-400" />
          <span className="text-slate-500 dark:text-slate-400">User:</span>
          <span className="font-medium text-slate-700 dark:text-slate-200">{alert.user}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 mb-0.5">Financial Exposure</div>
          <div className="text-base font-bold text-red-600 dark:text-red-400">{fmtINR(alert.exposure)}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 mb-0.5">AI Confidence</div>
          <div className="flex items-center gap-1.5">
            <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                style={{ width: `${alert.aiConfidence}%` }}
              />
            </div>
            <span className="text-sm font-bold text-red-600 dark:text-red-400">{alert.aiConfidence}%</span>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5">
        <button className="flex-1 py-1.5 rounded-lg bg-red-500/10 text-red-700 dark:text-red-400 text-[11px] font-semibold border border-red-200 dark:border-red-500/30 hover:bg-red-500/20 transition-colors">
          Investigate
        </button>
        <button
          onClick={() => setStatus('ESCALATED')}
          className="flex-1 py-1.5 rounded-lg bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[11px] font-semibold border border-orange-200 dark:border-orange-500/30 hover:bg-orange-500/20 transition-colors"
        >
          Escalate
        </button>
        <button className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

export default function BRFraudPanel() {
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Exposure summary */}
      <div className="rounded-xl bg-gradient-to-br from-red-500/10 to-orange-500/5 dark:from-red-500/15 dark:to-orange-500/8 border border-red-200 dark:border-red-500/25 p-4">
        <div className="flex items-center gap-3 mb-3">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">Total Fraud Exposure</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">4 active alerts · 2 escalated</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-xl font-bold text-red-600 dark:text-red-400">{fmtINR(totalExposure)}</div>
            <div className="text-[10px] text-slate-400">Financial at risk</div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {Object.entries(RISK_DIST).map(([level, count]) => {
            const colorMap = { CRITICAL: 'red', HIGH: 'orange', MEDIUM: 'amber', LOW: 'emerald' };
            const c = colorMap[level];
            return (
              <div key={level} className={`rounded-lg bg-${c}-500/10 border border-${c}-200 dark:border-${c}-500/25 p-2 text-center`}>
                <div className={`text-base font-bold text-${c}-600 dark:text-${c}-400`}>{count}</div>
                <div className="text-[9px] text-slate-400 mt-0.5">{level}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI recommendation */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500/8 to-violet-500/5 dark:from-indigo-500/12 dark:to-violet-500/8 border border-indigo-200 dark:border-indigo-500/20 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">AI Fraud Intelligence</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          2 critical alerts require immediate CFO escalation. The unauthorized debit (₹18,500) and phantom refund (₹18,500) show identical amounts — possible linked fraud scheme. Bank has been notified. Freeze account activity on HDFC-4521 pending investigation.
        </p>
      </div>

      {/* Fraud alerts */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Active Fraud Alerts</h3>
        <div className="space-y-3">
          {FRAUD_ALERTS.map((alert, i) => (
            <FraudCard key={alert.id} alert={alert} index={i} />
          ))}
        </div>
      </div>

      {/* Top risk transactions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-orange-400" />
          Top Risk Transactions
        </h3>
        <div className="space-y-2">
          {TOP_RISK.map((txn, i) => (
            <div key={txn.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                i === 0 ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' :
                i === 1 ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300' :
                'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
              }`}>{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{txn.narration || txn.description || txn.id}</div>
                <div className="text-[10px] text-slate-400">{txn.id}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs font-bold text-slate-800 dark:text-white">{fmtINR(txn.amount || 0)}</div>
                <div className={`text-[10px] font-semibold ${
                  (txn.riskScore || 0) >= 70 ? 'text-red-400' : (txn.riskScore || 0) >= 45 ? 'text-orange-400' : 'text-amber-400'
                }`}>Risk {txn.riskScore || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Compliance note */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
          All fraud alerts are logged in the immutable audit trail. Bank transaction reversals must be approved by Finance Controller. RBI guidelines on suspicious transactions apply.
        </p>
      </div>
    </div>
  );
}
