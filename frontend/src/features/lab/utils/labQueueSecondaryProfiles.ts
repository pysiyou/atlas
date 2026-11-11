/**
 * Client filter profiles for lists on the validation review tab (worklist + escalations).
 */

import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import type { PriorityLevel } from '@/types';
import type { PendingEscalationItem } from '../api/results';
import type { ValidationQueueRow } from '../types/validationQueue';
import type { LabQueueStageFilterConfig } from './labQueueStageFilterConfig';

export type LabQueueSecondaryFilterProfile<T, S> = Pick<
  LabQueueStageFilterConfig<T, S>,
  'callbacks' | 'sortByPriority'
> & {
  applyStatusFilter?: boolean;
};

/** Pending validation rows — bar priority multi-select matches order priority, not test status. */
export const VALIDATION_REVIEW_WORKLIST_PROFILE: LabQueueSecondaryFilterProfile<
  ValidationQueueRow,
  PriorityLevel
> = {
  callbacks: {
    getId: t => t.orderTestId,
    getOrderId: t => t.orderId,
    getSampleId: t => t.sampleId ?? undefined,
    getOrderDate: t => t.orderDate,
    getSampleType: t => t.sampleType,
    getStatus: t => t.priority as PriorityLevel,
    getPriority: t => t.priority,
    getQueueSince: t => t.resultEnteredAt ?? undefined,
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
  sortByPriority: true,
  applyStatusFilter: true,
};

export const VALIDATION_REVIEW_ESCALATION_PROFILE: LabQueueSecondaryFilterProfile<
  PendingEscalationItem,
  PriorityLevel
> = {
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
      const searchable = {
        ...item,
        sampleId: item.sampleId ?? undefined,
      };
      return createLabQueueSearchFilter<typeof searchable>()(searchable, query);
    },
  },
  sortByPriority: true,
  applyStatusFilter: true,
};
