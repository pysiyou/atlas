/**
 * Sample rejection options API.
 */

import { apiClient } from '@/lib/api/client';

export interface SampleRejectionOptionsResponse {
  canReject: boolean;
  rejectDisabledReason?: string;
  recollectionAttemptsUsed: number;
  recollectionAttemptsRemaining: number;
  maxRecollectionAttempts: number;
  canRequireRecollection: boolean;
  requireRecollectionDisabledReason?: string;
  orderHasValidatedTests: boolean;
  escalationRequired: boolean;
}

export const sampleRejectionAPI = {
  getOptions(sampleId: number): Promise<SampleRejectionOptionsResponse> {
    return apiClient.get<SampleRejectionOptionsResponse>(
      `/samples/${sampleId}/rejection-options`
    );
  },
};
