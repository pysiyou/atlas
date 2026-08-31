/**
 * Critical Values API
 */

import { apiClient } from '@/lib/apiClient';

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
    return apiClient.get<CriticalValueRecord[]>('/critical-values/pending');
  },

  notify(testId: number, body: NotifyCriticalValueRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/critical-values/${testId}/notify`, body);
  },

  acknowledge(
    testId: number,
    body: AcknowledgeCriticalValueRequest
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/critical-values/${testId}/acknowledge`, body);
  },
};
