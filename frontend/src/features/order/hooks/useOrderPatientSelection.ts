/**
 * useOrderPatientSelection
 *
 * Encapsulates patient selection for order create/edit: URL and initial patient,
 * search, filtered list, select/clear, and mode-based read-only behavior.
 */

import { useState } from 'react';
import { usePatientsList, usePatientSearch } from '@/hooks/queries';
import type { Patient } from '@/types';

export interface UseOrderPatientSelectionArgs {
  /** Preselected patient ID (from props or URL). */
  initialPatientId: string;
  /** When true, selection is read-only (edit mode). */
  patientReadOnly: boolean;
}

export interface UseOrderPatientSelectionReturn {
  selectedPatient: Patient | null;
  patientSearch: string;
  setPatientSearch: (value: string) => void;
  filteredPatients: Patient[];
  selectPatient: (patient: Patient) => void;
  clearPatient: () => void;
  patientReadOnly: boolean;
  isLoading: boolean;
}

export function useOrderPatientSelection({
  initialPatientId,
  patientReadOnly,
}: UseOrderPatientSelectionArgs): UseOrderPatientSelectionReturn {
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId);
  const [patientSearch, setPatientSearch] = useState('');

  const { patients, isLoading } = usePatientsList();
  const { results: filteredPatientsFromSearch } = usePatientSearch(patientSearch);

  const numericPatientId = selectedPatientId
    ? (typeof selectedPatientId === 'string' ? parseInt(selectedPatientId, 10) : selectedPatientId)
    : null;
  const selectedPatient = numericPatientId
    ? patients.find(p => p.id === numericPatientId) ?? null
    : null;

  const filteredPatients = patientSearch ? filteredPatientsFromSearch.slice(0, 5) : [];

  const selectPatient = (patient: Patient) => {
    if (!patientReadOnly) {
      setSelectedPatientId(patient.id.toString());
      setPatientSearch('');
    }
  };

  const clearPatient = () => {
    if (!patientReadOnly) {
      setSelectedPatientId('');
      setPatientSearch('');
    }
  };

  return {
    selectedPatient,
    patientSearch,
    setPatientSearch,
    filteredPatients,
    selectPatient,
    clearPatient,
    patientReadOnly,
    isLoading,
  };
}
