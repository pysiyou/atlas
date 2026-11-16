/**
 * Validation queue data — server worklist of resulted tests awaiting review.
 */
import { useMemo } from 'react';
import { useValidationWorklist, type WorklistPagination } from '../api/worklists';
import { worklistItemToValidationRow } from '../utils/worklistMappers';
import type { ValidationQueueRow } from '../types/queues';

export interface ResultValidationQueueData {
  validationRows: ValidationQueueRow[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
  pagination?: WorklistPagination;
  goToPage: (page: number) => void;
}

export function useResultValidationQueueData(params?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sampleType?: string;
  priority?: string;
  priorityGroup?: string;
  category?: string;
}): ResultValidationQueueData {
  const {
    items: worklistItems,
    isLoading: worklistLoading,
    isError: worklistError,
    error: worklistErr,
    refetch: refetchWorklist,
    pagination,
    goToPage,
  } = useValidationWorklist(params);

  const validationRows = useMemo(
    () => worklistItems.map(worklistItemToValidationRow),
    [worklistItems]
  );

  return {
    validationRows,
    isLoading: worklistLoading,
    isError: worklistError,
    error: worklistErr ?? null,
    refetch: () => {
      void refetchWorklist();
    },
    pagination,
    goToPage,
  };
}
