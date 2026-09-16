/**
 * Quality issues API hooks — React Query layer.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { invalidateResultQueries, invalidateQualityIssueQueries } from '@/lib/query/invalidate';
import type {
  QualityIssueTargetType,
  ReportQualityIssueRequest,
} from '@/types/lab-operations';
import { qualityIssuesAPI } from './qualityIssues.service';

export { qualityIssuesAPI } from './qualityIssues.service';

export function useQualityIssueOptions(
  targetType: QualityIssueTargetType | undefined,
  targetId: number | undefined,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.qualityIssues.options(targetType, targetId),
    queryFn: () => qualityIssuesAPI.getOptions(targetType!, targetId!),
    enabled: enabled && !!targetType && !!targetId,
  });
}

export function useReportQualityIssue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ReportQualityIssueRequest) => qualityIssuesAPI.reportIssue(body),
    onSuccess: async () => {
      await Promise.all([
        invalidateQualityIssueQueries(queryClient),
        invalidateResultQueries(queryClient),
      ]);
    },
  });
}

export function useQualityIssuesForOrder(orderId?: number) {
  return useQuery({
    queryKey: queryKeys.qualityIssues.forOrder(orderId),
    queryFn: () => qualityIssuesAPI.list({ orderId }),
    enabled: !!orderId,
  });
}
