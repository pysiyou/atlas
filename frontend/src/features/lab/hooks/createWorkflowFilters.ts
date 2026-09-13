/**
 * createWorkflowFilters - Factory for workflow-specific filter configurations
 *
 * Eliminates boilerplate of wiring getOrderDate, getSampleType, getStatus,
 * searchFilterFn callbacks across CollectionView, EntryView, ValidationView.
 */

import { useMemo } from 'react';
import { useLabWorkflowFilters } from './useLabWorkflowFilters';
import { useLabUrlSearch } from './useLabUrlSearch';
import { createLabItemFilter } from '../components/LabWorkflowView';
import { displayId } from '@/utils';
import type { SampleDisplay } from '../types';
import type { TestWithContextResult } from './useLabTestsFromOrders';
import type { SampleStatus, TestStatus } from '@/types';

// ─── Workflow Types ───────────────────────────────────────────────────────────

type WorkflowType = 'collection' | 'entry' | 'validation';

type WorkflowItem<T extends WorkflowType> = 
  T extends 'collection' ? SampleDisplay :
  T extends 'entry' ? TestWithContextResult :
  T extends 'validation' ? TestWithContextResult :
  never;

// ─── Filter Configurations ────────────────────────────────────────────────────

interface WorkflowFilterConfig<T, S> {
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

const COLLECTION_FILTER_CONFIG: WorkflowFilterConfig<SampleDisplay, SampleStatus> = {
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
        item.order ? displayId.order(item.order.orderId) : undefined,
        ...(item.requirement?.testCodes || []),
      ].filter(Boolean) as string[];
      return fields.some(field => field.toLowerCase().includes(lowerQuery));
    },
  },
  defaultStatuses: ['pending'],
  sortByPriority: true,
};

const ENTRY_FILTER_CONFIG: WorkflowFilterConfig<TestWithContextResult, TestStatus> = {
  callbacks: {
    getOrderDate: (t) => t.orderDate,
    getSampleType: (t) => t.sampleType,
    getStatus: (t) => t.status as TestStatus,
    getPriority: (t) => t.priority,
    getQueueSince: (t) => t.collectedAt,
    searchFilterFn: createLabItemFilter<TestWithContextResult>(),
  },
  defaultStatuses: ['sample-collected'],
  sortByPriority: true,
};

const VALIDATION_FILTER_CONFIG: WorkflowFilterConfig<TestWithContextResult, TestStatus> = {
  callbacks: {
    getOrderDate: (t) => t.orderDate,
    getSampleType: (t) => t.sampleType,
    getStatus: (t) => t.status as TestStatus,
    getPriority: (t) => t.priority,
    getQueueSince: (t) => t.resultEnteredAt,
    searchFilterFn: createLabItemFilter<TestWithContextResult>(),
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

export interface CreateWorkflowFiltersOptions<T extends WorkflowType> {
  items: WorkflowItem<T>[];
  workflowType: T;
}

export function createWorkflowFilters<T extends WorkflowType>({
  items,
  workflowType,
}: CreateWorkflowFiltersOptions<T>) {
  const urlSearch = useLabUrlSearch();
  
  const filterConfig = useMemo(
    () => WORKFLOW_FILTER_CONFIGS[workflowType],
    [workflowType]
  );
  
  // Cast to any to avoid complex type inference issues
  const options = useMemo(() => ({
    items,
    ...filterConfig.callbacks,
    initialStatusFilters: filterConfig.defaultStatuses,
    initialSearchQuery: urlSearch,
    sortByQueuePriority: filterConfig.sortByPriority,
  }), [items, filterConfig, urlSearch]) as any;
  
  return useLabWorkflowFilters(options);
}
