/**
 * Per-workflow getters and defaults for client-side lab queue filtering.
 */

import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import { labQueueSearchTextFields, matchLabQueueSearchQuery } from './labSearchAndLinks';
import type { EntryQueueRow } from '../types/entryQueue';
import type { ValidationQueueRow } from '../types/validationQueue';
import type { SampleCollectionQueueItem } from '../types';
import type { PendingEscalationItem } from '../api/results';
import type { EntryWorklistItem, ValidationWorklistItem } from '@/types/labWorklist';
import { PRIORITY_LEVEL_VALUES, type PriorityLevel } from '@/types';
import type { SampleStatus, TestStatus } from '@/types';

export type LabQueueWorkflowType = 'collection' | 'entry' | 'validation' | 'validationReview';

export type LabQueueItemByStage<T extends LabQueueWorkflowType> = T extends 'collection'
  ? SampleCollectionQueueItem
  : T extends 'entry'
    ? EntryQueueRow
    : T extends 'validation'
      ? ValidationQueueRow
      : T extends 'validationReview'
        ? PendingEscalationItem
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
    getOrderDate: d => d.orderDate,
    getSampleType: d => d.requirement?.sampleType ?? d.sample?.sampleType,
    getStatus: d => d.sample?.status,
    getPriority: d => d.priority,
    getQueueSince: d => d.orderDate,
    getOrderId: d => d.orderId,
    getSampleId: d => d.sample?.sampleId,
    searchFilterFn: (item, query) => {
      const sampleId = item.sample?.sampleId;
      const orderId = item.orderId;
      const textFields = labQueueSearchTextFields(
        { sampleId, orderId },
        [item.patientName || '', ...(item.requirement?.testCodes || [])].filter(Boolean) as string[],
      );
      return matchLabQueueSearchQuery({ sampleId, orderId }, textFields, query);
    },
  },
  defaultStatuses: ['pending'],
  sortByPriority: true,
};

const ENTRY_FILTER_CONFIG: LabQueueStageFilterConfig<EntryWorklistItem, TestStatus> = {
  callbacks: {
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.status as TestStatus,
    getPriority: t => t.priority,
    getQueueSince: t => t.collectedAt ?? undefined,
    getId: t => t.orderTestId,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId ?? undefined,
    searchFilterFn: (item, query) => {
      const searchable = {
        id: item.orderTestId,
        orderId: item.orderId,
        patientName: item.patientName,
        testName: item.testName,
        testCode: item.testCode,
        sampleId: item.sampleId ?? undefined,
      };
      return createLabQueueSearchFilter()(searchable, query);
    },
  },
  defaultStatuses: ['sample-collected'],
  sortByPriority: true,
};

const VALIDATION_FILTER_CONFIG: LabQueueStageFilterConfig<ValidationWorklistItem, TestStatus> = {
  callbacks: {
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.status as TestStatus,
    getPriority: t => t.priority,
    getQueueSince: t => t.resultEnteredAt ?? undefined,
    getId: t => t.orderTestId,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId ?? undefined,
    searchFilterFn: (item, query) => {
      const searchable = {
        id: item.orderTestId,
        orderId: item.orderId,
        patientName: item.patientName,
        testName: item.testName,
        testCode: item.testCode,
        sampleId: item.sampleId ?? undefined,
      };
      return createLabQueueSearchFilter()(searchable, query);
    },
  },
  defaultStatuses: ['resulted'],
  sortByPriority: true,
};

const VALIDATION_REVIEW_FILTER_CONFIG: LabQueueStageFilterConfig<PendingEscalationItem, PriorityLevel> = {
  callbacks: {
    getId: t => t.id,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId ?? undefined,
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.priority as PriorityLevel,
    getPriority: t => t.priority,
    getQueueSince: t => t.resultEnteredAt ?? t.orderDate,
    searchFilterFn: (item, query) => {
      const searchable = { ...item, sampleId: item.sampleId ?? undefined };
      return createLabQueueSearchFilter<typeof searchable>()(searchable, query);
    },
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
