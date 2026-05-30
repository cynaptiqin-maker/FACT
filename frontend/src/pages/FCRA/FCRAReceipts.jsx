import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Plus, Edit2, X, Save, CheckCircle, Filter, Search, ArrowUpRight } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n) return '₹0';
  if (Math.abs(n) >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const STATUS_CLR = {
  pending:           { bg: '#fef9c3', fg: '#854d0e' },
  verified:          { bg: '#dcfce7', fg: '#166534' },
  partially_utilized: { bg: '#dbeafe', fg: '#1e40af' },
  fully_utilized:    { bg: '#f3f4f6', fg: '#374151' },
  returned:          { bg: '#fee2e2', fg: '#991b1b' },
};

const PURPOSE_CODES = ['education', 'health', 'social', 'cultural', 'economic', 'religious', 'environment', 'other'];
const RECEIPT_MODES = ['wire_transfer', 'cheque', 'draft', 'online', 'cash'];
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'SGD', 'AED', 'SEK', 'NOK', 'DKK'];

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
    </div>
  );
}

function ReceiptDrawer({ receipt, registrations, donors, bankAccounts, projects, onClose, onSave }) {
  const isNew = !receipt?.id;
  const [form, setForm] = useState(receipt || {
    registration_id: registrations[0]?.id || '',
    donor_id: '', bank_account_id: '', project_id: '',
    amount: '', currency: 'USD', exchange_rate: '', amount_inr: '',
    receipt_date: new Date().toISOString().split('T')[0], bank_credit_date: '',
    purpose_code: 'health', purpose: '',
    receipt_mode: 'wire_transfer', transaction_reference: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  function set(k, v) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if ((k === 'amount' || k === 'exchange_rate') && next.amount && next.exchange_rate) {
        next.amount_inr = (parseFloat(next.amount) * parseFloat(next.exchange_rate)).toFixed(2);
      }
      return next;
    });
  }

  const filteredDonors   = donors.filter(d => !form.registration_id || d.registration_id === form.registration_id);
  const filteredAccounts = bankAccounts.filter(a => !form.registration_id || a.registration_id === form.registration_id);
  const filteredProjects = projects.filter(p => !form.registration_id || p.registration_id === form.registration_id);

  async function save() {
    if (!form.donor_id || !form.bank_account_id || !form.amount || !form.receipt_date) {
      setErr('Donor, bank account, amount, and receipt date are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      if (isNew) await fcraAPI.createReceipt(form);
      else await fcraAPI.updateReceipt(receipt.id, form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function verify() {
    setSaving(true);
    try {
      await fcraAPI.verifyReceipt(receipt.id);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Verify failed');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <div>
          <h2 className="font-semibold text-white">{isNew ? 'Record Foreign Receipt' : 'Edit Receipt'}</h2>
          {!isNew && receipt.receipt_number && <p className="text-white/70 text-xs">{receipt.receipt_number}</p>}
        </div>
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
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Donor *</label>
          <select value={form.donor_id} onChange={e => set('donor_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="">Select donor…</option>
            {filteredDonors.map(d => <option key={d.id} value={d.id}>{d.donor_name} ({d.country})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Designated Bank Account *</label>
          <select value={form.bank_account_id} onChange={e => set('bank_account_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="">Select account…</option>
            {filteredAccounts.filter(a => a.account_type === 'designated').map(a => (
              <option key={a.id} value={a.id}>{a.bank_name} ••••{a.account_number?.slice(-4)} ({a.account_code})</option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <label className="text-xs font-medium text-gray-600 mb-1 block">Currency</label>
            <select value={form.currency} onChange={e => set('currency', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="col-span-1">
            <Field label="Amount *" value={form.amount} onChange={v => set('amount', v)} type="number" placeholder="0.00" />
          </div>
          <div className="col-span-1">
            <Field label="Exchange Rate" value={form.exchange_rate} onChange={v => set('exchange_rate', v)} type="number" placeholder="83.50" />
          </div>
        </div>
        {form.amount_inr && (
          <div className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg flex justify-between">
            <span>Amount in INR</span><span className="font-bold">{fmtINR(form.amount_inr)}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Receipt Date *" value={form.receipt_date} onChange={v => set('receipt_date', v)} type="date" />
          <Field label="Bank Credit Date" value={form.bank_credit_date} onChange={v => set('bank_credit_date', v)} type="date" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Receipt Mode</label>
            <select value={form.receipt_mode} onChange={e => set('receipt_mode', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {RECEIPT_MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Purpose Code</label>
            <select value={form.purpose_code} onChange={e => set('purpose_code', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {PURPOSE_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <Field label="Transaction Reference" value={form.transaction_reference} onChange={v => set('transaction_reference', v)} placeholder="Bank ref / SWIFT" />
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Link to Project (optional)</label>
          <select value={form.project_id || ''} onChange={e => set('project_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="">No project</option>
            {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.project_name} ({p.project_code})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Purpose Description</label>
          <textarea value={form.purpose || ''} onChange={e => set('purpose', e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
      </div>
      <div className="px-6 py-4 border-t flex gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        {!isNew && receipt.status === 'pending' && (
          <button onClick={verify} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
            <CheckCircle size={14} /> Verify
          </button>
        )}
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60"
          style={{ backgroundColor: '#16a34a' }}>
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
          {isNew ? 'Record' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
}

export default function FCRAReceipts() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [donors, setDonors] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  async function load(p = page, sf = statusFilter) {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (sf !== 'all') params.status = sf;
      const [rec, regs, don, accs, proj] = await Promise.all([
        fcraAPI.getReceipts(params),
        fcraAPI.getRegistrations({ limit: 50 }),
        fcraAPI.getDonors({ limit: 200 }),
        fcraAPI.getBankAccounts({ limit: 50 }),
        fcraAPI.getProjects({ limit: 100, status: 'active' }),
      ]);
      setRows(rec.data.data || []);
      setTotal(rec.data.total || 0);
      setRegistrations(regs.data.data || []);
      setDonors(don.data.data || []);
      setBankAccounts(accs.data.data || []);
      setProjects(proj.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(1, statusFilter); setPage(1); }, [statusFilter]);
  useEffect(() => { load(page); }, [page]);

  const totalINR = rows.reduce((s, r) => s + parseFloat(r.amount_inr || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" /> Foreign Receipts
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} receipts · {fmtINR(totalINR)} total</p>
        </div>
        <button onClick={() => setDrawer('new')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#16a34a' }}>
          <Plus size={14} /> Record Receipt
        </button>
      </div>

      {/* Status Filters */}
      <div className="flex gap-2 flex-wrap">
        {[['all', 'All'], ['pending', 'Pending'], ['verified', 'Verified'], ['partially_utilized', 'Partial'], ['fully_utilized', 'Fully Used']].map(([v, l]) => (
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
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Receipt #', 'Date', 'Donor', 'Currency', 'Amount', 'INR', 'Purpose', 'Mode', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => (
                  <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-green-700 text-xs">{r.receipt_number || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.receipt_date}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 max-w-[120px] truncate">
                      {donors.find(d => d.id === r.donor_id)?.donor_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.currency}</td>
                    <td className="px-4 py-3 text-right font-medium">{Number(r.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700">{fmtINR(r.amount_inr)}</td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{r.purpose_code}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs capitalize">{r.receipt_mode?.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ backgroundColor: STATUS_CLR[r.status]?.bg, color: STATUS_CLR[r.status]?.fg }}>
                        {r.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setDrawer(r)} className="text-gray-400 hover:text-green-600">
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <TrendingUp size={28} className="mx-auto mb-2 text-gray-200" />
                No receipts found
              </div>
            )}
          </div>
        </div>
      )}

      {total > LIMIT && (
        <div className="flex justify-center gap-1">
          {[...Array(Math.min(Math.ceil(total / LIMIT), 10))].map((_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`w-8 h-8 text-xs rounded-lg ${page === i + 1 ? 'text-white' : 'border border-gray-200 text-gray-600'}`}
              style={page === i + 1 ? { backgroundColor: '#16a34a' } : {}}>
              {i + 1}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setDrawer(null)} />
            <ReceiptDrawer
              receipt={drawer === 'new' ? null : drawer}
              registrations={registrations} donors={donors}
              bankAccounts={bankAccounts} projects={projects}
              onClose={() => setDrawer(null)}
              onSave={() => { setDrawer(null); load(); }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
