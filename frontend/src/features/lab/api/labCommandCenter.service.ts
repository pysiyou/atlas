/**
 * Command Center API — board snapshot and activity timeline.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiTimelineResponse, TimelineEvent, TimelineResponse } from '@/lib/api/types';
import { timelineResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';
import type { PriorityLevel } from '@/types';

export type { TimelineEvent, TimelineResponse };

export interface LabBoardResponse {
  counts: { collection: number; entry: number; validation: number; supervisor: number };
  queueAge: Record<
    'collection' | 'entry' | 'validation',
    {
      oldestHours: number | null;
      averageHours: number | null;
      warningCount: number;
      criticalCount: number;
    }
  >;
  blockers: {
    paymentUnpaid: number;
    retestPending: number;
    recollectionWaiting: number;
    total: number;
  };
  health: 'healthy' | 'attention' | 'critical';
  healthMessage: string;
  suggestedTab?: string | null;
  ageBuckets: {
    fresh: number;
    onTrack: number;
    warning: number;
    critical: number;
  };
  priorityMix: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  attentionItems: Array<{
    id: string;
    stage: 'collection' | 'entry' | 'validation';
    stageLabel: string;
    orderId: number;
    patientName: string;
    priority: PriorityLevel;
    waitingHours: number;
    blockedReason?: string | null;
    blockedLabel?: string | null;
    queueTab: 'collection' | 'entry' | 'validation';
    since: string;
    workItemCount: number;
    orderTestIds: number[];
    attentionType: string;
  }>;
  attentionTotal: number;
  totalActive: number;
  computedAt?: string | null;
}

export const labCommandCenterAPI = {
  getTimeline: async (params: {
    hours_back?: number;
    limit?: number;
    offset?: number;
    categories?: string[];
  }): Promise<TimelineResponse> => {
    const queryParams: Record<string, string> = {};
    if (params.hours_back !== undefined) queryParams.hours_back = String(params.hours_back);
    if (params.limit !== undefined) queryParams.limit = String(params.limit);
    if (params.offset !== undefined) queryParams.offset = String(params.offset);
    if (params.categories && params.categories.length > 0) {
      queryParams.categories = params.categories.join(',');
    }
    const data = await apiClient.get<ApiTimelineResponse>('/command-center/timeline', queryParams);
    return parseApiResponse(timelineResponseSchema, data, 'timeline');
  },

  getCommandCenterBoard() {
    return apiClient.get<LabBoardResponse>('/lab/board');
  },
};
