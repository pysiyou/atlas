/**
 * Results API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiEscalationResolveResponse } from '@/lib/api/types';
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
    return apiClient.post<ApiEscalationResolveResponse>(
      `/results/order-tests/${payload.orderTestId}/escalation/resolve`,
      {
        action: payload.action,
        validationNotes: payload.validationNotes,
        rejectionReason: payload.rejectionReason,
        readBack: payload.readBack,
      }
    ) as Promise<EscalationResolveResult>;
  },

  async enterResults(params: { orderTestId: number; data: ResultEntryRequest }) {
    return apiClient.post(`/results/order-tests/${params.orderTestId}`, params.data);
  },

  async validateResults(params: { orderTestId: number; data: ResultValidationRequest }) {
    return apiClient.post(
      `/results/order-tests/${params.orderTestId}/validate`,
      params.data
    );
  },
};
