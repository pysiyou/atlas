import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { auditAPI } from '@/features/lab';

export function useOrderTimeline(orderId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: queryKeys.audit.entityTimeline('order', orderId),
    queryFn: () => auditAPI.getEntityTimeline('order', orderId!),
    enabled: enabled && orderId != null && orderId > 0,
  });
}
