/**
 * useDistributionByStage - Current lab pipeline: Pending, Collected, Resulted, Validated (today).
 *
 * For each stage computes:
 *   value        – donut slice count (tests currently in that state; validated = today only)
 *   doneToday    – operations completed today for the *next* transition
 *   totalNeeded  – doneToday + remaining (full workload for that transition)
 *   arrivedToday – new items that entered *this* queue today (trend)
 *   lastSeenAt   – most-recent operation timestamp for the corresponding transition
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import { isActiveTest } from '@/utils/orderUtils';

export interface DistributionByStagePoint {
  name: string;
  value: number;
  color?: string;
  doneToday: number;
  totalNeeded: number;
  arrivedToday: number;
  lastSeenAt?: string;
}

const STAGE_ORDER = ['Pending', 'Collected', 'Resulted', 'Validated'] as const;

const STAGE_COLORS: Record<string, string> = {
  Pending: 'var(--chart-warning)',
  Collected: 'var(--chart-brand)',
  Resulted: 'var(--chart-accent)',
  Validated: 'var(--chart-success)',
};

/** YYYY-MM-DD for a Date (local timezone). */
function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useDistributionByStage(): {
  data: DistributionByStagePoint[];
  isLoading: boolean;
} {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const isLoading = ordersLoading || samplesLoading;

  const data = useMemo((): DistributionByStagePoint[] => {
    const todayKey = dateKey(new Date());

    // ── sample collection lookup ──────────────────────────────────────
    const sampleCollectedAt = new Map<number, string>();
    (samples ?? []).forEach((s) => {
      if (s.status !== 'pending' && 'collectedAt' in s) {
        const ca = (s as { collectedAt: string }).collectedAt;
        if (ca) sampleCollectedAt.set(s.sampleId, ca);
      }
    });

    // ── counters ──────────────────────────────────────────────────────
    let pending = 0;
    let collected = 0;
    let resulted = 0;
    let validatedToday = 0;

    // operations completed today (across *all* current statuses)
    let collectionsToday = 0;
    let resultsToday = 0;
    let validationsToday = 0;

    // new items entering each queue today (only tests still in that queue)
    let collectionArrivals = 0;
    let resultArrivals = 0;
    let validationArrivals = 0;

    // most-recent operation timestamps
    let lastCollection = '';
    let lastResultEntry = '';
    let lastValidation = '';

    (orders ?? []).forEach((order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;
        if (test.status === 'rejected') return;

        const sampleCA =
          test.sampleId != null ? sampleCollectedAt.get(test.sampleId) : undefined;
        const wasCollectedToday = sampleCA ? sampleCA.startsWith(todayKey) : false;
        const wasResultedToday = test.resultEnteredAt
          ? test.resultEnteredAt.startsWith(todayKey)
          : false;
        const wasValidatedToday = test.resultValidatedAt
          ? test.resultValidatedAt.startsWith(todayKey)
          : false;

        // ── donut segment counts ────────────────────────────────────
        switch (test.status) {
          case 'pending':
            pending++;
            // trend: test created today → new arrival in collection queue
            if (test.createdAt?.startsWith(todayKey)) collectionArrivals++;
            break;

          case 'sample-collected':
          case 'in-progress':
            collected++;
            // trend: collected today → new arrival in result-entry queue
            if (wasCollectedToday) resultArrivals++;
            break;

          case 'resulted':
            resulted++;
            // trend: resulted today → new arrival in validation queue
            if (wasResultedToday) validationArrivals++;
            break;

          case 'validated':
            if (wasValidatedToday) validatedToday++;
            break;

          // escalated & others excluded from donut
          default:
            break;
        }

        // ── operations done today (regardless of current status) ────
        if (wasCollectedToday) collectionsToday++;
        if (wasResultedToday) resultsToday++;
        if (wasValidatedToday) validationsToday++;

        // ── last-seen timestamps (overall, not just today) ──────────
        if (sampleCA && sampleCA > lastCollection) lastCollection = sampleCA;
        if (test.resultEnteredAt && test.resultEnteredAt > lastResultEntry)
          lastResultEntry = test.resultEnteredAt;
        if (test.resultValidatedAt && test.resultValidatedAt > lastValidation)
          lastValidation = test.resultValidatedAt;
      });
    });

    // ── assemble stages ─────────────────────────────────────────────
    const metrics: Record<
      (typeof STAGE_ORDER)[number],
      Omit<DistributionByStagePoint, 'name' | 'color'>
    > = {
      Pending: {
        value: pending,
        doneToday: collectionsToday,
        totalNeeded: pending + collectionsToday,
        arrivedToday: collectionArrivals,
        lastSeenAt: lastCollection || undefined,
      },
      Collected: {
        value: collected,
        doneToday: resultsToday,
        totalNeeded: collected + resultsToday,
        arrivedToday: resultArrivals,
        lastSeenAt: lastResultEntry || undefined,
      },
      Resulted: {
        value: resulted,
        doneToday: validationsToday,
        totalNeeded: resulted + validationsToday,
        arrivedToday: validationArrivals,
        lastSeenAt: lastValidation || undefined,
      },
      Validated: {
        value: validatedToday,
        doneToday: validatedToday,
        totalNeeded: validatedToday,
        arrivedToday: validatedToday,
        lastSeenAt: lastValidation || undefined,
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
