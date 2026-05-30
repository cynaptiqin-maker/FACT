import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Edit2, X, Save, AlertTriangle } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n && n !== 0) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const STATUS_CLR = {
  active:      { bg: '#dcfce7', fg: '#166534' },
  disposed:    { bg: '#fee2e2', fg: '#991b1b' },
  written_off: { bg: '#f3f4f6', fg: '#374151' },
  transferred: { bg: '#fef9c3', fg: '#854d0e' },
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

function AssetDrawer({ asset, registrations, onClose, onSave }) {
  const isNew = !asset?.id;
  const [form, setForm] = useState(asset || {
    registration_id: registrations[0]?.id || '',
    asset_name: '',
    asset_category: '',
    funded_by: 'fcra',
    fcra_funded_percent: '',
    purchase_date: '',
    purchase_amount: '',
    vendor_name: '',
    location: '',
    notes: '',
    status: 'active',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.asset_name || !form.purchase_date || !form.registration_id) {
      setErr('Registration, asset name and purchase date are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      if (isNew) await fcraAPI.createAsset(form);
      else await fcraAPI.updateAsset(asset.id, form);
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
        <h2 className="font-semibold text-white">{isNew ? 'New FCRA Asset' : 'Edit Asset'}</h2>
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

        <Field label="Asset Name *" value={form.asset_name} onChange={v => set('asset_name', v)} placeholder="e.g. Generator Set 25KVA" />
        <Field label="Asset Category" value={form.asset_category} onChange={v => set('asset_category', v)} placeholder="e.g. Machinery" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Funded By">
            <select
              value={form.funded_by}
              onChange={e => set('funded_by', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
            >
              <option value="fcra">FCRA</option>
              <option value="domestic">Domestic</option>
              <option value="mixed">Mixed</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              value={form.status}
              onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400"
            >
              <option value="active">Active</option>
              <option value="disposed">Disposed</option>
              <option value="written_off">Written Off</option>
              <option value="transferred">Transferred</option>
            </select>
          </Field>
        </div>

        {form.funded_by === 'mixed' && (
          <Field
            label="FCRA Funded % (of cost)"
            value={form.fcra_funded_percent}
            onChange={v => set('fcra_funded_percent', v)}
            type="number"
            placeholder="e.g. 60"
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Purchase Date *" value={form.purchase_date} onChange={v => set('purchase_date', v)} type="date" />
          <Field label="Purchase Amount (₹) *" value={form.purchase_amount} onChange={v => set('purchase_amount', v)} type="number" placeholder="0" />
        </div>

        <Field label="Vendor Name" value={form.vendor_name} onChange={v => set('vendor_name', v)} placeholder="Vendor / Supplier" />
        <Field label="Location" value={form.location} onChange={v => set('location', v)} placeholder="Office, site, branch…" />

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
          {isNew ? 'Create' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
}

export default function FCRAAssets() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [drawer, setDrawer] = useState(null);
  const [regFilter, setRegFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fundedFilter, setFundedFilter] = useState('all');
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const params = { limit: 100 };
      if (regFilter) params.registration_id = regFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (fundedFilter !== 'all') params.funded_by = fundedFilter;
      const [assetsRes, regsRes] = await Promise.all([
        fcraAPI.getAssets(params),
        fcraAPI.getRegistrations({ limit: 50, status: 'active' }),
      ]);
      setRows(assetsRes.data.data || []);
      setTotal(assetsRes.data.total || 0);
      setRegistrations(regsRes.data.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load assets');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [regFilter, statusFilter, fundedFilter]);

  const totalPurchaseValue = rows.reduce((s, r) => s + Number(r.purchase_amount || 0), 0);
  const activeCount = rows.filter(r => r.status === 'active').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Package size={20} className="text-green-600" /> FCRA Assets
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} asset{total !== 1 ? 's' : ''} · FCRA-compliant asset register</p>
        </div>
        <button
          onClick={() => setDrawer('new')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#16a34a' }}
        >
          <Plus size={14} /> Add Asset
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPICard label="Total Assets" value={total} sub="All registrations" />
        <KPICard label="Total Purchase Value" value={fmtINR(totalPurchaseValue)} sub="Sum of all purchase costs" />
        <KPICard label="Active Assets" value={activeCount} sub={`${total - activeCount} disposed / written off`} />
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
          {[['all', 'All Status'], ['active', 'Active'], ['disposed', 'Disposed'], ['written_off', 'Written Off'], ['transferred', 'Transferred']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={statusFilter === v ? { backgroundColor: '#16a34a' } : {}}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {[['all', 'All Funding'], ['fcra', 'FCRA'], ['domestic', 'Domestic'], ['mixed', 'Mixed']].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFundedFilter(v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${fundedFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              style={fundedFilter === v ? { backgroundColor: '#16a34a' } : {}}
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
                  {['Asset Code', 'Asset Name', 'Category', 'Purchase Date', 'Purchase Amount', 'Current Value', 'Funded By', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-500 px-4 py-3 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((a, i) => (
                  <motion.tr
                    key={a.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{a.asset_code || '—'}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[180px] truncate">{a.asset_name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.asset_category || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.purchase_date || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{fmtINR(a.purchase_amount)}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">{fmtINR(a.current_value ?? a.purchase_amount)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize bg-gray-100 text-gray-700">
                        {a.funded_by}
                        {a.funded_by === 'mixed' && a.fcra_funded_percent ? ` (${a.fcra_funded_percent}%)` : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                        style={{ backgroundColor: STATUS_CLR[a.status]?.bg, color: STATUS_CLR[a.status]?.fg }}
                      >
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDrawer(a)} className="text-gray-400 hover:text-green-600">
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="py-16 text-center">
              <Package size={36} className="mx-auto text-gray-200 mb-3" />
              <p className="text-gray-500 font-medium">No assets found</p>
              <p className="text-xs text-gray-400 mt-1">Add your first FCRA asset to get started</p>
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
              onClick={() => setDrawer(null)}
            />
            <AssetDrawer
              asset={drawer === 'new' ? null : drawer}
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
