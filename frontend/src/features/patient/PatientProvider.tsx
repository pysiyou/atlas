/**
 * Patients Provider Component
 * Manages patient data using backend API with proper error handling
 */

import React, { type ReactNode, useCallback, useState, useEffect } from 'react';
import type { Patient } from '@/types';
import { PatientsContext, type PatientsContextType, type PatientError } from './PatientContext';
import { patientAPI } from '@/services/api/patients';

interface PatientsProviderProps {
  children: ReactNode;
}

/**
 * Patients Provider Component
 * Manages patient data using backend API with comprehensive error handling
 */
export const PatientsProvider: React.FC<PatientsProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<PatientError | null>(null);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh patients from backend
   */
  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await patientAPI.getAll();
      setPatients(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patients';
      console.error('Failed to load patients:', err);
      setError({
        message: errorMessage,
        operation: 'load',
      });
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load patients on mount
  useEffect(() => {
    refreshPatients();
  }, [refreshPatients]);

  /**
   * Add a new patient
   */
  const addPatient = useCallback(async (patient: Patient) => {
    try {
      setError(null);
      const created = await patientAPI.create(patient);
      setPatients(prev => [...prev, created]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create patient';
      console.error('Failed to create patient:', err);
      setError({
        message: errorMessage,
        operation: 'create',
      });
      throw err;
    }
  }, [refreshPatients]);

  /**
   * Update an existing patient
   */
  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    try {
      setError(null);
      const updated = await patientAPI.update(id, updates);
      setPatients(prev =>
        prev.map(patient =>
          patient.id === id ? updated : patient
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update patient';
      console.error('Failed to update patient:', err);
      setError({
        message: errorMessage,
        operation: 'update',
      });
      throw err;
    }
  }, [refreshPatients]);

  /**
   * Delete a patient
   */
  const deletePatient = useCallback(async (id: string) => {
    try {
      setError(null);
      await patientAPI.delete(id);
      setPatients(prev => prev.filter(patient => patient.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete patient';
      console.error('Failed to delete patient:', err);
      setError({
        message: errorMessage,
        operation: 'delete',
      });
      throw err;
    }
  }, []);

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
