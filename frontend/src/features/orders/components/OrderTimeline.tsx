import React, { useMemo } from 'react';
import { useUserLookup } from '@/features/users';
import type { LabTabId } from '@/features/lab/constants/labTabs';
import {
  STATUS_TIMELINE_STEPS,
  getOrderStepProgress,
  isStepBlocked,
  type StepProgress,
} from '../utils/orderTimelineUtils';
import type { Order } from '@/types';
import { OrderTimelineStep } from './OrderTimelineStep';

interface OrderTimelineProps {
  order: Order;
}

const LAB_STEP_TABS: Partial<Record<string, LabTabId>> = {
  'sample-collected': 'collection',
  'results-entered': 'entry',
  completed: 'validation',
};

/**
 * OrderTimeline - Displays the order progress through the lab workflow.
 */
export const OrderTimeline: React.FC<OrderTimelineProps> = ({ order }) => {
  const { getUserName } = useUserLookup();

  const stepProgressMap = useMemo(() => {
    return STATUS_TIMELINE_STEPS.reduce(
      (acc, step) => {
        acc[step.status] = getOrderStepProgress(order, step.status);
        return acc;
      },
      {} as Record<string, StepProgress>
    );
  }, [order]);

  return (
    <div className="p-4 space-y-0">
      {STATUS_TIMELINE_STEPS.map((step, index) => {
        const progress = stepProgressMap[step.status];
        const isLast = index === STATUS_TIMELINE_STEPS.length - 1;
        const nextProgress = !isLast
          ? stepProgressMap[STATUS_TIMELINE_STEPS[index + 1].status]
          : null;
        const blocked = isStepBlocked(order, step.status);
        const labTab = LAB_STEP_TABS[step.status];

        return (
          <OrderTimelineStep
            key={step.status}
            order={order}
            step={step}
            progress={progress}
            nextProgress={nextProgress}
            isLast={isLast}
            blocked={blocked}
            labTab={labTab}
            getUserName={(userId) => getUserName(String(userId))}
          />
        );
      })}
    </div>
  );
};
