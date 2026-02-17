/**
 * useDistributionByStage - Active (incomplete) tests by state: COLLECTION, RESULTS, VALIDATION, ESCALATION.
 *
 * Active = not superseded, not removed, not validated.
 * For each stage: value (count), arrivedToday (tests moved to that state today), lastSeenAt (last time an item entered this stage).
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
  /** Last time an item entered this stage (ISO datetime). */
  lastSeenAt?: string;
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
    let lastCollectionEntry = '';
    let lastResultsEntry = '';
    let lastValidationEntry = '';
    let lastEscalationEntry = '';

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
          case 'rejected':
            collection++;
            if (isTodayLocal(test.createdAt)) collectionArrivals++;
            {
              const enteredAt = test.createdAt ?? test.updatedAt ?? '';
              if (enteredAt && enteredAt > lastCollectionEntry) lastCollectionEntry = enteredAt;
            }
            break;
          case 'sample-collected':
          case 'in-progress':
            results++;
            if (wasCollectedToday) resultsArrivals++;
            if (sampleCA && sampleCA > lastResultsEntry) lastResultsEntry = sampleCA;
            break;
          case 'resulted':
            validation++;
            if (wasResultedToday) validationArrivals++;
            if (test.resultEnteredAt && test.resultEnteredAt > lastValidationEntry)
              lastValidationEntry = test.resultEnteredAt;
            break;
          case 'escalated':
            escalation++;
            if (isTodayLocal(test.updatedAt)) escalationArrivals++;
            if (test.updatedAt && test.updatedAt > lastEscalationEntry)
              lastEscalationEntry = test.updatedAt;
            break;
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
        lastSeenAt: lastCollectionEntry || undefined,
      },
      Results: {
        value: results,
        arrivedToday: resultsArrivals,
        lastSeenAt: lastResultsEntry || undefined,
      },
      Validation: {
        value: validation,
        arrivedToday: validationArrivals,
        lastSeenAt: lastValidationEntry || undefined,
      },
      Escalation: {
        value: escalation,
        arrivedToday: escalationArrivals,
        lastSeenAt: lastEscalationEntry || undefined,
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
