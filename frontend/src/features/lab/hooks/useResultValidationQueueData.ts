/**
 * Validation queue data — server worklist plus supervisor exception feeds.
 */
import { useAuthStore } from '@/app/authStore';
import { useMemo } from 'react';
import { useValidationWorklist, type WorklistPagination } from '../api/worklists';
import { worklistItemToValidationRow } from '../utils/worklistMappers';
import { usePendingEscalation, type PendingEscalationItem } from '../api/results';
import type { ValidationQueueRow } from '../types/queues';

export interface ResultValidationQueueData {
  validationRows: ValidationQueueRow[];
  escalations: PendingEscalationItem[];
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
  const { escalatedItems = [] } = usePendingEscalation();

  const validationRows = useMemo(
    () => worklistItems.map(worklistItemToValidationRow),
    [worklistItems]
  );

  return {
    validationRows,
    escalations: escalatedItems,
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
