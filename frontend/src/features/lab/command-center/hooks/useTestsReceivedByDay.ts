/**
 * useTestsReceivedByDay - Last N days: tests received (orderDate) and validated (resultValidatedAt).
 * Counts tests, not orders. One data point per day; missing days filled with 0.
 */

import { useMemo } from 'react';
import { useOrdersList } from '@/hooks/queries';
import type { OrderTest } from '@/types';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: 'numeric', day: 'numeric' };

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const getResultValidatedAt = (t: OrderTest & { result_validated_at?: string }): string | undefined =>
  t.resultValidatedAt ?? t.result_validated_at;

export interface TestsReceivedByDayPoint {
  date: string;
  value: number;
  dateKey: string;
}

/** Point with both received and validated (delivered) counts for dual-series chart. */
export interface TestsReceivedAndValidatedPoint {
  date: string;
  dateKey: string;
  received: number;
  validated: number;
}

export interface UseTestsReceivedByDayResult {
  data: TestsReceivedByDayPoint[];
  isLoading: boolean;
}

export interface UseTestsReceivedAndValidatedResult {
  data: TestsReceivedAndValidatedPoint[];
  isLoading: boolean;
}

/**
 * @param days Number of calendar days (e.g. 15 = last 15 days including today)
 */
export function useTestsReceivedByDay(days: number = 15): UseTestsReceivedByDayResult {
  const result = useTestsReceivedAndValidatedByDay(days);
  const data: TestsReceivedByDayPoint[] = result.data.map((p) => ({
    dateKey: p.dateKey,
    date: p.date,
    value: p.received,
  }));
  return { data, isLoading: result.isLoading };
}

/**
 * Returns received and validated (delivered) test counts per day for the last N days.
 * Received = tests by order date; validated = tests by resultValidatedAt date.
 */
export function useTestsReceivedAndValidatedByDay(days: number = 15): UseTestsReceivedAndValidatedResult {
  const { orders, isLoading } = useOrdersList();

  const data = useMemo((): TestsReceivedAndValidatedPoint[] => {
    const now = new Date();
    const dailyReceived: Record<string, number> = {};
    const dailyValidated: Record<string, number> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = getDateKey(d);
      dailyReceived[key] = 0;
      dailyValidated[key] = 0;
    }

    (orders ?? []).forEach((order) => {
      const orderDateKey = order.orderDate?.split('T')[0];
      (order.tests ?? []).forEach((test) => {
        if (test.status === 'superseded' || test.status === 'removed') return;
        if (orderDateKey && orderDateKey in dailyReceived) {
          dailyReceived[orderDateKey] += 1;
        }
        const validatedAt = getResultValidatedAt(test);
        if (validatedAt) {
          const validatedDateKey = validatedAt.split('T')[0];
          if (validatedDateKey in dailyValidated) {
            dailyValidated[validatedDateKey] += 1;
          }
        }
      });
    });

    const sortedKeys = Object.keys(dailyReceived).sort();
    return sortedKeys.map((key) => {
      const d = new Date(key);
      return {
        dateKey: key,
        date: d.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS),
        received: dailyReceived[key] ?? 0,
        validated: dailyValidated[key] ?? 0,
      };
    });
  }, [orders, days]);

  return { data, isLoading };
}
