/**
 * PatientList - Migrated to use ListView component
 *
 * Example migration showing how to use the new ListView component.
 * This demonstrates the pattern for migrating all list views.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientsList, useOrdersList } from '@/hooks/queries';
import type { Order } from '@/types';
import { useFiltering } from '@/utils/filtering';
import { ListView } from '@/shared/components';
import { Button } from '@/shared/ui';
import { PatientFilters, type AffiliationStatus } from './PatientFilters';
import { createPatientTableConfig } from './PatientTableConfig';
import { calculateAge } from '@/utils';
import type { Patient, Gender } from '@/types';
import { EditPatientModal } from './EditPatientModal';

/**
 * PatientList component - Migrated to use ListView
 *
 * This is an example migration showing how to use the new ListView component.
 * Benefits:
 * - Reduced code by ~100 lines
 * - Consistent UX with other list views
 * - Built-in loading/error/empty states
 * - Easy to add grid view in the future
 */
export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const { patients, isLoading, isError, error: queryError, refetch } = usePatientsList();
  const { orders } = useOrdersList();

  // Format error for ErrorAlert component
  const error = isError
    ? {
        message: queryError instanceof Error ? queryError.message : 'Failed to load patients',
        operation: 'load' as const,
      }
    : null;

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [ageRange, setAgeRange] = React.useState<[number, number]>([0, 150]);
  const [affiliationStatusFilters, setAffiliationStatusFilters] = React.useState<
    AffiliationStatus[]
  >([]);

  // Use shared filtering hook
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

  /**
   * Check if a patient's affiliation is active
   */
  const isAffiliationActive = (patient: Patient): boolean => {
    if (!patient.affiliation) return false;

    const now = new Date();
    const startDate = new Date(patient.affiliation.startDate);
    const endDate = new Date(patient.affiliation.endDate);

    return now >= startDate && now <= endDate;
  };

  // Apply age and affiliation status filters
  const filteredPatients = useMemo(() => {
    let filtered = preFilteredPatients;

    // Apply age filter
    const [minAge, maxAge] = ageRange;
    if (minAge !== 0 || maxAge !== 150) {
      filtered = filtered.filter(patient => {
        const age = calculateAge(patient.dateOfBirth);
        return age >= minAge && age <= maxAge;
      });
    }

    // Apply affiliation status filter
    if (affiliationStatusFilters.length > 0) {
      filtered = filtered.filter(patient => {
        const isActive = isAffiliationActive(patient);
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

  // Memoize table config to prevent recreation on every render
  const patientTableConfig = useMemo(() => {
    // Helper function to get orders by patient (for table config)
    const getOrdersByPatient = (patientId: number | string): Order[] => {
      const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
      return orders.filter(o => o.patientId === numericId);
    };
    return createPatientTableConfig(navigate, getOrdersByPatient);
  }, [navigate, orders]);

  return (
    <>
      <ListView
        mode="table"
        items={filteredPatients}
        viewConfig={patientTableConfig}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        onDismissError={() => {}}
        onRowClick={(patient: Patient) => navigate(`/patients/${patient.id}`)}
        title="Patients"
        headerActions={
          <Button variant="add" onClick={() => setIsCreateModalOpen(true)}>
            New Patient
          </Button>
        }
        filters={
          <PatientFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            ageRange={ageRange}
            onAgeRangeChange={setAgeRange}
            sexFilters={sexFilters}
            onSexFiltersChange={setSexFilters}
            affiliationStatusFilters={affiliationStatusFilters}
            onAffiliationStatusFiltersChange={setAffiliationStatusFilters}
          />
        }
        pagination={true}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
      />

      <EditPatientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />
    </>
  );
};
