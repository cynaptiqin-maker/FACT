import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Loader2, AlertCircle, LayoutList } from 'lucide-react';
import clsx from 'clsx';
import COAAccountNode, { COL } from './COAAccountNode';
import { ACCOUNT_TYPES, TYPE_CONFIG, flattenTree } from './coaConstants';

// ── Table column header ────────────────────────────────────────────────────────
function TH({ children, className }) {
  return (
    <span className={clsx(
      'text-[10px] font-semibold text-slate-400 uppercase tracking-wide select-none',
      className,
    )}>
      {children}
    </span>
  );
}

// ── Type section header ────────────────────────────────────────────────────────
function TypeSection({ type, accounts, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = TYPE_CONFIG[type] || {};
  const count = flattenTree(accounts).length;

  return (
    <div>
      {/* Section header row */}
      <button
        onClick={() => setOpen((s) => !s)}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 text-left',
          'bg-slate-50 border-y border-slate-100 hover:bg-slate-100 transition-colors',
        )}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.14 }} className="block">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </motion.span>
        <span className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dotColor)} />
        <span className="text-xs font-bold text-slate-700">{cfg.label}</span>
        <span className="text-xs text-slate-400 hidden sm:inline">— {cfg.description}</span>
        <span className={clsx(
          'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0',
          cfg.bg, cfg.text, cfg.border,
        )}>
          {count}
        </span>
      </button>

      {/* Section children */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            {accounts.map((account) => (
              <COAAccountNode
                key={account.id}
                account={account}
                depth={0}
                onSelect={() => {}} // passed down from parent via prop drilling — see below
                selected={null}
                searchTerm=""
                maxBalance={0}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ search }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
        {search ? <AlertCircle className="w-6 h-6 text-slate-400" /> : <LayoutList className="w-6 h-6 text-slate-300" />}
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-1">
        {search ? 'No accounts match' : 'No accounts yet'}
      </p>
      <p className="text-xs text-slate-400 max-w-56">
        {search ? 'Try different keywords or clear the filter.' : 'Create your first account group to get started.'}
      </p>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="w-4 h-4 rounded bg-slate-100" />
          <div className="w-5 h-5 rounded bg-slate-100" />
          <div className="flex-1 h-3 rounded bg-slate-100" style={{ maxWidth: `${35 + (i % 4) * 12}%` }} />
          <div className="w-14 h-3 rounded bg-slate-100" />
          <div className="w-12 h-4 rounded bg-slate-100" />
          <div className="w-16 h-3 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function COATreeExplorer({
  tree,
  isLoading,
  selectedAccount,
  onSelect,
  search,
  typeFilter,
  statusFilter,
  viewMode,
}) {
  const allFlat = useMemo(() => flattenTree(tree || []), [tree]);

  // Flat filtered list (used when search/filter active)
  const filteredFlat = useMemo(() => {
    const isFiltering = search || typeFilter !== 'ALL' || (statusFilter && statusFilter !== 'all');
    if (!isFiltering) return null; // null = show tree

    let list = allFlat;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) => a.name?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q),
      );
    }
    if (typeFilter !== 'ALL') list = list.filter((a) => a.type === typeFilter);
    if (statusFilter === 'active') list = list.filter((a) => a.is_active !== false);
    if (statusFilter === 'inactive') list = list.filter((a) => a.is_active === false);
    if (statusFilter === 'groups') list = list.filter((a) => a.is_group);
    if (statusFilter === 'ledgers') list = list.filter((a) => !a.is_group);
    return list;
  }, [allFlat, search, typeFilter, statusFilter]);

  const isFiltering = filteredFlat !== null;
  const showFlat = isFiltering || viewMode === 'flat';

  // Group tree roots by type
  const grouped = useMemo(() => {
    const g = {};
    ACCOUNT_TYPES.forEach((t) => { g[t] = []; });
    (tree || []).forEach((n) => { if (g[n.type]) g[n.type].push(n); });
    return g;
  }, [tree]);

  const maxBalance = useMemo(() => {
    const vals = allFlat
      .filter((a) => !a.is_group && a.current_balance != null)
      .map((a) => Math.abs(parseFloat(a.current_balance)));
    return Math.max(...vals, 1);
  }, [allFlat]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* ── Column header row ── */}
      <div className="flex items-center border-b border-slate-200 bg-slate-50 px-3 py-2 sticky top-0 z-10">
        {/* Name column — flex-1 */}
        <div className="flex-1 min-w-0 pl-[10px]">
          <TH>Account Name</TH>
        </div>
        {/* Right columns — fixed widths matching COL */}
        <TH className={clsx(COL.code, 'flex-shrink-0')}>Code</TH>
        <TH className={clsx(COL.type, 'flex-shrink-0 text-center')}>Type</TH>
        <TH className={clsx(COL.balance, 'flex-shrink-0 text-right pr-3')}>Balance</TH>
        <div className={clsx(COL.actions, 'flex-shrink-0')} />
      </div>

      {/* ── Content ── */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 440px)', minHeight: '300px' }}>
        {isLoading ? (
          <Skeleton />
        ) : showFlat ? (
          // Flat list (search / filter / flat-view mode)
          filteredFlat?.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            <div className="divide-y divide-slate-50">
              {(filteredFlat || allFlat).map((account) => {
                const cfg = TYPE_CONFIG[account.type] || {};
                const bal = account.current_balance != null ? parseFloat(account.current_balance) : null;
                return (
                  <div
                    key={account.id}
                    onClick={() => onSelect(account)}
                    className={clsx(
                      'flex items-center group cursor-pointer transition-colors',
                      selectedAccount?.id === account.id ? 'bg-blue-50' : 'hover:bg-slate-50',
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0 py-2 pl-3 pr-2">
                      <span className={clsx(
                        'w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[8px] font-bold',
                        cfg.bg, cfg.text,
                      )}>
                        {cfg.shortLabel}
                      </span>
                      <span className="text-sm text-slate-700 truncate">{account.name}</span>
                    </div>
                    <div className={clsx(COL.code, 'flex-shrink-0 py-2 text-[11px] font-mono text-slate-400')}>{account.code}</div>
                    <div className={clsx(COL.type, 'flex-shrink-0 py-2 flex justify-center')}>
                      <span className={clsx('text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border', cfg.bg, cfg.text, cfg.border)}>
                        {cfg.shortLabel}
                      </span>
                    </div>
                    <div className={clsx(COL.balance, 'flex-shrink-0 py-2 text-right pr-3 text-[11px] font-mono', bal != null && bal < 0 ? 'text-red-600' : 'text-slate-600')}>
                      {bal != null ? (new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(bal)) : '—'}
                    </div>
                    <div className={clsx(COL.actions, 'flex-shrink-0')} />
                  </div>
                );
              })}
            </div>
          )
        ) : !allFlat.length ? (
          <EmptyState search={search} />
        ) : (
          // Tree view grouped by type
          ACCOUNT_TYPES.map((type) => {
            const nodes = grouped[type] || [];
            if (!nodes.length) return null;
            return (
              <div key={type}>
                {/* Section header */}
                <TypeSectionWrapper
                  type={type}
                  nodes={nodes}
                  onSelect={onSelect}
                  selectedAccount={selectedAccount}
                  searchTerm={search}
                  maxBalance={maxBalance}
                />
              </div>
            );
          })
        )}
      </div>

      {/* ── Footer stats ── */}
      {allFlat.length > 0 && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/80 border-t border-slate-100">
          <span className="text-[11px] text-slate-400">
            {isFiltering
              ? `${filteredFlat?.length ?? 0} of ${allFlat.length} accounts`
              : `${allFlat.length} accounts total`}
          </span>
          <div className="flex items-center gap-3">
            {ACCOUNT_TYPES.map((t) => (
              <span key={t} className="flex items-center gap-1 text-[11px] text-slate-400">
                <span className={clsx('w-1.5 h-1.5 rounded-full', TYPE_CONFIG[t].dotColor)} />
                {(grouped[t] || []).length}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Separate component to hold the section open/close state
function TypeSectionWrapper({ type, nodes, onSelect, selectedAccount, searchTerm, maxBalance }) {
  const [open, setOpen] = useState(true);
  const cfg = TYPE_CONFIG[type] || {};
  const count = flattenTree(nodes).length;

  return (
    <>
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 border-y border-slate-100 hover:bg-slate-100 transition-colors"
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.14 }} className="block">
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </motion.span>
        <span className={clsx('w-2.5 h-2.5 rounded-full flex-shrink-0', cfg.dotColor)} />
        <span className="text-xs font-bold text-slate-700">{cfg.label}</span>
        <span className="text-xs text-slate-400 hidden md:inline ml-1">— {cfg.description}</span>
        <span className={clsx(
          'ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0',
          cfg.bg, cfg.text, cfg.border,
        )}>
          {count}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            {nodes.map((account) => (
              <COAAccountNode
                key={account.id}
                account={account}
                depth={0}
                onSelect={onSelect}
                selected={selectedAccount}
                searchTerm={searchTerm}
                maxBalance={maxBalance}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
