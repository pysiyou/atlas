/**
 * Patients Provider Component
 *
 * @deprecated This provider delegates to TanStack Query hooks and is kept for backward compatibility.
 * New components should use TanStack Query hooks directly from @/hooks/queries:
 * - usePatientsList() for fetching patients
 * - usePatient(id) for single patient
 * - usePatientSearch() for searching
 * - useCreatePatient() for creating
 * - useUpdatePatient() for updating
 *
 * This provider will be removed once all consumers are migrated to TanStack Query hooks.
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
import { logger } from '@/utils/logger';

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
  const addPatient = useCallback(
    async (patient: Patient) => {
      try {
        await createPatientMutation.mutateAsync(patient);
      } catch (err) {
        logger.error('Failed to create patient', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [createPatientMutation]
  );

  /**
   * Update an existing patient
   */
  const updatePatient = useCallback(
    async (id: number | string, updates: Partial<Patient>) => {
      try {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        await updatePatientMutation.mutateAsync({ id: numericId, updates });
      } catch (err) {
        logger.error('Failed to update patient', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [updatePatientMutation]
  );

  /**
   * Delete a patient
   */
  const deletePatient = useCallback(
    async (id: number | string) => {
      try {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        await deletePatientMutation.mutateAsync(numericId);
      } catch (err) {
        logger.error('Failed to delete patient', err instanceof Error ? err : undefined);
        throw err;
      }
    },
    [deletePatientMutation]
  );

  /**
   * Get a patient by ID (handles both number and string for URL compatibility)
   */
  const getPatient = useCallback(
    (id: number | string): Patient | undefined => {
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      if (isNaN(numericId)) return undefined;
      return patients.find(patient => patient.id === numericId);
    },
    [patients]
  );

  /**
   * Search patients by name, ID, or phone
   */
  const searchPatients = useCallback(
    (query: string): Patient[] => {
      if (!query.trim()) return patients;

      const lowerQuery = query.toLowerCase();
      // Try to parse as display ID (e.g., "PAT123") or numeric ID
      const parsedId = parseInt(
        lowerQuery.replace(/^(pat|ord|sam|tst|alq|inv|pay|clm|rpt|usr|aud|apt)/i, ''),
        10
      );

      return patients.filter(
        patient =>
          patient.fullName.toLowerCase().includes(lowerQuery) ||
          patient.id.toString().includes(parsedId.toString()) ||
          patient.phone.includes(query)
      );
    },
    [patients]
  );

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
