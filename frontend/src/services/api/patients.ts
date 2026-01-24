/**
 * Patient API Service
 * Handles all patient-related API calls
 */

import { apiClient } from './client';
import type { Patient } from '@/types';
import type { PaginatedResponse, PaginationMeta } from './orders';

/**
 * Filter options for patients list
 */
export interface PatientsFilter {
  search?: string;
  page?: number;
  pageSize?: number;
}

export type { PaginatedResponse, PaginationMeta };

export const patientAPI = {
  /**
   * Get all patients (non-paginated for backward compatibility)
   */
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients');
  },

  /**
   * Get patients with pagination
   */
  async getPaginated(filters?: PatientsFilter): Promise<PaginatedResponse<Patient>> {
    const params: Record<string, string> = { paginated: 'true' };

    if (filters?.search) params.search = filters.search;
    if (filters?.page) params.skip = String((filters.page - 1) * (filters.pageSize || 20));
    if (filters?.pageSize) params.limit = String(filters.pageSize);

    return apiClient.get<PaginatedResponse<Patient>>('/patients', params);
  },

  /**
   * Get patient by ID
   */
  async getById(id: string): Promise<Patient | null> {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  /**
   * Create new patient
   */
  async create(patient: Patient): Promise<Patient> {
    return apiClient.post<Patient, Patient>('/patients', patient);
  },

  /**
   * Update patient
   */
  async update(id: string, updates: Partial<Patient>): Promise<Patient> {
    return apiClient.put<Patient, Partial<Patient>>(`/patients/${id}`, updates);
  },

  /**
   * Delete patient
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/patients/${id}`);
  },

  /**
   * Search patients
   */
  async search(query: string): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients/search', { q: query });
  },
};
