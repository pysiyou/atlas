import type { NavigateFunction } from 'react-router-dom';
import { PatientGenderBadge } from '../components/PatientGenderBadge';
import type { TableViewConfig } from '@/components';
import {
  buildViews,
  renderContactBlock,
  renderDateTimeCell,
  renderPatientId,
  renderPatientNameWithAge,
} from '@/components/data-table';
import { formatDate, formatDateTime } from '@/utils';
import type { PatientContext } from '@/types';
import { isAffiliationActive } from '../utils/patientHelpers';
import { PatientCard } from '../components/PatientCard';
import { TYPE } from '@/components/theme/recipes';


const PATIENT_VIEWS = {
  full: ['id', 'fullName', 'gender', 'contact', 'lastOrder', 'registrationDate', 'affiliation'],
  medium: ['id', 'fullName', 'gender', 'contact', 'lastOrder', 'registrationDate'],
  compact: ['id', 'fullName', 'gender', 'contact'],
} as const;

export const createPatientTableConfig = (
  _navigate: NavigateFunction
): TableViewConfig<PatientContext> => {
  const columnMap = {
    id: {
      key: 'id',
      header: 'Patient ID',
      width: 'id' as const,
      sortable: true,
      accessor: (patient: PatientContext) => patient.id,
      render: (patient: PatientContext) => renderPatientId(patient.id),
    },
    fullName: {
      key: 'fullName',
      header: 'Name',
      width: 'fill' as const,
      sortable: true,
      accessor: (patient: PatientContext) => patient.fullName,
      render: (patient: PatientContext) =>
        renderPatientNameWithAge(patient.fullName, patient.dateOfBirth),
    },
    contact: {
      key: 'contact',
      header: 'Contact',
      width: 'fill' as const,
      render: (patient: PatientContext) => renderContactBlock(patient.phone, patient.email),
    },
    gender: {
      key: 'gender',
      header: 'Gender',
      width: 'sm' as const,
      sortable: true,
      accessor: (patient: PatientContext) => patient.gender,
      render: (patient: PatientContext) => <PatientGenderBadge gender={patient.gender} size="xs" />,
    },
    lastOrder: {
      key: 'lastOrder',
      header: 'Last Order',
      width: 'lg' as const,
      accessor: (patient: PatientContext) => patient.lastOrderDate ?? '',
      render: (patient: PatientContext) => {
        if (patient.orderCount === 0 || !patient.lastOrderDate) {
          return (
            <span className={`${TYPE.meta} truncate block font-normal`}>No orders</span>
          );
        }
        return (
          <div className="min-w-0 font-normal">
            <div className={`${TYPE.amount} font-normal`}>{patient.orderCount} orders</div>
            <div className={`${TYPE.meta} truncate font-normal`}>
              Last: {formatDateTime(patient.lastOrderDate)}
            </div>
          </div>
        );
      },
    },
    affiliation: {
      key: 'affiliation',
      header: 'Affiliation',
      width: 'lg' as const,
      sortable: true,
      accessor: (patient: PatientContext) => patient.affiliation?.endDate ?? '',
      render: (patient: PatientContext) => {
        if (!patient.affiliation) {
          return (
            <span className={`${TYPE.meta} truncate block font-normal`}>
              No Affiliation
            </span>
          );
        }
        const isActive = isAffiliationActive(patient.affiliation);
        return (
          <span className={`${TYPE.meta} truncate font-normal`}>
            {isActive ? 'Expires on' : 'Expired on'}: {formatDate(patient.affiliation.endDate)}
          </span>
        );
      },
    },
    registrationDate: {
      key: 'registrationDate',
      header: 'Registered',
      width: 'lg' as const,
      sortable: true,
      accessor: (patient: PatientContext) => patient.registrationDate,
      render: (patient: PatientContext) => renderDateTimeCell(patient.registrationDate),
    },
  };

  return {
    ...buildViews(columnMap, PATIENT_VIEWS),
    CardComponent: PatientCard,
  };
};
