/**
 * useDistributionByStage - Active (incomplete) tests by state: COLLECTION, RESULTS, VALIDATION, ESCALATION.
 *
 * Active = not superseded, not removed, not validated.
 * For each stage: value (count), arrivedToday (trend), avgWaitMs (average wait), oldestEntryAt (oldest item).
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import { isActiveTest } from '@/utils/orderUtils';

export interface DistributionByStagePoint {
  name: string;
  value: number;
  color?: string;
  /** Tests that entered this state today (trend). */
  arrivedToday: number;
  /** Average wait time in this stage (milliseconds). */
  avgWaitMs?: number;
  /** ISO datetime of the oldest item currently in this stage. */
  oldestEntryAt?: string;
}

const STAGE_ORDER = ['Collection', 'Results', 'Validation', 'Escalation'] as const;

const STAGE_COLORS: Record<(typeof STAGE_ORDER)[number], string> = {
  Collection: 'var(--chart-warning)',
  Results: 'var(--chart-brand)',
  Validation: 'var(--chart-accent)',
  Escalation: 'var(--chart-danger)',
};

/** True if the ISO datetime falls on today in the user's local timezone. */
function isTodayLocal(isoString: string | undefined): boolean {
  if (!isoString) return false;
  const d = new Date(isoString);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

export function useDistributionByStage(): {
  data: DistributionByStagePoint[];
  isLoading: boolean;
} {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const isLoading = ordersLoading || samplesLoading;

  const data = useMemo((): DistributionByStagePoint[] => {
    const sampleCollectedAt = new Map<number, string>();
    (samples ?? []).forEach((s) => {
      if (s.status !== 'pending' && 'collectedAt' in s) {
        const ca = (s as { collectedAt: string }).collectedAt;
        if (ca) sampleCollectedAt.set(s.sampleId, ca);
      }
    });

    let collection = 0;
    let results = 0;
    let validation = 0;
    let escalation = 0;
    let collectionArrivals = 0;
    let resultsArrivals = 0;
    let validationArrivals = 0;
    let escalationArrivals = 0;
    let collectionWaitSum = 0;
    let resultsWaitSum = 0;
    let validationWaitSum = 0;
    let escalationWaitSum = 0;
    let oldestCollection = '';
    let oldestResults = '';
    let oldestValidation = '';
    let oldestEscalation = '';
    const now = Date.now();

    (orders ?? []).forEach((order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;
        if (test.status === 'validated') return;

        const sampleCA =
          test.sampleId != null ? sampleCollectedAt.get(test.sampleId) : undefined;
        const wasCollectedToday = sampleCA ? isTodayLocal(sampleCA) : false;
        const wasResultedToday = isTodayLocal(test.resultEnteredAt);

        switch (test.status) {
          case 'pending':
          case 'rejected': {
            collection++;
            if (isTodayLocal(test.createdAt)) collectionArrivals++;
            const enteredAt = test.createdAt ?? test.updatedAt ?? '';
            if (enteredAt) {
              collectionWaitSum += now - new Date(enteredAt).getTime();
              if (!oldestCollection || enteredAt < oldestCollection) oldestCollection = enteredAt;
            }
            break;
          }
          case 'sample-collected':
          case 'in-progress': {
            results++;
            if (wasCollectedToday) resultsArrivals++;
            if (sampleCA) {
              resultsWaitSum += now - new Date(sampleCA).getTime();
              if (!oldestResults || sampleCA < oldestResults) oldestResults = sampleCA;
            }
            break;
          }
          case 'resulted': {
            validation++;
            if (wasResultedToday) validationArrivals++;
            if (test.resultEnteredAt) {
              validationWaitSum += now - new Date(test.resultEnteredAt).getTime();
              if (!oldestValidation || test.resultEnteredAt < oldestValidation)
                oldestValidation = test.resultEnteredAt;
            }
            break;
          }
          case 'escalated': {
            escalation++;
            if (isTodayLocal(test.updatedAt)) escalationArrivals++;
            if (test.updatedAt) {
              escalationWaitSum += now - new Date(test.updatedAt).getTime();
              if (!oldestEscalation || test.updatedAt < oldestEscalation)
                oldestEscalation = test.updatedAt;
            }
            break;
          }
          default:
            break;
        }
      });
    });

    const metrics: Record<
      (typeof STAGE_ORDER)[number],
      Omit<DistributionByStagePoint, 'name' | 'color'>
    > = {
      Collection: {
        value: collection,
        arrivedToday: collectionArrivals,
        avgWaitMs: collection > 0 ? collectionWaitSum / collection : undefined,
        oldestEntryAt: oldestCollection || undefined,
      },
      Results: {
        value: results,
        arrivedToday: resultsArrivals,
        avgWaitMs: results > 0 ? resultsWaitSum / results : undefined,
        oldestEntryAt: oldestResults || undefined,
      },
      Validation: {
        value: validation,
        arrivedToday: validationArrivals,
        avgWaitMs: validation > 0 ? validationWaitSum / validation : undefined,
        oldestEntryAt: oldestValidation || undefined,
      },
      Escalation: {
        value: escalation,
        arrivedToday: escalationArrivals,
        avgWaitMs: escalation > 0 ? escalationWaitSum / escalation : undefined,
        oldestEntryAt: oldestEscalation || undefined,
      },
    };

    return STAGE_ORDER.map((name) => ({
      name,
      color: STAGE_COLORS[name],
      ...metrics[name],
    }));
  }, [orders, samples]);

  return { data, isLoading };
}
