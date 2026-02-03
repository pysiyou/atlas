/**
 * useWeeklyActivities - Provides daily activity counts for the current week.
 * Returns 7 days (Mon-Sun) with counts for sampling, entry, and validation.
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import type { Order, OrderTest, Sample } from '@/types';

export interface DayActivity {
  dayOfWeek: string; // 'Mon', 'Tue', etc.
  date: string; // ISO date string (YYYY-MM-DD)
  sampling: number; // Samples collected
  entry: number; // Results entered
  validation: number; // Results validated
}

/** Get the start of the current week (Monday) */
const getWeekStart = (): Date => {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days; otherwise go to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/** Read result-entered timestamp; supports camelCase and snake_case */
const getResultEnteredAt = (test: OrderTest & { result_entered_at?: string }): string | undefined =>
  test.resultEnteredAt ?? test.result_entered_at;

/** Read validation timestamp; supports camelCase and snake_case */
const getResultValidatedAt = (test: OrderTest & { result_validated_at?: string }): string | undefined =>
  test.resultValidatedAt ?? test.result_validated_at;

const isActiveTest = (test: OrderTest): boolean =>
  test.status !== 'superseded' && test.status !== 'removed';

const isCollectedSample = (s: Sample): s is Sample & { collectedAt: string } =>
  s.status === 'collected' && 'collectedAt' in s && typeof (s as Sample & { collectedAt?: string }).collectedAt === 'string';

export function useWeeklyActivities(): {
  days: DayActivity[];
  isLoading: boolean;
} {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const isLoading = ordersLoading || samplesLoading;

  const days = useMemo(() => {
    const weekStart = getWeekStart();
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Helper to get local date string (YYYY-MM-DD) from a Date object
    const getLocalDateStr = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Helper to get local date string from ISO timestamp
    const getLocalDateFromISO = (iso: string): string => {
      const date = new Date(iso);
      return getLocalDateStr(date);
    };
    
    // Initialize 7 days
    const result: DayActivity[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = getLocalDateStr(date);
      
      result.push({
        dayOfWeek: dayNames[i],
        date: dateStr,
        sampling: 0,
        entry: 0,
        validation: 0,
      });
    }

    const orderList = orders ?? [];
    const sampleList = samples ?? [];

    // Count sampling activities (samples collected per day)
    sampleList.forEach((sample) => {
      if (isCollectedSample(sample)) {
        const collectedDate = getLocalDateFromISO(sample.collectedAt);
        const dayIndex = result.findIndex((d) => d.date === collectedDate);
        if (dayIndex !== -1) {
          result[dayIndex].sampling += 1;
        }
      }
    });

    // Count entry and validation activities (tests per day)
    orderList.forEach((order: Order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;

        // Entry: result entered
        const enteredAt = getResultEnteredAt(test);
        if (enteredAt) {
          const enteredDate = getLocalDateFromISO(enteredAt);
          const dayIndex = result.findIndex((d) => d.date === enteredDate);
          if (dayIndex !== -1) {
            result[dayIndex].entry += 1;
          }
        }

        // Validation: result validated
        const validatedAt = getResultValidatedAt(test);
        if (validatedAt) {
          const validatedDate = getLocalDateFromISO(validatedAt);
          const dayIndex = result.findIndex((d) => d.date === validatedDate);
          if (dayIndex !== -1) {
            result[dayIndex].validation += 1;
          }
        }
      });
    });

    // Debug logging
    // console.log('Weekly Activities Data:', result);

    return result;
  }, [orders, samples]);

  return { days, isLoading };
}
