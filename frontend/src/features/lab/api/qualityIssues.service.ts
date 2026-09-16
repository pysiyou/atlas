/**
 * Quality issues API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiQualityIssueOptions, ApiQualityIssueResult } from '@/lib/api/types';
import type {
  QualityIssueOptions,
  QualityIssueRecord,
  QualityIssueResult,
  QualityIssueTargetType,
  ReportQualityIssueRequest,
} from '@/types/lab-operations';

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

  list(params: {
    orderId?: number;
    sampleId?: number;
    orderTestId?: number;
  }): Promise<QualityIssueRecord[]> {
    const query: Record<string, string> = {};
    if (params.orderId) query.orderId = String(params.orderId);
    if (params.sampleId) query.sampleId = String(params.sampleId);
    if (params.orderTestId) query.orderTestId = String(params.orderTestId);
    return apiClient.get<QualityIssueRecord[]>('/lab/quality-issues', query);
  },
};
