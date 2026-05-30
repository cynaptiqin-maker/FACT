// ─── Depreciation Runs — GL Accounting Impact Panel ──────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, TrendingDown, TrendingUp, Building2, Layers,
  ChevronRight, ArrowRight, Info,
} from 'lucide-react';
import { MOCK_RUNS, fmtINR } from './DRConstants';

// ── Aggregate GL entries across all posted runs ─────────────────────────────
function buildGLSummary() {
  const drMap = {};
  const crMap = {};
  const costCenterMap = {};

  MOCK_RUNS.forEach(run => {
    if (run.status !== 'POSTED') return;
    run.glEntries?.forEach(entry => {
      if (entry.debit) {
        drMap[entry.account] = (drMap[entry.account] || 0) + entry.debit;
      }
      if (entry.credit) {
        crMap[entry.account] = (crMap[entry.account] || 0) + entry.credit;
      }
      if (entry.costCenter) {
        const key = `${entry.costCenter}`;
        costCenterMap[key] = (costCenterMap[key] || 0) + (entry.debit || entry.credit || 0);
      }
    });
  });

  return { drMap, crMap, costCenterMap };
}

const { drMap, crMap, costCenterMap } = buildGLSummary();

const PL_IMPACT = [
  { label: 'Depreciation Expense',    amount: 14280000, nature: 'debit',  gl: '6100-DEP' },
  { label: 'Impairment Expense',      amount: 850000,   nature: 'debit',  gl: '6150-IMP' },
  { label: 'Gain on Disposal',        amount: -120000,  nature: 'credit', gl: '7800-DISP' },
  { label: 'Revaluation Surplus',     amount: -340000,  nature: 'credit', gl: '3400-REV' },
];

const BS_IMPACT = [
  { label: 'Gross Block',             amount: 285600000, nature: 'debit',  gl: '1100-FA' },
  { label: 'Acc. Depreciation',       amount: -98420000, nature: 'credit', gl: '1110-ACCDEPR' },
  { label: 'Net Book Value',          amount: 187180000, nature: 'debit',  gl: '—' },
  { label: 'Deferred Tax Liability',  amount: 138600,    nature: 'credit', gl: '2520-DTL' },
];

const COST_CENTER_DATA = [
  { cc: 'CC-MED-001', name: 'Medical Equipment', amount: 5240000, pct: 36.7 },
  { cc: 'CC-INF-001', name: 'IT Infrastructure', amount: 3820000, pct: 26.8 },
  { cc: 'CC-BLDG-01', name: 'Buildings & Civil', amount: 2860000, pct: 20.0 },
  { cc: 'CC-VEH-001', name: 'Vehicles & Fleet',  amount: 1420000, pct: 9.9 },
  { cc: 'CC-OFF-001', name: 'Office Equipment',  amount: 940000,  pct: 6.6 },
];

const BRANCH_ALLOC = [
  { branch: 'Chennai HQ',   amount: 4820000, pct: 33.8 },
  { branch: 'Vellore',      amount: 3640000, pct: 25.5 },
  { branch: 'Coimbatore',   amount: 2940000, pct: 20.6 },
  { branch: 'Madurai',      amount: 1680000, pct: 11.8 },
  { branch: 'Trichy',       amount: 1200000, pct: 8.4  },
];

function ImpactRow({ label, amount, nature, gl, highlight }) {
  const isNeg = amount < 0;
  const abs   = Math.abs(amount);
  return (
    <div className={`flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0 ${highlight ? 'bg-slate-50 dark:bg-slate-700/30 -mx-3 px-3 rounded-lg' : ''}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${nature === 'debit' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
        <span className="text-[12px] text-slate-700 dark:text-slate-300 font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <span className="text-[10px] font-mono text-slate-400">{gl}</span>
        <span className={`text-[12px] font-bold tabular-nums ${isNeg ? 'text-emerald-600 dark:text-emerald-400' : nature === 'debit' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
          {isNeg ? '(' : ''}{fmtINR(abs)}{isNeg ? ')' : ''}
        </span>
      </div>
    </div>
  );
}

function ProgressBar({ pct, color = 'bg-violet-500' }) {
  return (
    <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

const TABS = [
  { id: 'pl',   label: 'P&L Impact' },
  { id: 'bs',   label: 'Balance Sheet' },
  { id: 'cc',   label: 'Cost Centres' },
  { id: 'branch', label: 'Branch Alloc' },
];

export default function DRAccountingPanel() {
  const [tab, setTab] = useState('pl');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/20 dark:to-indigo-900/20">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-violet-600 dark:text-violet-400" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">GL Accounting Impact</p>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-semibold">Ind AS 16</span>
          <span className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400 font-semibold">IFRS</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${
              tab === t.id
                ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {tab === 'pl' && (
            <motion.div key="pl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-1.5 mb-3">
                <TrendingDown size={13} className="text-rose-500" />
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Profit & Loss Impact (YTD)</p>
              </div>
              <div className="space-y-0">
                {PL_IMPACT.map((r, i) => <ImpactRow key={i} {...r} />)}
              </div>
              <div className="mt-3 flex items-center justify-between bg-rose-50 dark:bg-rose-900/20 rounded-xl px-3 py-2.5 border border-rose-200 dark:border-rose-800/40">
                <span className="text-[12px] font-bold text-rose-800 dark:text-rose-300">Net P&L Charge</span>
                <span className="text-[14px] font-bold text-rose-700 dark:text-rose-400 tabular-nums">{fmtINR(15010000 - 460000)}</span>
              </div>
            </motion.div>
          )}

          {tab === 'bs' && (
            <motion.div key="bs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Layers size={13} className="text-indigo-500" />
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Balance Sheet Position</p>
              </div>
              <div className="space-y-0">
                {BS_IMPACT.map((r, i) => <ImpactRow key={i} {...r} highlight={r.label === 'Net Book Value'} />)}
              </div>
              <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800/40">
                <div className="flex items-center gap-1.5 mb-2">
                  <Info size={11} className="text-indigo-600 dark:text-indigo-400" />
                  <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400">Deferred Tax Position</p>
                </div>
                <p className="text-[11px] text-indigo-600 dark:text-indigo-300 leading-relaxed">
                  IFRS vs IT Act timing difference creates a deferred tax liability of <strong>{fmtINR(138600)}</strong>
                  at 33% effective rate. Review with Tax team before period close.
                </p>
              </div>
            </motion.div>
          )}

          {tab === 'cc' && (
            <motion.div key="cc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Building2 size={13} className="text-teal-500" />
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Cost Centre Allocation (YTD)</p>
              </div>
              <div className="space-y-2.5">
                {COST_CENTER_DATA.map((cc, i) => (
                  <motion.div
                    key={cc.cc}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-[120px] flex-shrink-0">
                      <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 truncate">{cc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{cc.cc}</p>
                    </div>
                    <ProgressBar pct={cc.pct} color="bg-violet-500" />
                    <div className="text-right flex-shrink-0 w-[80px]">
                      <p className="text-[11.5px] font-bold tabular-nums text-slate-800 dark:text-slate-200">{fmtINR(cc.amount)}</p>
                      <p className="text-[10px] text-slate-400">{cc.pct}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Total</span>
                <span className="text-[13px] font-bold tabular-nums text-violet-600 dark:text-violet-400">{fmtINR(14280000)}</span>
              </div>
            </motion.div>
          )}

          {tab === 'branch' && (
            <motion.div key="branch" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-1.5 mb-3">
                <Building2 size={13} className="text-cyan-500" />
                <p className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Branch-wise Allocation (YTD)</p>
              </div>
              <div className="space-y-2.5">
                {BRANCH_ALLOC.map((b, i) => (
                  <motion.div
                    key={b.branch}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-[110px] flex-shrink-0">
                      <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-300 truncate">{b.branch}</p>
                    </div>
                    <ProgressBar pct={b.pct} color="bg-cyan-500" />
                    <div className="text-right flex-shrink-0 w-[80px]">
                      <p className="text-[11.5px] font-bold tabular-nums text-slate-800 dark:text-slate-200">{fmtINR(b.amount)}</p>
                      <p className="text-[10px] text-slate-400">{b.pct}%</p>
                    </div>
                  </motion.div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-200 dark:border-slate-700">
                <span className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Total</span>
                <span className="text-[13px] font-bold tabular-nums text-cyan-600 dark:text-cyan-400">{fmtINR(14280000)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
