/**
 * Entity audit timeline hooks — React Query layer.
 */
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { auditAPI } from './audit.service';

export { auditAPI, type EntityTimelineResponse } from './audit.service';

export function useEntityTimeline(
  entityType: 'sample' | 'order_test' | undefined,
  entityId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.audit.entityTimeline(entityType, entityId),
    queryFn: () => auditAPI.getEntityTimeline(entityType!, entityId!),
    enabled: enabled && !!entityType && entityId != null && entityId > 0,
  });
}
