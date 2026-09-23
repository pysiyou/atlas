/**
 * Samples API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api/constants';
import type { Sample, SampleStatus, ContainerType, ContainerTopColor } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useEntityLookup, parseNumericKey } from '@/hooks/useEntityLookup';
import { queryKeys, cacheConfig } from '@/lib/query';
import { invalidateCollectionQueries } from '@/lib/query/invalidate';
import { useAuthStore } from '@/app/authStore';

const BACKEND_COLOR_VALUES = [
  'red',
  'purple',
  'blue',
  'green',
  'gray',
  'yellow',
  'light-blue',
  'pink',
  'white',
  'black',
  'orange',
  'clear',
] as const;

const FRONTEND_TO_BACKEND_COLOR: Record<string, (typeof BACKEND_COLOR_VALUES)[number]> = {
  'red-top': 'red',
  'lavender-top': 'purple',
  'green-top': 'green',
  'blue-top': 'blue',
  'royal-blue-top': 'blue',
  'yellow-top': 'yellow',
  'gray-top': 'gray',
  'light-blue-top': 'light-blue',
  'pink-top': 'pink',
  'black-top': 'black',
  'orange-top': 'orange',
  'white-top': 'white',
  'clear-top': 'clear',
  'gold-top': 'yellow',
  'tiger-top': 'orange',
  'tan-top': 'orange',
};

function toBackendContainerColor(
  frontendColor: ContainerTopColor | string
): (typeof BACKEND_COLOR_VALUES)[number] {
  const mapped = FRONTEND_TO_BACKEND_COLOR[frontendColor];
  if (mapped) return mapped;
  if (BACKEND_COLOR_VALUES.includes(frontendColor as (typeof BACKEND_COLOR_VALUES)[number]))
    return frontendColor as (typeof BACKEND_COLOR_VALUES)[number];
  return 'red';
}

interface GetSamplesParams {
  orderId?: string;
  status?: SampleStatus;
  skip?: number;
  limit?: number;
}

export interface SamplesFilter {
  orderId?: string;
  status?: SampleStatus;
  page?: number;
  pageSize?: number;
}

interface CollectSampleRequest {
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
}

export const sampleAPI = {
  async getAll(params?: GetSamplesParams): Promise<Sample[]> {
    const queryParams: Record<string, string> = { limit: String(WORKFLOW_QUERY_LIMIT) };
    if (params?.orderId) queryParams.orderId = params.orderId;
    if (params?.status) queryParams.sampleStatus = params.status;
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);
    return apiClient.get<Sample[]>('/samples', queryParams);
  },

  async getById(sampleId: string): Promise<Sample | null> {
    try {
      return await apiClient.get<Sample>(`/samples/${sampleId}`);
    } catch {
      return null;
    }
  },

  async collect(sampleId: string, data: CollectSampleRequest): Promise<Sample> {
    const body = {
      collectedVolume: data.collectedVolume,
      actualContainerType: data.actualContainerType,
      actualContainerColor: toBackendContainerColor(data.actualContainerColor),
      ...(data.collectionNotes != null && data.collectionNotes !== ''
        ? { collectionNotes: data.collectionNotes }
        : {}),
    };
    return apiClient.patch<Sample>(`/samples/${sampleId}/collect`, body);
  },
};

/**
 * Samples API hooks — React Query layer.
 */
/**
 * Samples Query Hook
 *
 * Provides access to sample data with dynamic caching (30s stale time).
 * Samples change frequently during collection and processing.
 *
 *  */

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
 * @param filters - Optional filters to apply
 * @returns Query result containing samples array and loading state
 *
 * @example
 * ```tsx
 * const { samples, isLoading, error } = useSamplesList();
 * ```
 */
export interface LabQueryRefetchOptions {
  refetchInterval?: number;
}

export function useSamplesList(filters?: SamplesFilters, refetchOptions?: LabQueryRefetchOptions) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.samples.list(filters),
    queryFn: () => sampleAPI.getAll(filters),
    enabled: isAuthenticated && !isRestoring, // Only fetch when authenticated and not restoring
    ...cacheConfig.dynamic, // 30s stale, 5 min gc
    ...(refetchOptions?.refetchInterval != null
      ? { refetchInterval: refetchOptions.refetchInterval }
      : {}),
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
 * Hook to get sample lookup function.
 * Returns functions to resolve sample IDs to samples.
 *
 * @returns Object with getSample function
 */
export function useSampleLookup() {
  const { samples, isLoading } = useSamplesList();
  const { get: getSample } = useEntityLookup(samples, s => s.sampleId, {
    isLoading,
    normalizeKey: parseNumericKey,
  });

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
    onSuccess: () => invalidateCollectionQueries(queryClient),
  });
}
