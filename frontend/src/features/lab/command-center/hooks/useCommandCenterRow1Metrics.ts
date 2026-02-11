/**
 * useCommandCenterRow1Metrics - Row 1 KPIs: sampling done today, result (entry), validation.
 * Uses today's date (local date string) and filters orders/samples by date.
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import type { Order, OrderTest, ResultRejectionRecord } from '@/types';
import type { Sample } from '@/types';
import { isActiveTest } from '@/utils/orderUtils';

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
  /** Samples created today as % of sampling total (for trend display). */
  samplesCreatedTodayPct: number;
  resultEnteredToday: number;
  /** Tests still in result-entry queue (sample-collected or in-progress only). */
  resultStillNeedingEntry: number;
  /** Total for results card: entered today + still needing entry. */
  resultTotal: number;
  /** Tests whose sample was collected today (entered result-entry queue today). */
  resultEntryQueueEnteredToday: number;
  /** Result-entry queue entered today as % of result total (for trend display). */
  resultEntryQueueEnteredTodayPct: number;
  validatedToday: number;
  /** Tests still needing validation (status === 'resulted'). */
  validationTotal: number;
  /** Total for validation card: validated today + still needing validation. */
  validationTotalDisplay: number;
  /** Tests that had result entered today (entered validation queue today). */
  validationQueueEnteredToday: number;
  /** Validation queue entered today as % of validation total (for trend display). */
  validationQueueEnteredTodayPct: number;
  /** Tests with status === 'rejected'. */
  rejectedTotal: number;
  /** Rejected tests whose most recent rejection (resultRejectionHistory) was today. */
  rejectedToday: number;
  /** Rejected today as % of rejected total (for trend display). */
  rejectedTodayPct: number;
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
    let rejectedTotal = 0;
    let rejectedToday = 0;

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
        if (test.status === 'rejected') {
          rejectedTotal += 1;
          const history = test.resultRejectionHistory;
          const lastRejectedAt =
            history?.length
              ? (history[history.length - 1] as ResultRejectionRecord).rejectedAt
              : undefined;
          if (lastRejectedAt && isToday(lastRejectedAt)) {
            rejectedToday += 1;
          }
        }
      });
    });
    const resultTotal = resultEnteredToday + resultStillNeedingEntry;
    const validationTotalDisplay = validatedToday + validationTotal;

    const safePct = (num: number, denom: number) =>
      denom > 0 ? (num / denom) * 100 : 0;

    return {
      samplingDoneToday,
      samplesStillPending,
      samplingTotal,
      samplesCreatedToday,
      samplesCreatedTodayPct: safePct(samplesCreatedToday, samplingTotal),
      resultEnteredToday,
      resultStillNeedingEntry,
      resultTotal,
      resultEntryQueueEnteredToday,
      resultEntryQueueEnteredTodayPct: safePct(resultEntryQueueEnteredToday, resultTotal),
      validatedToday,
      validationTotal,
      validationTotalDisplay,
      validationQueueEnteredToday: resultEnteredToday,
      validationQueueEnteredTodayPct: safePct(resultEnteredToday, validationTotalDisplay),
      rejectedTotal,
      rejectedToday,
      rejectedTodayPct: safePct(rejectedToday, rejectedTotal),
      isLoading,
    };
  }, [orders, samples, ordersLoading, samplesLoading]);
}
