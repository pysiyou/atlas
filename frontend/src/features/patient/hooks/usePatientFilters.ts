/**
 * usePatientFilters Hook
 * 
 * Manages patient filter state and filtering logic
 */

import { useState, useMemo } from 'react';
import { useFiltering } from '@/utils/filtering';
import { calculateAge } from '@/utils';
import { usePatientService } from '../services/usePatientService';
import type { Patient, Gender } from '@/types';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import type { AffiliationStatus } from '../components/PatientFilters';

interface UsePatientFiltersOptions {
  patients: Patient[];
}

/**
 * Hook for managing patient filters
 */
export function usePatientFilters({ patients }: UsePatientFiltersOptions) {
  const { isAffiliationActive } = usePatientService();
  const [ageRange, setAgeRange] = useState<[number, number]>([AGE_RANGE_MIN, AGE_RANGE_MAX]);
  const [affiliationStatusFilters, setAffiliationStatusFilters] = useState<AffiliationStatus[]>([]);

  // Use shared filtering hook for search and gender
  const {
    filteredItems: preFilteredPatients,
    searchQuery,
    setSearchQuery,
    statusFilters: sexFilters,
    setStatusFilters: setSexFilters,
  } = useFiltering<Patient, Gender>(patients, {
    searchFields: patient => [
      patient.fullName,
      patient.id.toString(),
      patient.phone,
      patient.email || '',
    ],
    statusField: 'gender',
    defaultSort: { field: 'registrationDate', direction: 'desc' },
  });

  // Apply age and affiliation status filters
  const filteredPatients = useMemo(() => {
    let filtered = preFilteredPatients;

    // Apply age filter
    const [minAge, maxAge] = ageRange;
    if (minAge !== AGE_RANGE_MIN || maxAge !== AGE_RANGE_MAX) {
      filtered = filtered.filter(patient => {
        const age = calculateAge(patient.dateOfBirth);
        return age >= minAge && age <= maxAge;
      });
    }

    // Apply affiliation status filter
    if (affiliationStatusFilters.length > 0) {
      filtered = filtered.filter(patient => {
        const isActive = isAffiliationActive(patient.affiliation);
        const hasInactive = !patient.affiliation || !isActive;

        if (
          affiliationStatusFilters.includes('active') &&
          affiliationStatusFilters.includes('inactive')
        ) {
          return true; // Show all
        }
        if (affiliationStatusFilters.includes('active')) {
          return isActive;
        }
        if (affiliationStatusFilters.includes('inactive')) {
          return hasInactive;
        }
        return true;
      });
    }

    return filtered;
  }, [preFilteredPatients, ageRange, affiliationStatusFilters]);

  return {
    // Filtered results
    filteredPatients,
    
    // Search
    searchQuery,
    setSearchQuery,
    
    // Age range
    ageRange,
    setAgeRange,
    
    // Gender/Sex filters
    sexFilters,
    setSexFilters,
    
    // Affiliation status filters
    affiliationStatusFilters,
    setAffiliationStatusFilters,
  };
}
