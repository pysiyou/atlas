/**
 * Patients Context, Provider, and Hook
 * Consolidates patient state management into a single module:
 * - PatientsContext: React Context for patient data
 * - PatientsProvider: Provider component managing patient operations
 * - usePatients: Hook to consume patient context
 */

import React, { type ReactNode, useCallback } from 'react';
import type { Patient } from '@/types';
import { STORAGE_KEYS, loadFromLocalStorage } from '@/utils';
import { useLocalStorage, useAuth } from '@/hooks';
import { createFeatureContext } from '@/shared/context/createFeatureContext';

// ============================================================================
// Context Type Definition
// ============================================================================

/**
 * PatientsContext type definition
 */
export interface PatientsContextType {
  patients: Patient[];
  addPatient: (patient: Patient) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  deletePatient: (id: string) => void;
  getPatient: (id: string) => Patient | undefined;
  searchPatients: (query: string) => Patient[];
  refreshPatients: () => void;
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
 * Manages patient data and operations
 */
export const PatientsProvider: React.FC<PatientsProviderProps> = ({ children }) => {
  const [patients, setPatients] = useLocalStorage<Patient[]>(STORAGE_KEYS.PATIENTS, []);
  const { currentUser } = useAuth();

  /**
   * Add a new patient
   */
  const addPatient = useCallback((patient: Patient) => {
    const now = new Date().toISOString();
    const patientWithTimestamps: Patient = {
      ...patient,
      registrationDate: patient.registrationDate || now,
      createdAt: now,
      createdBy: currentUser?.username || 'system',
      updatedAt: now,
      updatedBy: currentUser?.username || 'system',
    };
    setPatients(prev => [...prev, patientWithTimestamps]);
  }, [setPatients, currentUser]);

  /**
   * Update an existing patient
   */
  const updatePatient = useCallback((id: string, updates: Partial<Patient>) => {
    const now = new Date().toISOString();
    const updatesWithTimestamps = {
      ...updates,
      updatedAt: now,
      updatedBy: currentUser?.username || 'system',
    };
    setPatients(prev =>
      prev.map(patient =>
        patient.id === id ? { ...patient, ...updatesWithTimestamps } : patient
      )
    );
  }, [setPatients, currentUser]);

  /**
   * Delete a patient
   */
  const deletePatient = useCallback((id: string) => {
    setPatients(prev => prev.filter(patient => patient.id !== id));
  }, [setPatients]);

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

  /**
   * Refresh patients from localStorage (useful after external updates)
   */
  const refreshPatients = useCallback(() => {
    // Force a re-read from localStorage
    const refreshedData = loadFromLocalStorage<Patient[]>(STORAGE_KEYS.PATIENTS, []);
    setPatients(refreshedData);
  }, [setPatients]);

  const value: PatientsContextType = {
    patients,
    addPatient,
    updatePatient,
    deletePatient,
    getPatient,
    searchPatients,
    refreshPatients,
  };

  return <PatientsContext.Provider value={value}>{children}</PatientsContext.Provider>;
};
