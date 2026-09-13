/**
 * Entity audit timeline API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { timelineResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';
import type { ApiEntityTimelineResponse, EntityTimelineResponse } from '@/lib/api/types';

export type { EntityTimelineResponse };

export const auditAPI = {
  getEntityTimeline(
    entityType: 'sample' | 'order_test',
    entityId: number
  ): Promise<EntityTimelineResponse> {
    return apiClient
      .get<ApiEntityTimelineResponse>(`/audit/entities/${entityType}/${entityId}/timeline`)
      .then(data => parseApiResponse(timelineResponseSchema, data, 'entity timeline'));
  },
};
