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

interface GetSamplesParams {
  orderId?: string;
  status?: SampleStatus;
  skip?: number;
  limit?: number;
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

export const sampleAPI = {
  /**
   * Get all samples with optional filters
   */
  async getAll(params?: GetSamplesParams): Promise<Sample[]> {
    const queryParams: Record<string, string> = {};
    if (params?.orderId) queryParams.orderId = params.orderId;
    if (params?.status) queryParams.status = params.status;
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);
    return apiClient.get<Sample[]>('/samples', queryParams);
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
};
