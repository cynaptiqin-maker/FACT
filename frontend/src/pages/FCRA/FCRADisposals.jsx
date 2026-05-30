import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Archive, Plus, X, Save, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const METHOD_LABELS = {
  sale:       'Sale',
  auction:    'Auction',
  donation:   'Donation',
  write_off:  'Write Off',
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

function KPICard({ label, value, valueClass }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${valueClass || 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

function DisposalDrawer({ registrations, assets, onClose, onSave }) {
  const [form, setForm] = useState({
    registration_id: registrations[0]?.id || '',
    asset_id: '',
    disposal_date: '',
    disposal_method: 'sale',
    book_value: '',
    sale_proceeds: '',
    buyer_name: '',
    mha_approval: false,
    mha_reference: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const gainLoss = (Number(form.sale_proceeds) || 0) - (Number(form.book_value) || 0);

  async function save() {
    if (!form.asset_id || !form.disposal_date || !form.registration_id) {
      setErr('Registration, asset and disposal date are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      await fcraAPI.createDisposal({ ...form, gain_loss: gainLoss });
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
        <h2 className="font-semibold text-white">Record Asset Disposal</h2>
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
          <Field label="Disposal Date *" value={form.disposal_date} onChange={v => set('disposal_date', v)} type="date" />
          <Field label="Disposal Method">
            <select
              value={form.disposal_method}
              onChange={e => set('disposal_method', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
            >
              {Object.entries(METHOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Book Value (₹)" value={form.book_value} onChange={v => set('book_value', v)} type="number" placeholder="0" />
          <Field label="Sale Proceeds (₹)" value={form.sale_proceeds} onChange={v => set('sale_proceeds', v)} type="number" placeholder="0" />
        </div>

        {/* Auto-computed gain/loss */}
        <div className={`px-3 py-2 rounded-lg text-sm font-semibold ${gainLoss >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          Gain / Loss: {gainLoss >= 0 ? '+' : ''}{fmtINR(gainLoss)}
          <span className="text-xs font-normal ml-1">(auto-computed)</span>
        </div>

        <Field label="Buyer Name" value={form.buyer_name} onChange={v => set('buyer_name', v)} placeholder="Individual or organisation" />

        {/* MHA Approval */}
        <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
          <input
            id="mha_approval"
            type="checkbox"
            checked={!!form.mha_approval}
            onChange={e => set('mha_approval', e.target.checked)}
            className="w-4 h-4 accent-green-600"
          />
          <label htmlFor="mha_approval" className="text-sm text-gray-700 cursor-pointer">MHA Approval obtained</label>
        </div>

        {form.mha_approval && (
          <Field label="MHA Reference Number" value={form.mha_reference} onChange={v => set('mha_reference', v)} placeholder="MHA/FCRA/…" />
        )}

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
          Record Disposal
        </button>
      </div>
    </motion.div>
  );
}

export default function FCRADisposals() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [assets, setAssets] = useState([]);
  const [drawer, setDrawer] = useState(false);
  const [regFilter, setRegFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const params = { limit: 100 };
      if (regFilter) params.registration_id = regFilter;
      if (methodFilter !== 'all') params.disposal_method = methodFilter;
      const [dispRes, regsRes, assetsRes] = await Promise.all([
        fcraAPI.getDisposals(params),
        fcraAPI.getRegistrations({ limit: 50 }),
        fcraAPI.getAssets({ limit: 100, status: 'active' }),
      ]);
      setRows(dispRes.data.data || []);
      setTotal(dispRes.data.total || 0);
      setRegistrations(regsRes.data.data || []);
      setAssets(assetsRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load disposals');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [regFilter, methodFilter]);

  const totalProceeds = rows.reduce((s, r) => s + Number(r.sale_proceeds || 0), 0);
  const netGainLoss = rows.reduce((s, r) => s + Number(r.gain_loss || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Archive size={20} className="text-green-600" /> Asset Disposals
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} disposal record{total !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setDrawer(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#16a34a' }}
        >
          <Plus size={14} /> Record Disposal
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total Disposals" value={total} />
        <KPICard label="Total Sale Proceeds" value={fmtINR(totalProceeds)} />
        <KPICard
          label="Net Gain / Loss"
          value={(netGainLoss >= 0 ? '+' : '') + fmtINR(netGainLoss)}
          valueClass={netGainLoss >= 0 ? 'text-green-700' : 'text-red-600'}
        />
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

        <div className="flex gap-1">
          {[['all', 'All Methods'], ['sale', 'Sale'], ['auction', 'Auction'], ['donation', 'Donation'], ['write_off', 'Write Off']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setMethodFilter(v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${methodFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={methodFilter === v ? { backgroundColor: '#16a34a' } : {}}
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
                  {['Asset', 'Disposal Date', 'Method', 'Book Value', 'Sale Proceeds', 'Gain / Loss', 'MHA Approval'].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((d, i) => {
                  const gl = Number(d.gain_loss || 0);
                  return (
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.asset_id ? d.asset_id.slice(0, 8) + '…' : '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{d.disposal_date || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 capitalize">
                          {METHOD_LABELS[d.disposal_method] || d.disposal_method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{fmtINR(d.book_value)}</td>
                      <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{fmtINR(d.sale_proceeds)}</td>
                      <td className={`px-4 py-3 font-semibold whitespace-nowrap ${gl >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {gl >= 0 ? '+' : ''}{fmtINR(gl)}
                      </td>
                      <td className="px-4 py-3">
                        {d.mha_approval
                          ? <span className="flex items-center gap-1 text-green-700 text-xs"><CheckCircle2 size={12} /> Yes</span>
                          : <span className="flex items-center gap-1 text-gray-400 text-xs"><XCircle size={12} /> No</span>}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="py-16 text-center">
              <Archive size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No disposal records found</p>
              <p className="text-xs text-gray-400 mt-1">Record an asset disposal to get started</p>
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
            <DisposalDrawer
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
