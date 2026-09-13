/**
 * PatientList - Uses ListView with server-side pagination.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedPatientContextList } from '../api/patients.api';
import { useFiltering } from '@/hooks/useFiltering';
import { ListView, Pagination } from '@/components';
import { Button } from '@/components';
import { useModal } from '@/lib/context/ModalContext';
import { PatientFilters, type AffiliationStatus } from '../components/PatientFilters';
import { createPatientTableConfig } from '../config/PatientTable.config';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { calculateAge } from '@/utils';
import type { PatientContext, Gender } from '@/types';
import { EditPatientModal } from '../components/EditPatientModal';
import { isAffiliationActive } from '../utils/patientHelpers';

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  useModal();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 150]);
  const [affiliationStatusFilters, setAffiliationStatusFilters] = useState<AffiliationStatus[]>(
    []
  );

  const {
    patients,
    pagination,
    page,
    goToPage,
    resetPage,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = usePaginatedPatientContextList(searchQuery.trim() || undefined);

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      resetPage();
    },
    [resetPage]
  );

  const error = isError
    ? { message: 'Failed to load patients', operation: 'load' as const }
    : null;

  const {
    filteredItems: preFilteredPatients,
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

  const filteredPatients = useMemo(() => {
    let filtered = preFilteredPatients;

    const [minAge, maxAge] = ageRange;
    if (minAge !== 0 || maxAge !== 150) {
      filtered = filtered.filter(patient => {
        const age = calculateAge(patient.dateOfBirth);
        return age >= minAge && age <= maxAge;
      });
    }

    if (affiliationStatusFilters.length > 0) {
      filtered = filtered.filter(patient => {
        const isActive = isAffiliationActive(patient.affiliation);
        const hasInactive = !patient.affiliation || !isActive;

        if (
          affiliationStatusFilters.includes('active') &&
          affiliationStatusFilters.includes('inactive')
        ) {
          return true;
        }
        if (affiliationStatusFilters.includes('active')) return isActive;
        if (affiliationStatusFilters.includes('inactive')) return hasInactive;
        return true;
      });
    }

    return filtered;
  }, [preFilteredPatients, ageRange, affiliationStatusFilters]);

  const patientTableConfig = useMemo(
    () => createPatientTableConfig(navigate),
    [navigate]
  );

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <ListView
          mode="table"
          items={filteredPatients}
          viewConfig={patientTableConfig}
          loading={isLoading || isFetching}
          error={error}
          onRetry={refetch}
          onDismissError={() => undefined}
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
              onSearchChange={handleSearchChange}
              sexFilters={sexFilters}
              onSexFiltersChange={setSexFilters}
              ageRange={ageRange}
              onAgeRangeChange={setAgeRange}
              affiliationStatusFilters={affiliationStatusFilters}
              onAffiliationStatusFiltersChange={setAffiliationStatusFilters}
            />
          }
          pagination={false}
        />
        <Pagination
          currentPage={page}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={goToPage}
          onPageSizeChange={() => undefined}
          pageSizeOptions={[DEFAULT_LIST_PAGE_SIZE]}
        />
      </div>

      <EditPatientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />
    </>
  );
};
