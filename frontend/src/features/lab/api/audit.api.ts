/**
 * Entity audit timeline API
 */
import { apiClient } from '@/lib/apiClient';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import type { TimelineEvent } from './commandCenter.api';

export interface EntityTimelineResponse {
  events: TimelineEvent[];
  total: number;
}

export const auditAPI = {
  getEntityTimeline(entityType: 'sample' | 'order_test', entityId: number): Promise<EntityTimelineResponse> {
    return apiClient.get<EntityTimelineResponse>(`/audit/entities/${entityType}/${entityId}/timeline`);
  },
};

export function useEntityTimeline(
  entityType: 'sample' | 'order_test' | undefined,
  entityId: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: queryKeys.audit.entityTimeline(entityType, entityId),
    queryFn: () => auditAPI.getEntityTimeline(entityType!, entityId!),
    enabled: enabled && !!entityType && entityId != null && entityId > 0,
  });
}
