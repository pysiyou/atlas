/**
 * useLabPipelineCounts — tab badge counts from GET /lab/board.
 */

import { useLabBoard } from '@/features/lab/api/worklists.api';

export interface LabPipelineCounts {
  collection: number;
  entry: number;
  /** Unvalidated tests in the review queue */
  validation: number;
  /** Escalations and recollection requests — validation tab badge only */
  supervisor: number;
}

export function getValidationTabCount(counts: LabPipelineCounts): number {
  return counts.validation + counts.supervisor;
}

const EMPTY_COUNTS: LabPipelineCounts = {
  collection: 0,
  entry: 0,
  validation: 0,
  supervisor: 0,
};

export function useLabPipelineCounts() {
  const { board, isError, error, refetch } = useLabBoard();
  return {
    counts: board?.counts ?? EMPTY_COUNTS,
    isError,
    error,
    refetch,
  };
}
