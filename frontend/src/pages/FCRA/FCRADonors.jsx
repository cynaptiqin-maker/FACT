import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Plus, Edit2, X, Save, Search, Filter, Globe2, Building2, User } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const DONOR_TYPES = ['individual', 'organization', 'government', 'ngo', 'foundation'];
const TYPE_ICON   = { individual: User, organization: Building2, government: Globe2, ngo: Globe2, foundation: Building2 };
const STATUS_CLR  = { active: { bg: '#dcfce7', fg: '#166534' }, inactive: { bg: '#fef9c3', fg: '#854d0e' }, blacklisted: { bg: '#fee2e2', fg: '#991b1b' } };

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
    </div>
  );
}

function DonorDrawer({ donor, registrations, onClose, onSave }) {
  const isNew = !donor?.id;
  const [form, setForm] = useState(donor || {
    registration_id: registrations[0]?.id || '', donor_name: '', donor_type: 'organization',
    country: '', country_code: '', email: '', phone: '', pan_number: '',
    passport_number: '', org_registration_number: '', website: '',
    donor_since: '', status: 'active', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.donor_name || !form.country || !form.registration_id) {
      setErr('Registration, donor name and country are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      if (isNew) await fcraAPI.createDonor(form);
      else await fcraAPI.updateDonor(donor.id, form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <h2 className="font-semibold text-white">{isNew ? 'New Donor' : 'Edit Donor'}</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">FCRA Registration *</label>
          <select value={form.registration_id} onChange={e => set('registration_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            {registrations.map(r => <option key={r.id} value={r.id}>{r.organization_name} ({r.fcra_number})</option>)}
          </select>
        </div>
        <Field label="Donor Name *" value={form.donor_name} onChange={v => set('donor_name', v)} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Donor Type</label>
            <select value={form.donor_type} onChange={e => set('donor_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {DONOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {['active', 'inactive', 'blacklisted'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Country *" value={form.country} onChange={v => set('country', v)} placeholder="e.g. United States" />
          <Field label="Country Code" value={form.country_code} onChange={v => set('country_code', v)} placeholder="e.g. US" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
          <Field label="Phone" value={form.phone} onChange={v => set('phone', v)} />
        </div>
        {form.donor_type === 'individual' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="PAN Number" value={form.pan_number} onChange={v => set('pan_number', v)} />
            <Field label="Passport Number" value={form.passport_number} onChange={v => set('passport_number', v)} />
          </div>
        ) : (
          <Field label="Organisation Reg. Number" value={form.org_registration_number} onChange={v => set('org_registration_number', v)} />
        )}
        <Field label="Website" value={form.website} onChange={v => set('website', v)} placeholder="https://" />
        <Field label="Donor Since" value={form.donor_since} onChange={v => set('donor_since', v)} type="date" />
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
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

export default function FCRADonors() {
  const [rows, setRows] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 24;

  async function load(p = page, q = search) {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (q) params.search = q;
      const [donors, regs] = await Promise.all([
        fcraAPI.getDonors(params),
        fcraAPI.getRegistrations({ limit: 50, status: 'active' }),
      ]);
      setRows(donors.data.data || []);
      setTotal(donors.data.total || 0);
      setRegistrations(regs.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(1, search); setPage(1); }, [search]);
  useEffect(() => { load(page); }, [page]);

  const totalContributions = rows.reduce((s, d) => s + parseFloat(d.total_contributions || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Users size={20} className="text-green-600" /> Donor Master
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} donor{total !== 1 ? 's' : ''} · {fmtINR(totalContributions)} total contributions</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Search size={14} className="text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search donors…"
              className="text-sm outline-none w-36" />
          </div>
          <button onClick={() => setDrawer('new')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
            style={{ backgroundColor: '#16a34a' }}>
            <Plus size={14} /> Add Donor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <Users size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{search ? 'No donors match your search' : 'No donors yet'}</p>
          {!search && <button onClick={() => setDrawer('new')} className="mt-4 px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#16a34a' }}>Add Donor</button>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((d, i) => {
              const Icon = TYPE_ICON[d.donor_type] || User;
              return (
                <motion.div key={d.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-50">
                        <Icon size={15} className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{d.donor_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{d.donor_type} · {d.country}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ backgroundColor: STATUS_CLR[d.status]?.bg, color: STATUS_CLR[d.status]?.fg }}>
                      {d.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Contributions</span>
                      <span className="font-bold text-green-700">{fmtINR(d.total_contributions)}</span>
                    </div>
                    {d.last_contribution_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Contribution</span>
                        <span className="text-gray-700">{d.last_contribution_date}</span>
                      </div>
                    )}
                    {d.donor_code && <p className="text-[10px] text-gray-300 font-mono">{d.donor_code}</p>}
                  </div>
                  <button onClick={() => setDrawer(d)} className="mt-2 flex items-center gap-1 text-xs text-green-700 hover:text-green-800">
                    <Edit2 size={11} /> Edit
                  </button>
                </motion.div>
              );
            })}
          </div>
          {total > LIMIT && (
            <div className="flex justify-center gap-2">
              {[...Array(Math.ceil(total / LIMIT))].map((_, i) => (
                <button key={i} onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 text-xs rounded-lg ${page === i + 1 ? 'text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  style={page === i + 1 ? { backgroundColor: '#16a34a' } : {}}>
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setDrawer(null)} />
            <DonorDrawer
              donor={drawer === 'new' ? null : drawer}
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
