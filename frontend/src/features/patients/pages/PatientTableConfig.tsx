import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '@/components';
import type { TableViewConfig } from '@/components';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import { displayId } from '@/utils';
import type { PatientContext } from '@/types';
import { DATA_ID_PRIMARY } from '@/utils/constants';
import { isAffiliationActive } from '../utils/patientHelpers';
import { PatientCard } from '../components/PatientCard';

/**
 * createPatientTableConfig — Table config for PatientList.
 *
 * Accepts PatientContext (Patient + pre-computed order stats).
 * No getOrdersByPatient callback needed — order data is already in the superset.
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function
export const createPatientTableConfig = (
  _navigate: NavigateFunction
): TableViewConfig<PatientContext> => {
  // Shared render functions to avoid duplication
  const renderId = (patient: PatientContext) => (
    <span className={`${DATA_ID_PRIMARY} font-normal`}>{displayId.patient(patient.id)}</span>
  );

  const renderName = (patient: PatientContext) => (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal capitalize">{patient.fullName}</div>
      <div className="text-xs text-text-tertiary truncate font-normal">
        {calculateAge(patient.dateOfBirth)} years old
      </div>
    </div>
  );

  const renderGender = (patient: PatientContext) => <Badge variant={patient.gender} size="sm" />;

  /** Uses pre-computed PatientContext.lastOrderDate — no Order[] lookup needed. */
  const renderLastOrder = (patient: PatientContext) => {
    if (patient.orderCount === 0 || !patient.lastOrderDate) {
      return (
        <span className="text-xs text-text-tertiary truncate block font-normal">No orders</span>
      );
    }

    return (
      <div className="min-w-0 font-normal">
        <div className={`${DATA_ID_PRIMARY} font-normal`}>{patient.orderCount} orders</div>
        <div className="text-xs text-text-tertiary truncate font-normal">
          Last: {formatDate(patient.lastOrderDate)}
        </div>
      </div>
    );
  };

  const renderContact = (patient: PatientContext) => (
    <div className="text-xs min-w-0 font-normal">
      <div className="text-xs text-text-primary truncate font-normal">
        {formatPhoneNumber(patient.phone)}
      </div>
      {patient.email && (
        <div className="text-xs text-text-tertiary truncate font-normal">{patient.email}</div>
      )}
    </div>
  );

  const renderAffiliation = (patient: PatientContext) => {
    if (!patient.affiliation) {
      return (
        <span className="text-xs text-text-tertiary truncate block font-normal">
          No Affiliation
        </span>
      );
    }
    const isActive = isAffiliationActive(patient.affiliation);
    return (
      <div className="flex items-center gap-2 min-w-0 font-normal">
        <span className="text-xs text-text-tertiary truncate font-normal">
          {isActive ? 'Expires on' : 'Expired on'}: {formatDate(patient.affiliation.endDate)}
        </span>
      </div>
    );
  };

  const renderRegistrationDate = (patient: PatientContext) => (
    <div className="text-xs text-text-tertiary truncate font-normal">
      {formatDate(patient.registrationDate)}
    </div>
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
        key: 'contact',
        header: 'Contact',
        width: 'fill',
        render: renderContact,
      },
      {
        key: 'gender',
        header: 'Gender',
        width: 'sm',
        sortable: true,
        render: renderGender,
      },
      {
        key: 'lastOrder',
        header: 'Last Order',
        width: 'lg',
        render: renderLastOrder,
      },
      {
        key: 'affiliation',
        header: 'Affiliation',
        width: 'lg',
        sortable: true,
        render: renderAffiliation,
      },
      {
        key: 'registrationDate',
        header: 'Registered',
        width: 'lg',
        sortable: true,
        render: renderRegistrationDate,
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
        key: 'contact',
        header: 'Contact',
        width: 'fill',
        render: renderContact,
      },
      {
        key: 'gender',
        header: 'Gender',
        width: 'lg', // 100px - shown in medium view
        sortable: true,
        render: renderGender,
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
        width: 'fill',
        sortable: true,
        render: renderName,
      },
      {
        key: 'contact',
        header: 'Contact',
        width: 'fill',
        render: renderContact,
      },
    ],
    CardComponent: PatientCard,
  };
};
