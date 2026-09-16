/**
 * Recollection requests API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import type {
  ApiRecollectionRequestResult,
  ApiRecollectionRequestSummary,
} from '@/lib/api/types';
import type {
  RecollectionRequestResult,
  RecollectionRequestSummary,
} from '@/types/lab-operations';

export const recollectionRequestsAPI = {
  listPending(): Promise<RecollectionRequestSummary[]> {
    return apiClient.get<ApiRecollectionRequestSummary[]>(
      '/lab/recollection-requests/pending'
    ) as Promise<RecollectionRequestSummary[]>;
  },

  approve(requestId: number, reviewNotes?: string): Promise<RecollectionRequestResult> {
    return apiClient.post<ApiRecollectionRequestResult>(
      `/lab/recollection-requests/${requestId}/approve`,
      { reviewNotes }
    ) as Promise<RecollectionRequestResult>;
  },

  deny(requestId: number, reviewNotes?: string): Promise<RecollectionRequestResult> {
    return apiClient.post<ApiRecollectionRequestResult>(
      `/lab/recollection-requests/${requestId}/deny`,
      { reviewNotes }
    ) as Promise<RecollectionRequestResult>;
  },
};
