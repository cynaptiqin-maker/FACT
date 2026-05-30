import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, ChevronRight, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import { accountingAPI } from '@services/api';
import { ACCOUNT_TYPE_CONFIG } from './jvConstants';

const RECENT_KEY = 'jv_recent_accounts';
const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; } };
const addRecent = (acc) => {
  const list = [acc, ...getRecent().filter(a => a.id !== acc.id)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
};

export default function JVAccountPicker({ value, onChange, error, onNext, tabIndex }) {
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef  = useRef(null);
  const listRef   = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['accounts-jv-search', search],
    queryFn: () =>
      accountingAPI.getAccounts({ search, limit: 12, is_group: false })
        .then(r => r.data.data || []),
    enabled: open,
    staleTime: 30_000,
  });

  const accounts = data || [];
  const recent   = search ? [] : getRecent();
  const list     = search ? accounts : [...recent.slice(0, 3), ...accounts.filter(a => !recent.find(r => r.id === a.id))];
  const total    = list.length;

  useEffect(() => {
    setHighlighted(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${highlighted}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const select = useCallback((acc) => {
    const cfg  = ACCOUNT_TYPE_CONFIG[acc.type] || {};
    const label = `${acc.code} — ${acc.name}`;
    addRecent({ id: acc.id, label, code: acc.code, name: acc.name, type: acc.type });
    onChange({ id: acc.id, label, code: acc.code, name: acc.name, type: acc.type });
    setOpen(false);
    setSearch('');
    setHighlighted(0);
    onNext?.();
  }, [onChange, onNext]);

  const handleKeyDown = useCallback((e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); }
      return;
    }
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setHighlighted(h => Math.min(h + 1, total - 1)); break;
      case 'ArrowUp':   e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); break;
      case 'Enter':     e.preventDefault(); if (list[highlighted]) select(list[highlighted]); break;
      case 'Tab':       if (list[highlighted]) select(list[highlighted]); break;
      case 'Escape':    setOpen(false); setSearch(''); inputRef.current?.blur(); break;
    }
  }, [open, list, highlighted, total, select]);

  const display = open ? search : (value?.label || '');
  const typeCfg = value?.type ? (ACCOUNT_TYPE_CONFIG[value.type] || {}) : null;

  return (
    <div className="relative w-full">
      {/* Input trigger */}
      <div className={clsx(
        'flex items-center gap-2 px-2.5 h-9 border rounded-lg bg-white transition-all duration-150',
        error
          ? 'border-red-400 ring-1 ring-red-200'
          : open
            ? 'border-brand-500 ring-2 ring-brand-100'
            : 'border-slate-200 hover:border-slate-300',
      )}>
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input
          ref={inputRef}
          tabIndex={tabIndex}
          value={display}
          placeholder="Search ledger account…"
          autoComplete="off"
          onChange={e => { setSearch(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 text-sm font-medium text-slate-800 outline-none bg-transparent placeholder:text-slate-400 placeholder:font-normal"
        />
        {typeCfg && (
          <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-md flex-shrink-0', typeCfg.className)}>
            {typeCfg.short}
          </span>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => { setOpen(false); setSearch(''); }} />
          <div className="absolute top-full mt-1.5 left-0 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-40 overflow-hidden">
            {/* Section: Recent (when no search) */}
            {!search && recent.length > 0 && (
              <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Recent
                </p>
                {recent.slice(0, 3).map((acc, i) => (
                  <AccountRow key={acc.id} acc={acc} idx={i} highlighted={highlighted} onHover={setHighlighted} onSelect={select} />
                ))}
              </div>
            )}

            {/* Accounts list */}
            <div ref={listRef} className="max-h-52 overflow-y-auto py-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
                </div>
              ) : accounts.length === 0 && search ? (
                <div className="py-6 text-center">
                  <p className="text-sm text-slate-400">No accounts found</p>
                  <p className="text-xs text-slate-300 mt-1">Try a broader search term</p>
                </div>
              ) : (
                accounts.map((acc, i) => {
                  const globalIdx = recent.filter(r => !accounts.find(a => a.id === r.id)).length + i;
                  return (
                    <AccountRow
                      key={acc.id} acc={acc}
                      idx={!search ? recent.slice(0, 3).length + i : i}
                      highlighted={highlighted}
                      onHover={setHighlighted}
                      onSelect={select}
                    />
                  );
                })
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-slate-100 px-3 py-1.5 flex items-center gap-2 text-[10px] text-slate-400 bg-slate-50">
              <span className="font-mono">↑↓</span><span>navigate</span>
              <span className="mx-1">·</span>
              <span className="font-mono">↵</span><span>select</span>
              <span className="mx-1">·</span>
              <span className="font-mono">Esc</span><span>close</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AccountRow({ acc, idx, highlighted, onHover, onSelect }) {
  const cfg = ACCOUNT_TYPE_CONFIG[acc.type] || { short: '?', className: 'bg-slate-100 text-slate-500' };
  return (
    <button
      data-idx={idx}
      type="button"
      onMouseDown={() => onSelect(acc)}
      onMouseEnter={() => onHover(idx)}
      className={clsx(
        'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
        idx === highlighted ? 'bg-brand-50' : 'hover:bg-slate-50',
      )}
    >
      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0', cfg.className)}>
        {cfg.short}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{acc.name}</p>
        <p className="text-[10px] text-slate-400 font-mono">{acc.code}</p>
      </div>
      {idx === highlighted && <ChevronRight className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />}
    </button>
  );
}
