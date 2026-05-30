import { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { PageErrorBoundary } from '../components/shared/ErrorBoundary';

/**
 * ReliabilityProvider
 *
 * Single root wrapper that configures:
 *   - React Query with retry, stale-time, and global error handling
 *   - Global loading state tracking
 *   - Duplicate submission prevention
 *   - Network status monitoring
 *   - Unhandled promise rejection capture
 */

// ─── Context ───────────────────────────────────────────────────────────────────

const ReliabilityContext = createContext(null);

export function useReliability() {
  const ctx = useContext(ReliabilityContext);
  if (!ctx) throw new Error('useReliability must be used inside ReliabilityProvider');
  return ctx;
}

// ─── Query Client (singleton) ─────────────────────────────────────────────────

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // 30s before refetch
      gcTime: 5 * 60_000,        // 5 min cache
      retry: (failureCount, error) => {
        // Never retry 4xx (except 429)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          if (error?.response?.status === 429) return failureCount < 2;
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * Math.pow(2, attempt), 30_000),
      refetchOnWindowFocus: false, // prevent surprise refetches in financial forms
    },
    mutations: {
      retry: (failureCount, error) => {
        // Only retry network errors, not business logic failures
        if (!error?.response && failureCount < 2) return true;
        return false;
      },
      retryDelay: 1_000,
    },
  },
});

// Intercept query errors globally
queryClient.setDefaultOptions({
  queries: {
    ...queryClient.getDefaultOptions().queries,
  },
  mutations: {
    ...queryClient.getDefaultOptions().mutations,
    onError: (error) => {
      // Only show toast for mutations — queries use component-level handling
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Operation failed. Please try again.';
      toast.error(message, { id: 'mutation-error', duration: 4000 });
    },
  },
});

// ─── Provider ──────────────────────────────────────────────────────────────────

export function ReliabilityProvider({ children }) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [globalLoading, setGlobalLoading] = useState(false);
  const loadingCountRef = useRef(0);

  // Submission lock to prevent double-clicks
  const submissionLocks = useRef(new Map());

  // ── Network status monitoring ──────────────────────────────────────────────

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored', { icon: '🌐', duration: 2000 });
      // Refetch stale queries when back online
      queryClient.invalidateQueries();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Changes will resume when connection is restored.', {
        id: 'offline-toast',
        duration: Infinity,
        icon: '⚠️',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Unhandled promise rejection capture ──────────────────────────────────

  useEffect(() => {
    const handler = (event) => {
      const error = event.reason;
      // Don't surface framework-internal errors as user toasts
      if (error?.name === 'ChunkLoadError') {
        toast.error('A new version is available. Reloading...', { duration: 3000 });
        setTimeout(() => window.location.reload(), 3000);
        return;
      }
      if (import.meta.env.DEV) {
        console.error('[UnhandledPromise]', error);
      }
    };

    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  // ── Global loading helpers ─────────────────────────────────────────────────

  const startLoading = useCallback(() => {
    loadingCountRef.current += 1;
    setGlobalLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    loadingCountRef.current = Math.max(0, loadingCountRef.current - 1);
    if (loadingCountRef.current === 0) setGlobalLoading(false);
  }, []);

  // ── Duplicate submission prevention ──────────────────────────────────────

  const lockSubmission = useCallback((key) => {
    if (submissionLocks.current.has(key)) return false;
    submissionLocks.current.set(key, Date.now());
    return true;
  }, []);

  const unlockSubmission = useCallback((key) => {
    submissionLocks.current.delete(key);
  }, []);

  const isSubmissionLocked = useCallback(
    (key) => submissionLocks.current.has(key),
    []
  );

  // ── Context value ──────────────────────────────────────────────────────────

  const value = {
    isOnline,
    globalLoading,
    startLoading,
    stopLoading,
    lockSubmission,
    unlockSubmission,
    isSubmissionLocked,
    queryClient,
  };

  return (
    <ReliabilityContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        <PageErrorBoundary module="Application">
          {/* Offline banner */}
          {!isOnline && (
            <div className="fixed top-0 left-0 right-0 z-[9999] bg-yellow-500 text-yellow-900 text-sm font-medium text-center py-2 px-4">
              You are offline — read-only mode active. Financial operations are paused.
            </div>
          )}
          {children}
        </PageErrorBoundary>
      </QueryClientProvider>
    </ReliabilityContext.Provider>
  );
}

export { queryClient };
