// ─── Depreciation Runs — Multi-Book Compliance Panel ────────────────────────
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, AlertTriangle, CheckCircle, TrendingUp, TrendingDown,
  Info, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, ReferenceLine,
} from 'recharts';
import { MULTIBOOK_DATA, fmtINR, fmtPct } from './DRConstants';

const BOOKS = [
  { id: 'ifrs',      label: 'IFRS (Ind AS)',             color: 'text-violet-600 dark:text-violet-400',  bg: 'bg-violet-100 dark:bg-violet-900/40',  dot: 'bg-violet-500', border: 'border-violet-200 dark:border-violet-800/40' },
  { id: 'statutory', label: 'Statutory (Companies Act)', color: 'text-indigo-600 dark:text-indigo-400',  bg: 'bg-indigo-100 dark:bg-indigo-900/40',  dot: 'bg-indigo-500', border: 'border-indigo-200 dark:border-indigo-800/40' },
  { id: 'itAct',     label: 'IT Act (Block WDV)',        color: 'text-amber-600 dark:text-amber-400',    bg: 'bg-amber-100 dark:bg-amber-900/40',    dot: 'bg-amber-500',  border: 'border-amber-200 dark:border-amber-800/40' },
  { id: 'gaap',      label: 'US GAAP',                   color: 'text-teal-600 dark:text-teal-400',      bg: 'bg-teal-100 dark:bg-teal-900/40',      dot: 'bg-teal-500',   border: 'border-teal-200 dark:border-teal-800/40' },
  { id: 'mgmt',      label: 'Management MIS',            color: 'text-slate-600 dark:text-slate-400',    bg: 'bg-slate-100 dark:bg-slate-700',        dot: 'bg-slate-500',  border: 'border-slate-200 dark:border-slate-700' },
];

const BOOK_AMOUNTS = {
  ifrs:      14280000,
  statutory: 13960000,
  itAct:     15840000,
  gaap:      13420000,
  mgmt:      14100000,
};

const VARIANCES = [
  { pair: 'IFRS vs Statutory',    variance: 320000,   pct: 2.3,  status: 'low',  note: 'Timing difference in useful life estimates for IT assets.' },
  { pair: 'IFRS vs IT Act',       variance: -1560000, pct: -9.9, status: 'high', note: 'Block WDV method gives higher allowance; creates deferred tax liability.' },
  { pair: 'IFRS vs GAAP',         variance: 860000,   pct: 6.0,  status: 'medium', note: 'GAAP uses straight-line for all assets; IFRS uses component approach for complex assets.' },
  { pair: 'IFRS vs Mgmt',         variance: 180000,   pct: 1.3,  status: 'low',  note: 'Management MIS uses accelerated rates for budgeting.' },
  { pair: 'Statutory vs IT Act',  variance: -1880000, pct: -13.5,status: 'critical', note: 'Statutory depreciation significantly lower than IT Act; material deferred tax exposure.' },
];

const DEFERRED_TAX = {
  timing:       1560000,
  rate:         33,
  liability:    514800,
  recognized:   138600,
  unrecognized: 376200,
};

function BookCard({ book }) {
  const b = BOOKS.find(b => b.id === book.id);
  if (!b) return null;
  return (
    <div className={`rounded-xl border ${b.border} ${b.bg} p-3`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-2 h-2 rounded-full ${b.dot}`} />
        <p className={`text-[11px] font-bold ${b.color}`}>{b.label}</p>
      </div>
      <p className={`text-[15px] font-bold tabular-nums ${b.color}`}>{fmtINR(BOOK_AMOUNTS[book.id])}</p>
      <p className="text-[10px] text-slate-400 mt-0.5">FY 2025–26 YTD</p>
    </div>
  );
}

function VarianceRow({ v, index }) {
  const [open, setOpen] = useState(false);
  const sev = {
    critical: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800/40', text: 'text-red-700 dark:text-red-400', badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400' },
    high:     { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800/40', text: 'text-amber-700 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400' },
    medium:   { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800/40', text: 'text-blue-700 dark:text-blue-400', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400' },
    low:      { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800/40', text: 'text-emerald-700 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400' },
  }[v.status];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl border ${sev.bg} ${sev.border} overflow-hidden`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          {v.variance < 0
            ? <TrendingDown size={13} className={sev.text} />
            : <TrendingUp size={13} className={sev.text} />}
          <div>
            <p className={`text-[12px] font-bold ${sev.text}`}>{v.pair}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Variance: <span className={`font-semibold ${sev.text}`}>{v.variance < 0 ? '-' : '+'}{fmtINR(Math.abs(v.variance))}</span>
              <span className="ml-1.5">{v.pct > 0 ? '+' : ''}{v.pct}%</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${sev.badge}`}>{v.status}</span>
          {open ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-inherit"
          >
            <p className={`px-3 py-2.5 text-[11.5px] leading-relaxed ${sev.text}`}>{v.note}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const CHART_COLORS = ['#7c3aed', '#6366f1', '#f59e0b', '#14b8a6', '#94a3b8'];

export default function DRMultiBookPanel() {
  const [tab, setTab] = useState('summary');

  const chartData = BOOKS.map((b, i) => ({
    name: b.label.split(' (')[0],
    amount: BOOK_AMOUNTS[b.id],
    color: CHART_COLORS[i],
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20">
        <div className="flex items-center gap-2">
          <BookOpen size={15} className="text-indigo-600 dark:text-indigo-400" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Multi-Book Compliance</p>
        </div>
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-semibold">
          5 books active
        </span>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0.5 px-3 py-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        {[
          { id: 'summary',  label: 'Book Summary' },
          { id: 'variance', label: 'Variances' },
          { id: 'deferred', label: 'Deferred Tax' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-[11.5px] font-semibold transition-all ${
              tab === t.id
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="p-4">
        <AnimatePresence mode="wait">
          {tab === 'summary' && (
            <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {BOOKS.slice(0, 4).map(b => <BookCard key={b.id} book={b} />)}
                <div className="col-span-2">
                  <BookCard book={BOOKS[4]} />
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-300 mb-2">Book Comparison Chart</p>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 100000).toFixed(0)}L`} width={44} />
                    <Tooltip
                      contentStyle={{ fontSize: 11, borderRadius: 8, border: 'none', background: '#1e293b', color: '#f1f5f9' }}
                      formatter={v => [fmtINR(v)]}
                    />
                    <Bar dataKey="amount" name="Depreciation" radius={[4, 4, 0, 0]}>
                      {chartData.map((d, i) => (
                        <rect key={i} fill={d.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {tab === 'variance' && (
            <motion.div key="variance" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mb-3">
                Book-to-book variance analysis identifies timing differences, method divergences, and deferred tax exposure.
              </p>
              {VARIANCES.map((v, i) => <VarianceRow key={v.pair} v={v} index={i} />)}
            </motion.div>
          )}

          {tab === 'deferred' && (
            <motion.div key="deferred" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
                  <p className="text-[13px] font-bold text-amber-800 dark:text-amber-300">Deferred Tax Exposure</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Timing Difference', value: fmtINR(DEFERRED_TAX.timing), color: 'text-amber-700 dark:text-amber-400' },
                    { label: 'Effective Rate',     value: `${DEFERRED_TAX.rate}%`,     color: 'text-amber-700 dark:text-amber-400' },
                    { label: 'Total DTL',          value: fmtINR(DEFERRED_TAX.liability),   color: 'text-rose-700 dark:text-rose-400' },
                    { label: 'Recognized',         value: fmtINR(DEFERRED_TAX.recognized),  color: 'text-emerald-700 dark:text-emerald-400' },
                  ].map(m => (
                    <div key={m.label} className="bg-white dark:bg-slate-800 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800/40">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">{m.label}</p>
                      <p className={`text-[13px] font-bold tabular-nums ${m.color}`}>{m.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 rounded-xl p-3 mb-3">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-bold text-rose-800 dark:text-rose-300">Unrecognized DTL</p>
                  <p className="text-[14px] font-bold text-rose-700 dark:text-rose-400 tabular-nums">{fmtINR(DEFERRED_TAX.unrecognized)}</p>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                  Requires recognition in current period. Inform CFO and Tax Counsel before period close.
                </p>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Info size={11} className="text-blue-600 dark:text-blue-400" />
                  <p className="text-[11px] font-bold text-blue-700 dark:text-blue-400">Ind AS 12 Compliance Note</p>
                </div>
                <p className="text-[11px] text-blue-600 dark:text-blue-300 leading-relaxed">
                  Under Ind AS 12, all temporary differences between tax base and carrying amounts must be recognized as deferred tax. The IT Act block WDV method consistently generates higher allowances than the IFRS carrying amount, creating a cumulative DTL that must be tracked quarterly.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
