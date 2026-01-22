/**
 * PatientList - Migrated to use ListView component
 * 
 * Example migration showing how to use the new ListView component.
 * This demonstrates the pattern for migrating all list views.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks';
import { useOrders } from '../order/OrderContext';
import { useFiltering } from '@/utils/filtering';
import { ListView } from '@/shared/components';
import { Button } from '@/shared/ui';
import { PatientFilters } from './PatientFilters';
import { getPatientTableColumns } from './PatientTableColumns';
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
  const { patients, error, clearError, refreshPatients, loading } = usePatients();
  const { getOrdersByPatient } = useOrders();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [ageRange, setAgeRange] = React.useState<[number, number]>([0, 150]);
  
  // Use shared filtering hook
  const { 
    filteredItems: preFilteredPatients, 
    searchQuery, 
    setSearchQuery, 
    statusFilters: sexFilters, 
    setStatusFilters: setSexFilters 
  } = useFiltering<Patient, Gender>(patients, {
    searchFields: (patient) => [
      patient.fullName, 
      patient.id, 
      patient.phone, 
      patient.email || ''
    ],
    statusField: 'gender',
    defaultSort: { field: 'registrationDate', direction: 'desc' }
  });

  // Apply age filter
  const filteredPatients = useMemo(() => {
    const [minAge, maxAge] = ageRange;
    if (minAge === 0 && maxAge === 150) return preFilteredPatients;
    
    return preFilteredPatients.filter(patient => {
      const age = calculateAge(patient.dateOfBirth);
      return age >= minAge && age <= maxAge;
    });
  }, [preFilteredPatients, ageRange]);

  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => getPatientTableColumns(navigate, getOrdersByPatient),
    [navigate, getOrdersByPatient]
  );

  return (
    <>
      <ListView
        mode="table"
        items={filteredPatients}
        columns={columns}
        loading={loading}
        error={error}
        onRetry={refreshPatients}
        onDismissError={clearError}
        onRowClick={(patient: Patient) => navigate(`/patients/${patient.id}`)}
        title="Patients"
        headerActions={
          <Button
            variant="add"
            onClick={() => setIsCreateModalOpen(true)}
          >
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
