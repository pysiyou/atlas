/**
 * Validation queue data — server worklist plus supervisor exception feeds.
 */
import { useAuthStore } from '@/app/authStore';
import { useMemo } from 'react';
import { useValidationWorklist, type WorklistPagination } from '../api/worklists';
import { mapValidationWorklistToOrderTestContext } from '../utils/labQueue';
import { usePendingEscalation } from '../api/results';
import { usePendingRecollectionRequests } from '../api/recollectionRequests';
import type { TestWithContext } from '@/types';
import type { RecollectionRequestSummary } from '@/types/lab-operations';

export interface ResultValidationQueueData {
  validationTests: TestWithContext[];
  escalations: TestWithContext[];
  recollections: RecollectionRequestSummary[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  pagination?: WorklistPagination;
  goToPage: (page: number) => void;
  canResolveEscalation: boolean;
}

export function useResultValidationQueueData(params?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sampleType?: string;
}): ResultValidationQueueData {
  const { hasRole } = useAuthStore();
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const {
    items: worklistItems,
    isLoading: worklistLoading,
    isError: worklistError,
    error: worklistErr,
    refetch: refetchWorklist,
    pagination,
    goToPage,
  } = useValidationWorklist(params);
  const { escalatedTests = [] } = usePendingEscalation();
  const { requests: recollectionRequests = [] } = usePendingRecollectionRequests();

  const validationTests = useMemo(
    () => worklistItems.map(mapValidationWorklistToOrderTestContext),
    [worklistItems]
  );

  return {
    validationTests,
    escalations: escalatedTests,
    recollections: recollectionRequests,
    isLoading: worklistLoading,
    isError: worklistError,
    error: worklistErr ?? null,
    refetch: () => {
      void refetchWorklist();
    },
    pagination,
    goToPage,
    canResolveEscalation,
  };
}
