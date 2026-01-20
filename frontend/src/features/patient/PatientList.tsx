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
import { Button, Badge, Avatar, TableActionMenu, TableActionItem } from '@/shared/ui';
import { Plus, Eye, Edit, FileText } from 'lucide-react';
import { PatientFilters } from './PatientFilters';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient, Gender, Order } from '@/types';
import { EditPatientModal } from './EditPatientModal';
import { isAffiliationActive } from './usePatientForm';
import type { Column } from '@/shared/ui/Table';

/**
 * Generate table column definitions for patient list
 */
const getPatientTableColumns = (
  navigate: ReturnType<typeof useNavigate>,
  getOrdersByPatient: (patientId: string) => Order[]
): Column<Patient>[] => [
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

  // Memoize columns
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
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
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
