/**
 * Audit API Service
 * Handles lab operation logs retrieval for activity timeline
 */

import { apiClient } from './client';
import type { LabOperationRecord, LabOperationType } from '@/types/lab-operations';

export interface GetLogsParams {
  limit?: number;
  offset?: number;
  operationType?: LabOperationType;
  entityType?: 'sample' | 'test' | 'order';
  hoursBack?: number;
}

export const auditAPI = {
  /**
   * Get lab operation logs for activity timeline
   */
  async getLogs(params?: GetLogsParams): Promise<LabOperationRecord[]> {
    const queryParams: Record<string, string> = {};

    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.offset) queryParams.offset = String(params.offset);
    if (params?.operationType) queryParams.operation_type = params.operationType;
    if (params?.entityType) queryParams.entity_type = params.entityType;
    if (params?.hoursBack) queryParams.hours_back = String(params.hoursBack);

    return apiClient.get<LabOperationRecord[]>('/audit/logs', queryParams);
  },
};
