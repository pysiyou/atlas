/**
 * Critical values API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { operationResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';
import type { ApiCriticalValueResponse } from '@/lib/api/types';

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
    return apiClient.get<ApiCriticalValueResponse[]>('/critical-values/pending') as Promise<
      CriticalValueRecord[]
    >;
  },

  notify(testId: number, body: NotifyCriticalValueRequest) {
    return apiClient
      .post(`/critical-values/${testId}/notify`, body)
      .then(data => parseApiResponse(operationResponseSchema, data, 'critical value notify'));
  },

  acknowledge(testId: number, body: AcknowledgeCriticalValueRequest) {
    return apiClient
      .post(`/critical-values/${testId}/acknowledge`, body)
      .then(data => parseApiResponse(operationResponseSchema, data, 'critical value acknowledge'));
  },
};
