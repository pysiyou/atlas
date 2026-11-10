/**
 * Critical values API, React Query hooks, and record mapping.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { operationResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';
import type { ApiCriticalValueResponse } from '@/lib/api/types';
import { useAuthStore } from '@/app/authStore';
import { queryKeys } from '@/lib/query';
import { invalidateCriticalValueQueries } from '@/lib/query/invalidate';
import type { LabModalWorkItem } from '../types/labQueueChrome';
import { LAB_PATHS } from '../constants/labConstants';

export interface CriticalValueRecord {
  id: number;
  orderId: number;
  testCode: string;
  testName?: string;
  patientId: number;
  patientName: string;
  flags?: string[];
  criticalNotificationSent: boolean;
  criticalNotifiedAt?: string;
  criticalNotifiedTo?: string;
  criticalAcknowledgedAt?: string;
  resultEnteredAt?: string;
  status: string;
}

export interface NotifyCriticalValueRequest {
  notifiedTo: string;
  notificationMethod?: string;
  notes?: string;
}

export interface AcknowledgeCriticalValueRequest {
  acknowledgedBy: string;
  notes?: string;
}

export const criticalValuesAPI = {
  getPending(): Promise<CriticalValueRecord[]> {
    return apiClient.get<ApiCriticalValueResponse[]>(LAB_PATHS.criticalValues.pending) as Promise<
      CriticalValueRecord[]
    >;
  },

  notify(testId: number, body: NotifyCriticalValueRequest) {
    return apiClient
      .post(LAB_PATHS.criticalValues.notify(testId), body)
      .then(data => parseApiResponse(operationResponseSchema, data, 'critical value notify'));
  },

  acknowledge(testId: number, body: AcknowledgeCriticalValueRequest) {
    return apiClient
      .post(LAB_PATHS.criticalValues.acknowledge(testId), body)
      .then(data => parseApiResponse(operationResponseSchema, data, 'critical value acknowledge'));
  },
};

export function usePendingCriticalValues() {
  const { isAuthenticated, isLoading: isRestoring } = useAuthStore();

  const query = useQuery({
    queryKey: queryKeys.criticalValues.pending(),
    queryFn: () => criticalValuesAPI.getPending(),
    enabled: isAuthenticated && !isRestoring,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  return {
    criticalValues: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useNotifyCriticalValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, body }: { testId: number; body: NotifyCriticalValueRequest }) =>
      criticalValuesAPI.notify(testId, body),
    onSuccess: () => invalidateCriticalValueQueries(queryClient),
  });
}

export function useAcknowledgeCriticalValue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ testId, body }: { testId: number; body: AcknowledgeCriticalValueRequest }) =>
      criticalValuesAPI.acknowledge(testId, body),
    onSuccess: () => invalidateCriticalValueQueries(queryClient),
  });
}

export function buildCriticalValueRecord(
  workItem: LabModalWorkItem
): CriticalValueRecord | null {
  if (!workItem.hasCriticalValues) {
    return null;
  }

  return {
    id: workItem.orderTestId,
    orderId: workItem.orderId,
    testCode: workItem.testCode,
    testName: workItem.testName,
    patientId: workItem.patientId ?? 0,
    patientName: workItem.patientName,
    flags: workItem.flags ?? undefined,
    criticalNotificationSent: workItem.criticalNotificationSent ?? false,
    criticalNotifiedAt: workItem.criticalNotifiedAt ?? undefined,
    criticalNotifiedTo: workItem.criticalNotifiedTo ?? undefined,
    criticalAcknowledgedAt: workItem.criticalAcknowledgedAt ?? undefined,
    resultEnteredAt: workItem.resultEnteredAt ?? undefined,
    status: workItem.status,
  };
}
