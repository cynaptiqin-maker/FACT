import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS } from './jvConstants';

export default function JVShortcutsModal({ onClose }) {
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1,    y: 0 }}
        exit={{ opacity: 0, scale: 0.95,    y: 8 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Keyboard Shortcuts</h2>
              <p className="text-[10px] text-slate-400">Journal Voucher module</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4 space-y-1">
          {KEYBOARD_SHORTCUTS.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="text-sm text-slate-600">{sc.desc}</span>
              <kbd className="text-[11px] font-mono bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
          <p className="text-[10px] text-slate-400 text-center">
            Press <kbd className="font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-600">Esc</kbd> to close
          </p>
        </div>
      </motion.div>
    </div>
  );
}
