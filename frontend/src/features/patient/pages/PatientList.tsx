/**
 * PatientList - Migrated to use ListView component
 *
 * Example migration showing how to use the new ListView component.
 * This demonstrates the pattern for migrating all list views.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatientsList, useOrdersList } from '@/hooks/queries';
import type { Order } from '@/types';
import { ListView } from '@/shared/components';
import { Button } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { FilterBar, useFilteredData, type FilterValues } from '@/utils/filters';
import { patientFilterConfig } from '../config/patientFilterConfig';
import { createPatientTableConfig } from './PatientTableConfig';
import { calculateAge } from '@/utils';
import type { Patient } from '@/types';
import { EditPatientModal } from '../modals/EditPatientModal';
import { isAffiliationActive } from '../utils/patientUtils';
import { AGE_RANGE_MIN, AGE_RANGE_MAX } from '../constants';

type AffiliationStatus = 'active' | 'inactive';

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
  const { openModal } = useModal();
  const { patients, isLoading, isError, error: queryError, refetch } = usePatientsList();
  const { orders } = useOrdersList();

  // Format error for ErrorAlert component
  const error = isError
    ? {
        message: queryError instanceof Error ? queryError.message : 'Failed to load patients',
        operation: 'load' as const,
      }
    : null;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Centralized filter state management
  const [filters, setFilters] = useState<FilterValues>({
    searchQuery: '',
    ageRange: [AGE_RANGE_MIN, AGE_RANGE_MAX],
    gender: [],
    affiliationStatus: [],
  });

  // Apply filters using centralized hook with custom filters
  const filteredPatients = useFilteredData<Patient>({
    items: patients,
    filterValues: filters,
    filterConfig: patientFilterConfig,
    customSearchFields: patient => [
      patient.fullName,
      patient.id.toString(),
      patient.phone,
      patient.email || '',
    ],
    customAgeCalculator: patient => calculateAge(patient.dateOfBirth),
    customFilters: {
      affiliationStatus: (patient, value) => {
        const statusFilters = (value as AffiliationStatus[]) || [];
        if (statusFilters.length === 0) return true;

        const isActive = isAffiliationActive(patient.affiliation);
        const hasInactive = !patient.affiliation || !isActive;

        if (statusFilters.includes('active') && statusFilters.includes('inactive')) {
          return true; // Show all
        }
        if (statusFilters.includes('active')) {
          return isActive;
        }
        if (statusFilters.includes('inactive')) {
          return hasInactive;
        }
        return true;
      },
    },
  });

  // Memoize table config to prevent recreation on every render
  const patientTableConfig = useMemo(() => {
    // Helper function to get orders by patient (for table config)
    const getOrdersByPatient = (patientId: number | string): Order[] => {
      const numericId = typeof patientId === 'string' ? parseInt(patientId, 10) : patientId;
      return orders.filter(o => o.patientId === numericId);
    };
    const openNewOrderModal = (patientId?: string) => openModal(ModalType.NEW_ORDER, { patientId });
    return createPatientTableConfig(navigate, getOrdersByPatient, openNewOrderModal);
  }, [navigate, orders, openModal]);

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
        filters={<FilterBar config={patientFilterConfig} value={filters} onChange={setFilters} />}
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
