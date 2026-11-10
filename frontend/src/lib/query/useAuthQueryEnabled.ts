/**
 * Shared auth gate for TanStack Query hooks.
 * Queries stay disabled until the Zustand auth store has rehydrated and the user is signed in.
 */

import { useSyncExternalStore } from 'react';
import { useAuthStore } from '@/app/authStore';

/** Subscribe to auth store changes (any field). */
function subscribeToAuth(onStoreChange: () => void): () => void {
  return useAuthStore.subscribe(onStoreChange);
}

/**
 * Whether the session is ready for authenticated queries (rehydrated + signed in).
 */
function getAuthQueryGateSnapshot(): boolean {
  const { isAuthenticated, isLoading } = useAuthStore.getState();
  return isAuthenticated && !isLoading;
}

/** SSR / pre-hydration: never enable queries. */
function getAuthQueryGateServerSnapshot(): boolean {
  return false;
}

/**
 * Returns whether a query should fetch for the current auth session.
 *
 * Uses `useSyncExternalStore` instead of `useAuthStore()` so lazy-loaded chunks
 * do not trip React hook ordering via Zustand's internal `useCallback` chain.
 *
 * @param extra - Additional caller-specific enablement (ids present, etc.).
 */
export function useAuthQueryEnabled(extra = true): boolean {
  const base = useSyncExternalStore(
    subscribeToAuth,
    getAuthQueryGateSnapshot,
    getAuthQueryGateServerSnapshot
  );
  return base && extra;
}
