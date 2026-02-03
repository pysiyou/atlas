/**
 * Affiliation Pricing Query Hook
 *
 * Provides access to affiliation pricing data with static caching.
 * Pricing data is fetched once per session and never considered stale.
 *
 * @module hooks/queries/useAffiliationPricing
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { affiliationAPI } from '@/services/api';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { AffiliationPricing } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';

/**
 * Hook to fetch and cache all affiliation pricing options.
 * Uses static cache - pricing rarely changes during a session.
 *
 * @returns Query result containing pricing array and loading state
 *
 * @example
 * ```tsx
 * const { pricing, isLoading, error } = useAffiliationPricing();
 * ```
 */
export function useAffiliationPricing() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.affiliations.pricing(),
    queryFn: () => affiliationAPI.getPricing(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.static, // Infinity stale time - pricing rarely changes
  });

  return {
    pricing: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch pricing for a specific affiliation duration.
 * Uses static cache with the specific duration as part of the key.
 *
 * @param duration - The affiliation duration (6, 12, or 24 months)
 * @returns Query result containing pricing for the specific duration
 *
 * @example
 * ```tsx
 * const { price, isLoading } = useAffiliationPrice(12);
 * ```
 */
export function useAffiliationPrice(duration: AffiliationDuration) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.affiliations.priceByDuration(duration),
    queryFn: () => affiliationAPI.getPrice(duration),
    enabled: isAuthenticated && !isRestoring && !!duration,
    ...cacheConfig.static,
  });

  return {
    price: query.data ?? null,
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook that selects specific pricing from the full pricing list.
 * Uses the same cached data as useAffiliationPricing but returns
 * only the requested duration's price.
 *
 * This is more efficient than useAffiliationPrice when you already
 * have the full pricing list cached.
 *
 * @param duration - The affiliation duration to select
 * @returns The price for the selected duration, or null if not found
 *
 * @example
 * ```tsx
 * const price = useSelectedAffiliationPrice(12);
 * ```
 */
export function useSelectedAffiliationPrice(duration: AffiliationDuration | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.affiliations.pricing(),
    queryFn: () => affiliationAPI.getPricing(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.static,
    select: (data: AffiliationPricing[]) =>
      duration ? data.find(p => p.duration === duration)?.price ?? null : null,
  });

  return query.data ?? null;
}
