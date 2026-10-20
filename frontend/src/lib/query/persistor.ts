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

/** Discard pre-summary catalog blobs still sitting in localStorage. */
export const PERSIST_BUSTER = 'catalog-summary-v1';

/**
 * Persist slim catalog lists and individual full documents, plus users/affiliations.
 * Skip `byCodes` batch keys — they are per-page and noisy.
 */
export function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  if (!queryKey.length) return false;
  const firstKey = queryKey[0];
  if (typeof firstKey !== 'string') return false;
  if (firstKey === 'tests') {
    const second = queryKey[1];
    return second === 'list' || second === 'detail';
  }
  return PERSISTABLE_QUERY_KEYS.includes(firstKey);
}

/**
 * Create the storage persister for localStorage
 */
/**
 * Remove the persisted TanStack Query cache from localStorage.
 * Call on logout so the next session cannot restore another user's catalog.
 */
export function clearPersistedQueryCache(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(PERSIST_STORAGE_KEY);
  } catch {
    // Ignore storage errors (private mode, quota, etc.)
  }
}

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
    serialize: data => JSON.stringify(data),
    deserialize: data => JSON.parse(data),
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

