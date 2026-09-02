/**
 * Quality Issues API + React Query hooks
 */
import { apiClient } from '@/lib/apiClient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { invalidateResultQueries } from '@/lib/query/invalidate';
import type {
  QualityIssueOptions,
  QualityIssueRecord,
  QualityIssueResult,
  QualityIssueTargetType,
  ReportQualityIssueRequest,
} from '@/types/lab-operations';

export const qualityIssuesAPI = {
  getOptions(targetType: QualityIssueTargetType, targetId: number): Promise<QualityIssueOptions> {
    return apiClient.get<QualityIssueOptions>('/lab/quality-issues/options', {
      targetType,
      targetId: String(targetId),
    });
  },

  reportIssue(body: ReportQualityIssueRequest): Promise<QualityIssueResult> {
    return apiClient.post<QualityIssueResult>('/lab/quality-issues', body);
  },

  list(params: { orderId?: number; sampleId?: number; orderTestId?: number }): Promise<QualityIssueRecord[]> {
    const query: Record<string, string> = {};
    if (params.orderId) query.orderId = String(params.orderId);
    if (params.sampleId) query.sampleId = String(params.sampleId);
    if (params.orderTestId) query.orderTestId = String(params.orderTestId);
    return apiClient.get<QualityIssueRecord[]>('/lab/quality-issues', query);
  },
};

export function useQualityIssueOptions(
  targetType: QualityIssueTargetType | undefined,
  targetId: number | undefined,
  enabled = true,
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
        queryClient.invalidateQueries({ queryKey: queryKeys.samples.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.orders.all }),
        invalidateResultQueries(queryClient),
        queryClient.invalidateQueries({ queryKey: queryKeys.qualityIssues.all }),
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
