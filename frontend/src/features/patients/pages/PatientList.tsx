/**
 * PatientList — server-paginated patients with URL entity filters.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedPatientContextList } from '../api/patients';
import { usePageFilters } from '@/hooks/usePageFilters';
import { PATIENT_URL_FILTER_KEYS } from '../config/patientFilters.config';
import { UrlFilterChipBar } from '@/components/filters';
import { actionButtonPreset } from '@/components/primitives';
import { ListView } from '@/components/surfaces';
import { Button } from '@/components/primitives';
import { PatientFilters } from '../components/PatientFilters';
import { createPatientTableConfig } from '../config/PatientTable.config';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { useServerListChrome } from '@/hooks';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import type { PatientContext, Gender } from '@/types';
import { EditPatientModal } from '../components/EditPatientModal';

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {
    filters,
    urlFilters,
    setFilter,
    clearUrlFilters,
    setUrlFilter,
  } = usePageFilters({
    urlFilterKeys: PATIENT_URL_FILTER_KEYS,
    initialFilters: {
      search: '',
      sex: [] as Gender[],
      ageRange: [AGE_RANGE_MIN, AGE_RANGE_MAX] as [number, number],
    },
  });

  const searchQuery = (filters.search as string) ?? '';
  const ageRange = useMemo(
    () => (filters.ageRange as [number, number]) ?? [AGE_RANGE_MIN, AGE_RANGE_MAX],
    [filters.ageRange]
  );
  const sexFilters = useMemo(() => (filters.sex as Gender[]) ?? [], [filters.sex]);

  const serverFilters = useMemo(() => {
    const [minAge, maxAge] = ageRange;
    const hasCustomAge = minAge !== AGE_RANGE_MIN || maxAge !== AGE_RANGE_MAX;
    return {
      search: searchQuery.trim() || undefined,
      patientId: urlFilters.patientId,
      gender: sexFilters.length > 0 ? sexFilters : undefined,
      ageMin: hasCustomAge ? minAge : undefined,
      ageMax: hasCustomAge ? maxAge : undefined,
    };
  }, [searchQuery, urlFilters.patientId, sexFilters, ageRange]);

  const {
    patients,
    pagination,
    page,
    goToPage,
    resetPage,
    isLoading,
    isError,
    error: patientsError,
    refetch,
  } = usePaginatedPatientContextList(serverFilters);

  const { loading, error, listPagination, setFilterAndReset, onRetry } = useServerListChrome({
    setFilter,
    resetPage,
    loadFailedKey: 'patients.list.loadFailed',
    isLoading,
    isError,
    error: patientsError,
    refetch,
    page,
    pagination,
    goToPage,
    pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
  });

  const handleSearchChange = useCallback(
    (query: string) => {
      setFilterAndReset('search', query);
    },
    [setFilterAndReset],
  );

  const patientTableConfig = useMemo(() => createPatientTableConfig(navigate), [navigate]);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <ListView
          items={patients}
          viewConfig={patientTableConfig}
          loading={loading}
          error={error}
          onRetry={onRetry}
          onDismissError={() => undefined}
          onRowClick={(patient: PatientContext) => navigate(`/patients/${patient.id}`)}
          title="Patients"
          headerActions={
            <Button {...actionButtonPreset('add')} size="sm" onClick={() => setIsCreateModalOpen(true)}>
              New Patient
            </Button>
          }
          filters={
            <>
              <UrlFilterChipBar
                urlFilters={urlFilters}
                urlFilterKeys={PATIENT_URL_FILTER_KEYS}
                onClear={clearUrlFilters}
                onClearSingle={key => setUrlFilter(key, undefined)}
              />
              <PatientFilters
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sexFilters={sexFilters}
                onSexFiltersChange={values => setFilterAndReset('sex', values)}
                ageRange={ageRange}
                onAgeRangeChange={value => setFilterAndReset('ageRange', value)}
              />
            </>
          }
          pagination={listPagination}
          defaultSort={{ key: 'registrationDate', direction: 'desc' }}
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
