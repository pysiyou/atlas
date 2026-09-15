/**
 * Command Center API service — activity timeline.
 */
import { apiClient } from '@/lib/api/client';
import type { ApiTimelineResponse, TimelineEvent, TimelineResponse } from '@/lib/api/types';
import { timelineResponseSchema, parseApiResponse } from '@/lib/api/schemas/responses.schema';

export type { TimelineEvent, TimelineResponse };

export const commandCenterAPI = {
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
};
