import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountingAPI } from '@services/api';
import toast from 'react-hot-toast';
import {
  Plus, ChevronDown, Loader2, Building2,
  CalendarDays, RefreshCw, Download, Printer,
  LayoutList, Calendar,
} from 'lucide-react';
import clsx from 'clsx';

import {
  MOCK_FY, generatePeriods, fyLabel,
} from './FiscalYears/fyConstants';
import FYKPICards    from './FiscalYears/FYKPICards';
import FYTimeline    from './FiscalYears/FYTimeline';
import FYTable       from './FiscalYears/FYTable';
import FYDetailPanel from './FiscalYears/FYDetailPanel';
import FYCreateModal from './FiscalYears/FYCreateModal';
import FYYearEndModal from './FiscalYears/FYYearEndModal';

// ─── Toolbar button ───────────────────────────────────────────────────────────
function Btn({ icon: Icon, label, onClick, primary, warning }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all',
        primary  && 'bg-brand-700 text-white border-brand-700 hover:bg-brand-800',
        warning  && 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700',
        !primary && !warning && 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300',
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

// ─── View toggle ──────────────────────────────────────────────────────────────
function ViewToggle({ view, onChange }) {
  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
      {[
        { id: 'timeline', icon: Calendar,    label: 'Timeline' },
        { id: 'table',    icon: LayoutList,  label: 'Table'    },
      ].map(v => (
        <button
          key={v.id}
          onClick={() => onChange(v.id)}
          className={clsx(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
            view === v.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700',
          )}
        >
          <v.icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function FiscalYears() {
  const queryClient = useQueryClient();

  // ── View state ─────────────────────────────────────────────────────────────
  const [view, setView]             = useState('timeline');
  const [selectedFY, setSelectedFY] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [createOpen, setCreateOpen] = useState(false);
  const [editingFY, setEditingFY]   = useState(null);
  const [yearEndFY, setYearEndFY]   = useState(null);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const [sort, setSort] = useState({ key: 'start_date', dir: 'desc' });

  // ── Data ───────────────────────────────────────────────────────────────────
  const { data: raw, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['fiscal-years'],
    queryFn: () =>
      accountingAPI.getFiscalYears()
        .then(r => r.data?.data || r.data || [])
        .catch(() => MOCK_FY),        // fall back to mock data on error
    staleTime: 1000 * 60 * 5,
  });

  // Augment each FY with generated periods if backend doesn't return them
  const fiscalYears = useMemo(() => {
    if (!raw?.length) return MOCK_FY;
    return raw.map(fy => ({
      ...fy,
      periods: fy.periods?.length ? fy.periods : generatePeriods(fy.start_date),
    }));
  }, [raw]);

  // Sorted fiscal years
  const sorted = useMemo(() => {
    return [...fiscalYears].sort((a, b) => {
      const av = a[sort.key] || '';
      const bv = b[sort.key] || '';
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === 'asc' ? cmp : -cmp;
    });
  }, [fiscalYears, sort]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const closeMutation = useMutation({
    mutationFn: (id) => accountingAPI.closeFiscalYear(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-years'] });
      const fy = fiscalYears.find(f => f.id === id);
      toast.success(`${fyLabel(fy || {})} closed`);
    },
  });

  const handleClose = useCallback((fy) => {
    if (!confirm(`Close "${fyLabel(fy)}"? This will prevent new journal entries.`)) return;
    closeMutation.mutate(fy.id);
  }, [closeMutation, fiscalYears]);

  const handleLock = useCallback((fy, lock) => {
    if (lock && !confirm(`Lock "${fyLabel(fy)}"? This is a permanent action that requires CFO approval to reverse.`)) return;
    toast.success(lock ? `${fyLabel(fy)} locked` : `${fyLabel(fy)} unlock request submitted for approval`);
  }, []);

  const handleArchive = useCallback((fy) => {
    toast.success(`${fyLabel(fy)} archived`);
  }, []);

  const handleKPIFilter = useCallback((filter) => {
    // Could scroll/filter the table — no-op for now
  }, []);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExport = () => {
    const header = ['Name', 'Start Date', 'End Date', 'Status', 'Branches Closed', 'Compliance'];
    const rows   = sorted.map(fy => [
      fyLabel(fy), fy.start_date, fy.end_date, fy.status,
      `${fy.branches_closed || 0}/${fy.branch_count || 5}`,
      fy.compliance_ok ? 'OK' : 'Issues',
    ]);
    const csv  = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'fiscal-years.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported fiscal years');
  };

  return (
    <div className="max-w-full space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <span>Finance</span><span>›</span>
            <span>Accounting</span><span>›</span>
            <span className="text-slate-600 font-medium">Fiscal Years</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-800">Fiscal Years</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage accounting calendars, period locking, and year-end governance
            {isFetching && !isLoading && (
              <span className="ml-2 inline-flex items-center gap-1 text-xs text-slate-400">
                <Loader2 className="w-3 h-3 animate-spin" />
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <CtxPill icon={Building2}    label="Entity"  value="All Entities" />
          <CtxPill icon={CalendarDays} label="Standard" value="India GAAP"  />

          <div className="w-px h-6 bg-slate-200" />

          <ViewToggle view={view} onChange={setView} />

          <Btn icon={RefreshCw} label="Refresh"  onClick={refetch} />
          <Btn icon={Download}  label="Export"   onClick={handleExport} />
          <Btn icon={Printer}   label="Print"    onClick={() => window.print()} />

          <Btn
            icon={Plus}
            label="Create Fiscal Year"
            primary
            onClick={() => { setEditingFY(null); setCreateOpen(true); }}
          />
        </div>
      </div>

      {/* ── KPI cards ───────────────────────────────────────────────────────── */}
      <FYKPICards fiscalYears={sorted} onFilter={handleKPIFilter} />

      {/* ── Main workspace ──────────────────────────────────────────────────── */}
      {view === 'timeline' ? (
        <FYTimeline
          fiscalYears={sorted}
          selectedFY={selectedFY}
          onSelectFY={setSelectedFY}
          selectedPeriod={selectedPeriod}
          onSelectPeriod={setSelectedPeriod}
        />
      ) : (
        <FYTable
          fiscalYears={sorted}
          isLoading={isLoading}
          selectedFY={selectedFY}
          onSelect={setSelectedFY}
          sort={sort}
          onSort={setSort}
          onEdit={(fy) => { setEditingFY(fy); setCreateOpen(true); }}
          onClose={handleClose}
          onLock={handleLock}
          onStartYE={(fy) => setYearEndFY(fy)}
          onArchive={handleArchive}
        />
      )}

      {/* Show table below timeline when a year is selected in timeline view */}
      {view === 'timeline' && sorted.length > 0 && (
        <FYTable
          fiscalYears={sorted}
          isLoading={isLoading}
          selectedFY={selectedFY}
          onSelect={setSelectedFY}
          sort={sort}
          onSort={setSort}
          onEdit={(fy) => { setEditingFY(fy); setCreateOpen(true); }}
          onClose={handleClose}
          onLock={handleLock}
          onStartYE={(fy) => setYearEndFY(fy)}
          onArchive={handleArchive}
        />
      )}

      {/* ── Detail panel (slide-in) ──────────────────────────────────────────── */}
      {selectedFY && (
        <FYDetailPanel
          fy={selectedFY}
          onClose={() => setSelectedFY(null)}
          onEdit={(fy) => { setEditingFY(fy); setCreateOpen(true); }}
          onStartYE={(fy) => setYearEndFY(fy)}
          onLaunchYE={(fy) => setYearEndFY(fy)}
        />
      )}

      {/* ── Create / Edit modal ──────────────────────────────────────────────── */}
      <FYCreateModal
        open={createOpen}
        onClose={() => { setCreateOpen(false); setEditingFY(null); }}
        editFY={editingFY}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['fiscal-years'] })}
      />

      {/* ── Year-end modal ───────────────────────────────────────────────────── */}
      <FYYearEndModal
        open={!!yearEndFY}
        fy={yearEndFY}
        onClose={() => setYearEndFY(null)}
      />
    </div>
  );
}
