/**
 * Results API Service + React Query hooks
 */

import { apiClient } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateResultQueries } from '@/lib/query/invalidate';
import { queryKeys, cacheConfig } from '@/lib/query';
import { useAuthStore } from '@/app/store';
import type { ValidationDecision, TestWithContext } from '@/types';
import type {
  EscalationResolveRequest,
  EscalationResolveResult,
} from '@/types/lab-operations';

interface ResultEntryRequest {
  results: Record<string, unknown>;
  technicianNotes?: string;
}

interface ResultValidationRequest {
  decision: ValidationDecision;
  validationNotes?: string;
}

export const resultAPI = {
  async getPendingEscalation(): Promise<TestWithContext[]> {
    return apiClient.get<TestWithContext[]>('/results/pending-escalation');
  },

  async getOrderTestContext(orderTestId: number): Promise<TestWithContext> {
    return apiClient.get<TestWithContext>(`/results/order-tests/${orderTestId}`);
  },

  async resolveEscalation(
    payload: EscalationResolveRequest & { orderTestId: number }
  ): Promise<EscalationResolveResult> {
    return apiClient.post<EscalationResolveResult>(
      `/results/order-tests/${payload.orderTestId}/escalation/resolve`,
      {
        action: payload.action,
        validationNotes: payload.validationNotes,
        rejectionReason: payload.rejectionReason,
        readBack: payload.readBack,
      }
    );
  },

  async enterResults(params: {
    orderTestId: number;
    data: ResultEntryRequest;
  }) {
    return apiClient.post(`/results/order-tests/${params.orderTestId}`, params.data);
  },

  async validateResults(params: {
    orderTestId: number;
    data: ResultValidationRequest;
  }) {
    return apiClient.post(
      `/results/order-tests/${params.orderTestId}/validate`,
      params.data
    );
  },
};

export function useEnterResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderTestId,
      results,
      technicianNotes,
    }: {
      orderTestId: number;
      orderId?: string | number;
      results: Record<string, unknown>;
      technicianNotes?: string;
    }) => {
      if (orderTestId == null) {
        throw new Error('orderTestId is required to enter results.');
      }
      return resultAPI.enterResults({
        orderTestId,
        data: { results, technicianNotes },
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        variables.orderId != null
          ? typeof variables.orderId === 'number'
            ? variables.orderId.toString()
            : variables.orderId
          : undefined;
      invalidateResultQueries(queryClient, { orderId: orderIdStr, samples: false });
    },
  });
}

export function useValidateResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderTestId,
      validationNotes,
    }: {
      orderTestId: number;
      orderId?: string | number;
      validationNotes?: string;
    }) => {
      if (orderTestId == null) {
        throw new Error('orderTestId is required to validate results.');
      }
      return resultAPI.validateResults({
        orderTestId,
        data: {
          decision: 'approved' as ValidationDecision,
          validationNotes,
        },
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        variables.orderId != null
          ? typeof variables.orderId === 'number'
            ? variables.orderId.toString()
            : variables.orderId
          : undefined;
      invalidateResultQueries(queryClient, { orderId: orderIdStr, samples: false });
    },
  });
}

export function useResolveEscalation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderTestId,
      action,
      validationNotes,
      rejectionReason,
      readBack,
    }: {
      orderId?: string | number;
      orderTestId: number;
      action: EscalationResolveRequest['action'];
      validationNotes?: string;
      rejectionReason?: string;
      readBack?: EscalationResolveRequest['readBack'];
    }) => {
      const { hasRole } = useAuthStore.getState();
      if (!hasRole(['administrator', 'lab-technician-plus'])) {
        throw new Error('You do not have permission to resolve escalations.');
      }
      if (orderTestId == null) {
        throw new Error('orderTestId is required to resolve an escalation.');
      }
      return resultAPI.resolveEscalation({
        orderTestId,
        action,
        validationNotes,
        rejectionReason,
        readBack,
      });
    },
    onSuccess: (_, variables) => {
      const orderIdStr =
        variables.orderId != null
          ? typeof variables.orderId === 'number'
            ? variables.orderId.toString()
            : variables.orderId
          : undefined;
      invalidateResultQueries(queryClient, {
        orderId: orderIdStr,
        samples: true,
        pendingEscalation: true,
      });
    },
  });
}

export function usePendingEscalation() {
  const { isAuthenticated, isLoading: isRestoring, hasRole } = useAuthStore();
  const queryClient = useQueryClient();
  const canViewEscalations = hasRole(['administrator', 'lab-technician', 'lab-technician-plus']);
  const canResolveEscalation = hasRole(['administrator', 'lab-technician-plus']);

  const query = useQuery({
    queryKey: queryKeys.results.pendingEscalation(),
    queryFn: () => resultAPI.getPendingEscalation(),
    enabled: isAuthenticated && !isRestoring && canViewEscalations,
    ...cacheConfig.dynamic,
    refetchInterval: 15_000,
  });

  const invalidatePendingEscalation = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.results.pendingEscalation() });
  };

  return {
    escalatedTests: (query.data ?? []) as TestWithContext[],
    canViewEscalations,
    canResolveEscalation,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidatePendingEscalation,
  };
}
