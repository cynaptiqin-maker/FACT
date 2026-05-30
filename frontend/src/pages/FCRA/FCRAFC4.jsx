import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Edit2, X, Save, RefreshCw, Calculator, Upload, CheckCircle2 } from 'lucide-react';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const STATUS_CLR = {
  draft:    { bg: '#f3f4f6', fg: '#374151' },
  filed:    { bg: '#dbeafe', fg: '#1e40af' },
  accepted: { bg: '#dcfce7', fg: '#166534' },
  rejected: { bg: '#fee2e2', fg: '#991b1b' },
  revised:  { bg: '#fef9c3', fg: '#854d0e' },
};

function Field({ label, value, onChange, type = 'text', placeholder, readOnly }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`} />
    </div>
  );
}

function FC4Drawer({ filing, registrations, onClose, onSave }) {
  const isNew = !filing?.id;
  const [form, setForm] = useState(filing || {
    registration_id: registrations[0]?.id || '', financial_year: '',
    filing_date: '', due_date: '', status: 'draft',
    opening_balance: '', total_receipts_fc: '', total_utilized_fc: '',
    admin_expenses: '', programme_expenses: '', capital_expenses: '',
    mha_acknowledgement_number: '', mha_filing_reference: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [computing, setComputing] = useState(false);
  const [err, setErr] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  async function save() {
    if (!form.financial_year || !form.registration_id) {
      setErr('Registration and financial year are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      if (isNew) await fcraAPI.createFC4Filing(form);
      else await fcraAPI.updateFC4Filing(filing.id, form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  async function compute() {
    if (!filing?.id) { setErr('Save first, then compute'); return; }
    setComputing(true); setErr('');
    try {
      const { data } = await fcraAPI.computeFC4(filing.id);
      const f = data.data;
      setForm(prev => ({
        ...prev,
        total_receipts_fc:  f.total_receipts_fc,
        total_utilized_fc:  f.total_utilized_fc,
        admin_expenses:     f.admin_expenses,
        programme_expenses: f.programme_expenses,
        capital_expenses:   f.capital_expenses,
        admin_cap_percent:  f.admin_cap_percent,
        closing_balance:    f.closing_balance,
      }));
    } catch (e) {
      setErr(e.response?.data?.message || 'Compute failed');
    } finally { setComputing(false); }
  }

  const closingBal = parseFloat(form.opening_balance || 0) + parseFloat(form.total_receipts_fc || 0) - parseFloat(form.total_utilized_fc || 0);
  const adminPct   = form.total_receipts_fc > 0 ? (parseFloat(form.admin_expenses || 0) / parseFloat(form.total_receipts_fc)) * 100 : 0;

  return (
    <motion.div initial={{ x: 500, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 500, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <div>
          <h2 className="font-semibold text-white">{isNew ? 'New FC-4 Filing' : `FC-4 · ${filing.financial_year}`}</h2>
          {!isNew && <p className="text-white/70 text-xs">{filing.filing_code}</p>}
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white"><X size={18} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {err && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{err}</p>}

        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">FCRA Registration</label>
          <select value={form.registration_id} onChange={e => set('registration_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            {registrations.map(r => <option key={r.id} value={r.id}>{r.organization_name} ({r.fcra_number})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Financial Year *" value={form.financial_year} onChange={v => set('financial_year', v)} placeholder="2024-25" />
          <Field label="Due Date" value={form.due_date} onChange={v => set('due_date', v)} type="date" />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {Object.keys(STATUS_CLR).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        {/* Financial summary */}
        <div className="border border-gray-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700 text-sm">Financial Summary</h3>
            {!isNew && (
              <button onClick={compute} disabled={computing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-300 text-green-700 rounded-lg hover:bg-green-50">
                {computing ? <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" /> : <Calculator size={12} />}
                Auto-compute
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Opening Balance (₹)" value={form.opening_balance} onChange={v => set('opening_balance', v)} type="number" />
            <Field label="Total FC Receipts (₹)" value={form.total_receipts_fc} onChange={v => set('total_receipts_fc', v)} type="number" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Programme Expenses" value={form.programme_expenses} onChange={v => set('programme_expenses', v)} type="number" />
            <Field label="Administrative Expenses" value={form.admin_expenses} onChange={v => set('admin_expenses', v)} type="number" />
            <Field label="Capital Expenses" value={form.capital_expenses} onChange={v => set('capital_expenses', v)} type="number" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Utilized" value={form.total_utilized_fc} onChange={v => set('total_utilized_fc', v)} type="number" />
            <Field label="Closing Balance (Auto)" value={closingBal.toFixed(2)} readOnly />
          </div>

          {/* Admin cap indicator */}
          {adminPct > 0 && (
            <div className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${adminPct > 20 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <span>Admin Cap: {adminPct.toFixed(2)}%</span>
              <span>{adminPct > 20 ? '⚠ Exceeds 20% limit' : '✓ Within limit'}</span>
            </div>
          )}
        </div>

        {/* MHA details */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Filing Date" value={form.filing_date} onChange={v => set('filing_date', v)} type="date" />
          <Field label="MHA Acknowledgement No." value={form.mha_acknowledgement_number} onChange={v => set('mha_acknowledgement_number', v)} />
        </div>
        <Field label="MHA Filing Reference" value={form.mha_filing_reference} onChange={v => set('mha_filing_reference', v)} />
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Notes</label>
          <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={2}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400 resize-none" />
        </div>
      </div>
      <div className="px-6 py-4 border-t flex gap-2">
        <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60"
          style={{ backgroundColor: '#16a34a' }}>
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={14} />}
          {isNew ? 'Create Draft' : 'Save'}
        </button>
      </div>
    </motion.div>
  );
}

export default function FCRAFC4() {
  const [rows, setRows] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [fc4, regs] = await Promise.all([
        fcraAPI.getFC4Filings({ limit: 50 }),
        fcraAPI.getRegistrations({ limit: 50 }),
      ]);
      setRows(fc4.data.data || []);
      setRegistrations(regs.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-green-600" /> FC-4 Filings
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Annual FC-4 returns to Ministry of Home Affairs · Due: 31 December each year</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={15} /></button>
          <button onClick={() => setDrawer('new')}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
            style={{ backgroundColor: '#16a34a' }}>
            <Plus size={14} /> New Filing
          </button>
        </div>
      </div>

      {/* Important note */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800">
        <span className="font-semibold">FC-4 Rule:</span> Every organisation with FCRA registration must file an annual return (FC-4) by 31st December for the preceding financial year (April–March). Filing covers all FC receipts, utilisation, and assets.
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-16 text-center">
          <FileText size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No FC-4 filings yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first annual return</p>
          <button onClick={() => setDrawer('new')} className="mt-4 px-4 py-2 text-sm text-white rounded-lg" style={{ backgroundColor: '#16a34a' }}>
            Create FC-4
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((f, i) => {
            const adminPct = f.admin_cap_percent || 0;
            const capBreach = adminPct > 20;
            return (
              <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{f.filing_code}</p>
                    <h3 className="font-bold text-gray-800 text-lg">FY {f.financial_year}</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                    style={{ backgroundColor: STATUS_CLR[f.status]?.bg, color: STATUS_CLR[f.status]?.fg }}>
                    {f.status}
                  </span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total FC Receipts</span>
                    <span className="font-semibold text-green-700">{fmtINR(f.total_receipts_fc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Utilized</span>
                    <span className="font-medium">{fmtINR(f.total_utilized_fc)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Closing Balance</span>
                    <span className="font-medium">{fmtINR(f.closing_balance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Admin Cap %</span>
                    <span className={`font-semibold ${capBreach ? 'text-red-600' : 'text-green-700'}`}>
                      {adminPct?.toFixed(2)}% {capBreach ? '⚠' : '✓'}
                    </span>
                  </div>
                  {f.filing_date && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Filed On</span>
                      <span className="font-medium">{f.filing_date}</span>
                    </div>
                  )}
                  {f.mha_acknowledgement_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">MHA Ack. No.</span>
                      <span className="font-mono text-gray-700 text-[10px]">{f.mha_acknowledgement_number}</span>
                    </div>
                  )}
                </div>
                {f.status === 'accepted' && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-green-700 bg-green-50 px-2 py-1.5 rounded-lg">
                    <CheckCircle2 size={12} /> Accepted by MHA
                  </div>
                )}
                <button onClick={() => setDrawer(f)} className="mt-3 flex items-center gap-1 text-xs text-green-700 hover:text-green-800">
                  <Edit2 size={11} /> Edit
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
            <FC4Drawer
              filing={drawer === 'new' ? null : drawer}
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
