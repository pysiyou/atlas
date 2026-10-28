/**
 * Lab worklist API service — server-paginated queues.
 */
import { apiClient } from '@/lib/api/client';
import type {
  ContainerTopColor,
  ContainerType,
  Gender,
  PaymentStatus,
  PriorityLevel,
  SampleStatus,
  TestStatus,
} from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { queryKeys, cacheConfig, useAuthQueryEnabled } from '@/lib/query';
import { LAB_PATHS } from '../constants/labConstants';

/** Default server page size for lab queues (backend max is 200). */
export const WORKLIST_PAGE_SIZE = 50;

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
  pipelineStage?: 'collection' | 'entry' | 'validation' | 'escalation' | 'completed' | 'cancelled' | null;
  attentionReason?: string | null;
  attentionLabel?: string | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  statusPresentation?: StatusPresentation | null;
  waitingHours: number;
  turnaroundHours: number;
  actualContainerType?: ContainerType | null;
  actualContainerColor?: ContainerTopColor | null;
  collectedAt?: string | null;
  collectedBy?: string | null;
  collectedVolume?: number | null;
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
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
  retestOfTestId?: number | null;
  retestNumber?: number;
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
  testCategory?: string | null;
  pipelineStage?: 'collection' | 'entry' | 'validation' | 'escalation' | 'completed' | 'cancelled' | null;
  attentionReason?: string | null;
  attentionLabel?: string | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  statusPresentation?: StatusPresentation | null;
}

export interface DashboardWorklistItem {
  orderTestId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  patientDob: string;
  patientGender: Gender;
  testCode: string;
  testName: string;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  stage: 'collection' | 'entry' | 'validation';
  activityAt: string;
  orderDate: string;
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
  testCategory?: string | null;
  attentionReason?: string | null;
  attentionLabel?: string | null;
  statusPresentation?: StatusPresentation | null;
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
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
  isRetest?: boolean;
  retestOfTestId?: number | null;
  retestNumber?: number;
  resultEnteredAt?: string | null;
  orderDate: string;
  waitingHours: number;
  turnaroundHours: number;
  hasCriticalValues: boolean;
  testCategory?: string | null;
  pipelineStage?: 'collection' | 'entry' | 'validation' | 'escalation' | 'completed' | 'cancelled' | null;
  attentionReason?: string | null;
  attentionLabel?: string | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  statusPresentation?: StatusPresentation | null;
}

interface WorklistParams {
  page?: number;
  pageSize?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sampleType?: string;
  status?: string;
  priority?: string;
}

function buildParams(params?: WorklistParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params?.page != null) q.page = String(params.page);
  if (params?.pageSize != null) q.pageSize = String(params.pageSize);
  if (params?.search) q.search = params.search;
  if (params?.dateFrom) q.dateFrom = params.dateFrom;
  if (params?.dateTo) q.dateTo = params.dateTo;
  if (params?.sampleType) q.sampleType = params.sampleType;
  if (params?.status) q.status = params.status;
  if (params?.priority) q.priority = params.priority;
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

  getAllTests(params?: WorklistParams) {
    return apiClient.get<{ items: DashboardWorklistItem[]; pagination: WorklistPagination }>(
      LAB_PATHS.worklists.allTests,
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
  dateFrom?: string;
  dateTo?: string;
  sampleType?: string;
  status?: string;
  priority?: string;
}

type WorklistQueryKeyFn = (params?: WorklistHookParams) => readonly unknown[];

function createWorklistQueryHook<TItem>(
  queryKeyFn: WorklistQueryKeyFn,
  fetchFn: (params?: WorklistHookParams) => Promise<{ items: TItem[]; pagination?: WorklistPagination }>,
) {
  return function useWorklistQuery(params?: WorklistHookParams) {
    const enabled = useAuthQueryEnabled();
    const pageSize = params?.pageSize ?? WORKLIST_PAGE_SIZE;
    const [page, setPage] = useState(params?.page ?? 1);
    const filterSnapshot = JSON.stringify({
      search: params?.search ?? null,
      dateFrom: params?.dateFrom ?? null,
      dateTo: params?.dateTo ?? null,
      sampleType: params?.sampleType ?? null,
      status: params?.status ?? null,
      priority: params?.priority ?? null,
      pageSize,
    });

    useEffect(() => {
      setPage(1);
    }, [filterSnapshot]);

    const queryParams: WorklistHookParams = {
      ...params,
      page,
      pageSize,
    };
    const query = useQuery({
      queryKey: queryKeyFn(queryParams),
      queryFn: () => fetchFn(queryParams),
      enabled,
      placeholderData: keepPreviousData,
      ...cacheConfig.dynamic,
    });

    const goToPage = useCallback((nextPage: number) => {
      setPage(nextPage);
    }, []);

    return {
      items: query.data?.items ?? [],
      pagination: query.data?.pagination,
      isLoading: query.isLoading,
      isError: query.isError,
      error: query.error,
      refetch: query.refetch,
      page,
      goToPage,
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

export const useAllTestsWorklist = createWorklistQueryHook(
  queryKeys.worklists.allTests,
  worklistsAPI.getAllTests,
);
