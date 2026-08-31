/**
 * PatientList - Uses ListView component with PatientContext superset type.
 *
 * PatientContext = Patient + pre-computed order statistics (orderCount, lastOrderDate, etc.)
 * Built by usePatientContextList — no inline Order[] joins needed here.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientContextList } from '@/features/patients/api/usePatientContext';
import { useFiltering } from '@/hooks/useFiltering';
import { ListView } from '@/components';
import { Button } from '@/components';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components';
import { useModal } from '@/lib/context/ModalContext';
import { PatientFilters, type AffiliationStatus } from '../components/PatientFilters';
import { createPatientTableConfig } from './PatientTableConfig';
import { calculateAge } from '@/utils';
import type { PatientContext, Gender } from '@/types';
import { EditPatientModal } from '../components/EditPatientModal';
import { isAffiliationActive } from '../utils/patient-helpers';

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  useModal(); // openModal reserved for future use
  const { patients, isLoading, isError, refetch } = usePatientContextList();

  // Format error for ErrorAlert component
  const error = isError
    ? {
        message: 'Failed to load patients',
        operation: 'load' as const,
      }
    : null;

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [ageRange, setAgeRange] = React.useState<[number, number]>([0, 150]);
  const [affiliationStatusFilters, setAffiliationStatusFilters] = React.useState<
    AffiliationStatus[]
  >([]);

  // Use shared filtering hook — PatientContext extends Patient so all fields are available
  const {
    filteredItems: preFilteredPatients,
    searchQuery,
    setSearchQuery,
    statusFilters: sexFilters,
    setStatusFilters: setSexFilters,
  } = useFiltering<PatientContext, Gender>(patients, {
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
    if (minAge !== 0 || maxAge !== 150) {
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

  // Memoize table config — PatientContext has pre-computed order stats, no callback needed
  const patientTableConfig = useMemo(
    () => createPatientTableConfig(navigate),
    [navigate]
  );

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
        onRowClick={(patient: PatientContext) => navigate(`/patients/${patient.id}`)}
        title="Patients"
        headerActions={
          <Button variant="add" size="sm" onClick={() => setIsCreateModalOpen(true)}>
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
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL}
      />

      <EditPatientModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          refetch();
          setIsCreateModalOpen(false);
        }}
        mode="create"
      />
    </>
  );
};
