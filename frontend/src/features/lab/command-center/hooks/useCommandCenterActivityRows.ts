/**
 * useCommandCenterActivityRows - Flattens orders to activity rows for command center table.
 * One row per order test; sorted by order.updatedAt desc (last modified).
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/hooks/queries';
import type { TestStatus } from '@/types';

export interface CommandCenterActivityRow {
  orderId: number;
  patientId: number;
  sampleId: number | undefined;
  testCode: string;
  status: TestStatus;
  lastModified: string;
}

const EXCLUDED_STATUSES: TestStatus[] = ['superseded', 'removed'];

export function useCommandCenterActivityRows(): {
  rows: CommandCenterActivityRow[];
  isLoading: boolean;
} {
  const { orders, isLoading } = useOrdersList();

  const rows = useMemo(() => {
    const flat: CommandCenterActivityRow[] = [];
    for (const order of orders) {
      for (const test of order.tests) {
        if (EXCLUDED_STATUSES.includes(test.status)) continue;
        flat.push({
          orderId: order.orderId,
          patientId: order.patientId,
          sampleId: test.sampleId,
          testCode: test.testCode,
          status: test.status,
          lastModified: order.updatedAt,
        });
      }
    }
    flat.sort(
      (a, b) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    return flat;
  }, [orders]);

  return { rows, isLoading };
}
