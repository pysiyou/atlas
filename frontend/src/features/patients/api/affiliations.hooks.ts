/**
 * Affiliation API hooks — React Query layer.
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useAuthStore } from '@/app/authStore';
import type { AffiliationPricing } from '@/types/affiliation';
import type { AffiliationDuration } from '@/types';
import { affiliationAPI } from './affiliations.service';

export { affiliationAPI } from './affiliations.service';

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
