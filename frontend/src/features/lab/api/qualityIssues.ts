/**
 * Quality issues API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiQualityIssueOptions, ApiQualityIssueResult } from '@/lib/api/types';
import type {
  QualityIssueOptions,
  QualityIssueResult,
  QualityIssueTargetType,
  ReportQualityIssueRequest,
} from '@/types/lab-operations';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { invalidateResultQueries, invalidateQualityIssueQueries } from '@/lib/query/invalidate';

export const qualityIssuesAPI = {
  getOptions(targetType: QualityIssueTargetType, targetId: number): Promise<QualityIssueOptions> {
    return apiClient.get<ApiQualityIssueOptions>('/lab/quality-issues/options', {
      targetType,
      targetId: String(targetId),
    }) as Promise<QualityIssueOptions>;
  },

  reportIssue(body: ReportQualityIssueRequest): Promise<QualityIssueResult> {
    return apiClient.post<ApiQualityIssueResult>('/lab/quality-issues', body) as Promise<QualityIssueResult>;
  },

};

/**
 * Quality issues API hooks — React Query layer.
 */

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

