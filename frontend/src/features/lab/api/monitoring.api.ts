/**
 * Lab monitoring API client — timeline, category summary, operations overview.
 */

import { apiClient } from '@/lib/apiClient';

export type CategorySummaryDays = 7 | 30 | 90;

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

export const monitoringAPI = {
  getCategorySummary: async (days: CategorySummaryDays): Promise<CategorySummaryResponse> => {
    return apiClient.get<CategorySummaryResponse>(
      `/monitoring/category-summary?days=${days}`
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
    return apiClient.get<TimelineResponse>('/monitoring/timeline', queryParams);
  },

  getOperationsOverview: async (hours_back = 24): Promise<OperationsOverviewResponse> => {
    return apiClient.get<OperationsOverviewResponse>(
      `/monitoring/operations-overview?hours_back=${hours_back}`
    );
  },
};
