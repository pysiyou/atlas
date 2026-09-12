/**
 * Command Center API client — activity timeline.
 */

import { apiClient } from '@/lib/apiClient';

export interface TimelineEvent {
  id: number;
  type: string;
  /** Workflow phase from entity timeline API (specimen | results | validation | escalation | composition). */
  phase?: string;
  /** Event tone from entity timeline API (neutral | problem | resolution). */
  tone?: string;
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

export const commandCenterAPI = {
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
