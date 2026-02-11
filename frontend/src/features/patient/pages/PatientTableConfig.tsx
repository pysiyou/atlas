
import type { NavigateFunction } from 'react-router-dom';
import { Badge } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { formatDate, calculateAge, formatPhoneNumber } from '@/utils';
import { displayId } from '@/utils';
import type { Patient, Order } from '@/types';
import { DATA_ID_PRIMARY } from '@/shared/constants';
// Helper function for affiliation status (pure function, no hook needed)
const isAffiliationActive = (affiliation?: { endDate: string }): boolean => {
  if (!affiliation) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(affiliation.endDate);
  endDate.setHours(0, 0, 0, 0);
  return endDate >= today;
};
import { PatientCard } from '../components/PatientCard';


// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function 
export const createPatientTableConfig = (
  _navigate: NavigateFunction,
  getOrdersByPatient: (patientId: number | string) => Order[]
): TableViewConfig<Patient> => {
  // Shared render functions to avoid duplication
  const renderId = (patient: Patient) => (
    <span className={`${DATA_ID_PRIMARY} font-normal`}>{displayId.patient(patient.id)}</span>
  );

  const renderName = (patient: Patient) => (
    <div className="min-w-0 font-normal">
      <div className="text-text-primary truncate font-normal capitalize">{patient.fullName}</div>
      <div className="text-xs text-text-tertiary truncate font-normal">
        {calculateAge(patient.dateOfBirth)} years old
      </div>
    </div>
  );

  const renderGender = (patient: Patient) => (
    <Badge variant={patient.gender} size="sm" />
  );

  const renderLastOrder = (patient: Patient) => {
    const patientOrders = getOrdersByPatient(patient.id);
    if (patientOrders.length === 0) {
      return <span className="text-xs text-text-tertiary truncate block font-normal">No orders</span>;
    }

    const lastOrder = patientOrders.sort((a, b) => 
      new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
    )[0];

    return (
      <div className="min-w-0 font-normal">
        <div className={`${DATA_ID_PRIMARY} font-normal`}>{displayId.order(lastOrder.orderId)}</div>
        <div className="text-xs text-text-tertiary truncate font-normal">
          {formatDate(lastOrder.orderDate)}
        </div>
      </div>
    );
  };

  const renderContact = (patient: Patient) => (
    <div className="text-xs min-w-0 font-normal">
      <div className="text-xs text-text-primary truncate font-normal">{formatPhoneNumber(patient.phone)}</div>
      {patient.email && <div className="text-xs text-text-tertiary truncate font-normal">{patient.email}</div>}
    </div>
  );

  const renderAffiliation = (patient: Patient) => {
    if (!patient.affiliation) {
      return <span className="text-xs text-text-tertiary truncate block font-normal">No Affiliation</span>;
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

  const renderRegistrationDate = (patient: Patient) => (
    <div className="text-xs text-text-tertiary truncate font-normal">{formatDate(patient.registrationDate)}</div>
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
      // {
      //   key: 'lastOrder',
      //   header: 'Last Order',
      //   width: 'sm', // 100px - shown in medium view
      //   render: renderLastOrder,
      // },
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
