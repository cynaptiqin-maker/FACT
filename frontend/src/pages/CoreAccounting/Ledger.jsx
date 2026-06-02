import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingAPI } from '@services/api';
import toast from 'react-hot-toast';
import {
  Plus, Upload, Download, Printer, MoreHorizontal, RefreshCw,
  Building2, CalendarDays, ChevronDown, Loader2,
} from 'lucide-react';
import clsx from 'clsx';
import { applyFilters, applySort, QUICK_FILTERS } from './Ledger/ledgerConstants';
import LedgerKPICards from './Ledger/LedgerKPICards';
import LedgerFilterBar from './Ledger/LedgerFilterBar';
import LedgerTable from './Ledger/LedgerTable';
import LedgerDetailDrawer from './Ledger/LedgerDetailDrawer';
import LedgerCreateModal from './Ledger/LedgerCreateModal';
import CsvImportModal from '@components/shared/CsvImportModal';
import ConfirmModal from '@components/shared/ConfirmModal';

// ─── Toolbar button ───────────────────────────────────────────────────────────
function Btn({ icon: Icon, label, onClick, primary, ai, subtle }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
        primary && 'bg-brand-700 text-white border-brand-700 hover:bg-brand-800',
        ai && 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0 hover:opacity-90',
        subtle && 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
        !primary && !ai && !subtle && 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// ─── Context pill (branch / fiscal year selector) ─────────────────────────────
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
export default function LedgerManagement() {
  const queryClient = useQueryClient();

  // ── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', status: '', group: '' });
  const [toggles, setToggles] = useState({ activeOnly: false, showFrozen: false });
  const [quickFilter, setQuickFilter] = useState(QUICK_FILTERS[0]);
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' });

  const [selectedLedger, setSelectedLedger] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingLedger, setEditingLedger] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [showImport, setShowImport] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: raw, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['ledger-management'],
    queryFn: () =>
      accountingAPI.getAccounts({ is_group: false, limit: 2000 })
        .then(r => r.data?.data || r.data || []),
    staleTime: 1000 * 60 * 2,
  });

  const allAccounts = raw || [];

  // ── Derived: KPI stats ─────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const active = allAccounts.filter(a => a.is_active !== false && !a.is_frozen).length;
    const frozen = allAccounts.filter(a => a.is_frozen).length;

    let debitTotal = 0, creditTotal = 0;
    allAccounts.forEach(a => {
      const n = parseFloat(a.current_balance || 0);
      if (n > 0) debitTotal += n;
      else if (n < 0) creditTotal += Math.abs(n);
    });

    const recentlyModified = allAccounts.filter(a => {
      try { return new Date(a.updated_at) > weekAgo; } catch { return false; }
    }).length;

    return { total: allAccounts.length, active, frozen, debitTotal, creditTotal, recentlyModified };
  }, [allAccounts]);

  // ── Derived: filtered + sorted list ───────────────────────────────────────
  const displayData = useMemo(() => {
    const filtered = applyFilters(allAccounts, search, { ...filters, ...toggles }, quickFilter);
    return applySort(filtered, sort.key, sort.dir);
  }, [allAccounts, search, filters, toggles, quickFilter, sort]);

  // ── KPI filter shortcut ────────────────────────────────────────────────────
  const handleKPIFilter = useCallback((filterKey) => {
    if (filterKey === 'active') setFilters(f => ({ ...f, status: 'active' }));
    if (filterKey === 'frozen') setFilters(f => ({ ...f, status: 'frozen' }));
    if (filterKey === 'recent') setSearch('');
  }, []);

  // ── Row selection ──────────────────────────────────────────────────────────
  const handleSelectRow = useCallback((id, checked) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked) => {
    if (checked) {
      setSelectedRows(new Set(displayData.map(a => a.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [displayData]);

  // ── Freeze/unfreeze ────────────────────────────────────────────────────────
  const freezeMutation = useMutation({
    mutationFn: (account) =>
      accountingAPI.updateAccount(account.id, { is_frozen: !account.is_frozen }),
    onSuccess: (_, account) => {
      queryClient.invalidateQueries({ queryKey: ['ledger-management'] });
      toast.success(account.is_frozen ? 'Ledger unfrozen' : 'Ledger frozen');
    },
  });

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = useCallback((account) => {
    setConfirmDelete(account);
  }, []);

  const executeDelete = useCallback((account) => {
    accountingAPI.updateAccount(account.id, { is_active: false })
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ['ledger-management'] });
        toast.success('Ledger deactivated');
        if (selectedLedger?.id === account.id) setSelectedLedger(null);
      })
      .catch(() => toast.error('Failed to deactivate ledger'));
  }, [selectedLedger, queryClient]);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = displayData.map(a => [
      a.code, a.name, a.parent_name, a.type,
      a.opening_balance ?? 0, a.current_balance ?? 0,
      a.is_active !== false ? 'Active' : 'Inactive',
    ]);
    const header = ['Code', 'Name', 'Group', 'Type', 'Opening Balance', 'Current Balance', 'Status'];
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ledgers.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} ledgers`);
  };

  return (
    <div className="max-w-full space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Finance</span>
            <span>›</span>
            <span>Accounts</span>
            <span>›</span>
            <span className="text-slate-600 font-medium">Ledger Management</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Ledger Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage all ledger accounts · double-entry general ledger
            {isFetching && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" /> Syncing…
              </span>
            )}
          </p>
        </div>

        {/* Right action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Context pills */}
          <CtxPill icon={Building2} label="Branch" value="All Branches" />
          <CtxPill icon={CalendarDays} label="FY" value="2025–26" />

          <div className="w-px h-6 bg-slate-200" />

          <Btn icon={RefreshCw} label="Refresh" subtle onClick={() => refetch()} />
          <Btn icon={Download} label="Export" subtle onClick={handleExport} />
          <Btn icon={Upload} label="Import" subtle onClick={() => setShowImport(true)} />

          {/* More actions */}
          <div className="relative group">
            <button className="flex items-center gap-1 px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              <MoreHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">More</span>
            </button>
          </div>

          <Btn
            icon={Plus}
            label="Create Ledger"
            primary
            onClick={() => { setEditingLedger(null); setIsCreateOpen(true); }}
          />
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <LedgerKPICards stats={stats} onFilter={handleKPIFilter} />

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <LedgerFilterBar
        search={search}
        onSearch={(v) => { setSearch(v); setSelectedRows(new Set()); }}
        filters={filters}
        onFilter={(f) => { setFilters(f); setSelectedRows(new Set()); }}
        toggles={toggles}
        onToggle={(t) => { setToggles(t); setSelectedRows(new Set()); }}
        quickFilter={quickFilter}
        onQuickFilter={(qf) => { setQuickFilter(qf); setSelectedRows(new Set()); }}
        totalResults={displayData.length}
      />

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <LedgerTable
        data={displayData}
        isLoading={isLoading}
        sort={sort}
        onSort={setSort}
        onRowClick={(account) => { setSelectedLedger(account); }}
        onEdit={(account) => { setEditingLedger(account); setIsCreateOpen(true); }}
        onDelete={handleDelete}
        onFreeze={(account) => freezeMutation.mutate(account)}
        selectedRows={selectedRows}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
        search={search}
      />

      {/* ── Detail drawer ───────────────────────────────────────────────────── */}
      {selectedLedger && (
        <LedgerDetailDrawer
          account={selectedLedger}
          onClose={() => setSelectedLedger(null)}
          onEdit={(account) => { setEditingLedger(account); setIsCreateOpen(true); }}
        />
      )}

      {/* ── Create / Edit modal ─────────────────────────────────────────────── */}
      <LedgerCreateModal
        open={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingLedger(null); }}
        editAccount={editingLedger}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['ledger-management'] });
        }}
      />

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Ledger Accounts"
        templateFilename="ledger_accounts_template.csv"
        templateHeaders={['code', 'name', 'type', 'parentCode', 'isGroup', 'description']}
        templateExample={[
          { code: '1000', name: 'Current Assets', type: 'ASSET', parentCode: '', isGroup: 'true', description: 'All current assets' },
          { code: '1001', name: 'Cash in Hand', type: 'ASSET', parentCode: '1000', isGroup: 'false', description: '' },
        ]}
        onImport={async (rows) => {
          const res = await accountingAPI.importAccounts(rows);
          queryClient.invalidateQueries({ queryKey: ['ledger-management'] });
          return res.data.data;
        }}
      />

      <ConfirmModal
        open={Boolean(confirmDelete)}
        title="Deactivate Ledger"
        message={confirmDelete ? `Deactivate ledger "${confirmDelete.name}"? This cannot be undone.` : ''}
        confirmLabel="Deactivate"
        danger
        onConfirm={() => { executeDelete(confirmDelete); setConfirmDelete(null); }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
