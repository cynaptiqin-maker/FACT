import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery }          from '@tanstack/react-query';
import { accountingAPI }     from '@services/api';
import toast                 from 'react-hot-toast';
import { Download, Printer, ChevronDown, Loader2, ChevronsDownUp, ChevronsUpDown, Building2, CalendarDays } from 'lucide-react';
import clsx from 'clsx';

import {
  currentFYDates, buildDisplayRows, calcGrandTotals,
  calcDifference, applyTBFilters, TYPE_ORDER,
} from './TrialBalance/tbConstants';
import TBSummaryCards      from './TrialBalance/TBSummaryCards';
import TBControlPanel      from './TrialBalance/TBControlPanel';
import TBTable             from './TrialBalance/TBTable';
import TBValidationBanner  from './TrialBalance/TBValidationBanner';
import TBAnalyticsPanel    from './TrialBalance/TBAnalyticsPanel';
import LedgerDetailDrawer  from './Ledger/LedgerDetailDrawer';

// ─── Action button ────────────────────────────────────────────────────────────
function Btn({ icon: Icon, label, onClick, primary }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all',
        primary
          ? 'bg-brand-700 text-white border-brand-700 hover:bg-brand-800'
          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function CtxPill({ icon: Icon, label, value }) {
  return (
    <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="hidden sm:inline text-slate-400">{label}:</span>
      <span className="font-semibold text-slate-700">{value}</span>
      <ChevronDown className="w-3 h-3 text-slate-400" />
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TrialBalance() {
  const fy = currentFYDates();

  // ── Report parameters ──────────────────────────────────────────────────────
  const [params, setParams]       = useState({ from: fy.from, to: fy.to });
  const [search, setSearch]       = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [opts, setOpts]           = useState({
    showZero: false,
    showInactive: false,
    showOpening: true,
    showPeriod: false,
  });

  // ── Tree expand state ──────────────────────────────────────────────────────
  const [expandedTypes,  setExpandedTypes]  = useState(new Set(TYPE_ORDER));
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  // ── Drill-down ─────────────────────────────────────────────────────────────
  const [selectedLedger, setSelectedLedger] = useState(null);

  // ── Data fetch ─────────────────────────────────────────────────────────────
  const { data: raw, isLoading, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['trial-balance', params.from, params.to],
    queryFn: () =>
      accountingAPI.getTrialBalance({ from: params.from, to: params.to })
        .then(r => r.data?.data || r.data || {}),
    staleTime: 1000 * 60 * 5,
    keepPreviousData: true,
  });

  // Normalise: support both { accounts: [...] } and flat array
  const allAccounts = useMemo(() => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.accounts)) return raw.accounts;
    return [];
  }, [raw]);

  const apiTotals = useMemo(() => {
    if (!raw) return null;
    return raw.totals || null;
  }, [raw]);

  // ── Filtered + hierarchy ───────────────────────────────────────────────────
  const filtered = useMemo(
    () => applyTBFilters(allAccounts, search, typeFilter),
    [allAccounts, search, typeFilter],
  );

  const grandTotals = useMemo(
    () => apiTotals || calcGrandTotals(filtered),
    [apiTotals, filtered],
  );

  const diff     = useMemo(() => calcDifference(grandTotals), [grandTotals]);
  const balanced = diff < 0.01;

  const displayRows = useMemo(
    () => buildDisplayRows(filtered, expandedTypes, expandedGroups, opts.showZero),
    [filtered, expandedTypes, expandedGroups, opts.showZero],
  );

  const suspenseCount = useMemo(
    () => allAccounts.filter(a => (a.name || '').toLowerCase().includes('suspense') &&
      (parseFloat(a.closing_debit || 0) + parseFloat(a.closing_credit || 0)) > 0).length,
    [allAccounts],
  );

  // ── Tree controls ──────────────────────────────────────────────────────────
  const toggleType = useCallback((type) => {
    setExpandedTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((gKey) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(gKey) ? next.delete(gKey) : next.add(gKey);
      return next;
    });
  }, []);

  const expandAll = () => {
    setExpandedTypes(new Set(TYPE_ORDER));
    const allGroupKeys = new Set(
      allAccounts.map(a => `${(a.type || 'ASSET').toUpperCase()}::${a.parent_name || 'Ungrouped'}`)
    );
    setExpandedGroups(allGroupKeys);
  };

  const collapseAll = () => {
    setExpandedTypes(new Set());
    setExpandedGroups(new Set());
  };

  const handleSort = useCallback((key) => {
    setSort(s => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  }, []);

  // ── Warnings ───────────────────────────────────────────────────────────────
  const warnings = useMemo(() => {
    const w = [];
    if (!balanced) w.push(`Debit total ≠ Credit total. Difference: ₹${diff.toFixed(2)}`);
    if (suspenseCount > 0) w.push(`${suspenseCount} suspense account(s) have non-zero balances.`);
    return w;
  }, [balanced, diff, suspenseCount]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const header = ['Code', 'Name', 'Group', 'Type', 'Op.Debit', 'Op.Credit', 'Tx.Debit', 'Tx.Credit', 'Cl.Debit', 'Cl.Credit'];
    const rows   = filtered.map(a => [
      a.code, a.name, a.parent_name, a.type,
      a.opening_debit || 0, a.opening_credit || 0,
      a.period_debit  || 0, a.period_credit  || 0,
      a.closing_debit || 0, a.closing_credit || 0,
    ]);
    const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `trial-balance-${params.from}-to-${params.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} accounts`);
  };

  return (
    <div className="max-w-full space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Finance</span><span>›</span>
            <span>Reports</span><span>›</span>
            <span className="text-slate-600 font-medium">Trial Balance</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Trial Balance</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {fy.label} · Verify debit–credit equality across all accounts
            {isFetching && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Refreshing…
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CtxPill icon={Building2} label="Branch" value="All Branches" />
          <CtxPill icon={CalendarDays} label="FY" value={fy.label} />
          <div className="w-px h-6 bg-slate-200" />

          {/* Expand / Collapse all */}
          <button
            onClick={expandAll}
            title="Expand all"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Expand All</span>
          </button>
          <button
            onClick={collapseAll}
            title="Collapse all"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-50 transition-all"
          >
            <ChevronsDownUp className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Collapse All</span>
          </button>

          <Btn icon={Download} label="Export CSV" onClick={handleExport} />
          <Btn icon={Printer} label="Print" onClick={() => window.print()} />
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <TBSummaryCards
        totals={grandTotals}
        accountCount={filtered.length}
        suspenseCount={suspenseCount}
        generatedAt={dataUpdatedAt ? new Date(dataUpdatedAt).toISOString() : null}
        isLoading={isLoading}
      />

      {/* ── Control panel ───────────────────────────────────────────────────── */}
      <TBControlPanel
        params={params}
        onParamsChange={setParams}
        search={search}
        onSearch={setSearch}
        typeFilter={typeFilter}
        onTypeFilter={setTypeFilter}
        opts={opts}
        onOptsChange={setOpts}
        onRefresh={refetch}
        isFetching={isFetching}
      />

      {/* ── Validation banner ────────────────────────────────────────────────── */}
      {!isLoading && allAccounts.length > 0 && (
        <TBValidationBanner
          balanced={balanced}
          diff={diff}
          warnings={warnings}
        />
      )}

      {/* ── Main table ──────────────────────────────────────────────────────── */}
      <TBTable
        displayRows={displayRows}
        grandTotals={grandTotals}
        diff={diff}
        balanced={balanced}
        opts={opts}
        sort={sort}
        onSort={handleSort}
        expandedTypes={expandedTypes}
        expandedGroups={expandedGroups}
        onToggleType={toggleType}
        onToggleGroup={toggleGroup}
        onLedgerClick={setSelectedLedger}
        isLoading={isLoading}
        search={search}
      />

      {/* ── Analytics panel ─────────────────────────────────────────────────── */}
      {!isLoading && allAccounts.length > 0 && (
        <TBAnalyticsPanel
          accounts={filtered}
          balanced={balanced}
          diff={diff}
        />
      )}

      {/* ── Ledger drill-down drawer ─────────────────────────────────────────── */}
      {selectedLedger && (
        <LedgerDetailDrawer
          account={selectedLedger}
          onClose={() => setSelectedLedger(null)}
          onEdit={() => {}}
        />
      )}
    </div>
  );
}
