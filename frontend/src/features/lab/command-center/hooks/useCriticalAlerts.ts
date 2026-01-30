/**
 * useCriticalAlerts - Derive un-notified critical/panic value alerts from orders.
 * Polls orders list; "Notify Doctor" calls orderAPI.markTestCritical and invalidates.
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrdersList } from '@/hooks/queries';
import { queryKeys } from '@/lib/query';
import { orderAPI } from '@/services/api/orders';
import { useAuthStore } from '@/shared/stores/auth.store';
import type { Order } from '@/types';
import type { TestResult } from '@/types/order';
import type { CriticalAlert } from '../types';

const CRITICAL_STATUSES = ['critical-high', 'critical-low', 'critical'] as const;

function parseThreshold(refRange: string | undefined): number {
  if (!refRange) return 0;
  const num = parseFloat(refRange.replace(/[^\d.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function buildAlertsFromOrders(orders: Order[] | undefined): CriticalAlert[] {
  if (!orders) return [];
  const alerts: CriticalAlert[] = [];
  for (const order of orders) {
    for (const test of order.tests ?? []) {
      if (!test.hasCriticalValues || test.criticalNotifiedAt) continue;
      const results = test.results as Record<string, TestResult> | null | undefined;
      if (!results) continue;
      for (const [paramKey, result] of Object.entries(results)) {
        const status = result?.status;
        if (!status || !CRITICAL_STATUSES.includes(status as (typeof CRITICAL_STATUSES)[number]))
          continue;
        const criticalType = status.includes('low') ? 'low' : 'high';
        const criticalThreshold = parseThreshold(result.referenceRange);
        alerts.push({
          patientId: order.patientId,
          patientName: order.patientName,
          orderId: order.orderId,
          testCode: test.testCode,
          testName: test.testName ?? test.testCode,
          parameterName: paramKey,
          value: result.value,
          unit: result.unit ?? '',
          criticalType,
          criticalThreshold: criticalThreshold || (typeof result.value === 'number' ? result.value : parseFloat(String(result.value))),
          notifiedAt: test.criticalNotifiedAt,
          acknowledgedAt: test.criticalAcknowledgedAt,
        });
      }
    }
  }
  return alerts;
}

export function useCriticalAlerts(_options?: { pollingIntervalMs?: number }) {
  const { isLoading: isRestoring } = useAuthStore();
  const queryClient = useQueryClient();
  const { orders, isLoading, refetch } = useOrdersList();
  const alerts = useMemo(() => buildAlertsFromOrders(orders), [orders]);

  const notifyDoctorMutation = useMutation({
    mutationFn: ({ orderId, testCode }: { orderId: number; testCode: string }) =>
      orderAPI.markTestCritical(String(orderId), testCode, 'physician'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
    },
  });

  const notifyDoctor = (alert: CriticalAlert) => {
    notifyDoctorMutation.mutate({ orderId: alert.orderId, testCode: alert.testCode });
  };

  return {
    alerts,
    isLoading: isRestoring || isLoading,
    refetch,
    notifyDoctor,
    isNotifying: notifyDoctorMutation.isPending,
  };
}
