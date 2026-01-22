/**
 * Patient Table Column Definitions
 * Column configuration for the patient list table
 * 
 * Follows the standard pattern used across all table column definitions:
 * - Uses preset widths ('xs', 'sm', 'md', 'lg', 'fill')
 * - Specifies visibility using presets ('always', 'tablet', 'desktop', 'wide')
 * - Includes priority for mobile card view (lower = more important)
 * - Action column is sticky right, always visible, with highest priority number
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, Avatar, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import type { ColumnConfig } from '@/shared/ui';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import type { Patient, Order } from '@/types';
import { isAffiliationActive } from './usePatientForm';

/**
 * Generate table column definitions for patient list
 * @param navigate - React Router navigate function
 * @param getOrdersByPatient - Function to get orders for a patient
 * @returns Array of column definitions following the standard pattern
 */
export const getPatientTableColumns = (
  navigate: NavigateFunction,
  getOrdersByPatient: (patientId: string) => Order[]
): ColumnConfig<Patient>[] => [
  {
    key: 'id',
    header: 'Patient ID',
    width: 'md',
    sortable: true,
    visible: 'always',
    priority: 1,
    render: (patient: Patient) => (
      <span className="text-xs text-sky-600 font-medium font-mono truncate block">
        {patient.id}
      </span>
    ),
  },
  {
    key: 'fullName',
    header: 'Name',
    width: 'fill',
    sortable: true,
    visible: 'always',
    priority: 2,
    render: (patient: Patient) => (
      <div className="flex items-center gap-3 min-w-0">
        <Avatar primaryText={patient.fullName} secondaryText={`${calculateAge(patient.dateOfBirth)} years old`} size="sm" className="shrink-0" />
      </div>
    ),
  },
  {
    key: 'gender',
    header: 'Gender',
    width: 'sm',
    sortable: true,
    visible: 'tablet',
    priority: 3,
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
    width: 'sm',
    visible: 'desktop',
    priority: 4,
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
    width: 'lg',
    visible: 'always',
    priority: 5,
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
    width: 'md',
    sortable: true,
    visible: 'wide',
    priority: 6,
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
    width: 'sm',
    sortable: true,
    visible: 'wide',
      priority: 7,
    render: (patient: Patient) => (
      <div className="text-xs text-gray-500 truncate">{formatDate(patient.registrationDate)}</div>
    ),
  },
  {
    key: 'actions',
    header: '',
    width: 'xs',
    visible: 'always',
    sticky: 'right',
    priority: 999,
    className: 'overflow-visible !px-1',
    headerClassName: '!px-1',
    render: (patient: Patient) => (
      <TableActionMenu>
        <TableActionItem
          label="View Details"
          icon={<Icon name="eye" className="w-4 h-4" />}
          onClick={() => navigate(`/patients/${patient.id}`)}
        />
        <TableActionItem
          label="Edit Patient"
          icon={<Icon name="pen" className="w-4 h-4" />}
          onClick={() => navigate(`/patients/${patient.id}/edit`)}
        />
        <TableActionItem
          label="Create Order"
          icon={<Icon name="document" className="w-4 h-4" />}
          onClick={() => navigate(`/orders/new?patientId=${patient.id}`)}
        />
      </TableActionMenu>
    ),
  },
];
