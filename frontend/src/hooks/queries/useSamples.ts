/**
 * Samples Query Hook
 * 
 * Provides access to sample data with dynamic caching (30s stale time).
 * Samples change frequently during collection and processing.
 * 
 * @module hooks/queries/useSamples
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { queryKeys, cacheConfig } from '@/lib/query';
import { sampleAPI } from '@/services/api/samples';
import { useAuth } from '@/features/auth/useAuth';
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
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.samples.list(filters),
    queryFn: () => sampleAPI.getAll(filters),
    enabled: isAuthenticated, // Only fetch when authenticated
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
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.samples.byId(sampleId ?? ''),
    queryFn: () => sampleAPI.getById(sampleId!),
    enabled: isAuthenticated && !!sampleId, // Only fetch when authenticated
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
    return samples.filter(s => s.orderId === orderId);
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
  const { isAuthenticated } = useAuth();

  const query = useQuery({
    queryKey: queryKeys.samples.pending(),
    queryFn: () => sampleAPI.getPending(),
    enabled: isAuthenticated, // Only fetch when authenticated
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
    const map = new Map<string, Sample>();
    samples.forEach(s => map.set(s.sampleId, s));
    return map;
  }, [samples]);

  const getSample = useCallback((sampleId: string): Sample | undefined => {
    return samplesMap.get(sampleId);
  }, [samplesMap]);

  const getSamplesByOrder = useCallback((orderId: string): Sample[] => {
    return samples.filter(s => s.orderId === orderId);
  }, [samples]);

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
