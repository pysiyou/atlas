/**
 * Samples API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api';
import { WORKFLOW_QUERY_LIMIT } from '@/lib/api';
import type { Sample, SampleStatus, ContainerType, ContainerTopColor } from '@/types';
import {
  CONTAINER_TOP_COLOR_VALUES,
  FRONTEND_TO_BACKEND_COLOR,
} from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useEntityLookup } from '@/hooks';
import { queryKeys, cacheConfig, getQueryClient, useAuthQueryEnabled } from '@/lib/query';
import { invalidateCollectionQueries } from '@/lib/query';
import { LAB_PATHS } from '../constants/labConstants';
import type { CollectionWorklistItem } from './worklists';

function toBackendContainerColor(
  frontendColor: ContainerTopColor | string
): (typeof CONTAINER_TOP_COLOR_VALUES)[number] {
  const mapped = FRONTEND_TO_BACKEND_COLOR[frontendColor];
  if (mapped) return mapped;
  if (CONTAINER_TOP_COLOR_VALUES.includes(frontendColor as (typeof CONTAINER_TOP_COLOR_VALUES)[number]))
    return frontendColor as (typeof CONTAINER_TOP_COLOR_VALUES)[number];
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
    return apiClient.get<Sample[]>(LAB_PATHS.samples.list, queryParams);
  },

  async getById(sampleId: string): Promise<Sample | null> {
    try {
      return await apiClient.get<Sample>(LAB_PATHS.samples.byId(sampleId));
    } catch {
      return null;
    }
  },

  /**
   * Server eligibility and queue display for a sample (deep-link / modal).
   */
  async getWorkContext(sampleId: string): Promise<CollectionWorklistItem> {
    return apiClient.get<CollectionWorklistItem>(LAB_PATHS.samples.workContext(sampleId));
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
    return apiClient.patch<Sample>(LAB_PATHS.samples.collect(sampleId), body);
  },

  async createAliquots(
    sampleId: string,
    data: { count: number; aliquotVolume: number; testCodes?: string[] }
  ): Promise<Sample[]> {
    return apiClient.post<Sample[]>(LAB_PATHS.samples.aliquots(sampleId), data);
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
  const enabled = useAuthQueryEnabled();

  const query = useQuery({
    queryKey: queryKeys.samples.list(filters),
    queryFn: () => sampleAPI.getAll(filters),
    enabled,
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
/**
 * Fetch samples for one order and return a synchronous id lookup.
 * Used by report generation so list pages do not mount a 500-row sample query.
 */
export async function createSampleLookupForOrder(
  orderId: string
): Promise<(sampleId: string) => Sample | undefined> {
  const client = getQueryClient();
  const samples = await client.fetchQuery({
    queryKey: queryKeys.samples.byOrder(String(orderId)),
    queryFn: () => sampleAPI.getAll({ orderId: String(orderId), limit: 50 }),
    ...cacheConfig.dynamic,
  });
  const byId = new Map(samples.map(sample => [sample.sampleId, sample]));
  return (sampleId: string) => byId.get(sampleId);
}

export function useSampleLookup() {
  const { samples, isLoading } = useSamplesList();
  const { get: getSample } = useEntityLookup(samples, s => s.sampleId, {
    isLoading,
  });

  const getSamplesByOrder = useCallback(
    (orderId: string): Sample[] => {
      if (!orderId) return [];
      return samples.filter(s => s.orderId === orderId);
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
 * Split remaining volume of a collected parent into child aliquot tubes.
 */
export function useCreateAliquots() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sampleId,
      count,
      aliquotVolume,
      testCodes,
    }: {
      sampleId: string;
      count: number;
      aliquotVolume: number;
      testCodes?: string[];
    }) => sampleAPI.createAliquots(sampleId, { count, aliquotVolume, testCodes }),
    onSuccess: () => invalidateCollectionQueries(queryClient),
  });
}

/**
 * Load canonical collection eligibility for a sample when the worklist cache has no row.
 */
export function useSampleWorkContext(sampleId: string | undefined, enabled = true) {
  const authEnabled = useAuthQueryEnabled(enabled && Boolean(sampleId));
  const query = useQuery({
    queryKey: queryKeys.samples.workContext(sampleId ?? ''),
    queryFn: () => sampleAPI.getWorkContext(sampleId!),
    enabled: authEnabled,
    ...cacheConfig.dynamic,
  });

  return {
    workContext: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
