
/**
 * PatientList Component
 * Displays a filterable and sortable list of patients with actions
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '@/hooks';
import { useOrders } from '../order/OrderContext';
import { useFiltering } from '@/hooks/useFiltering';
import { Table, Button, Badge, Avatar, TableActionMenu, TableActionItem } from '@/shared/ui';
import { Plus, Eye, Edit, FileText } from 'lucide-react';
import { PatientFilters } from './PatientFilters';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient, Gender } from '@/types';
import { EditPatientModal } from './EditPatientModal';
import { isAffiliationActive } from './usePatientForm';

/**
 * Generate table column definitions for patient list
 * @param navigate - React Router navigate function
 * @param getOrdersByPatient - Function to get orders for a specific patient
 * @returns Array of column definitions
 */
const getPatientTableColumns = (
  navigate: ReturnType<typeof useNavigate>,
  getOrdersByPatient: (patientId: string) => any[]
) => [
  {
    key: 'id',
    header: 'Patient ID',
    sortable: true,
    render: (patient: Patient) => (
      <span className="text-xs text-sky-600 font-mono">{patient.id}</span>
    ),
  },
  {
    key: 'fullName',
    header: 'Name',
    sortable: true,
    render: (patient: Patient) => (
      <div className="flex items-center gap-3">
        <Avatar name={patient.fullName} size="sm" />
        <div className="font-medium text-gray-900">{patient.fullName}</div>
      </div>
    ),
  },
  {
    key: 'dateOfBirth',
    header: 'Age',
    width: 100,
    sortable: true,
    render: (patient: Patient) => (
      <div className="text-xs text-gray-500">{calculateAge(patient.dateOfBirth)} years old</div>
    ),
  },
  {
    key: 'gender',
    header: 'gender',
    width: 100,
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
    width: 100,
    render: (patient: Patient) => {
      const patientOrders = getOrdersByPatient(patient.id);
      const testCount = patientOrders.reduce((acc, order) => acc + (order.tests?.length || 0), 0);
      
      return (
        <span className="text-xs text-gray-500">
          {testCount} {testCount === 1 ? 'Test' : 'Tests'}
        </span>
      );
    },
  },
  {
    key: 'contact',
    header: 'Contact',
    render: (patient: Patient) => (
      <div className="text-xs">
        <div>{formatPhoneNumber(patient.phone)}</div>
        {patient.email && <div className="text-xs text-gray-500">{patient.email}</div>}
      </div>
    ),
  },
  {
    key: 'affiliation',
    header: 'Affiliation',
    sortable: true,
    render: (patient: Patient) => {
      if (!patient.affiliation) {
        return <span className="text-xs text-gray-500">No Affiliation</span>;
      }
      const isActive = isAffiliationActive(patient.affiliation);
      return (
        <div className="flex items-center gap-2">
          {/* {isActive && (
            <Icon 
              name="verified" 
              className="w-4 h-4 text-blue-500" 
              aria-label="Verified affiliation"
            />
          )} */}
          <span className="text-xs text-gray-500">
            {isActive ? 'Expires' : 'Expired'}: {formatDate(patient.affiliation.endDate)}
          </span>
        </div>
      );
    },
  },
  {
    key: 'registrationDate',
    header: 'Registered',
    sortable: true,
    render: (patient: Patient) => (
      <div className="text-xs text-gray-500">{formatDate(patient.registrationDate)}</div>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: 50,
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
  const patientsContext = usePatients();
  const ordersContext = useOrders();

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [ageRange, setAgeRange] = useState<[number, number]>([0, 150]);

  const patients = patientsContext?.patients || [];
  
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

  if (!patientsContext || !ordersContext) {
    return <div>Loading...</div>;
  }
  
  const { getOrdersByPatient } = ordersContext;
  
  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => getPatientTableColumns(navigate, getOrdersByPatient),
    [navigate, getOrdersByPatient]
  );

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
            emptyMessage="No patients found. Try adjusting your search or filters."
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
