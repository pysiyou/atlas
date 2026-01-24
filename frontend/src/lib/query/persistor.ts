/**
 * Query Cache Persistence Configuration
 *
 * Persists TanStack Query cache to localStorage for:
 * - Instant app loading with cached data
 * - Offline resilience for static data
 * - Faster perceived performance on page reload
 *
 * Only static and semi-static data is persisted:
 * - Tests (static) - rarely changes
 * - Patients (semi-static) - occasionally changes
 *
 * Dynamic data (orders, samples) is NOT persisted to ensure freshness.
 */

import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { PersistedClient } from '@tanstack/react-query-persist-client';

/**
 * Storage key for the persisted cache
 */
export const PERSIST_STORAGE_KEY = 'atlas-query-cache';

/**
 * Maximum age for persisted cache (24 hours)
 * After this time, the cache will be discarded on load
 */
export const PERSIST_MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours

/**
 * Query key prefixes that should be persisted
 * Only static/semi-static data
 */
const PERSISTABLE_QUERY_KEYS = ['tests', 'users', 'affiliations'];

/**
 * Check if a query should be persisted based on its key
 */
function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  if (!queryKey.length) return false;
  const firstKey = queryKey[0];
  if (typeof firstKey !== 'string') return false;
  return PERSISTABLE_QUERY_KEYS.includes(firstKey);
}

/**
 * Create the storage persister for localStorage
 */
export function createPersister() {
  // Only create persister in browser environment
  if (typeof window === 'undefined') {
    return undefined;
  }

  return createSyncStoragePersister({
    storage: window.localStorage,
    key: PERSIST_STORAGE_KEY,
    // Throttle writes to localStorage (100ms)
    throttleTime: 100,
    // Custom serializer to handle dates
    serialize: (data) => JSON.stringify(data),
    deserialize: (data) => JSON.parse(data),
  });
}

/**
 * Dehydrate options - controls what gets persisted
 */
export const dehydrateOptions = {
  shouldDehydrateQuery: (query: { queryKey: readonly unknown[]; state: { status: string } }) => {
    // Only persist successful queries
    if (query.state.status !== 'success') {
      return false;
    }
    // Only persist static/semi-static data
    return shouldPersistQuery(query.queryKey);
  },
};

/**
 * Filter to apply when restoring persisted cache
 * Ensures stale data is not restored
 */
export function persistFilter(persistedClient: PersistedClient): PersistedClient {
  const now = Date.now();
  const maxAge = PERSIST_MAX_AGE;

  // Filter out expired queries
  const filteredQueries = persistedClient.clientState.queries.filter((query) => {
    const age = now - query.state.dataUpdatedAt;
    return age < maxAge;
  });

  return {
    ...persistedClient,
    clientState: {
      ...persistedClient.clientState,
      queries: filteredQueries,
    },
  };
}

/**
 * Clear persisted cache
 * Useful for logout or cache reset
 */
export function clearPersistedCache(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(PERSIST_STORAGE_KEY);
  }
}
