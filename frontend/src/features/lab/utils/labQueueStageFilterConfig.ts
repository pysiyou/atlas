/**
 * Per-workflow getters and defaults for client-side lab queue filtering.
 */

import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import { labQueueSearchTextFields, matchLabQueueSearchQuery } from './labSearchAndLinks';
import type { SampleCollectionQueueItem } from '../types';
import type { TestWithContextResult } from '../types';
import { PRIORITY_LEVEL_VALUES, type PriorityLevel } from '@/types';
import type { SampleStatus, TestStatus } from '@/types';

export type LabQueueWorkflowType = 'collection' | 'entry' | 'validation' | 'validationReview';

export type LabQueueItemByStage<T extends LabQueueWorkflowType> = T extends 'collection'
  ? SampleCollectionQueueItem
  : T extends 'entry'
    ? TestWithContextResult
    : T extends 'validation'
      ? TestWithContextResult
      : T extends 'validationReview'
        ? TestWithContextResult
        : never;

export interface LabQueueStageFilterConfig<T, S> {
  callbacks: {
    getOrderDate: (item: T) => string | undefined;
    getSampleType: (item: T) => string | undefined;
    getStatus: (item: T) => S | undefined;
    getPriority: (item: T) => string | undefined;
    getQueueSince: (item: T) => string | undefined;
    searchFilterFn: (item: T, query: string) => boolean;
    getId?: (item: T) => number | undefined;
    getOrderId: (item: T) => number | undefined;
    getSampleId?: (item: T) => number | undefined;
  };
  defaultStatuses: S[];
  sortByPriority: boolean;
}

const COLLECTION_FILTER_CONFIG: LabQueueStageFilterConfig<SampleCollectionQueueItem, SampleStatus> = {
  callbacks: {
    getOrderDate: d => d.order?.orderDate,
    getSampleType: d => d.requirement?.sampleType ?? d.sample?.sampleType,
    getStatus: d => d.sample?.status,
    getPriority: d => d.priority,
    getQueueSince: d => d.order?.orderDate,
    getOrderId: d => d.order?.orderId,
    getSampleId: d => d.sample?.sampleId,
    searchFilterFn: (item, query) => {
      const sampleId = item.sample?.sampleId;
      const orderId = item.order?.orderId;
      const textFields = labQueueSearchTextFields(
        { sampleId, orderId },
        [
          item.patient?.fullName || '',
          ...(item.requirement?.testCodes || []),
        ].filter(Boolean) as string[],
      );
      return matchLabQueueSearchQuery({ sampleId, orderId }, textFields, query);
    },
  },
  defaultStatuses: ['pending'],
  sortByPriority: true,
};

const ENTRY_FILTER_CONFIG: LabQueueStageFilterConfig<TestWithContextResult, TestStatus> = {
  callbacks: {
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.status as TestStatus,
    getPriority: t => t.priority,
    getQueueSince: t => t.collectedAt,
    getId: t => t.id,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId,
    searchFilterFn: createLabQueueSearchFilter<TestWithContextResult>(),
  },
  defaultStatuses: ['sample-collected'],
  sortByPriority: true,
};

const VALIDATION_FILTER_CONFIG: LabQueueStageFilterConfig<TestWithContextResult, TestStatus> = {
  callbacks: {
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.status as TestStatus,
    getPriority: t => t.priority,
    getQueueSince: t => t.resultEnteredAt,
    getId: t => t.id,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId,
    searchFilterFn: createLabQueueSearchFilter<TestWithContextResult>(),
  },
  defaultStatuses: ['resulted'],
  sortByPriority: true,
};

const VALIDATION_REVIEW_FILTER_CONFIG: LabQueueStageFilterConfig<TestWithContextResult, PriorityLevel> = {
  callbacks: {
    getId: t => t.id,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId,
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.priority as PriorityLevel,
    getPriority: t => t.priority,
    getQueueSince: t => t.resultEnteredAt ?? t.orderDate,
    searchFilterFn: createLabQueueSearchFilter<TestWithContextResult>(),
  },
  defaultStatuses: [...PRIORITY_LEVEL_VALUES],
  sortByPriority: true,
};

export const LAB_QUEUE_STAGE_FILTER_CONFIGS = {
  collection: COLLECTION_FILTER_CONFIG,
  entry: ENTRY_FILTER_CONFIG,
  validation: VALIDATION_FILTER_CONFIG,
  validationReview: VALIDATION_REVIEW_FILTER_CONFIG,
} as const;

export function getLabQueueStageConfig<T extends LabQueueWorkflowType>(workflowType: T) {
  return LAB_QUEUE_STAGE_FILTER_CONFIGS[workflowType];
}
