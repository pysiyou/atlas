/**
 * Patients Provider Component
 * 
 * MIGRATION NOTE: This provider now delegates to TanStack Query hooks.
 * It maintains backward compatibility for components still using usePatients() context.
 * 
 * New components should use the query hooks directly:
 * - usePatientsList() for fetching patients
 * - usePatient(id) for single patient
 * - usePatientSearch() for searching
 * - useCreatePatient() for creating
 * - useUpdatePatient() for updating
 * 
 * This provider will be deprecated once all consumers are migrated.
 */

import React, { type ReactNode, useCallback, useMemo } from 'react';
import type { Patient } from '@/types';
import { PatientsContext, type PatientsContextType, type PatientError } from './PatientContext';
import {
  usePatientsList,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
  useInvalidatePatients,
} from '@/hooks/queries';

interface PatientsProviderProps {
  children: ReactNode;
}

/**
 * PatientsProvider - Backward compatible wrapper around TanStack Query
 * 
 * Delegates data fetching to usePatientsList() hook which provides:
 * - 5 minute stale time (semi-static data)
 * - Request deduplication
 * - Automatic cache management
 */
export const PatientsProvider: React.FC<PatientsProviderProps> = ({ children }) => {
  // Delegate to TanStack Query hooks for data fetching
  const { patients, isLoading: loading, isError, error: queryError, refetch } = usePatientsList();
  const { invalidateAll } = useInvalidatePatients();
  
  // Mutation hooks
  const createPatientMutation = useCreatePatient();
  const updatePatientMutation = useUpdatePatient();
  const deletePatientMutation = useDeletePatient();

  // Format error for backward compatibility
  const error: PatientError | null = useMemo(() => {
    if (!isError) return null;
    return {
      message: queryError instanceof Error ? queryError.message : 'Failed to load patients',
      operation: 'load',
    };
  }, [isError, queryError]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    // With TanStack Query, errors are cleared on successful refetch
  }, []);

  /**
   * Refresh patients from backend
   */
  const refreshPatients = useCallback(async () => {
    await invalidateAll();
    await refetch();
  }, [invalidateAll, refetch]);

  /**
   * Add a new patient
   */
  const addPatient = useCallback(async (patient: Patient) => {
    try {
      await createPatientMutation.mutateAsync(patient);
    } catch (err) {
      console.error('Failed to create patient:', err);
      throw err;
    }
  }, [createPatientMutation]);

  /**
   * Update an existing patient
   */
  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    try {
      await updatePatientMutation.mutateAsync({ id, updates });
    } catch (err) {
      console.error('Failed to update patient:', err);
      throw err;
    }
  }, [updatePatientMutation]);

  /**
   * Delete a patient
   */
  const deletePatient = useCallback(async (id: string) => {
    try {
      await deletePatientMutation.mutateAsync(id);
    } catch (err) {
      console.error('Failed to delete patient:', err);
      throw err;
    }
  }, [deletePatientMutation]);

  /**
   * Get a patient by ID
   */
  const getPatient = useCallback((id: string): Patient | undefined => {
    return patients.find(patient => patient.id === id);
  }, [patients]);

  /**
   * Search patients by name, ID, or phone
   */
  const searchPatients = useCallback((query: string): Patient[] => {
    if (!query.trim()) return patients;
    
    const lowerQuery = query.toLowerCase();
    return patients.filter(patient => 
      patient.fullName.toLowerCase().includes(lowerQuery) ||
      patient.id.toLowerCase().includes(lowerQuery) ||
      patient.phone.includes(query)
    );
  }, [patients]);

  const value: PatientsContextType = {
    patients,
    addPatient,
    updatePatient,
    deletePatient,
    getPatient,
    searchPatients,
    refreshPatients,
    loading,
    error,
    clearError,
  };

  return <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>;
};
