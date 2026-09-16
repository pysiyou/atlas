/* eslint-disable max-lines -- colocated HTTP service + React Query hooks */
/**
 * Samples API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT, DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import type { Sample, SampleStatus, ContainerType, ContainerTopColor } from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useEntityLookup, parseNumericKey } from '@/hooks/useEntityLookup';
import { queryKeys, cacheConfig } from '@/lib/query';
import {
  invalidateCollectionQueries,
  useInvalidateQueryKey,
  invalidateSampleDetailQueries,
} from '@/lib/query/invalidate';
import { useAuthStore } from '@/app/authStore';

export type { PaginatedResponse, PaginationMeta };

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

  async getPaginated(filters?: SamplesFilter): Promise<PaginatedResponse<Sample>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.orderId) params.orderId = filters.orderId;
    if (filters?.status) params.sampleStatus = filters.status;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || DEFAULT_LIST_PAGE_SIZE));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Sample>>('/samples', params);
  },

  async getById(sampleId: string): Promise<Sample | null> {
    try {
      return await apiClient.get<Sample>(`/samples/${sampleId}`);
    } catch {
      return null;
    }
  },

  async getPending(): Promise<Sample[]> {
    return apiClient.get<Sample[]>('/samples/pending');
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
 * For large datasets, prefer usePaginatedSamples to avoid over-fetching.
 *
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
 * Hook to fetch paginated samples with server-side filtering.
 *
 * Use this for large datasets where client-side filtering is not practical.
 * Keeps previous data visible while fetching new page.
 *
 * @param filters - Optional filters (orderId, status)
 * @param initialPage - Starting page (default: 1)
 * @param pageSize - Items per page (default: 20)
 */
export function usePaginatedSamples(filters?: SamplesFilters, initialPage = 1, pageSize = 20) {
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
      setPage(p => p + 1);
    }
  }, [query.data?.pagination.hasNext]);

  const prevPage = useCallback(() => {
    if (query.data?.pagination.hasPrev) {
      setPage(p => p - 1);
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

/**
 * Hook to invalidate sample caches.
 *
 * @returns Object with invalidate functions
 */
export function useInvalidateSamples() {
  const queryClient = useQueryClient();
  const { invalidateAll } = useInvalidateQueryKey(queryKeys.samples.all);

  const invalidateSample = (sampleId: string) => {
    return invalidateSampleDetailQueries(queryClient, sampleId);
  };

  const invalidateByOrder = (orderId: string) => {
    return invalidateSampleDetailQueries(queryClient, undefined, orderId);
  };

  return { invalidateAll, invalidateSample, invalidateByOrder };
}
