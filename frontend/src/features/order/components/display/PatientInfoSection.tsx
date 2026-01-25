/**
 * PatientInfoSection Component
 * Displays patient information in order context
 */

import React from 'react';
import { Icon, Avatar } from '@/shared/ui';
import { calculateAge } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { Patient } from '@/types';
import { OrderInfoField } from './OrderInfoField';
import { formatOrderDate } from '../../utils/orderDetailUtils';

export interface PatientInfoSectionProps {
  patient: Patient | null;
  onViewPatient?: () => void;
  layout?: 'grid' | 'column';
}

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  patient,
  onViewPatient: _onViewPatient,
  layout = 'column',
}) => {
  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-3';

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <Icon name="user" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Patient Not Found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="flex gap-3 items-center col-span-full">
        <Avatar
          primaryText={patient.fullName}
          secondaryText={displayId.patient(patient.id)}
          secondaryTextClassName="font-mono"
          size="sm"
        />
      </div>
      <OrderInfoField
        icon="user-hands"
        label="Age & Gender"
        value={
          <span className="capitalize">
            {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
          </span>
        }
      />
      <OrderInfoField
        icon="calendar"
        label="Date of Birth"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(patient.dateOfBirth, 'long')}
          </span>
        }
      />
      <OrderInfoField icon="phone" label="Phone" value={patient.phone} />
      {patient.email && (
        <OrderInfoField
          icon="mail"
          label="Email"
          value={<span className="line-clamp-2 break-all">{patient.email}</span>}
        />
      )}
    </div>
  );
};
