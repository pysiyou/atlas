/**
 * PatientList - Uses ListView with server-side pagination and URL filter support.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePaginatedPatientContextList } from '../api/patients';
import { useClientListFilter } from '@/hooks/useClientListFilter';
import { usePageFilters } from '@/hooks/usePageFilters';
import { PATIENT_URL_FILTER_KEYS } from '../config/patientFilters.config';
import { UrlFilterBadges } from '@/components';
import { actionButtonPreset, ListView } from '@/components';
import { Button } from '@/components';
import { useModal } from '@/lib/context/ModalContext';
import { PatientFilters, type AffiliationStatus } from '../components/PatientFilters';
import { createPatientTableConfig } from '../config/PatientTable.config';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { errorAlertMessage } from '@/utils/feedback';
import { calculateAge } from '@/utils';
import { buildRangeHistogram } from '@/utils/rangeHistogram';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';
import type { PatientContext, Gender } from '@/types';
import { EditPatientModal } from '../components/EditPatientModal';
import { isAffiliationActive } from '../utils/patientHelpers';

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  useModal();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // URL-synced entity filters + local UI filters
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
      ageRange: [AGE_RANGE_MIN, AGE_RANGE_MAX] as [number, number],
      affiliationStatus: [] as AffiliationStatus[],
    },
  });

  const searchQuery = (filters.search as string) ?? '';
  const ageRange = useMemo(() => (filters.ageRange as [number, number]) ?? [AGE_RANGE_MIN, AGE_RANGE_MAX], [filters.ageRange]);
  const affiliationStatusFilters = useMemo(() => (filters.affiliationStatus as AffiliationStatus[]) ?? [], [filters.affiliationStatus]);

  const {
    patients,
    pagination,
    page,
    goToPage,
    resetPage,
    isLoading,
    isFetching,
    isError,
    error: patientsError,
    refetch,
  } = usePaginatedPatientContextList(searchQuery.trim() || undefined);

  const handleSearchChange = useCallback(
    (query: string) => {
      setFilter('search', query);
      resetPage();
    },
    [setFilter, resetPage]
  );

  const error = isError
    ? { message: errorAlertMessage('patients.list.loadFailed', patientsError), operation: 'load' as const }
    : null;

  // Apply URL filter for patientId
  const urlFilteredPatients = useMemo(() => {
    if (!urlFilters.patientId) return patients;
    const patientId = Number(urlFilters.patientId);
    return patients.filter(p => p.id === patientId);
  }, [patients, urlFilters.patientId]);

  const {
    filteredItems: preFilteredPatients,
    statusFilters: sexFilters,
    setStatusFilters: setSexFilters,
  } = useClientListFilter<PatientContext, Gender>(urlFilteredPatients, {
    searchFields: patient => [
      patient.fullName,
      patient.id.toString(),
      patient.phone,
      patient.email || '',
    ],
    statusField: 'gender',
    defaultSort: undefined,
  });

  const ageHistogram = useMemo(
    () =>
      buildRangeHistogram(
        preFilteredPatients
          .map(patient => calculateAge(patient.dateOfBirth))
          .filter(age => Number.isFinite(age)),
        AGE_RANGE_MIN,
        AGE_RANGE_MAX
      ),
    [preFilteredPatients]
  );

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
          items={filteredPatients}
          viewConfig={patientTableConfig}
          loading={isLoading || isFetching}
          error={error}
          onRetry={refetch}
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
              {urlFilters && Object.keys(urlFilters).length > 0 && (
                <UrlFilterBadges
                  urlFilters={urlFilters}
                  onClear={clearUrlFilters}
                  onClearSingle={(key) => {
                    const urlKey = PATIENT_URL_FILTER_KEYS.find(k => k === key);
                    if (urlKey) setUrlFilter(urlKey, undefined);
                  }}
                />
              )}
              <PatientFilters
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                sexFilters={sexFilters}
                onSexFiltersChange={setSexFilters}
                ageRange={ageRange}
                onAgeRangeChange={(value) => setFilter('ageRange', value)}
                affiliationStatusFilters={affiliationStatusFilters}
                onAffiliationStatusFiltersChange={(value) => setFilter('affiliationStatus', value)}
                ageHistogram={ageHistogram}
              />
            </>
          }
          pagination={{
            mode: 'server',
            currentPage: page,
            pageSize: pagination.pageSize,
            totalItems: pagination.total,
            onPageChange: goToPage,
            pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
          }}
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
