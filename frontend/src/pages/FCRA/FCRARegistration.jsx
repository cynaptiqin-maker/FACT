import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Plus, Edit2, CheckCircle2, AlertCircle, X, Save, RefreshCw, Calendar, Shield } from 'lucide-react';
import { fcraAPI } from '@services/api';

const STATUS_COLORS = {
  active:    { bg: '#dcfce7', fg: '#166534' },
  expired:   { bg: '#fee2e2', fg: '#991b1b' },
  suspended: { bg: '#fef9c3', fg: '#854d0e' },
  cancelled: { bg: '#f3f4f6', fg: '#374151' },
};

const ORG_TYPES = ['trust', 'society', 'section8_company', 'other'];

function RegistrationDrawer({ reg, onClose, onSave }) {
  const isNew = !reg?.id;
  const [form, setForm] = useState(reg || {
    fcra_number: '', organization_name: '', organization_type: 'trust',
    pan_number: '', registration_date: '', valid_upto: '', status: 'active',
    mha_reference_number: '', purpose_of_registration: '', email: '', phone: '',
    next_renewal_date: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.fcra_number || !form.organization_name || !form.registration_date) {
      setErr('FCRA number, organisation name and registration date are required');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      if (isNew) {
        await fcraAPI.createRegistration(form);
      } else {
        await fcraAPI.updateRegistration(reg.id, form);
      }
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <h2 className="font-semibold text-white">{isNew ? 'New FCRA Registration' : 'Edit Registration'}</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

        <Field label="FCRA Number *" value={form.fcra_number} onChange={v => set('fcra_number', v)} placeholder="e.g. 083780723" />
        <Field label="Organisation Name *" value={form.organization_name} onChange={v => set('organization_name', v)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Organisation Type</label>
            <select value={form.organization_type} onChange={e => set('organization_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {ORG_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
          <Field label="PAN Number" value={form.pan_number} onChange={v => set('pan_number', v)} placeholder="AAAAA0000A" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Registration Date *" value={form.registration_date} onChange={v => set('registration_date', v)} type="date" />
          <Field label="Valid Upto" value={form.valid_upto} onChange={v => set('valid_upto', v)} type="date" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Next Renewal Date" value={form.next_renewal_date} onChange={v => set('next_renewal_date', v)} type="date" />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {['active', 'expired', 'suspended', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <Field label="MHA Reference Number" value={form.mha_reference_number} onChange={v => set('mha_reference_number', v)} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
          <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Purpose of Registration</label>
          <textarea value={form.purpose_of_registration} onChange={e => set('purpose_of_registration', e.target.value)}
            rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
          <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
            rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
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

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
    </div>
  );
}

export default function FCRARegistration() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null); // null | 'new' | reg object

  async function load() {
    setLoading(true);
    try {
      const { data } = await fcraAPI.getRegistrations({ limit: 50 });
      setRows(data.data || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const daysToExpiry = (dateStr) => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr) - new Date()) / 86400000);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Globe size={20} className="text-green-600" /> FCRA Registration
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} registration{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={15} /></button>
          <button onClick={() => setDrawer('new')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
            style={{ backgroundColor: '#16a34a' }}>
            <Plus size={14} /> Add Registration
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Globe size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No FCRA registrations yet</p>
          <p className="text-sm text-gray-400 mt-1">Add your organisation's FCRA registration number to get started</p>
          <button onClick={() => setDrawer('new')}
            className="mt-4 px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#16a34a' }}>
            Add Registration
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r, i) => {
            const days = daysToExpiry(r.valid_upto);
            const expirySoon = days != null && days < 90 && days >= 0;
            const expired = days != null && days < 0;
            return (
              <motion.div key={r.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-400 font-mono">{r.fcra_number}</p>
                    <h3 className="font-semibold text-gray-800 mt-0.5">{r.organization_name}</h3>
                    <p className="text-xs text-gray-500 capitalize">{r.organization_type?.replace('_', ' ')}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                    style={{ backgroundColor: STATUS_COLORS[r.status]?.bg, color: STATUS_COLORS[r.status]?.fg }}>
                    {r.status}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Registered</span><span className="font-medium text-gray-700">{r.registration_date}</span>
                  </div>
                  {r.valid_upto && (
                    <div className="flex justify-between">
                      <span>Valid Upto</span>
                      <span className={`font-medium ${expired ? 'text-red-600' : expirySoon ? 'text-amber-600' : 'text-gray-700'}`}>
                        {r.valid_upto} {expirySoon && `(${days}d left)`}{expired && '(EXPIRED)'}
                      </span>
                    </div>
                  )}
                  {r.pan_number && (
                    <div className="flex justify-between">
                      <span>PAN</span><span className="font-mono text-gray-700">{r.pan_number}</span>
                    </div>
                  )}
                </div>
                {(expirySoon || expired) && (
                  <div className={`flex items-center gap-1.5 mt-3 text-xs px-2 py-1.5 rounded-lg ${expired ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                    <AlertCircle size={12} />{expired ? 'Registration expired — renewal required' : `Renewal due in ${days} days`}
                  </div>
                )}
                <button onClick={() => setDrawer(r)}
                  className="mt-3 flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800">
                  <Edit2 size={12} /> Edit
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setDrawer(null)} />
            <RegistrationDrawer
              reg={drawer === 'new' ? null : drawer}
              onClose={() => setDrawer(null)}
              onSave={() => { setDrawer(null); load(); }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
