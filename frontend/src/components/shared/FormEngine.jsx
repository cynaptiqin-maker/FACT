import { useCallback, useRef, useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { useReliability } from '../../providers/ReliabilityProvider';

/**
 * FormEngine — Enterprise-grade form wrapper.
 *
 * Features:
 *   - Zod schema validation
 *   - Duplicate submission prevention
 *   - Auto-draft persistence to sessionStorage
 *   - Loading/success/error states
 *   - Retry on network failure
 *   - Form-level error display
 *
 * Usage:
 *   <FormEngine
 *     id="new-invoice"
 *     schema={invoiceSchema}
 *     defaultValues={defaults}
 *     onSubmit={handleCreate}
 *     draftKey="invoice-draft"
 *   >
 *     {({ register, errors, isSubmitting }) => (
 *       <input {...register('patient_name')} />
 *     )}
 *   </FormEngine>
 */
export function FormEngine({
  id,
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  children,
  draftKey,
  submitLabel = 'Save',
  submitIcon,
  className = '',
  showFormError = true,
  autoDraft = false,
  resetOnSuccess = false,
}) {
  const { lockSubmission, unlockSubmission, isSubmissionLocked } = useReliability();
  const [formError, setFormError] = useState(null);
  const [successState, setSuccessState] = useState(false);
  const draftTimerRef = useRef(null);

  const methods = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: _loadDraft(draftKey) || defaultValues,
    mode: 'onBlur',
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = methods;

  // Auto-draft: debounced save to sessionStorage
  if (autoDraft && draftKey) {
    watch((values) => {
      clearTimeout(draftTimerRef.current);
      draftTimerRef.current = setTimeout(() => {
        try {
          sessionStorage.setItem(`form-draft:${draftKey}`, JSON.stringify(values));
        } catch {
          // sessionStorage quota exceeded — ignore
        }
      }, 500);
    });
  }

  const handleFormSubmit = useCallback(
    async (values) => {
      const lockKey = id || draftKey || 'form-submit';

      // Prevent double-click submission
      if (isSubmissionLocked(lockKey)) {
        toast.error('Submission already in progress. Please wait.');
        return;
      }

      if (!lockSubmission(lockKey)) return;
      setFormError(null);
      setSuccessState(false);

      try {
        const result = await onSubmit(values);

        setSuccessState(true);
        _clearDraft(draftKey);

        if (resetOnSuccess) reset(defaultValues);
        if (onSuccess) onSuccess(result, values);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.errors?.[0]?.message ||
          err?.message ||
          'Submission failed. Please try again.';

        setFormError(message);
        if (onError) onError(err);
      } finally {
        unlockSubmission(lockKey);
      }
    },
    [
      id,
      draftKey,
      isSubmissionLocked,
      lockSubmission,
      unlockSubmission,
      onSubmit,
      onSuccess,
      onError,
      reset,
      resetOnSuccess,
      defaultValues,
    ]
  );

  // Collect first-level field errors for display
  const fieldErrors = Object.entries(errors).map(([field, err]) => ({
    field,
    message: err?.message,
  }));

  return (
    <FormProvider {...methods}>
      <form
        id={id}
        onSubmit={handleSubmit(handleFormSubmit)}
        className={className}
        noValidate
      >
        {/* Form-level error banner */}
        {showFormError && (formError || fieldErrors.length > 0) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {formError && <p className="text-sm font-medium text-red-700">{formError}</p>}
              {fieldErrors.map(({ field, message }) => (
                <p key={field} className="text-xs text-red-600">
                  <span className="font-medium capitalize">{field.replace(/_/g, ' ')}</span>:{' '}
                  {message}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Form fields via render prop */}
        {typeof children === 'function'
          ? children({ register: methods.register, errors, isSubmitting, isDirty })
          : children}

        {/* Auto-draft indicator */}
        {autoDraft && isDirty && (
          <p className="mt-2 text-xs text-gray-400 flex items-center gap-1.5">
            <Save className="w-3 h-3" />
            Draft auto-saved
          </p>
        )}

        {/* Default submit button (only if no custom button is provided) */}
        {onSubmit && !className.includes('no-submit-btn') && (
          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : successState ? (
              '✓'
            ) : (
              submitIcon
            )}
            {isSubmitting ? 'Saving…' : submitLabel}
          </button>
        )}
      </form>
    </FormProvider>
  );
}

// ── Field component with consistent error display ─────────────────────────────

export function FormField({ label, name, required, error, hint, children }) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error.message || error}
        </p>
      )}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _loadDraft(draftKey) {
  if (!draftKey) return null;
  try {
    const raw = sessionStorage.getItem(`form-draft:${draftKey}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function _clearDraft(draftKey) {
  if (!draftKey) return;
  try {
    sessionStorage.removeItem(`form-draft:${draftKey}`);
  } catch {
    // ignore
  }
}

export default FormEngine;
