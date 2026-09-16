/**
 * Lab worklist API service — server-paginated queues.
 */
import { apiClient } from '@/lib/api/client';
import type {
  ContainerTopColor,
  ContainerType,
  PaymentStatus,
  PriorityLevel,
  SampleStatus,
  TestStatus,
} from '@/types';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/app/authStore';
import { queryKeys, cacheConfig } from '@/lib/query';
import { LAB_CONFIG } from '@/features/lab/constants';

export interface WorklistPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CollectionWorklistItem {
  sampleId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  sampleType: string;
  status: SampleStatus;
  priority: PriorityLevel;
  paymentStatus: PaymentStatus;
  orderDate: string;
  testCodes: string[];
  isRecollection: boolean;
  originalSampleId?: number | null;
  originalSampleCollectedAt?: string | null;
  recollectionReason?: string | null;
  recollectionAttempt?: number;
  blockedReason?: string | null;
  waitingHours: number;
  turnaroundHours: number;
  actualContainerType?: ContainerType | null;
  actualContainerColor?: ContainerTopColor | null;
  collectedAt?: string | null;
  collectedBy?: string | null;
  collectedVolume?: number | null;
}

export interface EntryWorklistItem {
  orderTestId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  testCode: string;
  testName: string;
  sampleId?: number | null;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  collectedAt?: string | null;
  orderDate: string;
  waitingHours: number;
  turnaroundHours: number;
  isRetest: boolean;
}

export interface ValidationWorklistItem {
  orderTestId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  testCode: string;
  testName: string;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  sampleId?: number | null;
  results?: Record<string, unknown> | null;
  flags?: string[] | null;
  enteredBy?: string | null;
  referringPhysician?: string | null;
  isRetest?: boolean;
  retestOfTestId?: number | null;
  retestNumber?: number;
  resultEnteredAt?: string | null;
  orderDate: string;
  waitingHours: number;
  turnaroundHours: number;
  hasCriticalValues: boolean;
}

interface WorklistParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

function buildParams(params?: WorklistParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params?.page != null) q.page = String(params.page);
  if (params?.pageSize != null) q.pageSize = String(params.pageSize);
  if (params?.search) q.search = params.search;
  return q;
}

export const worklistsAPI = {
  getCollection(params?: WorklistParams) {
    return apiClient.get<{ items: CollectionWorklistItem[]; pagination: WorklistPagination }>(
      '/lab/worklists/collection',
      buildParams(params)
    );
  },

  getEntry(params?: WorklistParams) {
    return apiClient.get<{ items: EntryWorklistItem[]; pagination: WorklistPagination }>(
      '/lab/worklists/entry',
      buildParams(params)
    );
  },

  getValidation(params?: WorklistParams) {
    return apiClient.get<{ items: ValidationWorklistItem[]; pagination: WorklistPagination }>(
      '/lab/worklists/validation',
      buildParams(params)
    );
  },
};

/**
 * Lab worklist React Query hooks.
 */

interface WorklistHookParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export function useCollectionWorklist(params?: WorklistHookParams) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.worklists.collection(params),
    queryFn: () => worklistsAPI.getCollection({ pageSize: 200, ...params }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useEntryWorklist(params?: WorklistHookParams) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.worklists.entry(params),
    queryFn: () => worklistsAPI.getEntry({ pageSize: 200, ...params }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}

export function useValidationWorklist(params?: WorklistHookParams) {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
  const query = useQuery({
    queryKey: queryKeys.worklists.validation(params),
    queryFn: () => worklistsAPI.getValidation({ pageSize: 200, ...params }),
    enabled: isAuthenticated && !isRestoring,
    ...cacheConfig.dynamic,
    refetchInterval: LAB_CONFIG.TAB_COUNT_REFRESH_MS,
  });
  return {
    items: query.data?.items ?? [],
    pagination: query.data?.pagination,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
