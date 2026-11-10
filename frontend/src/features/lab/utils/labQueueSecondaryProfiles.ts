/**
 * Client filter profiles for secondary lists on the validation review tab (escalations).
 */

import { createLabQueueSearchFilter } from '../components/LabWorkflowQueueLayout';
import type { PriorityLevel } from '@/types';
import type { PendingEscalationItem } from '../api/results';
import type { LabQueueStageFilterConfig } from './labQueueStageFilterConfig';

export type LabQueueSecondaryFilterProfile<T, S> = Pick<
  LabQueueStageFilterConfig<T, S>,
  'callbacks' | 'sortByPriority'
> & {
  applyStatusFilter?: boolean;
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
