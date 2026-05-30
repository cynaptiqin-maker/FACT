import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, BarChart3, ShieldCheck, Banknote, FolderKanban, Package, FileBarChart, AlertTriangle,
} from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function currentFY() {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${year}-${String(year + 1).slice(2)}`;
}

function Bar({ pct, color = '#16a34a' }) {
  return (
    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-2 rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Inline report renderers ──────────────────────────────────────────────────

function ReceiptSummaryView({ data }) {
  if (!data || !data.length) return <p className="text-sm text-gray-400 py-4">No receipt data for this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {['Currency', 'Purpose', 'No. of Receipts', 'Total Amount (₹)'].map(h => (
              <th key={h} className="text-left text-xs font-semibold text-gray-500 px-3 py-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
              <td className="px-3 py-2 font-semibold text-gray-700">{row.currency || '—'}</td>
              <td className="px-3 py-2 text-gray-600 capitalize">{row.purpose || '—'}</td>
              <td className="px-3 py-2 text-gray-600">{row.count || 0}</td>
              <td className="px-3 py-2 text-gray-800 font-semibold">{fmtINR(row.total_amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UtilisationSummaryView({ data }) {
  if (!data || !data.length) return <p className="text-sm text-gray-400 py-4">No utilisation data for this period.</p>;
  return (
    <div className="space-y-3">
      {data.map((row, i) => {
        const pct = row.total_budget > 0 ? (row.total_utilized / row.total_budget) * 100 : 0;
        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-gray-700 capitalize">{row.category || 'Unknown'}</span>
              <span className="text-gray-500">{fmtINR(row.total_utilized)} / {fmtINR(row.total_budget)} ({pct.toFixed(1)}%)</span>
            </div>
            <Bar pct={pct} />
          </div>
        );
      })}
    </div>
  );
}

function AdminCapView({ data }) {
  if (!data) return <p className="text-sm text-gray-400 py-4">No admin cap data for this period.</p>;
  const adminPct = data.admin_percent ?? 0;
  const breach = adminPct > 20;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-xs text-gray-500">Total FC Receipts</p>
          <p className="font-semibold text-gray-800">{fmtINR(data.total_receipts)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Admin Expenses</p>
          <p className="font-semibold text-gray-800">{fmtINR(data.admin_expenses)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Admin %</p>
          <p className={`font-bold text-lg ${breach ? 'text-red-600' : 'text-green-700'}`}>{adminPct.toFixed(2)}%</p>
        </div>
      </div>
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-500">Admin Cap Usage (20% limit)</span>
          <span className={breach ? 'text-red-600 font-semibold' : 'text-green-700'}>{adminPct.toFixed(2)}%</span>
        </div>
        <Bar pct={adminPct} color={breach ? '#dc2626' : '#16a34a'} />
        {breach && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <AlertTriangle size={11} /> Admin expenses exceed the 20% FCRA limit
          </p>
        )}
      </div>
      {data.monthly_trend && data.monthly_trend.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-2">Monthly Trend</p>
          <div className="flex gap-1 items-end h-12">
            {data.monthly_trend.map((m, i) => {
              const h = Math.min(100, (m.admin_percent / 25) * 100);
              return (
                <div key={i} title={`${m.month}: ${m.admin_percent?.toFixed(1)}%`} className="flex-1 rounded-t"
                  style={{ height: `${h}%`, backgroundColor: m.admin_percent > 20 ? '#fca5a5' : '#86efac', minHeight: 2 }} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function GenericTableView({ data, columns }) {
  if (!data || !data.length) return <p className="text-sm text-gray-400 py-4">No data for this period.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50">
            {columns.map(c => (
              <th key={c.key} className="text-left text-xs font-semibold text-gray-500 px-3 py-2 whitespace-nowrap">{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
              {columns.map(c => (
                <td key={c.key} className="px-3 py-2 text-gray-700">
                  {c.fmt ? c.fmt(row[c.key]) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Report card definitions ──────────────────────────────────────────────────

const REPORTS = [
  {
    id: 'receipts',
    icon: Banknote,
    title: 'FC Receipt Summary',
    description: 'Summary of all foreign receipts grouped by currency and purpose',
    fetch: (params) => fcraAPI.getReceiptsSummary(params).then(r => r.data),
    Render: ({ data }) => <ReceiptSummaryView data={data?.data || data} />,
  },
  {
    id: 'utilisation',
    icon: BarChart3,
    title: 'Utilisation Statement',
    description: 'Approved utilisations broken down by category and project',
    fetch: (params) => fcraAPI.getUtilisationSummary(params).then(r => r.data),
    Render: ({ data }) => <UtilisationSummaryView data={data?.data || data} />,
  },
  {
    id: 'admin_cap',
    icon: ShieldCheck,
    title: 'Admin Cap Report',
    description: 'Administrative expense percentage vs. the 20% FCRA limit with monthly trend',
    fetch: (params) => fcraAPI.getAdminCapReport(params).then(r => r.data),
    Render: ({ data }) => <AdminCapView data={data?.data || data} />,
  },
  {
    id: 'fc_balance',
    icon: FileText,
    title: 'FC Balance Report',
    description: 'Opening balance + Receipts − Utilisations = Closing balance',
    fetch: (params) => fcraAPI.getReceiptsSummary({ ...params, report: 'balance' }).then(r => r.data),
    Render: ({ data }) => {
      const d = data?.data || data;
      if (!d) return <p className="text-sm text-gray-400 py-4">No balance data available.</p>;
      const rows = Array.isArray(d) ? d : [d];
      return (
        <GenericTableView
          data={rows}
          columns={[
            { key: 'registration', label: 'Registration' },
            { key: 'opening_balance', label: 'Opening Balance', fmt: fmtINR },
            { key: 'total_receipts', label: 'FC Receipts', fmt: fmtINR },
            { key: 'total_utilized', label: 'Utilisations', fmt: fmtINR },
            { key: 'closing_balance', label: 'Closing Balance', fmt: fmtINR },
          ]}
        />
      );
    },
  },
  {
    id: 'project_fund',
    icon: FolderKanban,
    title: 'Project-wise Fund Report',
    description: 'Received vs. utilized amounts per project',
    fetch: (params) => fcraAPI.getUtilisationSummary({ ...params, groupBy: 'project' }).then(r => r.data),
    Render: ({ data }) => {
      const d = data?.data || data;
      if (!d || !d.length) return <p className="text-sm text-gray-400 py-4">No project data available.</p>;
      return (
        <div className="space-y-3">
          {d.map((p, i) => {
            const pct = p.received > 0 ? (p.utilized / p.received) * 100 : 0;
            return (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-gray-700">{p.project_name || p.project_code || `Project ${i + 1}`}</span>
                  <span className="text-gray-500">{fmtINR(p.utilized)} / {fmtINR(p.received)}</span>
                </div>
                <Bar pct={pct} />
              </div>
            );
          })}
        </div>
      );
    },
  },
  {
    id: 'asset_schedule',
    icon: Package,
    title: 'Asset Schedule',
    description: 'All FCRA assets with current values and status',
    fetch: (params) => fcraAPI.getAssets({ ...params, limit: 200 }).then(r => r.data),
    Render: ({ data }) => {
      const rows = data?.data || [];
      return (
        <GenericTableView
          data={rows}
          columns={[
            { key: 'asset_code', label: 'Code' },
            { key: 'asset_name', label: 'Asset Name' },
            { key: 'asset_category', label: 'Category' },
            { key: 'purchase_date', label: 'Purchased' },
            { key: 'purchase_amount', label: 'Purchase Value', fmt: fmtINR },
            { key: 'current_value', label: 'Current Value', fmt: fmtINR },
            { key: 'funded_by', label: 'Funded By' },
            { key: 'status', label: 'Status' },
          ]}
        />
      );
    },
  },
  {
    id: 'fc4_draft',
    icon: FileBarChart,
    title: 'FC-4 Draft Summary',
    description: 'Pre-filled FC-4 figures derived from actual transaction data',
    fetch: (params) => fcraAPI.getReceiptsSummary({ ...params, report: 'fc4_draft' }).then(r => r.data),
    Render: ({ data }) => {
      const d = data?.data || data;
      if (!d) return <p className="text-sm text-gray-400 py-4">No FC-4 data available.</p>;
      const items = Array.isArray(d) ? d : Object.entries(d).map(([k, v]) => ({ field: k, value: v }));
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">FC-4 Field</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">Value</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-600 capitalize">{String(row.field || '').replace(/_/g, ' ')}</td>
                  <td className="px-3 py-2 font-semibold text-gray-800">
                    {typeof row.value === 'number' ? fmtINR(row.value) : String(row.value ?? '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FCRAReports() {
  const [registrations, setRegistrations] = useState([]);
  const [fy, setFy] = useState(currentFY());
  const [regFilter, setRegFilter] = useState('');
  const [reportData, setReportData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [errorMap, setErrorMap] = useState({});

  useEffect(() => {
    fcraAPI.getRegistrations({ limit: 50 })
      .then(r => setRegistrations(r.data.data || []))
      .catch(() => {});
  }, []);

  async function generate(report) {
    setLoadingMap(m => ({ ...m, [report.id]: true }));
    setErrorMap(m => ({ ...m, [report.id]: null }));
    try {
      const params = { financial_year: fy };
      if (regFilter) params.registration_id = regFilter;
      const data = await report.fetch(params);
      setReportData(d => ({ ...d, [report.id]: data }));
    } catch (e) {
      setErrorMap(m => ({ ...m, [report.id]: e.response?.data?.message || 'Failed to generate report' }));
    } finally {
      setLoadingMap(m => ({ ...m, [report.id]: false }));
    }
  }

  // Derive a list of FY options (last 5 years)
  const fyOptions = (() => {
    const now = new Date();
    const baseYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    return Array.from({ length: 5 }, (_, i) => {
      const y = baseYear - i;
      return `${y}-${String(y + 1).slice(2)}`;
    });
  })();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <FileText size={20} className="text-green-600" /> FCRA Reports
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Generate compliance reports for MHA and internal use</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-center bg-white border border-gray-100 shadow-sm rounded-xl p-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Financial Year</label>
          <select
            value={fy}
            onChange={e => setFy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400"
          >
            {fyOptions.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        {registrations.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Registration</label>
            <select
              value={regFilter}
              onChange={e => setRegFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400"
            >
              <option value="">All Registrations</option>
              {registrations.map(r => <option key={r.id} value={r.id}>{r.organization_name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Report Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {REPORTS.map((report, i) => {
          const Icon = report.icon;
          const isLoading = !!loadingMap[report.id];
          const err = errorMap[report.id];
          const data = reportData[report.id];
          const hasData = data !== undefined && data !== null;

          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-green-50 shrink-0">
                    <Icon size={18} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm">{report.title}</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-snug">{report.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => generate(report)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-60 transition-opacity"
                  style={{ backgroundColor: '#16a34a' }}
                >
                  {isLoading
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                    : hasData ? 'Regenerate' : 'Generate'}
                </button>
              </div>

              {/* Inline result */}
              {(hasData || err) && (
                <div className="border-t border-gray-100 px-5 py-4">
                  {err ? (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertTriangle size={13} /> {err}
                    </div>
                  ) : (
                    <report.Render data={data} />
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
