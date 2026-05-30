import React, { useState, useMemo, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Upload, Download, Sparkles, RefreshCw,
  Bell, ChevronDown, Building2, CalendarDays,
  Loader2, CheckCircle, AlertTriangle, History, Network,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { accountingAPI } from '@services/api';

import COAKPICards from './COA/COAKPICards';
import COASearchBar from './COA/COASearchBar';
import COATreeExplorer from './COA/COATreeExplorer';
import COADetailsDrawer from './COA/COADetailsDrawer';
import COAAIPanel from './COA/COAAIPanel';
import COACreateModal from './COA/COACreateModal';
import { flattenTree, SAMPLE_ACTIVITY } from './COA/coaConstants';
import CsvImportModal from '@components/shared/CsvImportModal';

// ── Tiny activity item ─────────────────────────────────────────────────────────
function ActivityItem({ event }) {
  const dot = { create: 'bg-emerald-500', update: 'bg-blue-500', import: 'bg-violet-500', approve: 'bg-emerald-500', disable: 'bg-red-500' };
  return (
    <div className="flex gap-2 py-2 border-b border-slate-100 last:border-0">
      <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[9px] font-bold', dot[event.type] || 'bg-slate-400')}>
        {event.avatar}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-700"><span className="font-semibold">{event.user}</span> {event.action}</p>
        <p className="text-xs text-slate-400 truncate">{event.target}</p>
        <p className="text-[10px] text-slate-300">{event.time}</p>
      </div>
    </div>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────────
function Btn({ icon: Icon, label, onClick, primary, ai, active, badge }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all',
        primary && 'bg-brand-700 text-white border-brand-700 hover:bg-brand-800',
        ai && 'bg-gradient-to-r from-violet-600 to-cyan-500 text-white border-0',
        !primary && !ai && 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
        active && !primary && !ai && 'bg-slate-100 border-slate-300 text-slate-800',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
      {badge > 0 && (
        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Context pill ───────────────────────────────────────────────────────────────
function CtxPill({ icon: Icon, label, value }) {
  return (
    <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors">
      <Icon className="w-3.5 h-3.5 text-slate-400" />
      <span className="hidden sm:inline text-slate-400">{label}:</span>
      <span className="font-semibold text-slate-700">{value}</span>
      <ChevronDown className="w-3 h-3 text-slate-400" />
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function ChartOfAccounts() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('tree');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAI, setShowAI] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showImport, setShowImport]     = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: treeData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['accounts-tree'],
    queryFn: () => accountingAPI.getAccountTree().then((r) => r.data.data),
    staleTime: 30_000,
  });

  const { data: parentAccounts } = useQuery({
    queryKey: ['accounts-groups'],
    queryFn: () => accountingAPI.getAccounts({ is_group: true, limit: 200 }).then((r) => r.data.data),
    staleTime: 60_000,
  });

  const createMutation = useMutation({
    mutationFn: (data) =>
      editAccount
        ? accountingAPI.updateAccount(editAccount.id, data)
        : accountingAPI.createAccount(data),
    onSuccess: () => {
      toast.success(editAccount ? 'Account updated' : 'Account created');
      queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
      queryClient.invalidateQueries({ queryKey: ['accounts-groups'] });
      setEditAccount(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Operation failed'),
  });

  const tree = treeData || [];
  const allFlat = useMemo(() => flattenTree(tree), [tree]);

  const stats = useMemo(() => ({
    total: allFlat.length,
    active: allFlat.filter((a) => a.is_active !== false).length,
    inactive: allFlat.filter((a) => a.is_active === false).length,
    groups: allFlat.filter((a) => a.is_group).length,
    unmapped: allFlat.filter((a) => !a.is_group && !a.department).length,
    pendingApproval: 0,
    recentlyModified: 3,
  }), [allFlat]);

  const filteredCount = useMemo(() => {
    let list = allFlat;
    if (search) { const q = search.toLowerCase(); list = list.filter((a) => a.name?.toLowerCase().includes(q) || a.code?.toLowerCase().includes(q)); }
    if (typeFilter !== 'ALL') list = list.filter((a) => a.type === typeFilter);
    if (statusFilter === 'active') list = list.filter((a) => a.is_active !== false);
    if (statusFilter === 'inactive') list = list.filter((a) => a.is_active === false);
    return list.length;
  }, [allFlat, search, typeFilter, statusFilter]);

  const handleSelect = useCallback((account) => {
    setSelectedAccount((prev) => prev?.id === account.id ? null : account);
    setShowAI(false);
  }, []);

  const handleToggleAI = useCallback(() => {
    setShowAI((s) => !s);
    setSelectedAccount(null);
  }, []);

  const handleKPIFilter = useCallback((filter) => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter(filter === 'active' ? 'active' : filter === 'inactive' ? 'inactive' : filter === 'groups' ? 'groups' : 'all');
  }, []);

  const isFiltering = search || typeFilter !== 'ALL' || statusFilter !== 'all';

  return (
    <div className="space-y-4">

      {/* ── Context bar ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CtxPill icon={Building2} label="Org" value="Apollo Healthcare" />
          <CtxPill icon={CalendarDays} label="FY" value="2025-26" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowActivity((s) => !s)}
            className={clsx(
              'relative p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors border border-transparent',
              showActivity && 'bg-white border-slate-200 text-slate-700',
            )}
          >
            <History className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />
          </button>
          <button className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Page header ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        {/* Title + actions */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-700 to-brand-600 flex items-center justify-center flex-shrink-0">
                <Network className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Chart of Accounts
                {isFetching && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </h1>
            </div>
            <p className="text-xs text-slate-500 ml-[42px]">
              Manage your enterprise financial structure across branches, departments and healthcare workflows.
            </p>
            <div className="flex items-center gap-3 ml-[42px] mt-2">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CheckCircle className="w-3 h-3 text-emerald-500" />
                {stats.active} active
              </span>
              <span className="w-px h-3 bg-slate-200" />
              <span className="text-xs text-slate-400">{stats.total} accounts</span>
              {stats.unmapped > 0 && (
                <>
                  <span className="w-px h-3 bg-slate-200" />
                  <span className="flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.unmapped} unmapped
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <Btn icon={Plus} label="Add Account" primary onClick={() => { setEditAccount(null); setShowCreateModal(true); }} />
            <Btn icon={Upload} label="Import" onClick={() => setShowImport(true)} />
            <Btn icon={Download} label="Export" onClick={() => toast('Preparing export…', { icon: '📊' })} />
            <Btn icon={Sparkles} label="AI Insights" ai={showAI} active={showAI} badge={4} onClick={handleToggleAI} />
            <button
              onClick={() => refetch()}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={clsx('w-3.5 h-3.5', isFetching && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <COAKPICards stats={stats} onFilter={handleKPIFilter} />
      </div>

      {/* ── Search + filters ──────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <COASearchBar
          search={search}
          onSearch={setSearch}
          typeFilter={typeFilter}
          onTypeFilter={setTypeFilter}
          statusFilter={statusFilter}
          onStatusFilter={setStatusFilter}
          viewMode={viewMode}
          onViewMode={setViewMode}
          resultCount={filteredCount}
          totalCount={allFlat.length}
          onAISearch={(q) => { setSearch(q); setShowAI(true); }}
        />
      </div>

      {/* ── Workspace ─────────────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">

        {/* Activity feed */}
        {showActivity && (
          <div className="w-56 flex-shrink-0 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-slate-700">Recent Activity</span>
            </div>
            <div className="px-3 py-1">
              {SAMPLE_ACTIVITY.map((e) => <ActivityItem key={e.id} event={e} />)}
            </div>
          </div>
        )}

        {/* Tree */}
        <div className="flex-1 min-w-0">
          <COATreeExplorer
            tree={tree}
            isLoading={isLoading}
            selectedAccount={selectedAccount}
            onSelect={handleSelect}
            search={search}
            typeFilter={typeFilter}
            statusFilter={statusFilter}
            viewMode={viewMode}
          />
        </div>

        {/* Right panel */}
        <AnimatePresence mode="wait">
          {selectedAccount && !showAI && (
            <div key="drawer" className="w-80 flex-shrink-0">
              <COADetailsDrawer
                account={selectedAccount}
                onClose={() => setSelectedAccount(null)}
                onEdit={(acc) => { setEditAccount(acc); setShowCreateModal(true); }}
              />
            </div>
          )}
          {showAI && (
            <div key="ai" className="w-80 flex-shrink-0">
              <COAAIPanel
                onClose={() => setShowAI(false)}
                accountCount={stats.total}
              />
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1 pb-2">
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Live
          </span>
          Last synced: just now
        </span>
        <span>
          {isFiltering && <span className="text-blue-500 mr-3">{filteredCount} of {allFlat.length} shown</span>}
          FinOS · COA v2
        </span>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <COACreateModal
            key="modal"
            editAccount={editAccount}
            parentAccounts={parentAccounts || []}
            onClose={() => { setShowCreateModal(false); setEditAccount(null); }}
            onSuccess={async (data) => createMutation.mutateAsync(data)}
          />
        )}
      </AnimatePresence>

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Chart of Accounts"
        templateFilename="coa_template.csv"
        templateHeaders={['code', 'name', 'type', 'parentCode', 'isGroup', 'description']}
        templateExample={[
          { code: '1000', name: 'Current Assets', type: 'ASSET', parentCode: '', isGroup: 'true', description: 'All current assets' },
          { code: '1001', name: 'Cash in Hand', type: 'ASSET', parentCode: '1000', isGroup: 'false', description: '' },
        ]}
        onImport={async (rows) => {
          const res = await accountingAPI.importAccounts(rows);
          queryClient.invalidateQueries({ queryKey: ['accounts-tree'] });
          return res.data.data;
        }}
      />
    </div>
  );
}
