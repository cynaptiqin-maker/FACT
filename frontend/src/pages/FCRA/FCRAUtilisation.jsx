import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, Plus, Edit2, X, Save, CheckCircle, XCircle, Filter, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { fcraAPI } from '@services/api';

function fmtINR(n) {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  return `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const STATUS_CLR = {
  draft:    { bg: '#f3f4f6', fg: '#374151' },
  approved: { bg: '#dcfce7', fg: '#166534' },
  rejected: { bg: '#fee2e2', fg: '#991b1b' },
};
const CAT_CLR = {
  programme:      { bg: '#dbeafe', fg: '#1e40af' },
  administrative: { bg: '#fef9c3', fg: '#854d0e' },
  capital:        { bg: '#ede9fe', fg: '#5b21b6' },
  other:          { bg: '#f3f4f6', fg: '#374151' },
};
const PAYMENT_MODES = ['bank_transfer', 'cheque', 'cash', 'upi'];
const PAYEE_TYPES   = ['vendor', 'beneficiary', 'staff', 'government', 'other'];

function Field({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 mb-1 block">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400" />
    </div>
  );
}

function UtilDrawer({ util, registrations, projects, bankAccounts, onClose, onSave }) {
  const isNew = !util?.id;
  const [form, setForm] = useState(util || {
    registration_id: registrations[0]?.id || '', project_id: '', bank_account_id: '',
    amount: '', utilization_date: new Date().toISOString().split('T')[0],
    category: 'programme', purpose: '', payee_name: '', payee_type: 'vendor',
    payment_mode: 'bank_transfer', transaction_reference: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  const filteredProjects = projects.filter(p => !form.registration_id || p.registration_id === form.registration_id);
  const filteredAccounts = bankAccounts.filter(a => !form.registration_id || a.registration_id === form.registration_id);

  async function save() {
    if (!form.project_id || !form.bank_account_id || !form.amount) {
      setErr('Project, bank account, and amount are required');
      return;
    }
    setSaving(true); setErr('');
    try {
      if (isNew) await fcraAPI.createUtilisation(form);
      else await fcraAPI.updateUtilisation(util.id, form);
      onSave();
    } catch (e) {
      setErr(e.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  }

  return (
    <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ backgroundColor: '#16a34a' }}>
        <div>
          <h2 className="font-semibold text-white">{isNew ? 'New Utilisation Voucher' : 'Edit Voucher'}</h2>
          {!isNew && util.voucher_number && <p className="text-white/70 text-xs">{util.voucher_number}</p>}
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
          <label className="text-xs font-medium text-gray-600 mb-1 block">Project *</label>
          <select value={form.project_id} onChange={e => set('project_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="">Select project…</option>
            {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.project_name} ({p.project_code})</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Bank Account *</label>
          <select value={form.bank_account_id} onChange={e => set('bank_account_id', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="">Select account…</option>
            {filteredAccounts.map(a => <option key={a.id} value={a.id}>{a.bank_name} ••••{a.account_number?.slice(-4)} ({a.account_type})</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (₹) *" value={form.amount} onChange={v => set('amount', v)} type="number" placeholder="0.00" />
          <Field label="Utilisation Date *" value={form.utilization_date} onChange={v => set('utilization_date', v)} type="date" />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
            <option value="programme">Programme (direct work)</option>
            <option value="administrative">Administrative (max 20%)</option>
            <option value="capital">Capital (assets)</option>
            <option value="other">Other</option>
          </select>
          {form.category === 'administrative' && (
            <p className="text-[10px] text-amber-600 mt-1">⚠ Admin expenses must not exceed 20% of total FC received</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Payee Name" value={form.payee_name} onChange={v => set('payee_name', v)} />
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Payee Type</label>
            <select value={form.payee_type} onChange={e => set('payee_type', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {PAYEE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">Payment Mode</label>
            <select value={form.payment_mode} onChange={e => set('payment_mode', e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-green-400">
              {PAYMENT_MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <Field label="Transaction Ref." value={form.transaction_reference} onChange={v => set('transaction_reference', v)} />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 block">Purpose</label>
          <textarea value={form.purpose || ''} onChange={e => set('purpose', e.target.value)} rows={2}
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

function JournalPanel({ sourceId, onClose }) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fcraAPI.getJournals(sourceId)
      .then(r => setJournals(r.data.data || []))
      .catch(() => setJournals([]))
      .finally(() => setLoading(false));
  }, [sourceId]);

  return (
    <motion.div initial={{ x: 420, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 420, opacity: 0 }}
      className="fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-green-600" />
          <h3 className="font-semibold text-gray-800 text-sm">Accounting Journal</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {loading && <p className="text-xs text-gray-400 text-center py-8">Loading journals...</p>}
        {!loading && journals.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No journal entries found.</p>
            <p className="text-xs text-gray-400 mt-1">Journals are posted when a receipt is verified or a voucher is approved.</p>
          </div>
        )}
        {journals.map(je => (
          <div key={je.id} className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="bg-green-50 px-4 py-2 flex justify-between items-center">
              <span className="font-mono text-xs font-semibold text-green-700">{je.entry_number}</span>
              <span className="text-xs text-gray-500">{je.date}</span>
            </div>
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-600">{je.narration}</p>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="bg-gray-50 text-gray-400">
                <th className="text-left px-3 py-1.5 font-medium">Account</th>
                <th className="text-right px-3 py-1.5 font-medium">DR</th>
                <th className="text-right px-3 py-1.5 font-medium">CR</th>
              </tr></thead>
              <tbody>
                {(je.lines || []).map((l, i) => (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-1.5">
                      <div className="font-medium text-gray-700">{l.account_name}</div>
                      <div className="text-gray-400 font-mono">{l.account_code}</div>
                    </td>
                    <td className="px-3 py-1.5 text-right text-green-700 font-medium">{l.debit > 0 ? `₹${Number(l.debit).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-3 py-1.5 text-right text-blue-600 font-medium">{l.credit > 0 ? `₹${Number(l.credit).toLocaleString('en-IN')}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-gray-50 px-4 py-1.5 flex justify-between text-xs font-semibold text-gray-600">
              <span>Total</span>
              <span>₹{Number(je.total_debit).toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
        <div className="mt-4 px-4 py-3 bg-green-50 rounded-xl border border-green-100 text-xs text-green-700">
          <p className="font-semibold mb-1">How FCRA accounting works</p>
          <p>When a utilisation voucher is approved, the system posts: <strong>DR Expense Account → CR FC Designated Bank Account</strong>. This ensures the GL reflects the actual outflow from your foreign contribution funds.</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function FCRAUtilisation() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [drawer, setDrawer] = useState(null);
  const [journalSourceId, setJournalSourceId] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [catFilter, setCatFilter] = useState('all');
  const [page, setPage] = useState(1);
  const LIMIT = 25;
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  async function load(p = page) {
    setLoading(true);
    try {
      const params = { page: p, limit: LIMIT };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (catFilter !== 'all') params.category = catFilter;
      const [util, regs, proj, accs] = await Promise.all([
        fcraAPI.getUtilisations(params),
        fcraAPI.getRegistrations({ limit: 50 }),
        fcraAPI.getProjects({ limit: 100, status: 'active' }),
        fcraAPI.getBankAccounts({ limit: 50 }),
      ]);
      setRows(util.data.data || []);
      setTotal(util.data.total || 0);
      setRegistrations(regs.data.data || []);
      setProjects(proj.data.data || []);
      setBankAccounts(accs.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(1); setPage(1); }, [statusFilter, catFilter]);
  useEffect(() => { load(page); }, [page]);

  async function approve(id) {
    try { await fcraAPI.approveUtilisation(id); load(); } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  }

  function openReject(id) {
    setRejectReason('');
    setRejectTarget(id);
  }

  async function submitReject() {
    if (!rejectReason.trim()) return;
    try {
      await fcraAPI.rejectUtilisation(rejectTarget, { reason: rejectReason });
      setRejectTarget(null);
      setRejectReason('');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
  }

  const totalApproved = rows.filter(r => r.status === 'approved').reduce((s, r) => s + parseFloat(r.amount || 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingDown size={20} className="text-green-600" /> Utilisation Vouchers
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} vouchers · {fmtINR(totalApproved)} approved</p>
        </div>
        <button onClick={() => setDrawer('new')}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-white rounded-lg"
          style={{ backgroundColor: '#16a34a' }}>
          <Plus size={14} /> New Voucher
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="flex gap-1">
          {[['all', 'All Status'], ['draft', 'Draft'], ['approved', 'Approved'], ['rejected', 'Rejected']].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${statusFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              style={statusFilter === v ? { backgroundColor: '#16a34a' } : {}}>
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {[['all', 'All Categories'], ['programme', 'Programme'], ['administrative', 'Admin'], ['capital', 'Capital']].map(([v, l]) => (
            <button key={v} onClick={() => setCatFilter(v)}
              className={`px-2.5 py-1.5 text-xs rounded-lg font-medium transition-colors ${catFilter === v ? 'text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              style={catFilter === v ? { backgroundColor: '#8b5cf6' } : {}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Voucher #', 'Date', 'Project', 'Amount', 'Category', 'Payee', 'Mode', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((r, i) => {
                  const proj = projects.find(p => p.id === r.project_id);
                  return (
                    <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                      className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-green-700 text-xs">{r.voucher_number || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.utilization_date}</td>
                      <td className="px-4 py-3 font-medium text-gray-800 max-w-[120px] truncate">
                        {proj?.project_name || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-right">{fmtINR(r.amount)}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: CAT_CLR[r.category]?.bg, color: CAT_CLR[r.category]?.fg }}>
                          {r.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[100px] truncate">{r.payee_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs capitalize">{r.payment_mode?.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ backgroundColor: STATUS_CLR[r.status]?.bg, color: STATUS_CLR[r.status]?.fg }}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {r.status === 'draft' && (
                            <>
                              <button onClick={() => approve(r.id)} className="text-green-600 hover:text-green-800" title="Approve">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => openReject(r.id)} className="text-red-500 hover:text-red-700" title="Reject">
                                <XCircle size={14} />
                              </button>
                              <button onClick={() => setDrawer(r)} className="text-gray-400 hover:text-green-600">
                                <Edit2 size={13} />
                              </button>
                            </>
                          )}
                          {r.status === 'approved' && (
                            <button onClick={() => setJournalSourceId(r.id)} className="text-gray-400 hover:text-green-600" title="View Journal Entry">
                              <BookOpen size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {rows.length === 0 && (
              <div className="text-center py-12 text-gray-400"><TrendingDown size={28} className="mx-auto mb-2 text-gray-200" />No vouchers found</div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setDrawer(null)} />
            <UtilDrawer
              util={drawer === 'new' ? null : drawer}
              registrations={registrations} projects={projects} bankAccounts={bankAccounts}
              onClose={() => setDrawer(null)}
              onSave={() => { setDrawer(null); load(); }}
            />
          </>
        )}
        {journalSourceId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-40" onClick={() => setJournalSourceId(null)} />
            <JournalPanel sourceId={journalSourceId} onClose={() => setJournalSourceId(null)} />
          </>
        )}
      </AnimatePresence>

      {/* ── Reject reason dialog ─────────────────────────────────────────────── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRejectTarget(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-800">Reject Voucher</h2>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Rejection reason *</label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Enter reason for rejection…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-400 resize-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitReject}
                disabled={!rejectReason.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
