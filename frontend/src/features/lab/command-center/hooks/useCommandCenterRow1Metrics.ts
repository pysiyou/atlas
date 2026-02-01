/**
 * useCommandCenterRow1Metrics - Row 1 KPIs: sampling done today, result (entry), validation.
 * Uses today's date (local date string) and filters orders/samples by date.
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import type { Order, OrderTest } from '@/types';
import type { Sample } from '@/types';

/** True if iso timestamp falls on the user's local calendar today. */
const isToday = (iso: string | undefined): boolean => {
  if (!iso || typeof iso !== 'string') return false;
  try {
    const date = new Date(iso);
    const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
    const now = new Date();
    return y === now.getFullYear() && m === now.getMonth() && d === now.getDate();
  } catch {
    return false;
  }
};

const isCollectedSample = (s: Sample): s is Sample & { collectedAt: string } =>
  s.status === 'collected' && 'collectedAt' in s && typeof (s as Sample & { collectedAt?: string }).collectedAt === 'string';

const isActiveTest = (test: OrderTest): boolean =>
  test.status !== 'superseded' && test.status !== 'removed';

/** Read result-entered timestamp; supports camelCase and snake_case (API may return either). */
const getResultEnteredAt = (test: OrderTest & { result_entered_at?: string }): string | undefined =>
  test.resultEnteredAt ?? test.result_entered_at;
/** Read validation timestamp; supports camelCase and snake_case (API may return either). */
const getResultValidatedAt = (test: OrderTest & { result_validated_at?: string }): string | undefined =>
  test.resultValidatedAt ?? test.result_validated_at;

export interface CommandCenterRow1Metrics {
  /** Samples collected today (from samples with collectedAt today). */
  samplingDoneToday: number;
  /** Samples still pending collection (status === 'pending'). */
  samplesStillPending: number;
  /** Total for sampling card: completed today + still pending (sample units). */
  samplingTotal: number;
  /** Count of samples created today (trend: "X more samples today"). */
  samplesCreatedToday: number;
  resultEnteredToday: number;
  /** Tests still in result-entry queue (sample-collected or in-progress only). */
  resultStillNeedingEntry: number;
  /** Total for results card: entered today + still needing entry. */
  resultTotal: number;
  /** Tests whose sample was collected today (entered result-entry queue today). */
  resultEntryQueueEnteredToday: number;
  validatedToday: number;
  /** Tests still needing validation (status === 'resulted'). */
  validationTotal: number;
  /** Total for validation card: validated today + still needing validation. */
  validationTotalDisplay: number;
  /** Tests that had result entered today (entered validation queue today). */
  validationQueueEnteredToday: number;
  isLoading: boolean;
}

export function useCommandCenterRow1Metrics(): CommandCenterRow1Metrics {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const isLoading = ordersLoading || samplesLoading;

  return useMemo(() => {
    let resultEnteredToday = 0;
    let resultStillNeedingEntry = 0;
    let validatedToday = 0;
    let validationTotal = 0;
    let resultEntryQueueEnteredToday = 0;

    const orderList = orders ?? [];
    const sampleList = samples ?? [];

    // Sampling: all counts in SAMPLE units (not tests). One sample can map to multiple tests.
    const samplesCollectedToday = sampleList.filter(
      (s): s is Sample & { collectedAt: string } => isCollectedSample(s) && isToday(s.collectedAt)
    );
    const samplingDoneToday = samplesCollectedToday.length;
    const samplesStillPending = sampleList.filter((s) => s.status === 'pending').length;
    const samplingTotal = samplingDoneToday + samplesStillPending;
    const samplesCreatedToday = sampleList.filter((s) => isToday(s.createdAt)).length;
    const collectedTodaySampleIds = new Set(samplesCollectedToday.map((s) => s.sampleId));

    orderList.forEach((order: Order) => {
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;

        const inEntry = test.status === 'sample-collected' || test.status === 'in-progress';
        const inValidation = test.status === 'resulted';
        if (inEntry) {
          resultStillNeedingEntry += 1;
        }
        if (inValidation) {
          validationTotal += 1;
        }
        if (test.sampleId != null && collectedTodaySampleIds.has(test.sampleId)) {
          resultEntryQueueEnteredToday += 1;
        }
        const enteredAt = getResultEnteredAt(test);
        if (isToday(enteredAt)) {
          resultEnteredToday += 1;
        }
        const validatedAt = getResultValidatedAt(test);
        if (isToday(validatedAt)) {
          validatedToday += 1;
        }
      });
    });
    const resultTotal = resultEnteredToday + resultStillNeedingEntry;
    const validationTotalDisplay = validatedToday + validationTotal;

    return {
      samplingDoneToday,
      samplesStillPending,
      samplingTotal,
      samplesCreatedToday,
      resultEnteredToday,
      resultStillNeedingEntry,
      resultTotal,
      resultEntryQueueEnteredToday,
      validatedToday,
      validationTotal,
      validationTotalDisplay,
      validationQueueEnteredToday: resultEnteredToday,
      isLoading,
    };
  }, [orders, samples, ordersLoading, samplesLoading]);
}
