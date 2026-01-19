/**
 * PatientList Component
 * Displays a filterable and sortable list of patients with actions
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks';
import { useOrders } from '../order/OrderContext';
import { useFiltering } from '@/utils/filtering';
import { Table, Button, Badge, Avatar, TableActionMenu, TableActionItem, EmptyState } from '@/shared/ui';
import { Plus, Eye, Edit, FileText } from 'lucide-react';
import { PatientFilters } from './PatientFilters';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient, Gender, Order } from '@/types';
import { EditPatientModal } from './EditPatientModal';
import { isAffiliationActive } from './usePatientForm';
import { ErrorAlert } from '@/shared/components/ErrorAlert';

/**
 * Generate table column definitions for patient list
 * @param navigate - React Router navigate function
 * @param getOrdersByPatient - Function to get orders for a specific patient
 * @returns Array of column definitions
 */
const getPatientTableColumns = (
  navigate: ReturnType<typeof useNavigate>,
  getOrdersByPatient: (patientId: string) => Order[]
) => [
  {
    key: 'id',
    header: 'Patient ID',
    width: '12%',
    sortable: true,
    render: (patient: Patient) => (
      <span className="text-xs text-sky-600 font-medium font-mono truncate block">{patient.id}</span>
    ),
  },
  {
    key: 'fullName',
    header: 'Name',
    width: '18%',
    sortable: true,
    render: (patient: Patient) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar name={patient.fullName} size="sm" className="shrink-0" />
        <div className="font-medium text-gray-900 truncate">{patient.fullName}</div>
      </div>
    ),
  },
  {
    key: 'dateOfBirth',
    header: 'Age',
    width: '8%',
    sortable: true,
    render: (patient: Patient) => (
      <div className="text-xs text-gray-500 truncate">{calculateAge(patient.dateOfBirth)} years old</div>
    ),
  },
  {
    key: 'gender',
    header: 'Gender',
    width: '8%',
    sortable: true,
    render: (patient: Patient) => (
      <Badge
        variant={
          patient.gender === 'male' ? 'primary' : patient.gender === 'female' ? 'pink' : 'default'
        }
        size="sm"
      >
        {patient.gender.toUpperCase()}
      </Badge>
    ),
  },
  {
    key: 'tests',
    header: 'Tests',
    width: '10%',
    render: (patient: Patient) => {
      const patientOrders = getOrdersByPatient(patient.id);
      const testCount = patientOrders.reduce((acc, order) => acc + (order.tests?.length || 0), 0);
      
      return (
        <div className="min-w-0">
          <div className="font-medium truncate">{testCount} test{testCount !== 1 ? 's' : ''}</div>
          <div className="text-xs text-gray-500 truncate">
            {patientOrders.length} order{patientOrders.length !== 1 ? 's' : ''}
          </div>
        </div>
      );
    },
  },
  {
    key: 'contact',
    header: 'Contact',
    width: '15%',
    render: (patient: Patient) => (
      <div className="text-xs min-w-0">
        <div className="truncate">{formatPhoneNumber(patient.phone)}</div>
        {patient.email && <div className="text-xs text-gray-500 truncate">{patient.email}</div>}
      </div>
    ),
  },
  {
    key: 'affiliation',
    header: 'Affiliation',
    width: '14%',
    sortable: true,
    render: (patient: Patient) => {
      if (!patient.affiliation) {
        return <span className="text-xs text-gray-500 truncate block">No Affiliation</span>;
      }
      const isActive = isAffiliationActive(patient.affiliation);
      return (
        <div className="flex items-center gap-2 min-w-0">
          {/* {isActive && (
            <Icon 
              name="verified" 
              className="w-4 h-4 text-blue-500" 
              aria-label="Verified affiliation"
            />
          )} */}
          <span className="text-xs text-gray-500 truncate">
            {isActive ? 'Expires' : 'Expired'}: {formatDate(patient.affiliation.endDate)}
          </span>
        </div>
      );
    },
  },
  {
    key: 'registrationDate',
    header: 'Registered',
    width: '11%',
    sortable: true,
    render: (patient: Patient) => (
      <div className="text-xs text-gray-500 truncate">{formatDate(patient.registrationDate)}</div>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: '4%',
    className: 'overflow-visible !px-1',
    headerClassName: '!px-1',
    render: (patient: Patient) => (
      <TableActionMenu>
        <TableActionItem
          label="View Details"
          icon={<Eye size={16} />}
          onClick={() => navigate(`/patients/${patient.id}`)}
        />
        <TableActionItem
          label="Edit Patient"
          icon={<Edit size={16} />}
          onClick={() => navigate(`/patients/${patient.id}/edit`)}
        />
        <TableActionItem
          label="Create Order"
          icon={<FileText size={16} />}
          onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
        />
      </TableActionMenu>
    ),
  },
];

export const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const { patients, error, clearError, refreshPatients, loading } = usePatients();
  const { getOrdersByPatient } = useOrders();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 150]);
  
  // Use shared filtering hook for search and gender filters
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

  // Apply age filter separately (custom logic not in generic hook)
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

  // Show loading state
  if (loading && patients.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <p className="mt-2 text-gray-600">Loading patients...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patients</h1>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          New Patient
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={clearError}
          onRetry={refreshPatients}
          className="shrink-0"
        />
      )}

      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 overflow-hidden min-h-0 text-xs">
        <PatientFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          ageRange={ageRange}
          onAgeRangeChange={setAgeRange}
          sexFilters={sexFilters}
          onSexFiltersChange={setSexFilters}
        />

        <div className="flex-1 min-h-0">
          <Table
            data={filteredPatients}
            columns={columns}
            emptyMessage={
              <EmptyState
                icon="users-group"
                title="No Patients Found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            }
            pagination={true}
            initialPageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            onRowClick={(patient: Patient) => navigate(`/patients/${patient.id}`)}
            embedded={true}
          />
        </div>
      </div>

      <EditPatientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        mode="create"
      />
    </div>
  );
};
