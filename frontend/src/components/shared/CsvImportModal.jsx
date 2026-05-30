'use strict';
import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, Download, CheckCircle, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^,]+|(?<=,)(?=,)|(?<=,)$|^(?=,))/g) || [];
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || '').trim().replace(/^"|"$/g, '');
    });
    return obj;
  });
  return { headers, rows };
}

function downloadCsv(filename, headers, exampleRows) {
  const lines = [headers.join(','), ...exampleRows.map(r => headers.map(h => r[h] ?? '').join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── CsvImportModal ───────────────────────────────────────────────────────────
export default function CsvImportModal({
  open,
  onClose,
  title,
  templateFilename,
  templateHeaders,
  templateExample,
  onImport,          // async (rows) => { created, updated?, errors }
  extraFields,       // optional JSX to render extra inputs (e.g. fiscal year selector)
}) {
  const [file, setFile]           = useState(null);
  const [preview, setPreview]     = useState(null);
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [dragOver, setDragOver]   = useState(false);
  const inputRef                  = useRef();

  const reset = useCallback(() => {
    setFile(null); setPreview(null); setResult(null); setLoading(false);
  }, []);

  const handleClose = () => { reset(); onClose(); };

  const handleFile = useCallback((f) => {
    if (!f || !f.name.endsWith('.csv')) { toast.error('Please upload a .csv file'); return; }
    setFile(f); setResult(null);
    const reader = new FileReader();
    reader.onload = e => {
      const { headers, rows } = parseCsv(e.target.result);
      setPreview({ headers, rows: rows.slice(0, 5), total: rows.length, allRows: rows });
    };
    reader.readAsText(f);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  const handleSubmit = async () => {
    if (!preview?.allRows?.length) return;
    setLoading(true);
    try {
      const res = await onImport(preview.allRows);
      setResult(res);
      const { created = 0, updated = 0, errors = [] } = res;
      if (errors.length === 0) {
        toast.success(`Import complete: ${created} created${updated ? `, ${updated} updated` : ''}`);
      } else {
        toast.error(`Import finished with ${errors.length} error(s)`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err.message || 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
                  <p className="text-xs text-slate-500">Upload a CSV file to import in bulk</p>
                </div>
              </div>
              <button onClick={handleClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Template download */}
              <div className="flex items-center justify-between rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-xs font-medium text-slate-700">Download template</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Columns: {templateHeaders.join(', ')}</p>
                </div>
                <button
                  onClick={() => downloadCsv(templateFilename, templateHeaders, templateExample)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Template
                </button>
              </div>

              {/* Extra fields (e.g. fiscal year) */}
              {extraFields && <div>{extraFields}</div>}

              {/* Drop zone */}
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer py-8 transition-colors ${
                  dragOver ? 'border-brand-400 bg-brand-50' : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50'
                }`}
              >
                <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
                <FileText className="w-8 h-8 text-slate-300" />
                {file ? (
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                ) : (
                  <p className="text-sm text-slate-500">Drop CSV here or <span className="text-brand-600 font-medium">browse</span></p>
                )}
                <p className="text-xs text-slate-400">.csv files only</p>
              </div>

              {/* Preview table */}
              {preview && !result && (
                <div>
                  <p className="text-xs font-medium text-slate-600 mb-2">
                    Preview — {preview.total} row{preview.total !== 1 ? 's' : ''} detected
                    {preview.total > 5 ? ` (showing first 5)` : ''}
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-[11px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          {preview.headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.rows.map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                            {preview.headers.map(h => (
                              <td key={h} className="px-3 py-2 text-slate-700 whitespace-nowrap max-w-[150px] truncate">{row[h]}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {result.errors?.length === 0 ? (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        {result.created} created{result.updated ? `, ${result.updated} updated` : ''}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
                        <AlertTriangle className="w-4 h-4" />
                        {result.created} created · {result.errors.length} error{result.errors.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  {result.errors?.length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 overflow-y-auto max-h-40">
                      {result.errors.map((e, i) => (
                        <div key={i} className="px-3 py-2 border-b border-red-100 last:border-0 text-[11px] text-red-700">
                          {e.row ? `Row ${e.row}: ` : e.reference ? `Ref "${e.reference}": ` : ''}{e.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
              <button onClick={handleClose} className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                {result ? 'Close' : 'Cancel'}
              </button>
              {!result && preview && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {loading ? 'Importing…' : `Import ${preview.total} row${preview.total !== 1 ? 's' : ''}`}
                </button>
              )}
              {result && (
                <button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" /> Import Another
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
