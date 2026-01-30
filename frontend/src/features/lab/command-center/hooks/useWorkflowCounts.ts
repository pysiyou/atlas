/**
 * useWorkflowCounts - Derive funnel counts and lists from orders + samples.
 * No date filter: operational snapshot for command center.
 */

import { useMemo } from 'react';
import { useOrdersList, useSamplesList } from '@/hooks/queries';
import { isRejectedSample } from '@/types/sample';
import type { OrderTest } from '@/types';
import type { RejectedSampleSummary, RetestItem } from '../types';

const MAX_RETEST_ATTEMPTS = 3;

export function useWorkflowCounts() {
  const { orders, isLoading: ordersLoading } = useOrdersList();
  const { samples, isLoading: samplesLoading } = useSamplesList();
  const isLoading = ordersLoading || samplesLoading;

  const workflow = useMemo(() => {
    const preAnalytical = { pending: 0, rejected: [] as RejectedSampleSummary[] };
    const analytical = { pending: 0, retestQueue: [] as RetestItem[] };
    const postAnalytical = { pending: 0, partiallyValidated: 0 };

    if (!samples || !orders) {
      return { preAnalytical, analytical, postAnalytical };
    }

    const orderMap = new Map(orders.map(o => [o.orderId, o]));

    for (const sample of samples) {
      if (sample.status === 'pending') preAnalytical.pending++;
      if (isRejectedSample(sample)) {
        const order = orderMap.get(sample.orderId);
        preAnalytical.rejected.push({
          sampleId: sample.sampleId,
          orderId: sample.orderId,
          patientName: order?.patientName ?? '—',
          rejectionReasons: sample.rejectionReasons as string[],
        });
      }
    }

    for (const order of orders ?? []) {
      for (const test of order.tests ?? []) {
        const status = test.status;
        if (status === 'sample-collected') analytical.pending++;
        if (status === 'resulted' || status === 'in-progress') {
          postAnalytical.pending++;
        }
        const history = (test as OrderTest).resultRejectionHistory ?? [];
        const isRetest = (test as OrderTest).isRetest === true;
        if (!isRetest || test.resultValidatedAt) continue;
        const attemptCount = ((test as OrderTest).retestNumber ?? 0) + 1;
        const lastRejection = history[history.length - 1];
        analytical.retestQueue.push({
          orderId: order.orderId,
          testCode: test.testCode,
          testName: test.testName ?? test.testCode,
          patientName: order.patientName,
          attemptCount,
          maxAttempts: MAX_RETEST_ATTEMPTS,
          lastReason: lastRejection?.rejectionReason ?? '—',
        });
      }
    }

    const orderIdsWithSomeValidated = new Set<number>();
    const orderIdsWithSomePending = new Set<number>();
    let statUrgentOrders = 0;
    for (const order of orders ?? []) {
      let hasValidated = false;
      let hasPending = false;
      const isStatOrUrgent = order.priority === 'stat' || order.priority === 'urgent';
      for (const test of order.tests ?? []) {
        if (test.resultValidatedAt) hasValidated = true;
        if (test.status === 'resulted' || test.status === 'in-progress') hasPending = true;
      }
      if (hasValidated) orderIdsWithSomeValidated.add(order.orderId);
      if (hasPending) orderIdsWithSomePending.add(order.orderId);
      const hasIncompleteWork = order.tests?.some(
        t => t.status !== 'validated' && t.status !== 'removed' && t.status !== 'superseded'
      ) ?? false;
      if (isStatOrUrgent && hasIncompleteWork) statUrgentOrders++;
    }
    orderIdsWithSomeValidated.forEach(id => {
      if (orderIdsWithSomePending.has(id)) postAnalytical.partiallyValidated++;
    });

    return { preAnalytical, analytical, postAnalytical, statUrgentOrders };
  }, [orders, samples]);

  return {
    workflow: {
      preAnalytical: workflow.preAnalytical,
      analytical: workflow.analytical,
      postAnalytical: workflow.postAnalytical,
    },
    statUrgentOrders: workflow.statUrgentOrders ?? 0,
    isLoading,
  };
}
