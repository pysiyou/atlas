/**
 * Affiliation API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { expectArray } from '@/lib/api/errors';
import { REFERENCE_DATA_LIMIT } from '@/lib/api/constants';
import type { AffiliationPricing } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';
import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useAuthStore } from '@/app/authStore';

export const affiliationAPI = {
  async getPricing(): Promise<AffiliationPricing[]> {
    return expectArray<AffiliationPricing>(
      await apiClient.get<AffiliationPricing[]>('/affiliations/pricing', {
        limit: String(REFERENCE_DATA_LIMIT),
      }),
      'affiliation pricing'
    );
  },

  async getPrice(duration: AffiliationDuration): Promise<AffiliationPricing> {
    return apiClient.get<AffiliationPricing>(`/affiliations/pricing/${duration}`);
  },
};

/**
 * Affiliation API hooks — React Query layer.
 */

export function useAffiliationPricing() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.affiliations.pricing(),
    queryFn: () => affiliationAPI.getPricing(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.static,
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

export function useSelectedAffiliationPrice(duration: AffiliationDuration | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.affiliations.pricing(),
    queryFn: () => affiliationAPI.getPricing(),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.static,
    select: (data: AffiliationPricing[]) =>
      duration ? (data.find(p => p.duration === duration)?.price ?? null) : null,
  });

  return query.data ?? null;
}
