import React, { useMemo } from 'react';
import type { Order } from '@/types';
import { CircularProgress } from '@/shared/ui/CircularProgress';
import { STATUS_TIMELINE_STEPS, getOrderStepProgress } from './utils';

interface OrderCircularProgressProps {
  order: Order;
}

/**
 * OrderCircularProgress - Shows overall order progress through all 6 timeline steps.
 * 
 * Steps: Created, Paid, Sample Collected, Results Entered, Validated, Delivered
 * 
 * Progress is calculated as: (completed steps / total steps) * 100
 */
export const OrderCircularProgress: React.FC<OrderCircularProgressProps> = ({ order }) => {
  const { percentage, completedSteps, totalSteps } = useMemo(() => {
    const total = STATUS_TIMELINE_STEPS.length; // 6 steps

    // Count fully completed steps
    let completed = 0;
    for (const step of STATUS_TIMELINE_STEPS) {
      const progress = getOrderStepProgress(order, step.status);
      if (progress.isFullyComplete) {
        completed++;
      }
    }

    const pct = Math.round((completed / total) * 100);

    return { percentage: pct, completedSteps: completed, totalSteps: total };
  }, [order]);

  // Generate label: "X/Y" showing completed steps out of total
  const label = useMemo(() => {
    return `${completedSteps}/${totalSteps}`;
  }, [completedSteps, totalSteps]);

  return (
    <CircularProgress
      size={18}
      percentage={percentage}
      trackColorClass="stroke-gray-200"
      progressColorClass={percentage === 100 ? 'stroke-emerald-500' : 'stroke-blue-500'}
      label={label}
      className="h-7"
    />
  );
};
