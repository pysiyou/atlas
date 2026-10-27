import type { NavigateFunction } from 'react-router-dom';
import { PatientGenderBadge } from '../components/PatientGenderBadge';
import type { TableViewConfig } from '@/components/data-table';
import {
  buildViews,
  createBadgeColumn,
  createDateTimeColumn,
  createIdColumn,
  TABLE_COLUMN_WIDTH,
} from '@/components/data-table';
import { renderContactBlock, renderDateCell } from '@/utils/tableColumnRenders';
import {
  renderPatientId,
  renderPatientNameWithAge,
  renderPatientOrdersSummary,
} from '@/utils/presentation';
import type { PatientContext } from '@/types';
import { isAffiliationActive } from '../utils/patientHelpers';
import { PatientCard } from '../components/PatientCard';
import { TABLE_TYPE } from '@/theme/recipes';

const PATIENT_VIEWS = {
  full: ['id', 'fullName', 'contact', 'gender', 'orders', 'registrationDate', 'affiliation'],
  medium: ['id', 'fullName', 'contact', 'gender', 'orders', 'registrationDate'],
  compact: ['id', 'fullName', 'contact', 'gender'],
} as const;

export const createPatientTableConfig = (
  _navigate: NavigateFunction
): TableViewConfig<PatientContext> => {
  const columnMap = {
    id: createIdColumn<PatientContext>(
      'id',
      'Patient ID',
      patient => renderPatientId(patient.id),
      {
        sortable: true,
        accessor: patient => patient.id,
      }
    ),
    fullName: {
      key: 'fullName',
      header: 'Name',
      width: TABLE_COLUMN_WIDTH.flex,
      sortable: true,
      accessor: (patient: PatientContext) => patient.fullName,
      render: (patient: PatientContext) =>
        renderPatientNameWithAge(patient.fullName, patient.dateOfBirth),
    },
    contact: {
      key: 'contact',
      header: 'Contact',
      width: TABLE_COLUMN_WIDTH.flex,
      render: (patient: PatientContext) => renderContactBlock(patient.phone, patient.email),
    },
    gender: createBadgeColumn<PatientContext>(
      'gender',
      'Gender',
      patient => <PatientGenderBadge gender={patient.gender} size="xs" />,
      {
        sortable: true,
        accessor: patient => patient.gender,
      }
    ),
    orders: {
      key: 'orders',
      header: 'Orders',
      width: TABLE_COLUMN_WIDTH.supporting,
      sortable: true,
      accessor: (patient: PatientContext) => patient.lastOrderDate ?? '',
      render: (patient: PatientContext) =>
        renderPatientOrdersSummary(patient.orderCount, patient.lastOrderDate),
    },
    affiliation: {
      key: 'affiliation',
      header: 'Affiliation',
      width: TABLE_COLUMN_WIDTH.supporting,
      sortable: true,
      accessor: (patient: PatientContext) => patient.affiliation?.endDate ?? '',
      render: (patient: PatientContext) => {
        if (!patient.affiliation) {
          return (
            <span className={`${TABLE_TYPE.meta} truncate block font-normal`}>
              No Affiliation
            </span>
          );
        }
        const isActive = isAffiliationActive(patient.affiliation);
        return (
          <div className="min-w-0 font-normal">
            <div className={`${TABLE_TYPE.meta} truncate font-normal`}>
              {isActive ? 'Expires on' : 'Expired on'}
            </div>
            {renderDateCell(patient.affiliation.endDate, '—', 'secondary')}
          </div>
        );
      },
    },
    registrationDate: createDateTimeColumn<PatientContext>(
      'registrationDate',
      'Registered',
      patient => patient.registrationDate
    ),
  };

  return {
    ...buildViews(columnMap, PATIENT_VIEWS),
    CardComponent: PatientCard,
  };
};
