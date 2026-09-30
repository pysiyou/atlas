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
import { LAB_CONFIG, LAB_PATHS } from '../constants/labConstants';

export interface WorklistPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface LabWorklistAllowedActions {
  collect: boolean;
  enterResults: boolean;
  validate: boolean;
  reject: boolean;
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
  blockedLabel?: string | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  waitingHours: number;
  turnaroundHours: number;
  actualContainerType?: ContainerType | null;
  actualContainerColor?: ContainerTopColor | null;
  collectedAt?: string | null;
  collectedBy?: string | null;
  collectedVolume?: number | null;
  referringPhysician?: string | null;
  testName?: string | null;
  testCategory?: string | null;
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
  referringPhysician?: string | null;
  testCategory?: string | null;
  blockedReason?: string | null;
  blockedLabel?: string | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
}

export interface DashboardWorklistItem {
  orderTestId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  testCode: string;
  testName: string;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  stage: 'collection' | 'entry' | 'validation';
  activityAt: string;
  orderDate: string;
  referringPhysician?: string | null;
  testCategory?: string | null;
  blockedLabel?: string | null;
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
  sampleStatus?: SampleStatus | null;
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
  testCategory?: string | null;
  blockedReason?: string | null;
  blockedLabel?: string | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
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
      LAB_PATHS.worklists.collection,
      buildParams(params)
    );
  },

  getEntry(params?: WorklistParams) {
    return apiClient.get<{ items: EntryWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.entry,
      buildParams(params)
    );
  },

  getValidation(params?: WorklistParams) {
    return apiClient.get<{ items: ValidationWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.validation,
      buildParams(params)
    );
  },

  getDashboardToday(params?: WorklistParams) {
    return apiClient.get<{ items: DashboardWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.dashboardToday,
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

type WorklistQueryKeyFn = (params?: WorklistHookParams) => readonly unknown[];

function createWorklistQueryHook<TItem>(
  queryKeyFn: WorklistQueryKeyFn,
  fetchFn: (params?: WorklistHookParams) => Promise<{ items: TItem[]; pagination?: WorklistPagination }>,
) {
  return function useWorklistQuery(params?: WorklistHookParams) {
    const { isAuthenticated, isLoading: isRestoring } = useAuthStore();
    const query = useQuery({
      queryKey: queryKeyFn(params),
      queryFn: () => fetchFn({ pageSize: 200, ...params }),
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
  };
}

export const useCollectionWorklist = createWorklistQueryHook(
  queryKeys.worklists.collection,
  worklistsAPI.getCollection,
);

export const useEntryWorklist = createWorklistQueryHook(
  queryKeys.worklists.entry,
  worklistsAPI.getEntry,
);

export const useValidationWorklist = createWorklistQueryHook(
  queryKeys.worklists.validation,
  worklistsAPI.getValidation,
);

export const useDashboardWorklistToday = createWorklistQueryHook(
  queryKeys.worklists.dashboardToday,
  worklistsAPI.getDashboardToday,
);
