import { motion } from 'framer-motion';
import {
  CheckCircle2, Upload, Download, RotateCcw, Archive,
  Tag, X, AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ACTIONS = [
  { id: 'approve', icon: CheckCircle2, label: 'Approve All', cls: 'bg-emerald-600 hover:bg-emerald-700 text-white', requiresConfirm: true },
  { id: 'post', icon: Upload, label: 'Post All', cls: 'bg-sky-600 hover:bg-sky-700 text-white', requiresConfirm: true },
  { id: 'export', icon: Download, label: 'Export', cls: 'bg-gray-600 hover:bg-gray-700 text-white', requiresConfirm: false },
  { id: 'reverse', icon: RotateCcw, label: 'Reverse', cls: 'bg-amber-500 hover:bg-amber-600 text-white', requiresConfirm: true },
  { id: 'archive', icon: Archive, label: 'Archive', cls: 'bg-slate-500 hover:bg-slate-600 text-white', requiresConfirm: true },
  { id: 'tag', icon: Tag, label: 'Tag', cls: 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800', requiresConfirm: false },
];

export default function JVLBulkActionBar({ count, selectedRows, onAction, onClear }) {
  const handleAction = (action) => {
    if (action.requiresConfirm) {
      toast((t) => (
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-gray-800">{action.label} {count} journal{count !== 1 ? 's' : ''}?</p>
            <p className="text-xs text-gray-500 mt-0.5">This action cannot be easily undone.</p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => { toast.dismiss(t.id); onAction?.(action.id, Array.from(selectedRows)); }}
                className="px-3 py-1 rounded-lg bg-[#1C3741] text-white text-xs font-semibold hover:bg-[#254e5b]"
              >
                Confirm
              </button>
              <button onClick={() => toast.dismiss(t.id)} className="px-3 py-1 rounded-lg border text-xs font-medium text-gray-600">
                Cancel
              </button>
            </div>
          </div>
        </div>
      ), { duration: 8000 });
    } else {
      onAction?.(action.id, Array.from(selectedRows));
    }
  };

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-[#1C3741] dark:bg-[#0f2030] border-t border-[#254e5b] shadow-2xl"
    >
      <div className="flex items-center gap-2 mr-2">
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{count}</span>
        </div>
        <span className="text-sm font-medium text-white/80">
          {count} journal{count !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="w-px h-6 bg-white/20 mx-1" />

      <div className="flex items-center gap-1.5 flex-wrap">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction(action)}
              className={`h-8 px-3 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${action.cls}`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{action.label}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="flex-1" />

      <button
        onClick={onClear}
        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <X className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Deselect</span>
      </button>
    </motion.div>
  );
}
