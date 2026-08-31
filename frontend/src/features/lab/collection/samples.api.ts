/**
 * Samples API Service + React Query hooks
 */

import { apiClient } from '@/lib/apiClient';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { useEntityLookup, parseNumericKey } from '@/hooks/useEntityLookup';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useInvalidateQueryKey } from '@/lib/query/invalidate';
import { useAuthStore } from '@/app/store';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
  RejectionReason,
} from '@/types';
import type { RejectAndRecollectResponse } from '@/types/lab-operations';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';

export type { PaginatedResponse, PaginationMeta };

/** Backend ContainerTopColor enum values (API expects these, not frontend display keys like "red-top"). */
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

/** Map frontend container keys (e.g. red-top) to backend actualContainerColor enum. */
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

/**
 * Filter options for samples list with pagination
 */
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

interface RejectSampleRequest {
  rejectionReasons: RejectionReason[];
  rejectionNotes?: string;
  recollectionRequired?: boolean;
}

interface RejectAndRecollectRequest {
  rejectionReasons: RejectionReason[];
  rejectionNotes?: string;
  recollectionReason?: string;
}

export const sampleAPI = {
  /**
   * Get all samples with optional filters (requests up to backend max so tables can show full list)
   */
  async getAll(params?: GetSamplesParams): Promise<Sample[]> {
    const queryParams: Record<string, string> = { limit: '10000' };
    if (params?.orderId) queryParams.orderId = params.orderId;
    if (params?.status) queryParams.status = params.status;
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);
    return apiClient.get<Sample[]>('/samples', queryParams);
  },

  /**
   * Get samples with pagination
   */
  async getPaginated(filters?: SamplesFilter): Promise<PaginatedResponse<Sample>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.orderId) params.orderId = filters.orderId;
    if (filters?.status) params.sampleStatus = filters.status;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || 20));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Sample>>('/samples', params);
  },

  /**
   * Get a sample by its ID
   */
  async getById(sampleId: string): Promise<Sample | null> {
    try {
      return await apiClient.get<Sample>(`/samples/${sampleId}`);
    } catch {
      return null;
    }
  },

  /**
   * Get pending samples (lab tech only)
   */
  async getPending(): Promise<Sample[]> {
    return apiClient.get<Sample[]>('/samples/pending');
  },

  /**
   * Collect a sample.
   * Maps frontend container color keys (e.g. red-top) to backend enum (e.g. red).
   */
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

  /**
   * Reject a sample
   */
  async reject(sampleId: string, data: RejectSampleRequest): Promise<Sample> {
    return apiClient.patch<Sample>(`/samples/${sampleId}/reject`, data);
  },

  /**
   * Request recollection for a rejected sample
   */
  async requestRecollection(sampleId: string, reason: string): Promise<Sample> {
    return apiClient.post<Sample>(`/samples/${sampleId}/request-recollection`, { reason });
  },

  /**
   * Atomically reject a sample and request recollection.
   * Combines two operations into one transaction.
   *
   * This is useful when you know immediately that a sample needs to be rejected
   * and a new collection is required.
   *
   * - Rejects the current sample with provided reasons
   * - Creates a new recollection sample in PENDING status
   * - Links the two samples together
   * - Updates order tests to point to the new sample
   * - Escalates priority to urgent
   */
  async rejectAndRecollect(
    sampleId: string,
    data: RejectAndRecollectRequest
  ): Promise<RejectAndRecollectResponse> {
    return apiClient.post<RejectAndRecollectResponse>(
      `/samples/${sampleId}/reject-and-recollect`,
      data
    );
  },
};


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
  const { invalidateAll } = useInvalidateQueryKey(queryKeys.samples.all);

  const invalidateSample = (sampleId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.samples.byId(sampleId) });
  };

  const invalidateByOrder = (orderId: string) => {
    return queryClient.invalidateQueries({ queryKey: queryKeys.samples.byOrder(orderId) });
  };

  return { invalidateAll, invalidateSample, invalidateByOrder };
}


/**
 * Sample rejection options API.
 */

export interface SampleRejectionOptionsResponse {
  canReject: boolean;
  rejectDisabledReason?: string;
  recollectionAttemptsUsed: number;
  recollectionAttemptsRemaining: number;
  maxRecollectionAttempts: number;
  canRequireRecollection: boolean;
  requireRecollectionDisabledReason?: string;
  orderHasValidatedTests: boolean;
  escalationRequired: boolean;
}

export const sampleRejectionAPI = {
  getOptions(sampleId: number): Promise<SampleRejectionOptionsResponse> {
    return apiClient.get<SampleRejectionOptionsResponse>(
      `/samples/${sampleId}/rejection-options`
    );
  },
};
