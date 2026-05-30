// ─── GST Returns — Enterprise Healthcare FinOS Workspace ──────────────────────
// Amber/Orange theme · GSTR-1 / GSTR-3B / GSTR-9 · AI-assisted filing
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, AlertCircle, CheckCircle2, Clock, IndianRupee, Calendar,
  Filter, Download, Send, RefreshCw, ChevronDown, Sparkles, Search,
  TrendingUp, TrendingDown, AlertTriangle, Eye, X, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import TaxAIPanel from './TaxAIPanel';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_KPIS = [
  { id: 'gstr1_pending', label: 'GSTR-1 Pending', value: 3, format: 'num', trend: 1, trendLabel: 'vs last month', color: '#f97316', icon: AlertCircle, aiFlag: false },
  { id: 'gstr3b_due', label: 'GSTR-3B Due', value: 1, format: 'num', trend: 0, trendLabel: 'due today', color: '#ef4444', icon: Clock, aiFlag: false },
  { id: 'itc', label: 'Input Tax Credit', value: 18_42_500, format: 'lakh', trend: 8.4, trendLabel: 'vs last qtr', color: '#10b981', icon: TrendingUp, aiFlag: true },
  { id: 'output_tax', label: 'Output Tax', value: 34_18_900, format: 'lakh', trend: 5.2, trendLabel: 'vs last qtr', color: '#f59e0b', icon: IndianRupee, aiFlag: false },
  { id: 'net_gst', label: 'Net GST Payable', value: 15_76_400, format: 'lakh', trend: 3.1, trendLabel: 'vs last qtr', color: '#f97316', icon: IndianRupee, aiFlag: false },
  { id: 'last_filed', label: 'Last Filed', value: 'GSTR-3B', format: 'label', date: '20 Apr 2026', color: '#6366f1', icon: CheckCircle2, aiFlag: false },
];

const MOCK_RETURNS = [
  { id: 'R001', type: 'GSTR-1',  period: 'Apr 2026', dueDate: '11 May 2026', status: 'Pending',   taxAmount: 34_18_900, action: 'File Now'   },
  { id: 'R002', type: 'GSTR-3B', period: 'Apr 2026', dueDate: '20 May 2026', status: 'Pending',   taxAmount: 15_76_400, action: 'File Now'   },
  { id: 'R003', type: 'GSTR-1',  period: 'Mar 2026', dueDate: '11 Apr 2026', status: 'Filed',     taxAmount: 31_55_200, action: 'View'       },
  { id: 'R004', type: 'GSTR-3B', period: 'Mar 2026', dueDate: '20 Apr 2026', status: 'Filed',     taxAmount: 14_22_800, action: 'View'       },
  { id: 'R005', type: 'GSTR-1',  period: 'Feb 2026', dueDate: '11 Mar 2026', status: 'Filed',     taxAmount: 29_80_100, action: 'View'       },
  { id: 'R006', type: 'GSTR-3B', period: 'Feb 2026', dueDate: '20 Mar 2026', status: 'Filed',     taxAmount: 13_40_600, action: 'View'       },
  { id: 'R007', type: 'GSTR-1',  period: 'Jan 2026', dueDate: '11 Feb 2026', status: 'Late',      taxAmount: 28_12_700, action: 'View'       },
  { id: 'R008', type: 'GSTR-9',  period: 'FY 2024-25', dueDate: '31 Dec 2025', status: 'Filed',   taxAmount: 3_24_80_000, action: 'View'    },
];

const MOCK_HSN = [
  { code: '9993', desc: 'Healthcare / Medical Services',        taxable: 2_18_40_000, igst: 0,         cgst: 0,         sgst: 0,         rate: '0%' },
  { code: '3004', desc: 'Pharmaceutical Preparations',         taxable: 48_20_000,   igst: 0,         cgst: 4_33_800,  sgst: 4_33_800,  rate: '18%' },
  { code: '9018', desc: 'Medical Instruments & Appliances',    taxable: 22_80_000,   igst: 2_05_200,  cgst: 1_02_600,  sgst: 1_02_600,  rate: '12%' },
  { code: '9019', desc: 'Mechano-Therapy Apparatus',           taxable: 8_40_000,    igst: 0,         cgst: 75_600,    sgst: 75_600,    rate: '18%' },
  { code: '8713', desc: 'Wheelchairs & Mobility Equipment',    taxable: 5_60_000,    igst: 28_000,    cgst: 0,         sgst: 0,         rate: '5%'  },
  { code: '9005', desc: 'Diagnostic Kits & Reagents',          taxable: 12_30_000,   igst: 0,         cgst: 1_10_700,  sgst: 1_10_700,  rate: '18%' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtINR(n) {
  if (n === undefined || n === null) return '—';
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000)    return `₹${(n / 1_00_000).toFixed(2)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

function StatusBadge({ status }) {
  const map = {
    Filed:   'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    Pending: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400',
    Late:    'bg-rose-100    text-rose-700    dark:bg-rose-900/40    dark:text-rose-400',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${map[status] || map.Pending}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === 'Filed' ? 'bg-emerald-500' : status === 'Late' ? 'bg-rose-500' : 'bg-amber-500'}`} />
      {status}
    </span>
  );
}

// ─── useCountUp ───────────────────────────────────────────────────────────────
import { useEffect, useRef } from 'react';
function useCountUp(target, duration = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    let start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(target * ease);
      if (pct < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ kpi, index }) {
  const animVal = useCountUp(typeof kpi.value === 'number' ? kpi.value : 0, 1000 + index * 70);
  const Icon = kpi.icon;
  const displayVal = () => {
    if (kpi.format === 'lakh') return fmtINR(animVal);
    if (kpi.format === 'num')  return Math.round(animVal).toString();
    if (kpi.format === 'label') return kpi.value;
    return animVal.toFixed(0);
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}
      className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 overflow-hidden cursor-pointer group"
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: kpi.color }} />
      {kpi.aiFlag && (
        <span className="absolute top-3 right-3 flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
          <Sparkles size={9} />AI
        </span>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${kpi.color}1a` }}>
          <Icon size={15} style={{ color: kpi.color }} />
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{kpi.label}</span>
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-50 font-mono tracking-tight mb-1">
        {displayVal()}
      </div>
      {kpi.format === 'label' ? (
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Date: {kpi.date}</div>
      ) : (
        <div className={`flex items-center gap-1 text-[11px] font-medium ${kpi.trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {kpi.trend > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          <span>{Math.abs(kpi.trend)}{kpi.format === 'pct' ? '' : '%'} {kpi.trendLabel}</span>
        </div>
      )}
    </motion.div>
  );
}

// ─── HSN Summary Table ────────────────────────────────────────────────────────
function HSNTable() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">HSN / SAC Summary</h3>
        <button
          onClick={() => toast.success('HSN report exported')}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <Download size={12} /> Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/60">
              {['HSN/SAC Code', 'Description', 'Rate', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total Tax'].map(h => (
                <th key={h} className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_HSN.map((row, i) => (
              <tr key={row.code} className={`border-t border-slate-100 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-800/20'}`}>
                <td className="px-4 py-2.5 font-mono font-semibold text-orange-600 dark:text-orange-400">{row.code}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300 max-w-xs truncate">{row.desc}</td>
                <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded font-semibold">{row.rate}</span></td>
                <td className="px-4 py-2.5 font-mono text-slate-700 dark:text-slate-300">{fmtINR(row.taxable)}</td>
                <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{row.igst > 0 ? fmtINR(row.igst) : '—'}</td>
                <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{row.cgst > 0 ? fmtINR(row.cgst) : '—'}</td>
                <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{row.sgst > 0 ? fmtINR(row.sgst) : '—'}</td>
                <td className="px-4 py-2.5 font-mono font-semibold text-orange-700 dark:text-orange-400">{fmtINR(row.igst + row.cgst + row.sgst)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-amber-50 dark:bg-amber-900/20 border-t-2 border-amber-200 dark:border-amber-800 font-semibold">
              <td className="px-4 py-2.5" colSpan={3}>Total</td>
              <td className="px-4 py-2.5 font-mono">{fmtINR(MOCK_HSN.reduce((s, r) => s + r.taxable, 0))}</td>
              <td className="px-4 py-2.5 font-mono">{fmtINR(MOCK_HSN.reduce((s, r) => s + r.igst, 0))}</td>
              <td className="px-4 py-2.5 font-mono">{fmtINR(MOCK_HSN.reduce((s, r) => s + r.cgst, 0))}</td>
              <td className="px-4 py-2.5 font-mono">{fmtINR(MOCK_HSN.reduce((s, r) => s + r.sgst, 0))}</td>
              <td className="px-4 py-2.5 font-mono text-orange-700 dark:text-orange-400">
                {fmtINR(MOCK_HSN.reduce((s, r) => s + r.igst + r.cgst + r.sgst, 0))}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Quick Filing Panel ───────────────────────────────────────────────────────
function QuickFilingPanel() {
  const [returnType, setReturnType] = useState('GSTR-3B');
  const [period, setPeriod] = useState('Apr 2026');
  const [filing, setFiling] = useState(false);

  const handleFile = () => {
    setFiling(true);
    toast.loading(`Filing ${returnType} for ${period}…`, { id: 'filing' });
    setTimeout(() => {
      setFiling(false);
      toast.success(`${returnType} for ${period} filed successfully on GSTN portal`, { id: 'filing' });
    }, 2200);
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
          <Send size={15} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Quick Filing</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">File returns directly to GSTN portal</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Return Type</label>
          <select
            value={returnType}
            onChange={e => setReturnType(e.target.value)}
            className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            <option>GSTR-1</option>
            <option>GSTR-3B</option>
            <option>GSTR-9</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Period</label>
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
          >
            {['Apr 2026','Mar 2026','Feb 2026','Jan 2026','Dec 2025'].map(p => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
      <button
        onClick={handleFile}
        disabled={filing}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {filing ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
        {filing ? 'Filing…' : `File ${returnType}`}
      </button>
      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-2 text-center">
        Ensure your DSC/EVC is ready before filing
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GSTReturns() {
  const [search, setSearch]           = useState('');
  const [typeFilter, setTypeFilter]   = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAI, setShowAI]           = useState(false);

  const filtered = useMemo(() => {
    return MOCK_RETURNS.filter(r => {
      const q = search.toLowerCase();
      if (q && !r.type.toLowerCase().includes(q) && !r.period.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'All' && r.type !== typeFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      return true;
    });
  }, [search, typeFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-5 pb-10">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-200 dark:shadow-orange-900/30">
            <FileText size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">GST Returns</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">GSTIN: 29AADCH1234M1Z5 · FY 2025-26 · Portal Status: <span className="text-emerald-500 font-semibold">Active</span></p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAI(s => !s)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${showAI ? 'bg-amber-500 text-white' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'}`}
          >
            <Sparkles size={13} /> AI Insights
          </button>
          <button onClick={() => toast.success('Refreshed from GSTN portal')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <RefreshCw size={13} /> Sync Portal
          </button>
          <button onClick={() => toast.success('GST report exported')} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {MOCK_KPIS.map((kpi, i) => <KPICard key={kpi.id} kpi={kpi} index={i} />)}
      </div>

      {/* ── Main Content + AI Panel ── */}
      <div className={`grid gap-4 ${showAI ? 'grid-cols-1 lg:grid-cols-[1fr_320px]' : 'grid-cols-1'}`}>
        <div className="flex flex-col gap-4">
          {/* ── Returns Table ── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {/* Filter Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search returns…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-300"
                />
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300">
                {['All','GSTR-1','GSTR-3B','GSTR-9'].map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-300">
                {['All','Filed','Pending','Late'].map(s => <option key={s}>{s}</option>)}
              </select>
              <span className="text-xs text-slate-400 ml-auto">{filtered.length} returns</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60">
                    {['Return Type','Period','Due Date','Status','Tax Amount','Action'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-t border-slate-100 dark:border-slate-800 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className="font-semibold text-orange-600 dark:text-orange-400 font-mono">{row.type}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{row.period}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${row.status === 'Pending' ? 'text-amber-600 dark:text-amber-400' : row.status === 'Late' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400'}`}>
                          {row.dueDate}
                        </span>
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">{fmtINR(row.taxAmount)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (row.action === 'File Now') toast.success(`Initiating filing for ${row.type} — ${row.period}`);
                            else toast(`Viewing ${row.type} — ${row.period}`);
                          }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                            row.action === 'File Now'
                              ? 'bg-orange-500 hover:bg-orange-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {row.action === 'File Now' ? <Send size={11} /> : <Eye size={11} />}
                          {row.action}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm">No returns match the selected filters.</div>
              )}
            </div>
          </div>

          {/* ── Bottom: HSN + Quick Filing ── */}
          <div className={`grid gap-4 ${showAI ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[1fr_280px]'}`}>
            <HSNTable />
            {!showAI && <QuickFilingPanel />}
          </div>
        </div>

        {/* ── AI Panel ── */}
        <AnimatePresence>
          {showAI && (
            <div className="flex flex-col gap-4">
              <TaxAIPanel onClose={() => setShowAI(false)} />
              <QuickFilingPanel />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
