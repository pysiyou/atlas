/**
 * Shared auth gate for TanStack Query hooks.
 * Queries stay disabled until the Zustand auth store has rehydrated and the user is signed in.
 */

import { useAuthStore } from '@/app/authStore';

/**
 * Returns whether a query should fetch for the current auth session.
 *
 * @param extra - Additional caller-specific enablement (ids present, etc.).
 */
export function useAuthQueryEnabled(extra = true): boolean {
  const { isAuthenticated, isLoading } = useAuthStore();
  return isAuthenticated && !isLoading && extra;
}
