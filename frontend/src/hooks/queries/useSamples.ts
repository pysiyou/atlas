/**
 * Samples Query Hook
 *
 * Provides access to sample data with dynamic caching (30s stale time).
 * Samples change frequently during collection and processing.
 *
 * @module hooks/queries/useSamples
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { sampleAPI } from '@/services/api/samples';
import { useAuthStore } from '@/shared/stores/auth.store';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
  RejectionReason,
} from '@/types';

/**
 * Filter options for samples list
 */
export interface SamplesFilters {
  orderId?: string;
  status?: SampleStatus;
}

/**
 * Hook to fetch and cache all samples.
 * Uses dynamic cache - data is considered fresh for 30 seconds.
 * Only fetches when user is authenticated to prevent race conditions on login.
 *
 * @param filters - Optional filters to apply
 * @returns Query result containing samples array and loading state
 *
 * @example
 * ```tsx
 * const { samples, isLoading, error } = useSamplesList();
 * ```
 */
export function useSamplesList(filters?: SamplesFilters) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.samples.list(filters),
    queryFn: () => sampleAPI.getAll(filters),
    enabled: isAuthenticated && !isRestoring, // Only fetch when authenticated and not restoring
    ...cacheConfig.dynamic, // 30s stale, 5 min gc
  });

  return {
    samples: query.data ?? [],
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to fetch paginated samples with server-side filtering.
 *
 * Use this for large datasets where client-side filtering is not practical.
 * Keeps previous data visible while fetching new page.
 *
 * @param filters - Optional filters (orderId, status)
 * @param initialPage - Starting page (default: 1)
 * @param pageSize - Items per page (default: 20)
 */
export function usePaginatedSamples(
  filters?: SamplesFilters,
  initialPage = 1,
  pageSize = 20
) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const [page, setPage] = useState(initialPage);

  const query = useQuery({
    queryKey: queryKeys.samples.paginated({
      ...filters,
      page,
      pageSize,
    }),
    queryFn: () =>
      sampleAPI.getPaginated({
        ...filters,
        page,
        pageSize,
      }),
    enabled: isAuthenticated && !isRestoring,
    placeholderData: keepPreviousData,
    ...cacheConfig.dynamic,
  });

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const nextPage = useCallback(() => {
    if (query.data?.pagination.hasNext) {
      setPage((p) => p + 1);
    }
  }, [query.data?.pagination.hasNext]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage((p) => p - 1);
    }
  }, [query.data?.pagination.hasPrev]);

  return {
    samples: query.data?.data ?? [],
    pagination: query.data?.pagination ?? {
      page: 1,
      pageSize,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
    isLoading: query.isLoading,
    isPending: query.isPending,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    page,
    goToPage,
    nextPage,
    prevPage,
  };
}

/**
 * Hook to fetch a single sample by ID.
 * Only fetches when user is authenticated to prevent race conditions on login.
 *
 * @param sampleId - The sample ID to fetch
 * @returns Query result with sample data
 *
 * @example
 * ```tsx
 * const { sample, isLoading } = useSample('SMP-001');
 * ```
 */
export function useSample(sampleId: string | undefined) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.samples.byId(sampleId ?? ''),
    queryFn: () => sampleAPI.getById(sampleId!),
    enabled: isAuthenticated && !isRestoring && !!sampleId, // Only fetch when authenticated and not restoring
    ...cacheConfig.dynamic,
  });

  return {
    sample: query.data,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get samples by order ID.
 * Uses cached data for instant filtering.
 *
 * @param orderId - The order ID to filter by
 * @returns Array of samples for the order
 */
export function useSamplesByOrder(orderId: string | undefined) {
  const { samples, isLoading } = useSamplesList();

  const orderSamples = useMemo(() => {
    if (!orderId) return [];
    const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
    if (isNaN(numericOrderId)) return [];
    return samples.filter(s => s.orderId === numericOrderId);
  }, [samples, orderId]);

  return {
    samples: orderSamples,
    isLoading,
  };
}

/**
 * Hook to get samples by status.
 * Uses cached data for instant filtering.
 *
 * @param status - The sample status to filter by
 * @returns Array of samples with the specified status
 */
export function useSamplesByStatus(status: SampleStatus | undefined) {
  const { samples, isLoading } = useSamplesList();

  const filteredSamples = useMemo(() => {
    if (!status) return samples;
    return samples.filter(s => s.status === status);
  }, [samples, status]);

  return {
    samples: filteredSamples,
    isLoading,
  };
}

/**
 * Hook to get pending samples.
 * Only fetches when user is authenticated to prevent race conditions on login.
 *
 * @returns Array of samples with pending status
 */
export function usePendingSamples() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.samples.pending(),
    queryFn: () => sampleAPI.getPending(),
    enabled: isAuthenticated && !isRestoring, // Only fetch when authenticated and not restoring
    ...cacheConfig.dynamic,
  });

  return {
    samples: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Hook to get sample lookup function.
 * Returns functions to resolve sample IDs to samples.
 *
 * @returns Object with getSample function
 */
export function useSampleLookup() {
  const { samples, isLoading } = useSamplesList();

  const samplesMap = useMemo(() => {
    const map = new Map<number, Sample>();
    samples.forEach(s => map.set(s.sampleId, s));
    return map;
  }, [samples]);

  const getSample = useCallback(
    (sampleId: number | string): Sample | undefined => {
      const numericId = typeof sampleId === 'string' ? parseInt(sampleId, 10) : sampleId;
      if (isNaN(numericId)) return undefined;
      return samplesMap.get(numericId);
    },
    [samplesMap]
  );

  const getSamplesByOrder = useCallback(
    (orderId: number | string): Sample[] => {
      const numericOrderId = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
      if (isNaN(numericOrderId)) return [];
      return samples.filter(s => s.orderId === numericOrderId);
    },
    [samples]
  );

  return {
    getSample,
    getSamplesByOrder,
    isLoading,
  };
}

/**
 * Collect sample request data
 */
interface CollectSampleData {
  sampleId: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
}

/**
 * Mutation hook to collect a sample.
 * Invalidates relevant caches on success.
 *
 * @returns Mutation result with mutate function
 *
 * @example
 * ```tsx
 * const { mutate: collectSample, isPending } = useCollectSample();
 * collectSample({ sampleId: 'SMP-001', collectedVolume: 3.5, ... });
 * ```
 */
export function useCollectSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sampleId,
      collectedVolume,
      actualContainerType,
      actualContainerColor,
      collectionNotes,
    }: CollectSampleData) =>
      sampleAPI.collect(sampleId, {
        collectedVolume,
        actualContainerType,
        actualContainerColor,
        collectionNotes,
      }),
    onSuccess: () => {
      // Invalidate samples and orders (order test status changes)
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Reject sample request data
 */
interface RejectSampleData {
  sampleId: string;
  reasons: RejectionReason[];
  notes?: string;
  requireRecollection?: boolean;
}

/**
 * Mutation hook to reject a sample.
 * Invalidates relevant caches on success.
 *
 * @returns Mutation result with mutate function
 */
export function useRejectSample() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sampleId,
      reasons,
      notes,
      requireRecollection = true,
    }: RejectSampleData) => {
      // 1. Reject the sample
      await sampleAPI.reject(sampleId, {
        rejectionReasons: reasons,
        rejectionNotes: notes,
        recollectionRequired: requireRecollection,
      });

      // 2. Automatically request recollection if required
      if (requireRecollection) {
        const reasonStr = reasons.map(r => r.replace('_', ' ')).join(', ');
        const fullReason = notes ? `${reasonStr} - ${notes}` : reasonStr;
        await sampleAPI.requestRecollection(sampleId, fullReason);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });
}

/**
 * Mutation hook to request sample recollection.
 *
 * @returns Mutation result with mutate function
 */
export function useRequestRecollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sampleId, reason }: { sampleId: string; reason: string }) =>
      sampleAPI.requestRecollection(sampleId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
    },
  });
}

/**
 * Hook to invalidate sample caches.
 *
 * @returns Object with invalidate functions
 */
export function useInvalidateSamples() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.samples.all });
  };

  const invalidateSample = (sampleId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.samples.byId(sampleId) });
  };

  const invalidateByOrder = (orderId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.samples.byOrder(orderId) });
  };

  return { invalidateAll, invalidateSample, invalidateByOrder };
}
