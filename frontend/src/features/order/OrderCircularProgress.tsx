import React, { useMemo } from 'react';
import type { Order } from '@/types';
import { CircularProgress } from '@/shared/ui/CircularProgress';

interface OrderCircularProgressProps {
  order: Order;
}

export const OrderCircularProgress: React.FC<OrderCircularProgressProps> = ({ order }) => {
  const { percentage, completedTests, totalTests } = useMemo(() => {
    const total = order.tests.length;
    if (total === 0) {
      return { percentage: 0, completedTests: 0, totalTests: 0 };
    }

    // Count fully completed tests (validated or reported)
    const completed = order.tests.filter((t) => ['validated', 'reported'].includes(t.status)).length;
    const pct = Math.round((completed / total) * 100);

    return { percentage: pct, completedTests: completed, totalTests: total };
  }, [order]);

  // Generate label: "X/Y" for multi-test, "XX%" for single test
  const label = useMemo(() => {
    if (totalTests === 0) return '0%';
    if (totalTests === 1) return `${percentage}%`;
    return `${completedTests}/${totalTests}`;
  }, [percentage, completedTests, totalTests]);

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
