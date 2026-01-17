/**
 * Patients Context, Provider, and Hook
 * Consolidates patient state management using backend API
 */

import React, { type ReactNode, useCallback, useState, useEffect } from 'react';
import type { Patient } from '@/types';
import { createFeatureContext } from '@/shared/context/createFeatureContext';
import { patientAPI } from '@/services/api/patients';

// ============================================================================
// Context Type Definition
// ============================================================================

/**
 * PatientsContext type definition
 */
export interface PatientsContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => Promise<void>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: string) => Promise<void>;
  getPatient: (id: string) => Patient | undefined;
  searchPatients: (query: string) => Patient[];
  refreshPatients: () => Promise<void>;
  loading: boolean;
}

// ============================================================================
// Context Creation
// ============================================================================

/**
 * React Context for Patients using generic factory
 */
export const { Context: PatientsContext, useFeature: usePatients } = 
  createFeatureContext<PatientsContextType>('Patients');

// ============================================================================
// Provider Component
// ============================================================================

interface PatientsProviderProps {
  children: ReactNode;
}

/**
 * Patients Provider Component
 * Manages patient data using backend API
 */
export const PatientsProvider: React.FC<PatientsProviderProps> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);

  /**
   * Refresh patients from backend
   */
  const refreshPatients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await patientAPI.getAll();
      setPatients(data);
    } catch (error) {
      console.error('Failed to load patients:', error);
      // Don't throw error - just log it and keep empty array
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
      const created = await patientAPI.create(patient);
      setPatients(prev => [...prev, created]);
      // Refresh to ensure full data consistency with server
      await refreshPatients();
    } catch (error) {
      console.error('Failed to create patient:', error);
      throw error;
    }
  }, [refreshPatients]);

  /**
   * Update an existing patient
   */
  const updatePatient = useCallback(async (id: string, updates: Partial<Patient>) => {
    try {
      const updated = await patientAPI.update(id, updates);
      setPatients(prev =>
        prev.map(patient =>
          patient.id === id ? updated : patient
        )
      );
      // Refresh to ensure full data consistency with server
      await refreshPatients();
    } catch (error) {
      console.error('Failed to update patient:', error);
      throw error;
    }
  }, [refreshPatients]);

  /**
   * Delete a patient
   */
  const deletePatient = useCallback(async (id: string) => {
    try {
      await patientAPI.delete(id);
      setPatients(prev => prev.filter(patient => patient.id !== id));
    } catch (error) {
      console.error('Failed to delete patient:', error);
      throw error;
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
  };

  return <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>;
};

