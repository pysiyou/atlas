/**
 * Client filter profiles for secondary lists on the validation review tab (escalations, recollections).
 */

import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import type { PriorityLevel, TestWithContext } from '@/types';
import type { RecollectionRequestSummary } from '@/types/lab-operations';
import type { LabQueueStageFilterConfig } from './labQueueStageFilterConfig';

export type LabQueueSecondaryFilterProfile<T, S> = Pick<
  LabQueueStageFilterConfig<T, S>,
  'callbacks' | 'sortByPriority'
> & {
  applyStatusFilter?: boolean;
};

const filterRecollectionRequest = createLabQueueSearchFilter<RecollectionRequestSummary>(item =>
  [item.orderNumber, item.patientName, ...(item.testCodes ?? []), item.rejectedSampleId?.toString()].filter(
    (value): value is string => Boolean(value),
  ),
);

export const VALIDATION_REVIEW_ESCALATION_PROFILE: LabQueueSecondaryFilterProfile<
  TestWithContext,
  PriorityLevel
> = {
  callbacks: {
    getId: t => t.id,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId,
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.priority as PriorityLevel,
    getPriority: t => t.priority,
    getQueueSince: t => t.resultEnteredAt ?? t.orderDate,
    searchFilterFn: createLabQueueSearchFilter<TestWithContext>(),
  },
  sortByPriority: true,
  applyStatusFilter: true,
};

export const VALIDATION_REVIEW_RECOLLECTION_PROFILE: LabQueueSecondaryFilterProfile<
  RecollectionRequestSummary,
  PriorityLevel
> = {
  callbacks: {
    getOrderDate: request => request.createdAt,
    getSampleType: request => request.sampleType,
    getStatus: () => undefined,
    getPriority: () => undefined,
    getQueueSince: request => request.createdAt,
    getId: request => request.orderTestId,
    getOrderId: request => request.orderId,
    getSampleId: request => request.rejectedSampleId,
    searchFilterFn: filterRecollectionRequest,
  },
  sortByPriority: true,
  applyStatusFilter: false,
};
