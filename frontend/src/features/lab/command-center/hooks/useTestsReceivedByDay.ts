/**
 * useTestsReceivedByDay - Last N days: tests received (orderDate) and validated (resultValidatedAt).
 * useActivityByDay - Per day: sampling count (samples collected), result entered, validated.
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import type { OrderTest } from '@/types';
import type { Sample } from '@/types';
import { isActiveTest } from '@/utils/orderUtils';

const DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = { month: 'numeric', day: 'numeric' };

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Format YYYY-MM-DD key as local date string (avoids UTC midnight shifting day in some timezones). */
function formatDateKey(key: string): string {
  const d = new Date(key + 'T00:00:00');
  return d.toLocaleDateString(undefined, DATE_FORMAT_OPTIONS);
}

const getResultEnteredAt = (t: OrderTest & { result_entered_at?: string }): string | undefined =>
  t.resultEnteredAt ?? t.result_entered_at;
const getResultValidatedAt = (t: OrderTest & { result_validated_at?: string }): string | undefined =>
  t.resultValidatedAt ?? t.result_validated_at;

const isCollectedSample = (s: Sample): s is Sample & { collectedAt: string } =>
  s.status === 'collected' && 'collectedAt' in s && typeof (s as Sample & { collectedAt?: string }).collectedAt === 'string';

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
 * @param days Number of calendar days (e.g. 15 = last 15 days including today). Clamped to 1–365.
 */
export function useTestsReceivedByDay(days: number = 15): UseTestsReceivedByDayResult {
  const safeDays = Math.max(1, Math.min(days, 365));
  const result = useTestsReceivedAndValidatedByDay(safeDays);
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
 * @param days Clamped to 1–365.
 */
export function useTestsReceivedAndValidatedByDay(days: number = 15): UseTestsReceivedAndValidatedResult {
  const { orders, isLoading } = useOrdersList();
  const safeDays = Math.max(1, Math.min(days, 365));

  const data = useMemo((): TestsReceivedAndValidatedPoint[] => {
    const now = new Date();
    const dailyReceived: Record<string, number> = {};
    const dailyValidated: Record<string, number> = {};

    for (let i = safeDays - 1; i >= 0; i--) {
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
        if (!isActiveTest(test)) return;
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
    return sortedKeys.map((key) => ({
      dateKey: key,
      date: formatDateKey(key),
      received: dailyReceived[key] ?? 0,
      validated: dailyValidated[key] ?? 0,
    }));
  }, [orders, safeDays]);

  return { data, isLoading };
}

/** Per-day counts: sampling (samples collected), result entered, validated. */
export interface ActivityByDayPoint {
  dateKey: string;
  date: string;
  sampling: number;
  resultEntered: number;
  validated: number;
}

export interface UseActivityByDayResult {
  data: ActivityByDayPoint[];
  isLoading: boolean;
}

/**
 * Returns per-day activity for stacked bar: sampling count, result entered count, validated count.
 * Sampling = samples collected that day (collectedAt). Result entered / validated = tests by resultEnteredAt / resultValidatedAt.
 * @param days Clamped to 1–365.
 */
export function useActivityByDay(days: number = 15): UseActivityByDayResult {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const isLoading = ordersLoading || samplesLoading;
  const safeDays = Math.max(1, Math.min(days, 365));

  const data = useMemo((): ActivityByDayPoint[] => {
    const now = new Date();
    const dailySampling: Record<string, number> = {};
    const dailyResultEntered: Record<string, number> = {};
    const dailyValidated: Record<string, number> = {};

    for (let i = safeDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = getDateKey(d);
      dailySampling[key] = 0;
      dailyResultEntered[key] = 0;
      dailyValidated[key] = 0;
    }

    (samples ?? []).forEach((s) => {
      if (!isCollectedSample(s)) return;
      const dateKey = s.collectedAt.split('T')[0];
      if (dateKey in dailySampling) dailySampling[dateKey] += 1;
    });

    (orders ?? []).forEach((order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;
        const enteredAt = getResultEnteredAt(test);
        if (enteredAt) {
          const key = enteredAt.split('T')[0];
          if (key in dailyResultEntered) dailyResultEntered[key] += 1;
        }
        const validatedAt = getResultValidatedAt(test);
        if (validatedAt) {
          const key = validatedAt.split('T')[0];
          if (key in dailyValidated) dailyValidated[key] += 1;
        }
      });
    });

    const sortedKeys = Object.keys(dailySampling).sort();
    return sortedKeys.map((key) => ({
      dateKey: key,
      date: formatDateKey(key),
      sampling: dailySampling[key] ?? 0,
      resultEntered: dailyResultEntered[key] ?? 0,
        validated: dailyValidated[key] ?? 0,
    }));
  }, [orders, samples, safeDays]);

  return { data, isLoading };
}
