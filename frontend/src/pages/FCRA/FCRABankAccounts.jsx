import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Landmark, Plus, Edit2, X, Save, RefreshCw, Star, TrendingUp, TrendingDown } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (n == null) return '₹0';
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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

function BankAccountDrawer({ account, registrations, onClose, onSave }) {
  const isNew = !account?.id;
  const [form, setForm] = useState(account || {
    registration_id: registrations[0]?.id || '',
    bank_name: '', branch_name: '', account_number: '', ifsc_code: '',
    account_type: 'designated', status: 'active', opening_date: '',
    opening_balance: '', is_primary: false, notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.bank_name || !form.account_number || !form.registration_id) {
      setErr('Registration, bank name and account number are required');
      return;
    }
    setSaving(true);
    setErr('');
    try {
      if (isNew) await fcraAPI.createBankAccount(form);
      else await fcraAPI.updateBankAccount(account.id, form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ x: 400, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 400, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <h2 className="font-semibold text-white">{isNew ? 'New Bank Account' : 'Edit Bank Account'}</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">FCRA Registration *</label>
          <select value={form.registration_id} onChange={e => set('registration_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            {registrations.map(r => (
              <option key={r.id} value={r.id}>{r.organization_name} ({r.fcra_number})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Account Type</label>
            <select value={form.account_type} onChange={e => set('account_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              <option value="designated">Designated (Receives FC)</option>
              <option value="utilisation">Utilisation (Spends FC)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {['active', 'inactive', 'closed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <Field label="Bank Name *" value={form.bank_name} onChange={v => set('bank_name', v)} />
        <Field label="Branch Name" value={form.branch_name} onChange={v => set('branch_name', v)} />
        <Field label="Account Number *" value={form.account_number} onChange={v => set('account_number', v)} />
        <Field label="IFSC Code" value={form.ifsc_code} onChange={v => set('ifsc_code', v)} placeholder="e.g. SBIN0001234" />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Opening Date" value={form.opening_date} onChange={v => set('opening_date', v)} type="date" />
          <Field label="Opening Balance (₹)" value={form.opening_balance} onChange={v => set('opening_balance', v)} type="number" placeholder="0" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="primary" checked={form.is_primary} onChange={e => set('is_primary', e.target.checked)}
            className="accent-green-600" />
          <label htmlFor="primary" className="text-sm text-gray-700">Primary Designated Account</label>
        </div>
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

export default function FCRABankAccounts() {
  const [rows, setRows] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [filter, setFilter] = useState('all');

  async function load() {
    setLoading(true);
    try {
      const [accs, regs] = await Promise.all([
        fcraAPI.getBankAccounts({ limit: 100 }),
        fcraAPI.getRegistrations({ limit: 50, status: 'active' }),
      ]);
      setRows(accs.data.data || []);
      setRegistrations(regs.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === 'all' ? rows : rows.filter(r => r.account_type === filter);
  const totalBalance = rows.reduce((s, r) => s + parseFloat(r.current_balance || 0), 0);
  const designatedBal = rows.filter(r => r.account_type === 'designated').reduce((s, r) => s + parseFloat(r.current_balance || 0), 0);

  const statusColor = { active: { bg: '#dcfce7', fg: '#166534' }, inactive: { bg: '#fef9c3', fg: '#854d0e' }, closed: { bg: '#f3f4f6', fg: '#374151' } };
  const typeColor = { designated: { bg: '#dbeafe', fg: '#1e40af' }, utilisation: { bg: '#ede9fe', fg: '#5b21b6' } };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Landmark size={20} className="text-green-600" /> FCRA Bank Accounts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{rows.length} account{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={15} /></button>
          <button onClick={() => setDrawer('new')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
            style={{ backgroundColor: '#16a34a' }}>
            <Plus size={14} /> Add Account
          </button>
        </div>
      </div>

      {/* Balance Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Balance', value: fmtINR(totalBalance), icon: Landmark, color: '#16a34a' },
          { label: 'Designated Accounts', value: fmtINR(designatedBal), icon: TrendingUp, color: '#0ea5e9', sub: 'Receives foreign contributions' },
          { label: 'Utilisation Accounts', value: fmtINR(totalBalance - designatedBal), icon: TrendingDown, color: '#8b5cf6', sub: 'Spends foreign contributions' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
                <Icon size={16} style={{ color }} />
              </div>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[['all', 'All'], ['designated', 'Designated'], ['utilisation', 'Utilisation']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${filter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            style={filter === v ? { backgroundColor: '#16a34a' } : {}}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((acc, i) => (
            <motion.div key={acc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-50">
                    <Landmark size={15} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{acc.bank_name}</p>
                    <p className="text-xs text-gray-500">{acc.branch_name}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {acc.is_primary && <Star size={13} className="text-amber-500 fill-amber-500" />}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: typeColor[acc.account_type]?.bg, color: typeColor[acc.account_type]?.fg }}>
                    {acc.account_type}
                  </span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account No.</span>
                  <span className="font-mono text-gray-700">••••{acc.account_number?.slice(-4)}</span>
                </div>
                {acc.ifsc_code && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">IFSC</span>
                    <span className="font-mono text-gray-700">{acc.ifsc_code}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Balance</span>
                  <span className="font-bold text-gray-800">{fmtINR(acc.current_balance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ backgroundColor: statusColor[acc.status]?.bg, color: statusColor[acc.status]?.fg }}>
                    {acc.status}
                  </span>
                </div>
              </div>
              {acc.account_code && (
                <p className="text-[10px] text-gray-300 mt-2 font-mono">{acc.account_code}</p>
              )}
              <button onClick={() => setDrawer(acc)}
                className="mt-2 flex items-center gap-1 text-xs text-green-700 hover:text-green-800">
                <Edit2 size={11} /> Edit
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setDrawer(null)} />
            <BankAccountDrawer
              account={drawer === 'new' ? null : drawer}
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
