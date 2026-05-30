import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useReliability } from '../providers/ReliabilityProvider';

/**
 * useFinancialForm
 *
 * Specialized hook for financial mutations (invoice creation, payment,
 * journal posting, etc.). Provides:
 *   - Idempotency key generation (sent as header)
 *   - Duplicate submission prevention
 *   - Optimistic cache invalidation
 *   - Rollback on failure
 *   - Structured error extraction from API violations array
 *   - Loading/success/error state machine
 *
 * Usage:
 *   const { submit, isSubmitting, error, violations } = useFinancialForm({
 *     mutationFn: (data) => billingAPI.createInvoice(data),
 *     invalidateKeys: [['billing', 'invoices'], ['ar', 'dashboard']],
 *     successMessage: 'Invoice created successfully',
 *   })
 */
export function useFinancialForm({
  mutationFn,
  invalidateKeys = [],
  successMessage = 'Saved successfully',
  errorMessage = 'Operation failed',
  onSuccess,
  onError,
  rollback,
}) {
  const queryClient = useQueryClient();
  const { lockSubmission, unlockSubmission, isSubmissionLocked } = useReliability();
  const [violations, setViolations] = useState([]);
  const [idempotencyKey, setIdempotencyKey] = useState(() => uuidv4());

  const mutation = useMutation({
    mutationFn: async (data) => {
      const lockKey = `financial-form:${idempotencyKey}`;

      if (isSubmissionLocked(lockKey)) {
        throw new Error('Submission in progress — please wait');
      }

      if (!lockSubmission(lockKey)) {
        throw new Error('Could not acquire submission lock');
      }

      try {
        // Attach idempotency key to request (api.js interceptor reads this)
        const result = await mutationFn(data, idempotencyKey);
        return result;
      } finally {
        unlockSubmission(lockKey);
      }
    },

    onSuccess: (result, variables) => {
      setViolations([]);

      // Regenerate key for the next unique submission
      setIdempotencyKey(uuidv4());

      // Invalidate dependent queries
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }

      toast.success(successMessage);
      onSuccess?.(result, variables);
    },

    onError: (err, variables, context) => {
      // Extract financial integrity violations
      const apiViolations = err?.response?.data?.violations || [];
      const apiErrors = err?.response?.data?.errors || [];
      const allViolations = [...apiViolations, ...apiErrors];

      setViolations(allViolations);

      const message =
        err?.response?.data?.message ||
        err?.message ||
        errorMessage;

      toast.error(message, { duration: 5000 });

      // Execute rollback if provided
      if (rollback && context) {
        rollback(context, err);
      }

      onError?.(err, variables);
    },
  });

  const submit = useCallback(
    (data) => {
      setViolations([]);
      return mutation.mutateAsync(data);
    },
    [mutation]
  );

  const reset = useCallback(() => {
    mutation.reset();
    setViolations([]);
    setIdempotencyKey(uuidv4()); // fresh key for a new attempt
  }, [mutation]);

  return {
    submit,
    reset,
    isSubmitting: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
    violations,
    data: mutation.data,
    idempotencyKey,
  };
}

export default useFinancialForm;
