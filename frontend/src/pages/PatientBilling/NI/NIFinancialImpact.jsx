import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  BarChart2, ChevronDown, ChevronUp, ArrowRight,
  BookOpen, TrendingUp,
} from 'lucide-react';
import { NI_GL_ACCOUNTS, NI_SERVICE_CATALOG, fmt } from './NIConstants';

const DEPT_COLORS = ['#0284c7','#059669','#7c3aed','#d97706','#dc2626','#0891b2','#0d9488','#ea580c'];

function GLEntry({ entry }) {
  return (
    <div className={`flex items-center gap-3 py-1.5 border-b border-slate-50 last:border-0 ${entry.type === 'DR' ? '' : ''}`}>
      <span className={`text-[10px] font-bold w-6 shrink-0 ${entry.type === 'DR' ? 'text-sky-600' : 'text-emerald-600'}`}>
        {entry.type}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] font-mono text-slate-500">{entry.code}</div>
        <div className="text-xs text-slate-700 leading-tight truncate">{entry.name}</div>
      </div>
      <span className={`font-mono text-xs font-semibold shrink-0 ${entry.type === 'DR' ? 'text-sky-700' : 'text-emerald-700'}`}>
        {fmt(entry.amount)}
      </span>
    </div>
  );
}

function buildGLEntries(lineItems, patient, totals) {
  if (!lineItems.length) return [];
  const entries = [];

  // Debit side — who owes us
  if (patient?.insurance) {
    const insAmt = totals.insuranceCoverage ?? 0;
    const patAmt = (totals.netPayable ?? 0) - insAmt;
    if (insAmt > 0) entries.push({ type:'DR', ...NI_GL_ACCOUNTS.insuranceDebtors, amount:insAmt });
    if (patAmt > 0) entries.push({ type:'DR', ...NI_GL_ACCOUNTS.patientDebtors,   amount:patAmt });
  } else if (patient?.corporate) {
    entries.push({ type:'DR', ...NI_GL_ACCOUNTS.corporateDebtors, amount:totals.netPayable ?? 0 });
  } else {
    entries.push({ type:'DR', ...NI_GL_ACCOUNTS.patientDebtors,   amount:totals.netPayable ?? 0 });
  }

  // Credit side — revenue by category
  const categoryRevenue = {};
  lineItems.forEach(li => {
    const base = (li.qty||0) * (li.unitPrice||0);
    const disc = base * ((li.discPct||0)/100);
    const net  = base - disc;
    const cat  = li.category || 'CONSULTATION';
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + net;
  });

  const catToGL = {
    CONSULTATION: NI_GL_ACCOUNTS.revenueConsultation,
    LAB:          NI_GL_ACCOUNTS.revenueLab,
    RADIOLOGY:    NI_GL_ACCOUNTS.revenueRadiology,
    SURGERY:      NI_GL_ACCOUNTS.revenueOT,
    ICU:          NI_GL_ACCOUNTS.revenueICU,
    ROOM:         NI_GL_ACCOUNTS.revenueRoom,
    PHARMACY:     NI_GL_ACCOUNTS.revenuePharmacy,
  };

  Object.entries(categoryRevenue).forEach(([cat, amt]) => {
    if (amt > 0) {
      const gl = catToGL[cat] ?? NI_GL_ACCOUNTS.revenueConsultation;
      entries.push({ type:'CR', ...gl, amount:amt });
    }
  });

  if ((totals.totalTax ?? 0) > 0) {
    entries.push({ type:'CR', ...NI_GL_ACCOUNTS.gstPayable, amount:totals.totalTax });
  }
  if ((totals.totalDiscount ?? 0) > 0) {
    entries.push({ type:'DR', ...NI_GL_ACCOUNTS.discountAllowed, amount:totals.totalDiscount });
    const last = entries.find(e => e.type === 'CR');
    if (last) last.amount = Math.max(0, last.amount - totals.totalDiscount);
  }

  return entries;
}

function buildDeptAllocation(lineItems) {
  const alloc = {};
  lineItems.forEach(li => {
    const net = (li.qty||0) * (li.unitPrice||0) * (1 - (li.discPct||0)/100);
    const svc = NI_SERVICE_CATALOG.find(s => s.code === li.code);
    const label = svc?.category ?? li.category ?? 'Other';
    alloc[label] = (alloc[label] || 0) + net;
  });
  return Object.entries(alloc)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)
    .sort((a,b) => b.value - a.value);
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-slate-700">{payload[0].name}</div>
      <div className="font-mono font-bold text-sky-600 mt-0.5">{fmt(payload[0].value)}</div>
    </div>
  );
};

export default function NIFinancialImpact({ lineItems, patient, totals }) {
  const [expanded, setExpanded] = useState(false);

  const glEntries   = buildGLEntries(lineItems, patient, totals);
  const deptAlloc   = buildDeptAllocation(lineItems);
  const totalRevenue = deptAlloc.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(p => !p)}
        className="flex items-center justify-between w-full px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-indigo-100">
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
          </div>
          <span className="font-semibold text-sm text-slate-700">Financial Impact</span>
        </div>
        <div className="flex items-center gap-2">
          {totalRevenue > 0 && <span className="text-xs font-bold text-emerald-600">{fmt(totalRevenue)}</span>}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:'auto', opacity:1 }}
            exit={{   height:0, opacity:0 }}
            transition={{ duration:0.2 }}
            className="overflow-hidden"
          >
            {lineItems.length === 0 ? (
              <div className="px-4 pb-4 pt-2 text-center text-xs text-slate-400">
                Add line items to see GL impact preview.
              </div>
            ) : (
              <div className="px-4 pb-4 space-y-4">
                {/* Department allocation donut */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-sky-500" />
                    <span className="text-xs font-semibold text-slate-600">Revenue Allocation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ResponsiveContainer width={100} height={100}>
                      <PieChart>
                        <Pie data={deptAlloc} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={2}>
                          {deptAlloc.map((_, i) => (
                            <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1">
                      {deptAlloc.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[10px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background:DEPT_COLORS[i % DEPT_COLORS.length] }} />
                          <span className="text-slate-600 flex-1 truncate">{d.name}</span>
                          <span className="font-mono font-semibold text-slate-700">{fmt(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GL entry preview */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="text-xs font-semibold text-slate-600">GL Posting Preview</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[24px_1fr_auto] gap-0 px-3 py-1.5 bg-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <span>T</span><span>Account</span><span>Amount</span>
                    </div>
                    <div className="px-3 py-1 divide-y divide-slate-100">
                      {glEntries.map((e, i) => <GLEntry key={i} entry={e} />)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 px-1 text-[10px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <span className="font-bold text-sky-600">DR</span> = Debit &nbsp;
                      <span className="font-bold text-emerald-600">CR</span> = Credit
                    </span>
                    <span className="text-slate-400">Balanced: {fmt(glEntries.filter(e=>e.type==='DR').reduce((s,e)=>s+e.amount,0))} = {fmt(glEntries.filter(e=>e.type==='CR').reduce((s,e)=>s+e.amount,0))}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
