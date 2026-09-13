/**
 * Samples API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT, DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import type {
  Sample,
  SampleStatus,
  ContainerType,
  ContainerTopColor,
} from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';

export type { PaginatedResponse, PaginationMeta };

const BACKEND_COLOR_VALUES = [
  'red',
  'purple',
  'blue',
  'green',
  'gray',
  'yellow',
  'light-blue',
  'pink',
  'white',
  'black',
  'orange',
  'clear',
] as const;

const FRONTEND_TO_BACKEND_COLOR: Record<string, (typeof BACKEND_COLOR_VALUES)[number]> = {
  'red-top': 'red',
  'lavender-top': 'purple',
  'green-top': 'green',
  'blue-top': 'blue',
  'royal-blue-top': 'blue',
  'yellow-top': 'yellow',
  'gray-top': 'gray',
  'light-blue-top': 'light-blue',
  'pink-top': 'pink',
  'black-top': 'black',
  'orange-top': 'orange',
  'white-top': 'white',
  'clear-top': 'clear',
  'gold-top': 'yellow',
  'tiger-top': 'orange',
  'tan-top': 'orange',
};

function toBackendContainerColor(
  frontendColor: ContainerTopColor | string
): (typeof BACKEND_COLOR_VALUES)[number] {
  const mapped = FRONTEND_TO_BACKEND_COLOR[frontendColor];
  if (mapped) return mapped;
  if (BACKEND_COLOR_VALUES.includes(frontendColor as (typeof BACKEND_COLOR_VALUES)[number]))
    return frontendColor as (typeof BACKEND_COLOR_VALUES)[number];
  return 'red';
}

interface GetSamplesParams {
  orderId?: string;
  status?: SampleStatus;
  skip?: number;
  limit?: number;
}

export interface SamplesFilter {
  orderId?: string;
  status?: SampleStatus;
  page?: number;
  pageSize?: number;
}

interface CollectSampleRequest {
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
}

export const sampleAPI = {
  async getAll(params?: GetSamplesParams): Promise<Sample[]> {
    const queryParams: Record<string, string> = { limit: String(WORKFLOW_QUERY_LIMIT) };
    if (params?.orderId) queryParams.orderId = params.orderId;
    if (params?.status) queryParams.status = params.status;
    if (params?.skip) queryParams.skip = String(params.skip);
    if (params?.limit) queryParams.limit = String(params.limit);
    return apiClient.get<Sample[]>('/samples', queryParams);
  },

  async getPaginated(filters?: SamplesFilter): Promise<PaginatedResponse<Sample>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.orderId) params.orderId = filters.orderId;
    if (filters?.status) params.sampleStatus = filters.status;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || DEFAULT_LIST_PAGE_SIZE));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Sample>>('/samples', params);
  },

  async getById(sampleId: string): Promise<Sample | null> {
    try {
      return await apiClient.get<Sample>(`/samples/${sampleId}`);
    } catch {
      return null;
    }
  },

  async getPending(): Promise<Sample[]> {
    return apiClient.get<Sample[]>('/samples/pending');
  },

  async collect(sampleId: string, data: CollectSampleRequest): Promise<Sample> {
    const body = {
      collectedVolume: data.collectedVolume,
      actualContainerType: data.actualContainerType,
      actualContainerColor: toBackendContainerColor(data.actualContainerColor),
      ...(data.collectionNotes != null && data.collectionNotes !== ''
        ? { collectionNotes: data.collectionNotes }
        : {}),
    };
    return apiClient.patch<Sample>(`/samples/${sampleId}/collect`, body);
  },
};
