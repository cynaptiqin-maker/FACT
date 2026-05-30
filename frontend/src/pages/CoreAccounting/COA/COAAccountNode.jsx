import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, MoreHorizontal, Edit2, Copy,
  EyeOff, MoveRight, Merge, FileText, History,
  ArrowRight, Layers,
} from 'lucide-react';
import clsx from 'clsx';
import { TYPE_CONFIG, formatBalance } from './coaConstants';

// Tiny type icon box
function TypeDot({ type, isGroup }) {
  const cfg = TYPE_CONFIG[type] || {};
  return (
    <div className={clsx(
      'w-5 h-5 flex-shrink-0 rounded flex items-center justify-center text-[8px] font-bold',
      cfg.bg, cfg.text,
    )}>
      {isGroup ? <Layers className="w-3 h-3" /> : (cfg.shortLabel || type.slice(0, 3))}
    </div>
  );
}

// Context menu
function ContextMenu({ onClose }) {
  const actions = [
    { icon: Edit2, label: 'Edit account' },
    { icon: Copy, label: 'Duplicate' },
    { icon: FileText, label: 'View transactions' },
    { icon: History, label: 'Audit history' },
    { divider: true },
    { icon: EyeOff, label: 'Disable', destructive: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.1 }}
      className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5"
    >
      {actions.map((a, i) =>
        a.divider ? (
          <div key={i} className="my-1 border-t border-slate-100" />
        ) : (
          <button
            key={a.label}
            onClick={onClose}
            className={clsx(
              'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left',
              a.destructive ? 'text-red-600 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-50',
            )}
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
          </button>
        )
      )}
    </motion.div>
  );
}

// COL WIDTHS — must match COATreeExplorer header
export const COL = {
  code: 'w-[76px]',
  type: 'w-[58px]',
  balance: 'w-[108px]',
  actions: 'w-[72px]',
};

export default function COAAccountNode({
  account,
  depth = 0,
  onSelect,
  selected,
  searchTerm,
  maxBalance,
}) {
  const [expanded, setExpanded] = useState(depth < 2);
  const [showMenu, setShowMenu] = useState(false);
  const hasChildren = account.children?.length > 0;
  const cfg = TYPE_CONFIG[account.type] || {};
  const isSelected = selected?.id === account.id;

  // Highlight matching text
  const highlight = (text) => {
    if (!searchTerm || searchTerm.length < 2) return text;
    const re = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.split(re).map((part, i) =>
      re.test(part)
        ? <mark key={i} className="bg-yellow-200 text-yellow-900 rounded-sm px-0.5 not-italic">{part}</mark>
        : part
    );
  };

  const bal = account.current_balance != null ? parseFloat(account.current_balance) : null;
  const balPct = bal != null && maxBalance > 0 ? Math.min(Math.abs(bal) / maxBalance, 1) * 100 : 0;

  return (
    <div>
      {/* ── Row ── */}
      <div
        onClick={() => onSelect(account)}
        className={clsx(
          'flex items-center group cursor-pointer transition-colors duration-100',
          isSelected ? 'bg-blue-50' : 'hover:bg-slate-50',
          account.is_active === false && 'opacity-55',
        )}
      >
        {/* LEFT: indented name section — takes remaining width */}
        <div
          className="flex items-center gap-1.5 flex-1 min-w-0 py-1.5 pr-2"
          style={{ paddingLeft: `${depth * 18 + 10}px` }}
        >
          {/* Expand toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); if (hasChildren) setExpanded((s) => !s); }}
            className="w-4 h-4 flex-shrink-0 flex items-center justify-center"
          >
            {hasChildren ? (
              <motion.span animate={{ rotate: expanded ? 90 : 0 }} transition={{ duration: 0.14 }} className="block">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </motion.span>
            ) : (
              <span className="w-1 h-1 rounded-full bg-slate-200 block" />
            )}
          </button>

          <TypeDot type={account.type} isGroup={account.is_group} />

          <span className={clsx(
            'text-sm truncate',
            account.is_group ? 'font-semibold text-slate-800' : isSelected ? 'text-blue-800' : 'text-slate-700',
          )}>
            {highlight(account.name || '')}
            {account.is_group && account.children?.length > 0 && (
              <span className="ml-1 text-[10px] font-normal text-slate-400">
                ({account.children.length})
              </span>
            )}
          </span>

          {/* Tax badges */}
          {account.is_gst_applicable && (
            <span className="hidden xl:inline flex-shrink-0 text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-200 px-1 py-0.5 rounded">
              GST
            </span>
          )}
          {account.is_tds_applicable && (
            <span className="hidden xl:inline flex-shrink-0 text-[9px] font-bold bg-sky-50 text-sky-600 border border-sky-200 px-1 py-0.5 rounded">
              TDS
            </span>
          )}
        </div>

        {/* RIGHT: fixed-width columns — always aligned to header */}
        {/* Code */}
        <div className={clsx(COL.code, 'flex-shrink-0 py-1.5 pr-2')}>
          <span className="text-[11px] font-mono text-slate-400">
            {highlight(account.code || '')}
          </span>
        </div>

        {/* Type */}
        <div className={clsx(COL.type, 'flex-shrink-0 py-1.5 flex items-center justify-center')}>
          <span className={clsx(
            'text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border',
            cfg.bg, cfg.text, cfg.border,
          )}>
            {cfg.shortLabel}
          </span>
        </div>

        {/* Balance */}
        <div className={clsx(COL.balance, 'flex-shrink-0 py-1.5 flex items-center justify-end gap-1.5 pr-3')}>
          {bal != null && !account.is_group ? (
            <>
              {/* mini progress bar */}
              <div className="hidden lg:block w-10 h-1 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${balPct}%` }}
                  transition={{ duration: 0.5 }}
                  className={clsx('h-full rounded-full', bal < 0 ? 'bg-red-400' : 'bg-emerald-400')}
                />
              </div>
              <span className={clsx(
                'text-[11px] font-mono',
                bal < 0 ? 'text-red-600' : 'text-slate-600',
              )}>
                {formatBalance(bal)}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-slate-300">—</span>
          )}
        </div>

        {/* Actions — reveal on hover */}
        <div className={clsx(COL.actions, 'flex-shrink-0 py-1.5 flex items-center justify-end pr-2 gap-0.5')}>
          <AnimatePresence>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); onSelect(account); }}
                className="p-1 rounded hover:bg-blue-100 text-slate-300 hover:text-blue-600 transition-colors"
                title="Details"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors"
                title="Edit"
              >
                <Edit2 className="w-3 h-3" />
              </button>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu((s) => !s); }}
                  className="p-1 rounded hover:bg-slate-200 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>
                <AnimatePresence>
                  {showMenu && <ContextMenu onClose={() => setShowMenu(false)} />}
                </AnimatePresence>
              </div>
            </div>
          </AnimatePresence>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {hasChildren && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            {account.children.map((child) => (
              <COAAccountNode
                key={child.id}
                account={child}
                depth={depth + 1}
                onSelect={onSelect}
                selected={selected}
                searchTerm={searchTerm}
                maxBalance={maxBalance}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
