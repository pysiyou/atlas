/**
 * Catalog bootstrap for result entry — entry queue rows come from GET /lab/worklists/entry.
 */
import { useTestCatalog } from '@/features/catalog';
import type { Test } from '@/types';

export interface ResultEntryQueueData {
  tests: Test[];
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useResultEntryQueueData(): ResultEntryQueueData {
  const {
    tests = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useTestCatalog();

  return {
    tests,
    isLoading,
    isError,
    error,
    refetch: () => {
      void refetch();
    },
  };
}
