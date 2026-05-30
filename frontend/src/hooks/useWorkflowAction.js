import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';

/**
 * useWorkflowAction
 *
 * Hook for triggering workflow transitions (Approve, Reject, Escalate, etc.)
 * with confirmation, loading state, and proper cache invalidation.
 *
 * Features:
 *   - Per-action loading state (won't freeze the whole page)
 *   - Confirmation dialog support
 *   - Automatic invalidation of workflow and source module queries
 *   - Error display with workflow-specific messaging
 *
 * Usage:
 *   const { trigger, isLoading } = useWorkflowAction({
 *     taskId: task.id,
 *     invalidateKeys: [['billing', 'invoices'], ['workflow', 'tasks']],
 *   })
 *   <button onClick={() => trigger('APPROVE', { comment: 'Looks good' })}>Approve</button>
 */
export function useWorkflowAction({ taskId, invalidateKeys = [], onSuccess, onError }) {
  const queryClient = useQueryClient();
  const [activeAction, setActiveAction] = useState(null);

  const mutation = useMutation({
    mutationFn: ({ action, payload }) =>
      adminAPI.performWorkflowAction(taskId, action, payload),

    onMutate: ({ action }) => {
      setActiveAction(action);
    },

    onSuccess: (result, { action }) => {
      const messages = {
        APPROVE: 'Approved successfully',
        REJECT: 'Rejected',
        ESCALATE: 'Escalated to next level',
        SUBMIT: 'Submitted for approval',
        CANCEL: 'Cancelled',
        COMPLETE: 'Marked as complete',
      };
      toast.success(messages[action] || 'Action completed');

      for (const key of invalidateKeys) {
        queryClient.invalidateQueries({ queryKey: key });
      }
      // Always refresh workflow tasks
      queryClient.invalidateQueries({ queryKey: ['workflow', 'tasks'] });

      onSuccess?.(result, action);
    },

    onError: (err, { action }) => {
      const message =
        err?.response?.data?.message || err?.message || `${action} failed. Please try again.`;
      toast.error(message);
      onError?.(err, action);
    },

    onSettled: () => {
      setActiveAction(null);
    },
  });

  const trigger = useCallback(
    (action, payload = {}) => {
      if (mutation.isPending) return;
      return mutation.mutateAsync({ action, payload });
    },
    [mutation]
  );

  return {
    trigger,
    isLoading: mutation.isPending,
    activeAction,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export default useWorkflowAction;
