/**
 * Monitoring API Client
 */

import { apiClient } from '@/lib/apiClient';

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

export interface CategorySummaryItem {
  category: string;
  count: number;
  percentage: number;
}

export interface CategorySummaryResponse {
  total: number;
  categories: CategorySummaryItem[];
}

export type CategorySummaryDays = 7 | 30 | 90;

export const monitoringAPI = {
  async getTimeline(params?: {
    hoursBack?: number;
    limit?: number;
    offset?: number;
  }): Promise<TimelineResponse> {
    const queryParams: Record<string, string> = {};
    if (params?.hoursBack) queryParams.hours_back = String(params.hoursBack);
    if (params?.limit) queryParams.limit = String(params.limit);
    if (params?.offset) queryParams.offset = String(params.offset);

    return apiClient.get<TimelineResponse>('/monitoring/timeline', queryParams);
  },

  async getCategorySummary(days: CategorySummaryDays): Promise<CategorySummaryResponse> {
    return apiClient.get<CategorySummaryResponse>('/monitoring/category-summary', { days: String(days) });
  },
};
