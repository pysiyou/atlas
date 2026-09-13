/**
 * Patient API service — pure HTTP, no React.
 */
import { apiClient } from '@/lib/api/client';
import { WORKFLOW_QUERY_LIMIT, DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import type { Patient } from '@/types';
import type { PaginatedResponse, PaginationMeta } from '@/types/pagination';

export type { PaginatedResponse, PaginationMeta };

export interface PatientsFilter {
  search?: string;
  page?: number;
  pageSize?: number;
}

export const patientAPI = {
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients', { limit: String(WORKFLOW_QUERY_LIMIT) });
  },

  async getPaginated(filters?: PatientsFilter): Promise<PaginatedResponse<Patient>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || DEFAULT_LIST_PAGE_SIZE));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Patient>>('/patients', params);
  },

  async getById(id: string): Promise<Patient | null> {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  async create(patient: Patient): Promise<Patient> {
    return apiClient.post<Patient>('/patients', patient);
  },

  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    return apiClient.put<Patient>(`/patients/${id}`, updates);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/patients/${id}`);
  },

  async search(query: string): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients/search', { q: query });
  },
};
