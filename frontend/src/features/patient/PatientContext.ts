/**
 * Patients Context Definition
 * Separate file for context to support Fast Refresh
 */

import { createContext, useContext } from 'react';
import type { Patient } from '@/types';

/**
 * Error state for patient operations
 */
export interface PatientError {
  message: string;
  code?: string;
  operation?: 'load' | 'create' | 'update' | 'delete' | 'search';
}

/**
 * PatientsContext type definition
 */
export interface PatientsContextType {
  /** List of all patients */
  patients: Patient[];
  /** Loading state for async operations */
  loading: boolean;
  /** Error state for failed operations */
  error: PatientError | null;
  /** Add a new patient */
  addPatient: (patient: Patient) => Promise<void>;
  /** Update an existing patient */
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<void>;
  /** Delete a patient */
  deletePatient: (id: string) => Promise<void>;
  /** Get a patient by ID */
  getPatient: (id: string) => Patient | undefined;
  /** Search patients by name, ID, or phone */
  searchPatients: (query: string) => Patient[];
  /** Refresh patients from backend */
  refreshPatients: () => Promise<void>;
  /** Clear any error state */
  clearError: () => void;
}

/**
 * React Context for Patients
 */
export const PatientsContext = createContext<PatientsContextType | undefined>(undefined);

/**
 * Hook to access the Patients context
 * @throws Error if used outside of PatientsProvider
 */
export function usePatients(): PatientsContextType {
  const context = useContext(PatientsContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  return context;
}
