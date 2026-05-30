import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Plus, Edit2, X, Save, CheckCircle2, AlertCircle, Clock, AlertTriangle } from 'lucide-react';
import api, { fcraAPI } from '@services/api';

const TYPE_LABELS = {
  fc4_filing:    'FC-4 Filing',
  renewal:       'Registration Renewal',
  intimation:    'MHA Intimation',
  audit:         'Audit',
  bank_statement:'Bank Statement',
  mha_query:     'MHA Query Response',
  other:         'Other',
};
const STATUS_CLR = {
  pending:     { bg: '#fef9c3', fg: '#854d0e' },
  in_progress: { bg: '#dbeafe', fg: '#1e40af' },
  completed:   { bg: '#dcfce7', fg: '#166534' },
  overdue:     { bg: '#fee2e2', fg: '#991b1b' },
  waived:      { bg: '#f3f4f6', fg: '#374151' },
};

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
    </div>
  );
}

function ComplianceDrawer({ item, registrations, onClose, onSave }) {
  const isNew = !item?.id;
  const [form, setForm] = useState(item || {
    registration_id: registrations[0]?.id || '', compliance_type: 'fc4_filing',
    title: '', description: '', due_date: '', completed_date: '',
    status: 'pending', reminder_days: 30, financial_year: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.title || !form.due_date) { setErr('Title and due date are required'); return; }
    setSaving(true); setErr('');
    try {
      if (isNew) await fcraAPI.createCompliance(form);
      else await fcraAPI.updateCompliance(item.id, form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function complete() {
    setSaving(true);
    try {
      await fcraAPI.completeCompliance(item.id, { completed_date: form.completed_date || new Date().toISOString().split('T')[0] });
      onSave();
    } catch (e) { setErr(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <h2 className="font-semibold text-white">{isNew ? 'New Compliance Item' : 'Edit Compliance'}</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">FCRA Registration</label>
          <select value={form.registration_id} onChange={e => set('registration_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            {registrations.map(r => <option key={r.id} value={r.id}>{r.organization_name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
            <select value={form.compliance_type} onChange={e => set('compliance_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {Object.keys(STATUS_CLR).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <Field label="Title *" value={form.title} onChange={v => set('title', v)} placeholder="e.g. FC-4 Filing for FY 2024-25" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Due Date *" value={form.due_date} onChange={v => set('due_date', v)} type="date" />
          <Field label="Financial Year" value={form.financial_year} onChange={v => set('financial_year', v)} placeholder="2024-25" />
        </div>
        {!isNew && (
          <Field label="Completed Date" value={form.completed_date} onChange={v => set('completed_date', v)} type="date" />
        )}
        <Field label="Reminder Days Before Due" value={form.reminder_days} onChange={v => set('reminder_days', v)} type="number" placeholder="30" />
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
          <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
      </div>
      <div className="px-6 py-4 border-t flex gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        {!isNew && ['pending', 'in_progress'].includes(item?.status) && (
          <button onClick={complete} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
            <CheckCircle2 size={14} /> Mark Done
          </button>
        )}
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60"
          style={{ backgroundColor: '#16a34a' }}>
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
          {isNew ? 'Create' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
}

export default function FCRACompliance() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.compliance_type = typeFilter;
      const [comp, regs] = await Promise.all([
        fcraAPI.getCompliances(params),
        fcraAPI.getRegistrations({ limit: 50 }),
      ]);
      setRows(comp.data.data || []);
      setTotal(comp.data.total || 0);
      setRegistrations(regs.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [statusFilter, typeFilter]);

  const overdue  = rows.filter(r => r.status === 'overdue').length;
  const upcoming = rows.filter(r => {
    const days = Math.ceil((new Date(r.due_date) - new Date()) / 86400000);
    return r.status !== 'completed' && r.status !== 'waived' && days >= 0 && days <= 30;
  }).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar size={20} className="text-green-600" /> Compliance Calendar
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} items · {overdue} overdue · {upcoming} due in 30 days</p>
        </div>
        <button onClick={() => setDrawer('new')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#16a34a' }}>
          <Plus size={14} /> Add Item
        </button>
      </div>

      {/* Summary chips */}
      {(overdue > 0 || upcoming > 0) && (
        <div className="flex gap-2">
          {overdue > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
              <AlertTriangle size={13} /> {overdue} overdue — immediate action required
            </div>
          )}
          {upcoming > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium">
              <Clock size={13} /> {upcoming} due within 30 days
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1">
          {[['all', 'All Status'], ['pending', 'Pending'], ['in_progress', 'In Progress'], ['overdue', 'Overdue'], ['completed', 'Completed']].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              style={statusFilter === v ? { backgroundColor: '#16a34a' } : {}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {rows.map((c, i) => {
            const daysLeft = Math.ceil((new Date(c.due_date) - new Date()) / 86400000);
            const isOverdue = daysLeft < 0;
            const isUrgent  = daysLeft >= 0 && daysLeft <= 14;
            const StatusIcon = isOverdue ? AlertCircle : isUrgent ? Clock : CheckCircle2;
            const clr = isOverdue ? '#dc2626' : isUrgent ? '#d97706' : '#16a34a';
            return (
              <motion.div key={c.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="mt-0.5 shrink-0">
                      <StatusIcon size={16} style={{ color: clr }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800 text-sm">{c.title}</p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: STATUS_CLR[c.status]?.bg, color: STATUS_CLR[c.status]?.fg }}>
                          {c.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[c.compliance_type]} {c.financial_year && `· FY ${c.financial_year}`}</p>
                      {c.description && <p className="text-xs text-gray-400 mt-1 truncate">{c.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-gray-500">{c.due_date}</p>
                      <p className="text-xs font-semibold" style={{ color: clr }}>
                        {isOverdue ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                      </p>
                    </div>
                    <button onClick={() => setDrawer(c)} className="text-gray-400 hover:text-green-600">
                      <Edit2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {rows.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
              <CheckCircle2 size={36} className="mx-auto text-green-200 mb-3" />
              <p className="text-gray-500 font-medium">No compliance items found</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setDrawer(null)} />
            <ComplianceDrawer
              item={drawer === 'new' ? null : drawer}
              registrations={registrations}
              onClose={() => setDrawer(null)}
              onSave={() => { setDrawer(null); load(); }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
