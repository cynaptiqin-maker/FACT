import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

/**
 * useOptimisticUpdate
 *
 * Applies an optimistic UI update before the server responds, then
 * rolls back automatically if the server returns an error.
 *
 * Usage:
 *   const { mutate } = useOptimisticUpdate({
 *     queryKey: ['ar', 'invoices'],
 *     mutationFn: (id) => arAPI.writeOff(id),
 *     updater: (oldData, variables) => ({
 *       ...oldData,
 *       data: oldData.data.map(inv =>
 *         inv.id === variables ? { ...inv, status: 'WRITTEN_OFF' } : inv
 *       )
 *     }),
 *     successMessage: 'Written off successfully',
 *   })
 */
export function useOptimisticUpdate({
  queryKey,
  mutationFn,
  updater,
  successMessage = 'Updated',
  errorMessage = 'Update failed — changes reverted',
  onSuccess,
  onError,
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn,

    onMutate: async (variables) => {
      // Cancel any in-flight refetches (they would overwrite the optimistic update)
      await queryClient.cancelQueries({ queryKey });

      // Snapshot for rollback
      const previousData = queryClient.getQueryData(queryKey);

      // Apply optimistic update
      if (updater) {
        queryClient.setQueryData(queryKey, (old) =>
          old ? updater(old, variables) : old
        );
      }

      return { previousData };
    },

    onSuccess: (result, variables) => {
      toast.success(successMessage);
      onSuccess?.(result, variables);
    },

    onError: (err, variables, context) => {
      // Rollback
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData);
      }

      const message =
        err?.response?.data?.message || err?.message || errorMessage;
      toast.error(message);
      onError?.(err, variables);
    },

    onSettled: () => {
      // Always refetch after a mutation settles to ensure server truth
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const mutate = useCallback(
    (variables) => mutation.mutate(variables),
    [mutation]
  );

  const mutateAsync = useCallback(
    (variables) => mutation.mutateAsync(variables),
    [mutation]
  );

  return {
    mutate,
    mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error,
  };
}

export default useOptimisticUpdate;
