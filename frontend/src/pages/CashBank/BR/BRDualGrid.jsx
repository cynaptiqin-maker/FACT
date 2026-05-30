import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, CheckCircle2, XCircle, AlertCircle,
  Sparkles, ChevronDown, ChevronRight, MoreHorizontal, Link2,
  AlertOctagon, Clock, GitMerge, Eye, FileText,
} from 'lucide-react';
import { MOCK_SYSTEM_TXNS, MOCK_BANK_TXNS, MATCH_STATUS, fmtINR } from './BRConstants';

const statusChip = (status) => {
  const s = MATCH_STATUS[status];
  if (!s) return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold border ${s.bg} ${s.text} ${s.border} whitespace-nowrap`}>
      <span className={`w-1 h-1 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
};

const riskBadge = (level, score) => {
  const colors = { CRITICAL: 'text-red-400', HIGH: 'text-orange-400', MEDIUM: 'text-amber-400', LOW: 'text-emerald-400' };
  return (
    <span className={`text-[10px] font-semibold ${colors[level] || 'text-slate-400'}`}>{score ?? '—'}</span>
  );
};

const confBar = (conf) => {
  if (!conf) return <span className="text-[10px] text-slate-400">—</span>;
  const color = conf >= 90 ? 'bg-emerald-400' : conf >= 70 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${conf}%` }} />
      </div>
      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{conf}%</span>
    </div>
  );
};

// ─── SYSTEM TRANSACTION ROW ──────────────────────────────────────────────────
function SystemRow({ txn, selected, onSelect, highlighted, onHighlight, onOpen, matchedBankId }) {
  const [expanded, setExpanded] = useState(false);
  const isMatched = !!txn.matchId;
  const isCredit  = txn.cr > 0;

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseEnter={() => onHighlight(txn.matchId)}
        onMouseLeave={() => onHighlight(null)}
        onClick={() => setExpanded(e => !e)}
        className={`group transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60 ${
          highlighted === txn.id || highlighted === txn.matchId
            ? 'bg-indigo-50/80 dark:bg-indigo-500/10'
            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
        } ${txn.status === 'EXCEPTION' ? 'bg-orange-50/40 dark:bg-orange-500/5' : ''}`}
      >
        <td className="pl-3 pr-1 py-2.5 w-8" onClick={e => { e.stopPropagation(); onSelect(txn.id); }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-500 focus:ring-indigo-400"
          />
        </td>
        <td className="px-2 py-2.5 w-7">
          {isCredit
            ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            : <ArrowUpRight  className="w-3.5 h-3.5 text-red-500" />}
        </td>
        <td className="px-2 py-2.5 min-w-[100px]">
          <div className="text-[11px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate">{txn.ref}</div>
          <div className="text-[10px] text-slate-400">{txn.date} · {txn.time?.slice(0,5)}</div>
        </td>
        <td className="px-2 py-2.5 min-w-[140px]">
          <div className="text-xs text-slate-700 dark:text-slate-200 truncate max-w-[160px]" title={txn.narration}>{txn.narration}</div>
          <div className="text-[10px] text-slate-400">{txn.source?.replace('_', ' ')} · {txn.method}</div>
        </td>
        <td className="px-2 py-2.5 text-right w-24">
          {isCredit
            ? <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(txn.cr)}</span>
            : <span className="text-xs font-bold text-red-600 dark:text-red-400">{fmtINR(txn.dr)}</span>}
        </td>
        <td className="px-2 py-2.5 w-28">{statusChip(txn.status)}</td>
        <td className="px-2 py-2.5 w-20">{confBar(txn.confidence)}</td>
        <td className="px-2 py-2.5 w-10">{riskBadge(txn.riskLevel, txn.riskScore)}</td>
        <td className="pr-3 py-2.5 w-16">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onOpen(txn, 'sys'); }}
              className="p-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              title="View detail"
            >
              <Eye className="w-3 h-3" />
            </button>
            {isMatched && (
              <button
                onClick={e => { e.stopPropagation(); onHighlight(txn.matchId); }}
                className="p-1 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                title="Highlight match"
              >
                <Link2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </td>
      </motion.tr>

      {/* Expanded row */}
      <AnimatePresence>
        {expanded && (
          <motion.tr
            key={`${txn.id}-exp`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={9} className="bg-indigo-50/60 dark:bg-indigo-500/5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="px-4 py-3 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 mb-0.5">Branch / Dept</div>
                  <div className="font-medium text-slate-700 dark:text-slate-200">{txn.branch} · {txn.department}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">GL Account</div>
                  <div className="font-medium text-slate-700 dark:text-slate-200 font-mono">{txn.glAccount}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Voucher / User</div>
                  <div className="font-medium text-slate-700 dark:text-slate-200">{txn.voucherNo} · {txn.user}</div>
                </div>
                {txn.matchId && (
                  <div className="col-span-2">
                    <div className="text-slate-400 mb-0.5">Matched Bank Ref</div>
                    <div className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">{txn.bankRef || txn.matchId}</div>
                  </div>
                )}
                {(txn.aiNote || txn.varianceReason) && (
                  <div className="col-span-3 flex items-start gap-2 p-2 rounded-lg bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/20">
                    <Sparkles className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 dark:text-slate-300">{txn.aiNote || txn.varianceReason}</span>
                  </div>
                )}
                <div className="col-span-3 flex gap-2">
                  <button onClick={() => onOpen(txn, 'sys')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-500/20 transition-colors">
                    <Eye className="w-3 h-3" /> Full Detail
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                    <GitMerge className="w-3 h-3" /> Match
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <FileText className="w-3 h-3" /> Adjust
                  </button>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── BANK TRANSACTION ROW ────────────────────────────────────────────────────
function BankRow({ txn, selected, onSelect, highlighted, onHighlight, onOpen }) {
  const [expanded, setExpanded] = useState(false);
  const isCredit = txn.type === 'CREDIT';

  return (
    <>
      <motion.tr
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseEnter={() => onHighlight(txn.matchId)}
        onMouseLeave={() => onHighlight(null)}
        onClick={() => setExpanded(e => !e)}
        className={`group transition-colors cursor-pointer border-b border-slate-100 dark:border-slate-800/60 ${
          highlighted === txn.id || highlighted === txn.matchId
            ? 'bg-indigo-50/80 dark:bg-indigo-500/10'
            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
        } ${txn.riskFlag ? 'bg-red-50/40 dark:bg-red-500/5' : ''}`}
      >
        <td className="pl-3 pr-1 py-2.5 w-8" onClick={e => { e.stopPropagation(); onSelect(txn.id); }}>
          <input
            type="checkbox"
            checked={selected}
            onChange={() => {}}
            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-500 focus:ring-indigo-400"
          />
        </td>
        <td className="px-2 py-2.5 w-7">
          {isCredit
            ? <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
            : <ArrowUpRight  className="w-3.5 h-3.5 text-red-500" />}
        </td>
        <td className="px-2 py-2.5 min-w-[110px]">
          <div className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 truncate">{txn.bankRef}</div>
          <div className="text-[10px] text-slate-400">{txn.date} · {txn.time?.slice(0,5)}</div>
        </td>
        <td className="px-2 py-2.5 min-w-[140px]">
          <div className="text-xs text-slate-700 dark:text-slate-200 truncate max-w-[160px]" title={txn.narration}>{txn.narration}</div>
          <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{txn.description}</div>
        </td>
        <td className="px-2 py-2.5 text-right w-24">
          {isCredit
            ? <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{fmtINR(txn.amount)}</span>
            : <span className="text-xs font-bold text-red-600 dark:text-red-400">{fmtINR(txn.amount)}</span>}
        </td>
        <td className="px-2 py-2.5 w-28">
          {statusChip(txn.status)}
          {txn.riskFlag && <AlertOctagon className="w-3 h-3 text-red-400 inline ml-1" />}
        </td>
        <td className="px-2 py-2.5 w-20">{confBar(txn.confidence)}</td>
        <td className="px-2 py-2.5 w-10">
          <span className={`text-[10px] font-semibold ${txn.riskFlag ? 'text-red-400' : 'text-emerald-400'}`}>
            {txn.riskFlag ? 'HIGH' : 'OK'}
          </span>
        </td>
        <td className="pr-3 py-2.5 w-16">
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={e => { e.stopPropagation(); onOpen(txn, 'bank'); }}
              className="p-1 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <Eye className="w-3 h-3" />
            </button>
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && (
          <motion.tr
            key={`${txn.id}-exp`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <td colSpan={9} className="bg-slate-50/60 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800/60">
              <div className="px-4 py-3 grid grid-cols-3 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 mb-0.5">Method</div>
                  <div className="font-medium text-slate-700 dark:text-slate-200">{txn.method}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Bank Reference</div>
                  <div className="font-medium text-slate-700 dark:text-slate-200 font-mono">{txn.bankRef}</div>
                </div>
                <div>
                  <div className="text-slate-400 mb-0.5">Description</div>
                  <div className="font-medium text-slate-700 dark:text-slate-200">{txn.description}</div>
                </div>
                {txn.matchId && (
                  <div className="col-span-2">
                    <div className="text-slate-400 mb-0.5">Matched System Entry</div>
                    <div className="font-medium text-emerald-600 dark:text-emerald-400 font-mono">{txn.matchId}</div>
                  </div>
                )}
                {(txn.riskNote || txn.aiNote || txn.varianceNote) && (
                  <div className="col-span-3 flex items-start gap-2 p-2 rounded-lg bg-red-500/5 border border-red-200 dark:border-red-500/20">
                    <AlertOctagon className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />
                    <span className="text-red-600 dark:text-red-400">{txn.riskNote || txn.aiNote || txn.varianceNote}</span>
                  </div>
                )}
                <div className="col-span-3 flex gap-2">
                  <button onClick={() => onOpen(txn, 'bank')} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[11px] font-medium border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-500/20 transition-colors">
                    <Eye className="w-3 h-3" /> Full Detail
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-medium border border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-500/20 transition-colors">
                    <GitMerge className="w-3 h-3" /> Match
                  </button>
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    <FileText className="w-3 h-3" /> Adjust
                  </button>
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── TABLE HEADER ────────────────────────────────────────────────────────────
function GridHeader({ allSelected, onSelectAll, side }) {
  return (
    <thead>
      <tr className="border-b-2 border-slate-200 dark:border-slate-700">
        <th className="pl-3 pr-1 py-2.5 w-8 text-left">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onSelectAll}
            className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-indigo-500 focus:ring-indigo-400"
          />
        </th>
        <th className="px-2 py-2.5 w-7" />
        <th className="px-2 py-2.5 text-left">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {side === 'sys' ? 'Reference' : 'Bank Ref'}
          </span>
        </th>
        <th className="px-2 py-2.5 text-left">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Narration</span>
        </th>
        <th className="px-2 py-2.5 text-right w-24">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</span>
        </th>
        <th className="px-2 py-2.5 w-28">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</span>
        </th>
        <th className="px-2 py-2.5 w-20">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Confidence</span>
        </th>
        <th className="px-2 py-2.5 w-10">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Risk</span>
        </th>
        <th className="pr-3 py-2.5 w-16" />
      </tr>
    </thead>
  );
}

// ─── MATCH STATUS LEGEND ──────────────────────────────────────────────────────
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
      {Object.entries(MATCH_STATUS).map(([k, v]) => (
        <div key={k} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${v.dot}`} />
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{v.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── DUAL GRID MAIN EXPORT ──────────────────────────────────────────────────
export default function BRDualGrid({ filters, selectedSys, selectedBank, onSelectSys, onSelectBank, onOpenDetail }) {
  const [highlight, setHighlight] = useState(null);

  const filteredSys = useMemo(() => {
    return MOCK_SYSTEM_TXNS.filter(t => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.ref?.toLowerCase().includes(q) &&
            !t.narration?.toLowerCase().includes(q) &&
            !t.source?.toLowerCase().includes(q) &&
            !t.method?.toLowerCase().includes(q)) return false;
      }
      if (filters.status && t.status !== filters.status) return false;
      if (filters.branch && t.branch !== filters.branch) return false;
      if (filters.type   && t.type !== filters.type)     return false;
      if (filters.source && t.source !== filters.source) return false;
      if (filters.risk   && t.riskLevel !== filters.risk) return false;
      if (filters.amtMin && (t.cr || t.dr) < Number(filters.amtMin)) return false;
      if (filters.amtMax && (t.cr || t.dr) > Number(filters.amtMax)) return false;
      if (filters.unmatchedOnly  && t.matchId)                    return false;
      if (filters.exceptionsOnly && t.status !== 'EXCEPTION')     return false;
      return true;
    });
  }, [filters]);

  const filteredBank = useMemo(() => {
    return MOCK_BANK_TXNS.filter(t => {
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!t.bankRef?.toLowerCase().includes(q) &&
            !t.narration?.toLowerCase().includes(q) &&
            !t.description?.toLowerCase().includes(q)) return false;
      }
      if (filters.status && t.status !== filters.status) return false;
      if (filters.method && t.method !== filters.method) return false;
      if (filters.amtMin && t.amount < Number(filters.amtMin)) return false;
      if (filters.amtMax && t.amount > Number(filters.amtMax)) return false;
      if (filters.unmatchedOnly  && t.matchId)                return false;
      if (filters.exceptionsOnly && t.status !== 'EXCEPTION') return false;
      if (filters.riskOnly       && !t.riskFlag)              return false;
      return true;
    });
  }, [filters]);

  const handleSelectAllSys  = () => {
    const allIds = filteredSys.map(t => t.id);
    const allSelected = allIds.every(id => selectedSys.includes(id));
    allSelected ? onSelectSys([]) : onSelectSys(allIds);
  };
  const handleSelectAllBank = () => {
    const allIds = filteredBank.map(t => t.id);
    const allSelected = allIds.every(id => selectedBank.includes(id));
    allSelected ? onSelectBank([]) : onSelectBank(allIds);
  };

  const sysTotal  = filteredSys.reduce((s, t)  => s + (t.cr || t.dr), 0);
  const bankCredit = filteredBank.filter(t => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
  const bankDebit  = filteredBank.filter(t => t.type === 'DEBIT').reduce((s, t)  => s + t.amount, 0);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Legend />

      {/* Dual panel container */}
      <div className="flex flex-1 overflow-hidden gap-0">
        {/* LEFT: System transactions */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-slate-200 dark:border-slate-700">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-indigo-500/8 to-transparent dark:from-indigo-500/12 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30 flex items-center justify-center">
                <ArrowDownLeft className="w-2.5 h-2.5 text-indigo-500" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">System Transactions</span>
              <span className="text-[10px] text-slate-400">(Books / Ledger)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">{filteredSys.length} entries</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{fmtINR(sysTotal, 'lakh')}</span>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse" style={{ minWidth: 640 }}>
              <GridHeader
                allSelected={filteredSys.length > 0 && filteredSys.every(t => selectedSys.includes(t.id))}
                onSelectAll={handleSelectAllSys}
                side="sys"
              />
              <tbody>
                {filteredSys.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
                      No system transactions match the current filters
                    </td>
                  </tr>
                ) : filteredSys.map(txn => (
                  <SystemRow
                    key={txn.id}
                    txn={txn}
                    selected={selectedSys.includes(txn.id)}
                    onSelect={id => onSelectSys(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    highlighted={highlight}
                    onHighlight={setHighlight}
                    onOpen={onOpenDetail}
                    matchedBankId={txn.matchId}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 text-xs">
            <div className="flex gap-4">
              <div><span className="text-slate-400">Receipts:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtINR(filteredSys.filter(t=>t.cr>0).reduce((s,t)=>s+t.cr,0),'lakh')}</span></div>
              <div><span className="text-slate-400">Payments:</span> <span className="font-semibold text-red-600 dark:text-red-400">{fmtINR(filteredSys.filter(t=>t.dr>0).reduce((s,t)=>s+t.dr,0),'lakh')}</span></div>
            </div>
            <div className="text-slate-400">{selectedSys.length > 0 && `${selectedSys.length} selected`}</div>
          </div>
        </div>

        {/* CENTER: Match indicator strip */}
        <div className="w-12 flex-shrink-0 flex flex-col items-center justify-start bg-gradient-to-b from-indigo-500/5 to-transparent dark:from-indigo-500/8 border-x border-slate-200 dark:border-slate-700 pt-4 gap-1.5">
          <div className="text-[9px] text-slate-400 writing-mode-vertical -rotate-90 whitespace-nowrap mt-4 font-semibold tracking-widest uppercase">Match Engine</div>
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 2, delay: i * 0.25, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400"
            />
          ))}
        </div>

        {/* RIGHT: Bank statement transactions */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-emerald-500/8 to-transparent dark:from-emerald-500/12 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center">
                <ArrowDownLeft className="w-2.5 h-2.5 text-emerald-500" />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Bank Statement</span>
              <span className="text-[10px] text-slate-400">(Imported)</span>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-slate-400">{filteredBank.length} entries</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{fmtINR(bankCredit,'lakh')}</span>
              <span className="font-semibold text-red-600 dark:text-red-400">-{fmtINR(bankDebit,'lakh')}</span>
            </div>
          </div>

          {/* Grid */}
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse" style={{ minWidth: 640 }}>
              <GridHeader
                allSelected={filteredBank.length > 0 && filteredBank.every(t => selectedBank.includes(t.id))}
                onSelectAll={handleSelectAllBank}
                side="bank"
              />
              <tbody>
                {filteredBank.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm">
                      No bank entries match the current filters
                    </td>
                  </tr>
                ) : filteredBank.map(txn => (
                  <BankRow
                    key={txn.id}
                    txn={txn}
                    selected={selectedBank.includes(txn.id)}
                    onSelect={id => onSelectBank(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
                    highlighted={highlight}
                    onHighlight={setHighlight}
                    onOpen={onOpenDetail}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex-shrink-0 text-xs">
            <div className="flex gap-4">
              <div><span className="text-slate-400">Credits:</span> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmtINR(bankCredit,'lakh')}</span></div>
              <div><span className="text-slate-400">Debits:</span>  <span className="font-semibold text-red-600 dark:text-red-400">{fmtINR(bankDebit,'lakh')}</span></div>
            </div>
            <div className="text-slate-400">{selectedBank.length > 0 && `${selectedBank.length} selected`}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
