/**
 * TanStack Query Client Configuration
 *
 * Implements tiered caching strategy based on data characteristics:
 * - Static: Test catalog, users (rarely changes) - Infinity cache
 * - Semi-static: Patients (occasional changes) - 5 min stale time
 * - Dynamic: Orders, samples, payments (frequent changes) - 30s stale time
 *
 * refetchOnWindowFocus skips queries whose key prefix is in STATIC_QUERY_KEY_PREFIXES (see keys.ts).
 */

import { QueryClient } from '@tanstack/react-query';
import { STATIC_QUERY_KEY_PREFIXES } from './keys';

/**
 * Cache configuration presets for different data tiers
 */
export const cacheConfig = {
  /**
   * Static data - rarely changes (test catalog, users, enums)
   * Fetched once per session, never considered stale
   */
  static: {
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  },

  /**
   * Semi-static data - occasional changes (patients)
   * Cached for 5 minutes, kept in memory for 30 minutes
   */
  semiStatic: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
  },

  /**
   * Dynamic data - frequent changes (orders, samples, payments)
   * Short cache, background refetch on focus
   */
  dynamic: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 1,
  },
} as const;

/**
 * Minimum time since last fetch before refetching on window focus (1 minute)
 */
const SMART_REFETCH_THRESHOLD = 60 * 1000;

/**
 * Create and configure the QueryClient instance
 * Uses sensible defaults that can be overridden per-query
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default to dynamic behavior - most queries are dynamic
        ...cacheConfig.dynamic,
        // Smart window focus refetch - only if data is stale enough
        refetchOnWindowFocus: (query) => {
          const queryKey = query.queryKey;
          if (Array.isArray(queryKey) && typeof queryKey[0] === 'string') {
            if (STATIC_QUERY_KEY_PREFIXES.includes(queryKey[0] as (typeof STATIC_QUERY_KEY_PREFIXES)[number])) {
              return false;
            }
          }
          // Only refetch if data is older than threshold
          const lastFetch = query.state.dataUpdatedAt;
          if (lastFetch && Date.now() - lastFetch < SMART_REFETCH_THRESHOLD) {
            return false;
          }
          return true;
        },
        // Network mode - fetch only when online
        networkMode: 'online',
        // Use previous data as placeholder while refetching
        placeholderData: (previousData: unknown) => previousData,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        // Network mode - attempt only when online
        networkMode: 'online',
      },
    },
  });
}

/**
 * Singleton QueryClient instance for the application
 * Created lazily to avoid issues with SSR (if ever needed)
 */
let queryClientInstance: QueryClient | null = null;

/**
 * Get or create the singleton QueryClient instance
 * @returns The application's QueryClient
 */
export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient();
  }
  return queryClientInstance;
}

/**
 * Reset the QueryClient instance (useful for testing or logout)
 * Clears all cached data and resets the client
 */
export function resetQueryClient(): void {
  if (queryClientInstance) {
    queryClientInstance.clear();
    queryClientInstance = null;
  }
}
