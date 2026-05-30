import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, X, Save, AlertTriangle } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const INCOME_TYPE_LABELS = {
  rent:          'Rent',
  interest:      'Interest',
  dividend:      'Dividend',
  sale_proceeds: 'Sale Proceeds',
  other:         'Other',
};

const INCOME_TYPE_CLR = {
  rent:          { bg: '#dbeafe', fg: '#1e40af' },
  interest:      { bg: '#dcfce7', fg: '#166534' },
  dividend:      { bg: '#fef9c3', fg: '#854d0e' },
  sale_proceeds: { bg: '#f3e8ff', fg: '#6b21a8' },
  other:         { bg: '#f3f4f6', fg: '#374151' },
};

function Field({ label, value, onChange, type = 'text', placeholder, children }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      {children || (
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
        />
      )}
    </div>
  );
}

function KPICard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function IncomeDrawer({ registrations, assets, onClose, onSave }) {
  const [form, setForm] = useState({
    registration_id: registrations[0]?.id || '',
    asset_id: '',
    income_type: 'rent',
    income_date: '',
    amount: '',
    payer_name: '',
    reference: '',
    financial_year: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.asset_id || !form.income_date || !form.amount || !form.registration_id) {
      setErr('Registration, asset, date and amount are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      await fcraAPI.createAssetIncome(form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <motion.div
      initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <h2 className="font-semibold text-white">Record Asset Income</h2>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

        <Field label="FCRA Registration *">
          <select
            value={form.registration_id}
            onChange={e => set('registration_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
          >
            {registrations.map(r => <option key={r.id} value={r.id}>{r.organization_name}</option>)}
          </select>
        </Field>

        <Field label="Asset *">
          <select
            value={form.asset_id}
            onChange={e => set('asset_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
          >
            <option value="">Select asset…</option>
            {assets.map(a => (
              <option key={a.id} value={a.id}>
                {a.asset_code ? `${a.asset_code} — ` : ''}{a.asset_name}
              </option>
            ))}
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Income Type">
            <select
              value={form.income_type}
              onChange={e => set('income_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
            >
              {Object.entries(INCOME_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="Financial Year" value={form.financial_year} onChange={v => set('financial_year', v)} placeholder="2024-25" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Income Date *" value={form.income_date} onChange={v => set('income_date', v)} type="date" />
          <Field label="Amount (₹) *" value={form.amount} onChange={v => set('amount', v)} type="number" placeholder="0" />
        </div>

        <Field label="Payer Name" value={form.payer_name} onChange={v => set('payer_name', v)} placeholder="Person or organisation" />
        <Field label="Reference / Receipt No." value={form.reference} onChange={v => set('reference', v)} placeholder="e.g. RENT/2024/001" />

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
          <textarea
            value={form.notes || ''}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none"
          />
        </div>
      </div>
      <div className="px-6 py-4 border-t flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60"
          style={{ backgroundColor: '#16a34a' }}
        >
          {saving
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Save size={14} />}
          Record Income
        </button>
      </div>
    </motion.div>
  );
}

export default function FCRAAssetIncome() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [regFilter, setRegFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const params = { limit: 100 };
      if (regFilter) params.registration_id = regFilter;
      if (typeFilter !== 'all') params.income_type = typeFilter;
      const [incRes, regsRes, assetsRes] = await Promise.all([
        fcraAPI.getAssetIncome(params),
        fcraAPI.getRegistrations({ limit: 50 }),
        fcraAPI.getAssets({ limit: 100, status: 'active' }),
      ]);
      setRows(incRes.data.data || []);
      setTotal(incRes.data.total || 0);
      setRegistrations(regsRes.data.data || []);
      setAssets(assetsRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load income records');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [regFilter, typeFilter]);

  const totalAmount = rows.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" /> Asset Income
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} income record{total !== 1 ? 's' : ''} · Income generated from FCRA assets</p>
        </div>
        <button
          onClick={() => setDrawer(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#16a34a' }}
        >
          <Plus size={14} /> Record Income
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard label="Total Income Records" value={total} sub="All types and registrations" />
        <KPICard label="Total Amount" value={fmtINR(totalAmount)} sub="Sum of all income entries" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        {registrations.length > 0 && (
          <select
            value={regFilter}
            onChange={e => setRegFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-green-400 bg-white"
          >
            <option value="">All Registrations</option>
            {registrations.map(r => <option key={r.id} value={r.id}>{r.organization_name}</option>)}
          </select>
        )}

        <div className="flex gap-1 flex-wrap">
          {[['all', 'All Types'], ['rent', 'Rent'], ['interest', 'Interest'], ['dividend', 'Dividend'], ['other', 'Other']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${typeFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={typeFilter === v ? { backgroundColor: '#16a34a' } : {}}
            >
              {l}
            </button>
          ))}
        </div>
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
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  {['Income Code', 'Income Date', 'Asset', 'Type', 'Payer', 'Amount', 'Financial Year'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((inc, i) => (
                  <motion.tr
                    key={inc.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inc.income_code || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{inc.income_date || '—'}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{inc.asset_id ? inc.asset_id.slice(0, 8) + '…' : '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          backgroundColor: INCOME_TYPE_CLR[inc.income_type]?.bg,
                          color: INCOME_TYPE_CLR[inc.income_type]?.fg,
                        }}
                      >
                        {INCOME_TYPE_LABELS[inc.income_type] || inc.income_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px] truncate">{inc.payer_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-800 font-semibold whitespace-nowrap">{fmtINR(inc.amount)}</td>
                    <td className="px-4 py-3 text-gray-500">{inc.financial_year || '—'}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="py-16 text-center">
              <TrendingUp size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No income records found</p>
              <p className="text-xs text-gray-400 mt-1">Record income generated from FCRA assets</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40"
              onClick={() => setDrawer(false)}
            />
            <IncomeDrawer
              registrations={registrations}
              assets={assets}
              onClose={() => setDrawer(false)}
              onSave={() => { setDrawer(false); load(); }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
