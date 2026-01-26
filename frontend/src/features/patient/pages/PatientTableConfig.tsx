/**
 * Patient Table Configuration
 *
 * Multi-view table configuration for patient list.
 * Defines separate column sets for different screen sizes:
 *
 * - Card View (xs/sm ≤640px): Mobile card layout with PatientCard component
 * - Compact Table (md 768px): Minimal columns - ID, Name, Contact, Actions
 * - Medium Table (lg 1024px): Moderate columns - adds Gender, Tests
 * - Full Table (xl+ ≥1280px): All columns including Affiliation, Registered
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, Avatar, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { Patient, Order } from '@/types';
import { isAffiliationActive } from '../utils/affiliationUtils';
import { PatientCard } from '../components/cards/PatientCard';
import { ICONS } from '@/utils/icon-mappings';
import { brandColors } from '@/shared/design-system/tokens/colors';

/**
 * Create patient table configuration with full, compact, and card views
 *
 * @param navigate - React Router navigate function
 * @param getOrdersByPatient - Function to get orders for a patient
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function 
export const createPatientTableConfig = (
  navigate: NavigateFunction,
  getOrdersByPatient: (patientId: number | string) => Order[],
  openNewOrderModal: (patientId?: string) => void
): TableViewConfig<Patient> => {
  // Shared render functions to avoid duplication
  const renderId = (patient: Patient) => (
    <span className={`text-xs ${brandColors.primary.icon} font-medium font-mono truncate block`}>
      {displayId.patient(patient.id)}
    </span>
  );

  const renderName = (patient: Patient) => (
    <Avatar
      primaryText={patient.fullName}
      secondaryText={`${calculateAge(patient.dateOfBirth)} years old`}
      size="sm"
    />
  );

  const renderGender = (patient: Patient) => (
    <Badge variant={patient.gender} size="sm" />
  );

  const renderTests = (patient: Patient) => {
    const patientOrders = getOrdersByPatient(patient.id);
    const testCount = patientOrders.reduce((acc, order) => acc + (order.tests?.length || 0), 0);

    return (
      <div className="min-w-0">
        <div className="font-medium truncate">
          {testCount} test{testCount !== 1 ? 's' : ''}
        </div>
        <div className="text-xs text-text-muted truncate">
          {patientOrders.length} order{patientOrders.length !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  const renderContact = (patient: Patient) => (
    <div className="text-xs min-w-0">
      <div className="truncate">{formatPhoneNumber(patient.phone)}</div>
      {patient.email && <div className="text-xs text-text-muted truncate">{patient.email}</div>}
    </div>
  );

  const renderAffiliation = (patient: Patient) => {
    if (!patient.affiliation) {
      return <span className="text-xs text-text-muted truncate block">No Affiliation</span>;
    }
    const isActive = isAffiliationActive(patient.affiliation);
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-text-muted truncate">
          {isActive ? 'Expires' : 'Expired'}: {formatDate(patient.affiliation.endDate)}
        </span>
      </div>
    );
  };

  const renderRegistrationDate = (patient: Patient) => (
    <div className="text-xs text-text-muted truncate">{formatDate(patient.registrationDate)}</div>
  );

  const renderActions = (patient: Patient) => (
    <TableActionMenu>
      <TableActionItem
        label="View Details"
        icon={<Icon name={ICONS.actions.view} className="w-4 h-4" />}
        onClick={() => navigate(`/patients/${patient.id}`)}
      />
      <TableActionItem
        label="Edit Patient"
        icon={<Icon name={ICONS.actions.edit} className="w-4 h-4" />}
        onClick={() => navigate(`/patients/${patient.id}/edit`)}
      />
      <TableActionItem
        label="Create Order"
        icon={<Icon name={ICONS.dataFields.document} className="w-4 h-4" />}
        onClick={() => openNewOrderModal(patient.id.toString())}
      />
    </TableActionMenu>
  );

  return {
    fullColumns: [
      {
        key: 'id',
        header: 'Patient ID',
        width: 'sm',
        sortable: true,
        render: renderId,
      },
      {
        key: 'fullName',
        header: 'Name',
        width: 'fill',
        sortable: true,
        render: renderName,
      },
      {
        key: 'gender',
        header: 'Gender',
        width: 'sm',
        sortable: true,
        render: renderGender,
      },
      {
        key: 'tests',
        header: 'Tests',
        width: 'sm',
        render: renderTests,
      },
      {
        key: 'contact',
        header: 'Contact',
        width: 'fill',
        render: renderContact,
      },
      {
        key: 'affiliation',
        header: 'Affiliation',
        width: 'md',
        sortable: true,
        render: renderAffiliation,
      },
      {
        key: 'registrationDate',
        header: 'Registered',
        width: 'md',
        sortable: true,
        render: renderRegistrationDate,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    mediumColumns: [
      {
        key: 'id',
        header: 'Patient ID',
        width: 'sm', // 200px - matches full view
        sortable: true,
        render: renderId,
      },
      {
        key: 'fullName',
        header: 'Name',
        width: 'fill', // Same as full view
        sortable: true,
        render: renderName,
      },
      {
        key: 'gender',
        header: 'Gender',
        width: 'sm', // 100px - shown in medium view
        sortable: true,
        render: renderGender,
      },
      {
        key: 'tests',
        header: 'Tests',
        width: 'sm', // 100px - shown in medium view
        render: renderTests,
      },
      {
        key: 'contact',
        header: 'Contact',
        // Spans: Contact(fill with base:0, grow:1) + Affiliation(150px) + Registered(150px)
        // Total base needed: 0 + 150 + 150 = 300px, plus grow:1 for Contact's flex share
        width: 'fill',
        render: renderContact,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    compactColumns: [
      {
        key: 'id',
        header: 'ID',
        width: 'sm', // 200px fixed - matches full view ID
        sortable: true,
        render: renderId,
      },
      {
        key: 'fullName',
        header: 'Name',
        // Spans: Name(fill with base:0, grow:1) + Gender(100px) + Tests(100px)
        // Total base needed: 0 + 100 + 100 = 200px, plus grow:1 for Name's flex share
        width: { base: 200, min: 200, grow: 1, shrink: 1 },
        sortable: true,
        render: renderName,
      },
      {
        key: 'contact',
        header: 'Contact',
        // Spans: Contact(fill with base:0, grow:1) + Affiliation(150px) + Registered(150px)
        // Total base needed: 0 + 150 + 150 = 300px, plus grow:1 for Contact's flex share
        width: { base: 300, min: 200, grow: 1, shrink: 1 },
        render: renderContact,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs', // 60px fixed
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    CardComponent: PatientCard,
  };
};
