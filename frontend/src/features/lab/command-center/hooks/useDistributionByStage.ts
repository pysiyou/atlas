/**
 * useDistributionByStage - Test counts by workflow stage: Sample, Result, Validation, Scalation.
 * Uses order test status; excludes rejected/superseded/removed.
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/hooks/queries';
import { isActiveTest } from '@/utils/orderUtils';
import type { OrderTest } from '@/types';

export interface DistributionByStagePoint {
  name: string;
  value: number;
}

const STAGE_ORDER = ['Sample', 'Result', 'Validation', 'Scalation'] as const;

function stageFromStatus(status: OrderTest['status']): (typeof STAGE_ORDER)[number] | null {
  switch (status) {
    case 'pending':
    case 'sample-collected':
    case 'in-progress':
      return 'Sample';
    case 'resulted':
      return 'Result';
    case 'validated':
      return 'Validation';
    case 'escalated':
      return 'Scalation';
    case 'rejected':
    case 'superseded':
    case 'removed':
      return null;
    default:
      return null;
  }
}

export function useDistributionByStage(): {
  data: DistributionByStagePoint[];
  isLoading: boolean;
} {
  const { orders, isLoading } = useOrdersList();

  const data = useMemo((): DistributionByStagePoint[] => {
    const countByStage = new Map<string, number>();
    STAGE_ORDER.forEach((s) => countByStage.set(s, 0));

    (orders ?? []).forEach((order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;
        const stage = stageFromStatus(test.status);
        if (!stage) return;
        countByStage.set(stage, (countByStage.get(stage) ?? 0) + 1);
      });
    });

    return STAGE_ORDER.map((name) => ({
      name,
      value: countByStage.get(name) ?? 0,
    }));
  }, [orders]);

  return { data, isLoading };
}
