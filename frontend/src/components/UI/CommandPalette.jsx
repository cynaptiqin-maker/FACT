import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Brain, Loader2, CornerDownLeft } from 'lucide-react';
import { aiAPI } from '@services/api';
import clsx from 'clsx';

const QUICK_ACTIONS = [
  { label: 'New Journal Voucher', path: '/accounting/journal', group: 'Create' },
  { label: 'New Patient Invoice', path: '/billing/new', group: 'Create' },
  { label: 'Record Payment', path: '/billing/payment', group: 'Create' },
  { label: 'CFO Dashboard', path: '/', group: 'Navigate' },
  { label: 'Chart of Accounts', path: '/accounting/chart-of-accounts', group: 'Navigate' },
  { label: 'Trial Balance', path: '/accounting/trial-balance', group: 'Navigate' },
  { label: 'P&L Statement', path: '/reports/pl', group: 'Reports' },
  { label: 'Balance Sheet', path: '/reports/balance-sheet', group: 'Reports' },
  { label: 'Cash Flow Statement', path: '/reports/cash-flow', group: 'Reports' },
  { label: 'GST Returns', path: '/taxation/gst', group: 'Compliance' },
  { label: 'TDS Summary', path: '/taxation/tds', group: 'Compliance' },
  { label: 'AR Aging Report', path: '/ar/aging', group: 'Reports' },
  { label: 'Insurance Claims', path: '/insurance', group: 'Navigate' },
  { label: 'Run Payroll', path: '/payroll/run', group: 'Operations' },
  { label: 'Depreciation Run', path: '/assets/depreciation', group: 'Operations' },
  { label: 'AI Assistant', path: '/ai', group: 'Navigate' },
  { label: 'Anomaly Detector', path: '/ai/anomalies', group: 'Navigate' },
  { label: 'User Management', path: '/admin/users', group: 'Admin' },
  { label: 'Module Manager', path: '/admin/modules', group: 'Admin' },
  { label: 'Audit Logs', path: '/admin/audit-logs', group: 'Admin' },
  // FCRA
  { label: 'FCRA Dashboard', path: '/fcra', group: 'FCRA' },
  { label: 'Record FC Receipt', path: '/fcra/receipts', group: 'FCRA' },
  { label: 'FCRA Utilisation Vouchers', path: '/fcra/utilisation', group: 'FCRA' },
  { label: 'FCRA Donors', path: '/fcra/donors', group: 'FCRA' },
  { label: 'FCRA Projects', path: '/fcra/projects', group: 'FCRA' },
  { label: 'FCRA Bank Accounts', path: '/fcra/bank-accounts', group: 'FCRA' },
  { label: 'FCRA Compliance Calendar', path: '/fcra/compliance', group: 'FCRA' },
  { label: 'FCRA FC-4 Filing', path: '/fcra/fc4', group: 'FCRA' },
  { label: 'FCRA Asset Register', path: '/fcra/assets', group: 'FCRA' },
  { label: 'FCRA Reports', path: '/fcra/reports', group: 'FCRA' },
  { label: 'FCRA Audit Trail', path: '/fcra/audit', group: 'FCRA' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setAiMode(false);
      setAiResult(null);
      setAiError(null);
      setSelectedIdx(0);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Filter actions
  const filteredActions = query
    ? QUICK_ACTIONS.filter((a) =>
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.group.toLowerCase().includes(query.toLowerCase())
      )
    : QUICK_ACTIONS;

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (aiMode) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filteredActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filteredActions[selectedIdx]) {
      navigate(filteredActions[selectedIdx].path);
      onClose();
    }
  };

  // AI query
  const handleAIQuery = async () => {
    if (!query.trim()) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);
    try {
      const res = await aiAPI.query(query);
      setAiResult(res.data.data);
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI query failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleAIMode = () => {
    setAiMode((m) => !m);
    setAiResult(null);
    setAiError(null);
    inputRef.current?.focus();
  };

  // Group actions
  const grouped = {};
  filteredActions.forEach((action) => {
    if (!grouped[action.group]) grouped[action.group] = [];
    grouped[action.group].push(action);
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100">
          {aiMode ? (
            <Brain className="w-4.5 h-4.5 text-brand-600 flex-shrink-0" />
          ) : (
            <Search className="w-4.5 h-4.5 text-slate-400 flex-shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder={aiMode ? 'Ask AI anything about your finances...' : 'Search actions, pages, or press ↵ to navigate...'}
            className="flex-1 text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={toggleAIMode}
            className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              aiMode ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            <Brain className="w-3 h-3" />
            AI
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto">
          {/* AI Mode */}
          {aiMode ? (
            <div className="p-4">
              {!aiResult && !aiLoading && !aiError && (
                <div className="text-center py-8">
                  <Brain className="w-8 h-8 text-brand-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 mb-1">Ask the AI anything about your finances</p>
                  <p className="text-xs text-slate-400">
                    e.g. "What is our revenue this month?" or "Show pending insurance claims"
                  </p>
                  {query && (
                    <button
                      onClick={handleAIQuery}
                      className="mt-4 flex items-center gap-2 mx-auto px-4 py-2 bg-brand-600 text-white text-sm rounded-lg hover:bg-brand-700 transition-colors"
                    >
                      <Brain className="w-4 h-4" />
                      Ask AI
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
              {aiLoading && (
                <div className="text-center py-8">
                  <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Thinking...</p>
                </div>
              )}
              {aiError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                  {aiError}
                </div>
              )}
              {aiResult && (
                <div className="space-y-3">
                  <div className="p-3 bg-brand-50 border border-brand-100 rounded-lg">
                    <p className="text-sm text-slate-700 font-medium mb-1">Answer</p>
                    <p className="text-sm text-slate-600">{aiResult.summary}</p>
                  </div>
                  {aiResult.data && aiResult.data.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            {Object.keys(aiResult.data[0]).map((k) => (
                              <th key={k} className="px-3 py-2 text-left font-semibold text-slate-500 uppercase">
                                {k.replace(/_/g, ' ')}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {aiResult.data.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              {Object.values(row).map((v, j) => (
                                <td key={j} className="px-3 py-2 text-slate-700">
                                  {v === null ? '—' : String(v)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <button
                    onClick={() => navigate('/ai')}
                    className="text-xs text-brand-600 hover:text-brand-700 font-medium"
                  >
                    Open full AI assistant →
                  </button>
                </div>
              )}
              {query && !aiLoading && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={handleAIQuery}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-brand-600 hover:bg-brand-50 rounded-lg transition-colors font-medium"
                  >
                    <Brain className="w-4 h-4" />
                    Ask: "{query}"
                    <CornerDownLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Navigation Mode */
            <div className="py-2">
              {filteredActions.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-8">No results for "{query}"</p>
              ) : (
                Object.entries(grouped).map(([group, items]) => (
                  <div key={group}>
                    <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                      {group}
                    </p>
                    {items.map((action) => {
                      const globalIdx = filteredActions.indexOf(action);
                      return (
                        <button
                          key={action.path}
                          onClick={() => { navigate(action.path); onClose(); }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                          className={clsx(
                            'w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors',
                            globalIdx === selectedIdx
                              ? 'bg-brand-50 text-brand-700'
                              : 'text-slate-700 hover:bg-slate-50'
                          )}
                        >
                          <span>{action.label}</span>
                          {globalIdx === selectedIdx && (
                            <ArrowRight className="w-3.5 h-3.5 text-brand-600" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[11px] text-slate-400">↑↓ navigate</span>
          <span className="text-[11px] text-slate-400">↵ select</span>
          <span className="text-[11px] text-slate-400">esc close</span>
          <span className="flex-1" />
          <span className="text-[11px] text-slate-400">⌘K toggle</span>
        </div>
      </div>
    </div>
  );
}
