import React from 'react';

/**
 * ConfirmModal — a small, accessible confirmation dialog.
 *
 * Props:
 *   open        {boolean}  Whether the modal is visible
 *   title       {string}   Bold heading
 *   message     {string}   Body text (gray)
 *   confirmLabel{string}   Text for confirm button (default "Confirm")
 *   danger      {boolean}  When true the confirm button is red; otherwise primary blue
 *   onConfirm   {fn}       Called when the user clicks the confirm button
 *   onCancel    {fn}       Called when the user clicks Cancel or the backdrop
 */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-xl shadow-xl p-6 space-y-4">
        {title && (
          <h2
            id="confirm-modal-title"
            className="text-base font-bold text-slate-800"
          >
            {title}
          </h2>
        )}

        {message && (
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
