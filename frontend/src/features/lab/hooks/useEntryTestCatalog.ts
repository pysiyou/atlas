/**
 * Test catalog bootstrap for result entry (parameters, sample types).
 */
import { useTestCatalog } from '@/features/catalog';
import type { Test } from '@/types';

export interface EntryTestCatalogData {
  tests: Test[];
  isLoading: boolean;
}

export function useEntryTestCatalog(): EntryTestCatalogData {
  const { tests, isLoading } = useTestCatalog();
  return { tests, isLoading };
}
