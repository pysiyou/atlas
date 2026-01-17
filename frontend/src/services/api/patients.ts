/**
 * Patient API Service
 * Handles all patient-related API calls
 */

import { apiClient } from './client';
import type { Patient } from '@/types';

export const patientAPI = {
  /**
   * Get all patients
   */
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients');
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

