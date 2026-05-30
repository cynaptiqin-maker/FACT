import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Plus, Edit2, X, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const SECTORS = ['education', 'health', 'social', 'cultural', 'economic', 'religious', 'environment', 'other'];
const STATUS_CLR = {
  active:    { bg: '#dcfce7', fg: '#166534' },
  completed: { bg: '#dbeafe', fg: '#1e40af' },
  suspended: { bg: '#fef9c3', fg: '#854d0e' },
  cancelled: { bg: '#fee2e2', fg: '#991b1b' },
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

function ProjectDrawer({ project, registrations, onClose, onSave }) {
  const isNew = !project?.id;
  const [form, setForm] = useState(project || {
    registration_id: registrations[0]?.id || '', project_name: '', description: '',
    project_type: 'ongoing', sector: 'health', start_date: '', end_date: '',
    budgeted_amount: '', admin_cap_percent: 20, objectives: '', status: 'active', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.project_name || !form.start_date || !form.registration_id) {
      setErr('Registration, project name and start date are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      if (isNew) await fcraAPI.createProject(form);
      else await fcraAPI.updateProject(project.id, form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <h2 className="font-semibold text-white">{isNew ? 'New FCRA Project' : 'Edit Project'}</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">FCRA Registration *</label>
          <select value={form.registration_id} onChange={e => set('registration_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            {registrations.map(r => <option key={r.id} value={r.id}>{r.organization_name}</option>)}
          </select>
        </div>
        <Field label="Project Name *" value={form.project_name} onChange={v => set('project_name', v)} />
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Type</label>
            <select value={form.project_type} onChange={e => set('project_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {['ongoing', 'time_bound', 'corpus'].map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Sector</label>
            <select value={form.sector} onChange={e => set('sector', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {['active', 'completed', 'suspended', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start Date *" value={form.start_date} onChange={v => set('start_date', v)} type="date" />
          <Field label="End Date" value={form.end_date} onChange={v => set('end_date', v)} type="date" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Budgeted Amount (₹)" value={form.budgeted_amount} onChange={v => set('budgeted_amount', v)} type="number" placeholder="0" />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Admin Cap Limit (%)</label>
            <input type="number" max="20" min="0" value={form.admin_cap_percent || 20}
              onChange={e => set('admin_cap_percent', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
            <p className="text-[10px] text-amber-600 mt-0.5">FCRA limit is 20% of total receipts</p>
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Description</label>
          <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Objectives</label>
          <textarea value={form.objectives || ''} onChange={e => set('objectives', e.target.value)} rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
      </div>
      <div className="px-6 py-4 border-t flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
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

export default function FCRAProjects() {
  const [rows, setRows] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');

  async function load() {
    setLoading(true);
    try {
      const params = { limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const [proj, regs] = await Promise.all([
        fcraAPI.getProjects(params),
        fcraAPI.getRegistrations({ limit: 50 }),
      ]);
      setRows(proj.data.data || []);
      setRegistrations(regs.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FolderKanban size={20} className="text-green-600" /> FCRA Projects
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} project{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setDrawer('new')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#16a34a' }}>
          <Plus size={14} /> New Project
        </button>
      </div>

      <div className="flex gap-2">
        {[['all', 'All'], ['active', 'Active'], ['completed', 'Completed'], ['suspended', 'Suspended']].map(([v, l]) => (
          <button key={v} onClick={() => setStatusFilter(v)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={statusFilter === v ? { backgroundColor: '#16a34a' } : {}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((p, i) => {
            const utilPct   = p.received_amount > 0 ? Math.min((p.utilized_amount / p.received_amount) * 100, 100) : 0;
            const adminPct  = p.received_amount > 0 ? (p.admin_utilized / p.received_amount) * 100 : 0;
            const capBreach = adminPct > 20;
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-mono text-[10px] text-gray-400">{p.project_code}</p>
                    <h3 className="font-semibold text-gray-800 truncate">{p.project_name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{p.sector} · {p.project_type?.replace('_', ' ')}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize shrink-0"
                    style={{ backgroundColor: STATUS_CLR[p.status]?.bg, color: STATUS_CLR[p.status]?.fg }}>
                    {p.status}
                  </span>
                </div>

                {/* Budget progress */}
                <div className="space-y-2 mb-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Utilisation</span>
                      <span className="font-medium">{utilPct.toFixed(0)}% · {fmtINR(p.utilized_amount)}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full">
                      <div className="h-2 rounded-full bg-green-500" style={{ width: `${utilPct}%` }} />
                    </div>
                  </div>
                  {capBreach && (
                    <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 px-2 py-1.5 rounded-lg">
                      <AlertTriangle size={11} /> Admin cap breach ({adminPct.toFixed(1)}%)
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs border-t border-gray-50 pt-3">
                  <div>
                    <p className="text-gray-400">Received</p>
                    <p className="font-semibold text-gray-700">{fmtINR(p.received_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Utilized</p>
                    <p className="font-semibold text-gray-700">{fmtINR(p.utilized_amount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Balance</p>
                    <p className="font-semibold text-green-700">{fmtINR(p.received_amount - p.utilized_amount)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">{p.start_date} → {p.end_date || 'Ongoing'}</span>
                  <button onClick={() => setDrawer(p)} className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800">
                    <Edit2 size={11} /> Edit
                  </button>
                </div>
              </motion.div>
            );
          })}
          {rows.length === 0 && (
            <div className="col-span-3 bg-white rounded-xl border border-gray-100 p-16 text-center">
              <FolderKanban size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No projects found</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setDrawer(null)} />
            <ProjectDrawer
              project={drawer === 'new' ? null : drawer}
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
