/**
 * Command Center API client — dashboard metrics and activity timeline.
 */

import { apiClient } from '@/lib/apiClient';

export interface CategorySummaryItem {
  category: string;
  count: number;
  percentage: number;
}

export interface CategorySummaryResponse {
  total: number;
  categories: CategorySummaryItem[];
}

export interface TimelineEvent {
  id: number;
  type: string;
  entityType: string;
  entityId: number;
  timestamp: string;
  performedBy: string;
  performedByName: string | null;
  metadata: Record<string, unknown>;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  comment?: string | null;
}

export interface TimelineResponse {
  events: TimelineEvent[];
  total: number;
}

export interface OperationsOverviewResponse {
  testFlow: Record<string, number>;
  escalations: {
    open: number;
    resolved: number;
  };
  qualityIssues: number;
  recollectionRequests: {
    pending: number;
    approved: number;
    denied: number;
  };
}

export interface StageTimingItem {
  key: string;
  name: string;
  hours: number;
  targetHours: number;
  minHours: number;
  maxHours: number;
  p95Hours: number;
}

export interface StageTimingResponse {
  stages: StageTimingItem[];
}

export interface DelaySourceItem {
  key: string;
  name: string;
  count: number;
  avgDelayHours: number;
  impactHours: number;
  pctOfTests: number;
}

export interface DelayImpactResponse {
  sources: DelaySourceItem[];
  totalImpactHours: number;
}

export interface TatStageItem {
  key: string;
  label: string;
  hours: number;
}

export interface TurnaroundTimeResponse {
  avgHours: number;
  targetHours: number;
  medianHours: number;
  p95Hours: number;
  minHours: number;
  maxHours: number;
  stages: TatStageItem[];
}

export interface DelaySeverityItem {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export interface SlaPerformanceResponse {
  onTimeRate: number;
  onTimeTarget: number;
  totalTests: number;
  onTimeCount: number;
  delayedCount: number;
  delayedRate: number;
  avgDelayOverTarget: number;
  delaySeverity: DelaySeverityItem[];
}

export interface CommandCenterDashboardResponse {
  operationsOverview: OperationsOverviewResponse;
  categorySummary: CategorySummaryResponse;
  stageTiming: StageTimingResponse;
  delayImpact: DelayImpactResponse;
  turnaroundTime: TurnaroundTimeResponse;
  slaPerformance: SlaPerformanceResponse;
}

export const commandCenterAPI = {
  getDashboard: async (params: {
    hours_back?: number;
  }): Promise<CommandCenterDashboardResponse> => {
    const queryParams: Record<string, string> = {};
    if (params.hours_back !== undefined) queryParams.hours_back = String(params.hours_back);
    return apiClient.get<CommandCenterDashboardResponse>(
      '/command-center/dashboard',
      queryParams
    );
  },

  getTimeline: async (params: {
    hours_back?: number;
    limit?: number;
    offset?: number;
  }): Promise<TimelineResponse> => {
    const queryParams: Record<string, string> = {};
    if (params.hours_back !== undefined) queryParams.hours_back = String(params.hours_back);
    if (params.limit !== undefined) queryParams.limit = String(params.limit);
    if (params.offset !== undefined) queryParams.offset = String(params.offset);
    return apiClient.get<TimelineResponse>('/command-center/timeline', queryParams);
  },
};
