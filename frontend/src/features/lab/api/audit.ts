/**
 * Entity audit timeline API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { timelineResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';
import type { ApiEntityTimelineResponse, EntityTimelineResponse } from '@/lib/api/types';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';

export type { EntityTimelineResponse };

export const auditAPI = {
  getEntityTimeline(
    entityType: 'sample' | 'order_test' | 'order',
    entityId: number
  ): Promise<EntityTimelineResponse> {
    return apiClient
      .get<ApiEntityTimelineResponse>(`/audit/entities/${entityType}/${entityId}/timeline`)
      .then(data => parseApiResponse(timelineResponseSchema, data, 'entity timeline'));
  },
};

/**
 * Entity audit timeline hooks — React Query layer.
 */

export function useEntityTimeline(
  entityType: 'sample' | 'order_test' | 'order' | undefined,
  entityId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.audit.entityTimeline(entityType, entityId),
    queryFn: () => auditAPI.getEntityTimeline(entityType!, entityId!),
    enabled: enabled && !!entityType && entityId != null && entityId > 0,
  });
}
