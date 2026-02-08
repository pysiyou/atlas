/**
 * Samples API Service
 * Handles sample collection and tracking
 */

import { apiClient } from './client';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
  RejectionReason,
} from '@/types';
import type { RejectAndRecollectResponse } from '@/types/lab-operations';
import type { PaginatedResponse, PaginationMeta } from './orders';

export type { PaginatedResponse, PaginationMeta };

interface GetSamplesParams {
  orderId?: string;
  status?: SampleStatus;
  skip?: number;
  limit?: number;
}

/**
 * Filter options for samples list with pagination
 */
export interface SamplesFilter {
  orderId?: string;
  status?: SampleStatus;
  page?: number;
  pageSize?: number;
}

interface CollectSampleRequest {
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
}

interface RejectSampleRequest {
  rejectionReasons: RejectionReason[];
  rejectionNotes?: string;
  recollectionRequired?: boolean;
}

interface RejectAndRecollectRequest {
  rejectionReasons: RejectionReason[];
  rejectionNotes?: string;
  recollectionReason?: string;
}

export const sampleAPI = {
  /**
   * Get all samples with optional filters (requests up to backend max so tables can show full list)
   */
  async getAll(params?: GetSamplesParams): Promise<Sample[]> {
    const queryParams: Record<string, string> = { limit: '10000' };
    if (params?.orderId) queryParams.orderId = params.orderId;
    if (params?.status) queryParams.status = params.status;
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);
    return apiClient.get<Sample[]>('/samples', queryParams);
  },

  /**
   * Get samples with pagination
   */
  async getPaginated(filters?: SamplesFilter): Promise<PaginatedResponse<Sample>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.orderId) params.orderId = filters.orderId;
    if (filters?.status) params.sampleStatus = filters.status;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || 20));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Sample>>('/samples', params);
  },

  /**
   * Get a sample by its ID
   */
  async getById(sampleId: string): Promise<Sample | null> {
    try {
      return await apiClient.get<Sample>(`/samples/${sampleId}`);
    } catch {
      return null;
    }
  },

  /**
   * Get pending samples (lab tech only)
   */
  async getPending(): Promise<Sample[]> {
    return apiClient.get<Sample[]>('/samples/pending');
  },

  /**
   * Collect a sample
   */
  async collect(sampleId: string, data: CollectSampleRequest): Promise<Sample> {
    return apiClient.patch<Sample>(`/samples/${sampleId}/collect`, data);
  },

  /**
   * Reject a sample
   */
  async reject(sampleId: string, data: RejectSampleRequest): Promise<Sample> {
    return apiClient.patch<Sample>(`/samples/${sampleId}/reject`, data);
  },

  /**
   * Request recollection for a rejected sample
   */
  async requestRecollection(sampleId: string, reason: string): Promise<Sample> {
    return apiClient.post<Sample>(`/samples/${sampleId}/request-recollection`, { reason });
  },

  /**
   * Atomically reject a sample and request recollection.
   * Combines two operations into one transaction.
   *
   * This is useful when you know immediately that a sample needs to be rejected
   * and a new collection is required.
   *
   * - Rejects the current sample with provided reasons
   * - Creates a new recollection sample in PENDING status
   * - Links the two samples together
   * - Updates order tests to point to the new sample
   * - Escalates priority to urgent
   */
  async rejectAndRecollect(
    sampleId: string,
    data: RejectAndRecollectRequest
  ): Promise<RejectAndRecollectResponse> {
    return apiClient.post<RejectAndRecollectResponse>(
      `/samples/${sampleId}/reject-and-recollect`,
      data
    );
  },
};
