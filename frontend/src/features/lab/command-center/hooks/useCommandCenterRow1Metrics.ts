/**
 * useCommandCenterRow1Metrics - Row 1 KPIs with trend = % growth vs yesterday.
 * Primary values: pending counts. Trend value: (todayCount - yesterdayCount) / yesterdayCount * 100.
 * "Pending samples" count matches Collection tab: only samples that have order, patient, and requirements.
 */

import { useMemo } from 'react';
import {
  useOrdersList,
  useSamplesList,
  useOrderLookup,
  useTestCatalog,
  usePatientNameLookup,
} from '@/hooks/queries';
import type { Order, OrderTest, ResultRejectionRecord } from '@/types';
import type { Sample } from '@/types';
import { isActiveTest } from '@/utils/orderUtils';
import { calculateRequiredSamples } from '@/utils';

const TREND_LABEL = 'vs yesterday';

function getDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** True if iso timestamp's calendar date equals dateKey (YYYY-MM-DD). */
function isOnDate(iso: string | undefined, dateKey: string): boolean {
  if (!iso || typeof iso !== 'string') return false;
  try {
    const datePart = iso.split('T')[0];
    return datePart === dateKey;
  } catch {
    return false;
  }
}

/** Percentage change vs yesterday: (today - yesterday) / yesterday * 100. Returns 0 if yesterday === 0. */
function pctGrowthVsYesterday(todayCount: number, yesterdayCount: number): number {
  if (yesterdayCount <= 0) return 0;
  return (todayCount - yesterdayCount) / yesterdayCount * 100;
}

const isCollectedSample = (s: Sample): s is Sample & { collectedAt: string } =>
  s.status === 'collected' && 'collectedAt' in s && typeof (s as Sample & { collectedAt?: string }).collectedAt === 'string';

const getResultEnteredAt = (test: OrderTest & { result_entered_at?: string }): string | undefined =>
  test.resultEnteredAt ?? test.result_entered_at;
const getResultValidatedAt = (test: OrderTest & { result_validated_at?: string }): string | undefined =>
  test.resultValidatedAt ?? test.result_validated_at;

function getLastRejectedAt(test: OrderTest): string | undefined {
  const history = test.resultRejectionHistory;
  if (!history?.length) return undefined;
  return (history[history.length - 1] as ResultRejectionRecord)?.rejectedAt;
}

export interface CommandCenterRow1Metrics {
  samplesStillPending: number;
  resultStillNeedingEntry: number;
  validationTotal: number;
  rejectedTotal: number;
  samplesUrgentCount: number;
  resultUrgentCount: number;
  validationUrgentCount: number;
  rejectedUrgentCount: number;
  /** Trend: % growth vs yesterday (samples collected). */
  trendSamplesCollected: number;
  /** Trend: % growth vs yesterday (results entered). */
  trendResultEntered: number;
  /** Trend: % growth vs yesterday (validated). */
  trendValidated: number;
  /** Trend: % growth vs yesterday (rejected). */
  trendRejected: number;
  trendLabel: string;
  isLoading: boolean;
}

export function useCommandCenterRow1Metrics(): CommandCenterRow1Metrics {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const { getOrder } = useOrderLookup();
  const { tests } = useTestCatalog();
  const { getPatient } = usePatientNameLookup();
  const isLoading = ordersLoading || samplesLoading;

  return useMemo(() => {
    const now = new Date();
    const todayKey = getDateKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = getDateKey(yesterday);

    const orderList = orders ?? [];
    const sampleList = samples ?? [];
    const testCatalog = tests ?? [];

    // Card 1: Pending count aligned with Collection tab (only samples with order, patient, requirements)
    let samplesStillPending = 0;
    let samplesUrgentCount = 0;
    sampleList.forEach((s) => {
      if (s.status !== 'pending') return;
      const order = getOrder(s.orderId);
      if (!order) return;
      const patient = getPatient(order.patientId);
      if (!patient) return;
      const testsForSample = order.tests.filter(t => s.testCodes?.includes(t.testCode));
      if (testsForSample.length === 0) return;
      const requirements = calculateRequiredSamples(
        testsForSample,
        testCatalog,
        order.priority,
        order.orderId
      );
      if (requirements.length === 0) return;
      samplesStillPending += 1;
      if (s.priority === 'urgent') samplesUrgentCount += 1;
    });

    // Card 1: samples collected today / yesterday (by collectedAt) for trend
    let samplesCollectedToday = 0;
    let samplesCollectedYesterday = 0;
    sampleList.forEach((s) => {
      if (!isCollectedSample(s)) return;
      if (isOnDate(s.collectedAt, todayKey)) samplesCollectedToday += 1;
      else if (isOnDate(s.collectedAt, yesterdayKey)) samplesCollectedYesterday += 1;
    });

    // Card 2–4: iterate order tests once
    let resultEnteredToday = 0;
    let resultEnteredYesterday = 0;
    let resultStillNeedingEntry = 0;
    let resultUrgentCount = 0;
    let validatedToday = 0;
    let validatedYesterday = 0;
    let validationTotal = 0;
    let validationUrgentCount = 0;
    let rejectedToday = 0;
    let rejectedYesterday = 0;
    let rejectedTotal = 0;
    let rejectedUrgentCount = 0;

    orderList.forEach((order: Order) => {
      const isUrgent = order.priority === 'urgent';
      (order.tests ?? []).forEach((test) => {
        if (!isActiveTest(test)) return;

        if (test.status === 'sample-collected' || test.status === 'in-progress') {
          resultStillNeedingEntry += 1;
          if (isUrgent) resultUrgentCount += 1;
        }
        if (test.status === 'resulted') {
          validationTotal += 1;
          if (isUrgent) validationUrgentCount += 1;
        }
        if (test.status === 'rejected') {
          rejectedTotal += 1;
          if (isUrgent) rejectedUrgentCount += 1;
        }

        const enteredAt = getResultEnteredAt(test);
        if (isOnDate(enteredAt, todayKey)) resultEnteredToday += 1;
        else if (isOnDate(enteredAt, yesterdayKey)) resultEnteredYesterday += 1;

        const validatedAt = getResultValidatedAt(test);
        if (isOnDate(validatedAt, todayKey)) validatedToday += 1;
        else if (isOnDate(validatedAt, yesterdayKey)) validatedYesterday += 1;

        const lastRejectedAt = getLastRejectedAt(test);
        if (isOnDate(lastRejectedAt, todayKey)) rejectedToday += 1;
        else if (isOnDate(lastRejectedAt, yesterdayKey)) rejectedYesterday += 1;
      });
    });

    return {
      samplesStillPending,
      resultStillNeedingEntry,
      validationTotal,
      rejectedTotal,
      samplesUrgentCount,
      resultUrgentCount,
      validationUrgentCount,
      rejectedUrgentCount,
      trendSamplesCollected: pctGrowthVsYesterday(samplesCollectedToday, samplesCollectedYesterday),
      trendResultEntered: pctGrowthVsYesterday(resultEnteredToday, resultEnteredYesterday),
      trendValidated: pctGrowthVsYesterday(validatedToday, validatedYesterday),
      trendRejected: pctGrowthVsYesterday(rejectedToday, rejectedYesterday),
      trendLabel: TREND_LABEL,
      isLoading,
    };
  }, [orders, samples, getOrder, getPatient, tests, isLoading]);
}
