import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import api from '@services/api';

const ENTITY_TYPES = [
  'all', 'registration', 'bank_account', 'donor', 'receipt',
  'project', 'utilisation', 'asset', 'compliance', 'fc4_filing',
];

const ACTIONS = ['all', 'create', 'update', 'approve', 'reject', 'verify', 'file'];

const ENTITY_CLR = {
  registration: { bg: '#dbeafe', fg: '#1e40af' },
  bank_account:  { bg: '#dcfce7', fg: '#166534' },
  donor:         { bg: '#fef9c3', fg: '#854d0e' },
  receipt:       { bg: '#f3e8ff', fg: '#6b21a8' },
  project:       { bg: '#ecfdf5', fg: '#065f46' },
  utilisation:   { bg: '#fff7ed', fg: '#9a3412' },
  asset:         { bg: '#f0fdf4', fg: '#166534' },
  compliance:    { bg: '#eff6ff', fg: '#1d4ed8' },
  fc4_filing:    { bg: '#fdf4ff', fg: '#86198f' },
};

const ACTION_CLR = {
  create:  { bg: '#dcfce7', fg: '#166534' },
  update:  { bg: '#dbeafe', fg: '#1e40af' },
  approve: { bg: '#f0fdf4', fg: '#065f46' },
  reject:  { bg: '#fee2e2', fg: '#991b1b' },
  verify:  { bg: '#fef9c3', fg: '#854d0e' },
  file:    { bg: '#f3e8ff', fg: '#6b21a8' },
};

function fmtTs(ts) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return ts; }
}

function truncUUID(id) {
  if (!id) return '—';
  if (id.length <= 12) return id;
  return id.slice(0, 8) + '…';
}

function diffCount(oldV, newV) {
  try {
    const o = typeof oldV === 'string' ? JSON.parse(oldV) : (oldV || {});
    const n = typeof newV === 'string' ? JSON.parse(newV) : (newV || {});
    const keys = new Set([...Object.keys(o), ...Object.keys(n)]);
    let count = 0;
    for (const k of keys) {
      if (JSON.stringify(o[k]) !== JSON.stringify(n[k])) count++;
    }
    return count;
  } catch { return null; }
}

function JsonDiff({ label, value, color }) {
  let formatted = '';
  try {
    const v = typeof value === 'string' ? JSON.parse(value) : value;
    formatted = JSON.stringify(v, null, 2);
  } catch {
    formatted = String(value || '{}');
  }
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-semibold mb-1" style={{ color }}>{label}</p>
      <pre
        className="text-[10px] leading-relaxed overflow-auto rounded-lg p-2 max-h-48"
        style={{ backgroundColor: color + '10', color: '#374151', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
      >
        {formatted || '{}'}
      </pre>
    </div>
  );
}

function LogRow({ log, index }) {
  const [expanded, setExpanded] = useState(false);
  const hasDiff = log.old_values !== undefined || log.new_values !== undefined;
  const changedFields = hasDiff ? diffCount(log.old_values, log.new_values) : null;

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.02 }}
        className={`border-b border-gray-50 transition-colors cursor-pointer ${expanded ? 'bg-green-50/40' : 'hover:bg-gray-50'}`}
        onClick={() => hasDiff && setExpanded(e => !e)}
      >
        <td className="px-4 py-3 whitespace-nowrap">
          <p className="text-xs text-gray-700">{fmtTs(log.created_at || log.timestamp)}</p>
        </td>
        <td className="px-4 py-3">
          {log.entity_type ? (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
              style={{
                backgroundColor: ENTITY_CLR[log.entity_type]?.bg || '#f3f4f6',
                color: ENTITY_CLR[log.entity_type]?.fg || '#374151',
              }}
            >
              {log.entity_type.replace(/_/g, ' ')}
            </span>
          ) : '—'}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-gray-500">{truncUUID(log.entity_id)}</td>
        <td className="px-4 py-3">
          {log.action ? (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
              style={{
                backgroundColor: ACTION_CLR[log.action]?.bg || '#f3f4f6',
                color: ACTION_CLR[log.action]?.fg || '#374151',
              }}
            >
              {log.action}
            </span>
          ) : '—'}
        </td>
        <td className="px-4 py-3 font-mono text-xs text-gray-500">{truncUUID(log.performed_by || log.user_id)}</td>
        <td className="px-4 py-3">
          {changedFields !== null ? (
            <span className="text-xs text-gray-600">{changedFields} field{changedFields !== 1 ? 's' : ''} changed</span>
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-gray-400">
          {hasDiff && (
            expanded
              ? <ChevronDown size={13} />
              : <ChevronRight size={13} />
          )}
        </td>
      </motion.tr>

      {/* Expanded diff row */}
      <AnimatePresence>
        {expanded && hasDiff && (
          <tr>
            <td colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex gap-4">
                  <JsonDiff label="Before" value={log.old_values} color="#dc2626" />
                  <JsonDiff label="After" value={log.new_values} color="#16a34a" />
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
}

export default function FCRAAuditLog() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState('all');
  const [action, setAction] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [error, setError] = useState('');
  const [is404, setIs404] = useState(false);

  const PAGE_SIZE = 50;

  const load = useCallback(async (pageNum = 1, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError(''); setIs404(false);
    try {
      const params = { limit: PAGE_SIZE, offset: (pageNum - 1) * PAGE_SIZE };
      if (entityType !== 'all') params.entity_type = entityType;
      if (action !== 'all') params.action = action;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const res = await api.get('/api/fcra/audit-logs', { params });
      const newRows = res.data.data || [];
      setRows(prev => append ? [...prev, ...newRows] : newRows);
      setTotal(res.data.total || 0);
      setPage(pageNum);
    } catch (e) {
      if (e.response?.status === 404) {
        setIs404(true);
        setRows([]);
        setTotal(0);
      } else {
        setError(e.response?.data?.message || 'Failed to load audit logs');
      }
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  }, [entityType, action, fromDate, toDate]);

  useEffect(() => { load(1); }, [entityType, action, fromDate, toDate]);

  const hasMore = rows.length < total;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck size={20} className="text-green-600" /> FCRA Audit Trail
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {is404 ? 'Audit log endpoint not yet available' : `${total} event${total !== 1 ? 's' : ''} · read-only`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end bg-white border border-gray-100 shadow-sm rounded-xl p-4">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Entity Type</label>
          <select
            value={entityType}
            onChange={e => setEntityType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400"
          >
            {ENTITY_TYPES.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All Types' : t.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Action</label>
          <select
            value={action}
            onChange={e => setAction(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400"
          >
            {ACTIONS.map(a => (
              <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400"
          />
        </div>

        {(fromDate || toDate || entityType !== 'all' || action !== 'all') && (
          <button
            onClick={() => { setEntityType('all'); setAction('all'); setFromDate(''); setToDate(''); }}
            className="px-3 py-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          <AlertTriangle size={15} /> {error}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : is404 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 text-center">
          <ShieldCheck size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium">Audit log endpoint not yet available</p>
          <p className="text-xs text-gray-400 mt-1">The /api/fcra/audit-logs route has not been implemented yet</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Timestamp', 'Entity Type', 'Entity ID', 'Action', 'Performed By', 'Changes', ''].map(h => (
                      <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((log, i) => (
                    <LogRow key={log.id || i} log={log} index={i} />
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 && !is404 && (
              <div className="py-16 text-center">
                <ShieldCheck size={36} className="mx-auto text-gray-200 mb-3" />
                <p className="text-gray-500 font-medium">No audit events found</p>
                <p className="text-xs text-gray-400 mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => load(page + 1, true)}
                disabled={loadingMore}
                className="flex items-center gap-2 px-5 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-60 text-gray-700"
              >
                {loadingMore
                  ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  : null}
                {loadingMore ? 'Loading…' : `Load more (${total - rows.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
