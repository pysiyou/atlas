/**
 * useLabQueueFilters - Factory hook for workflow-specific filter configurations
 *
 * Eliminates boilerplate of wiring getOrderDate, getSampleType, getStatus,
 * searchFilterFn callbacks across SampleCollectionQueue, ResultEntryQueue, ResultValidationQueue.
 */

import { useMemo } from 'react';
import { useLabQueueFilterState, type UseLabQueueFilterStateOptions } from './useLabQueueFilterState';
import { useLabQueueUrlSearch } from './useLabQueueUrlSearch';
import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import { displayId } from '@/utils';
import type { SampleCollectionQueueItem } from '../types';
import type { TestWithContextResult } from './useOrderTestsWithLabContext';
import type { SampleStatus, TestStatus } from '@/types';

// ─── Workflow Types ───────────────────────────────────────────────────────────

type WorkflowType = 'collection' | 'entry' | 'validation';

type LabQueueItemByStage<T extends WorkflowType> = 
  T extends 'collection' ? SampleCollectionQueueItem :
  T extends 'entry' ? TestWithContextResult :
  T extends 'validation' ? TestWithContextResult :
  never;

// ─── Filter Configurations ────────────────────────────────────────────────────

interface LabQueueFilterConfig<T, S> {
  callbacks: {
    getOrderDate: (item: T) => string | undefined;
    getSampleType: (item: T) => string | undefined;
    getStatus: (item: T) => S | undefined;
    getPriority: (item: T) => string | undefined;
    getQueueSince: (item: T) => string | undefined;
    searchFilterFn: (item: T, query: string) => boolean;
  };
  defaultStatuses: S[];
  sortByPriority: boolean;
}

const COLLECTION_FILTER_CONFIG: LabQueueFilterConfig<SampleCollectionQueueItem, SampleStatus> = {
  callbacks: {
    getOrderDate: (d) => d.order?.orderDate,
    getSampleType: (d) => d.requirement?.sampleType ?? d.sample?.sampleType,
    getStatus: (d) => d.sample?.status,
    getPriority: (d) => d.priority,
    getQueueSince: (d) => d.order?.orderDate,
    searchFilterFn: (item, query) => {
      const lowerQuery = query.toLowerCase();
      const fields = [
        item.patient?.fullName || '',
        item.sample?.sampleId != null ? displayId.sample(item.sample.sampleId) : '',
        item.sample?.sampleId != null ? String(item.sample.sampleId) : '',
        item.order ? displayId.order(item.order.orderId) : undefined,
        ...(item.requirement?.testCodes || []),
      ].filter(Boolean) as string[];
      return fields.some(field => field.toLowerCase().includes(lowerQuery));
    },
  },
  defaultStatuses: ['pending'],
  sortByPriority: true,
};

const ENTRY_FILTER_CONFIG: LabQueueFilterConfig<TestWithContextResult, TestStatus> = {
  callbacks: {
    getOrderDate: (t) => t.orderDate,
    getSampleType: (t) => t.sampleType,
    getStatus: (t) => t.status as TestStatus,
    getPriority: (t) => t.priority,
    getQueueSince: (t) => t.collectedAt,
    searchFilterFn: createLabQueueSearchFilter<TestWithContextResult>(),
  },
  defaultStatuses: ['sample-collected'],
  sortByPriority: true,
};

const VALIDATION_FILTER_CONFIG: LabQueueFilterConfig<TestWithContextResult, TestStatus> = {
  callbacks: {
    getOrderDate: (t) => t.orderDate,
    getSampleType: (t) => t.sampleType,
    getStatus: (t) => t.status as TestStatus,
    getPriority: (t) => t.priority,
    getQueueSince: (t) => t.resultEnteredAt,
    searchFilterFn: createLabQueueSearchFilter<TestWithContextResult>(),
  },
  defaultStatuses: ['resulted'],
  sortByPriority: true,
};

const WORKFLOW_FILTER_CONFIGS = {
  collection: COLLECTION_FILTER_CONFIG,
  entry: ENTRY_FILTER_CONFIG,
  validation: VALIDATION_FILTER_CONFIG,
} as const;

// ─── Factory Hook ─────────────────────────────────────────────────────────────

export interface UseLabQueueFiltersOptions<T extends WorkflowType> {
  items: LabQueueItemByStage<T>[];
  workflowType: T;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  skipSearchFilter?: boolean;
  appliedStatusFilters?: SampleStatus[] | TestStatus[];
  collectionSampleLookup?: boolean;
}

export function useLabQueueFilters<T extends WorkflowType>({
  items,
  workflowType,
  searchQuery,
  onSearchChange,
  skipSearchFilter,
  appliedStatusFilters,
  collectionSampleLookup,
}: UseLabQueueFiltersOptions<T>) {
  const urlSearch = useLabQueueUrlSearch();

  const filterConfig = useMemo(
    () => WORKFLOW_FILTER_CONFIGS[workflowType],
    [workflowType]
  );

  const options = useMemo(
    () => ({
      items,
      ...filterConfig.callbacks,
      initialStatusFilters: filterConfig.defaultStatuses,
      initialSearchQuery: urlSearch,
      sortByQueuePriority: filterConfig.sortByPriority,
      searchQuery,
      onSearchChange,
      skipSearchFilter,
      appliedStatusFilters,
      collectionSampleLookup,
    }),
    [
      items,
      filterConfig,
      urlSearch,
      searchQuery,
      onSearchChange,
      skipSearchFilter,
      appliedStatusFilters,
      collectionSampleLookup,
    ]
  );

  return useLabQueueFilterState(
    options as UseLabQueueFilterStateOptions<LabQueueItemByStage<T>, SampleStatus | TestStatus>
  );
}
