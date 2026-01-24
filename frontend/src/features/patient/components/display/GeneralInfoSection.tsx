/**
 * GeneralInfoSection Component
 * Displays patient general information
 */

import React from 'react';
import type { Patient } from '@/types';
import { InfoField } from './InfoField';
import { formatDetailDate, formatAddress } from '../../utils/patientDetailUtils';

export interface GeneralInfoSectionProps {
  patient: Patient;
  layout?: 'grid' | 'column';
}

export const GeneralInfoSection: React.FC<GeneralInfoSectionProps> = ({
  patient,
  layout = 'column',
}) => {
  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-3';

  return (
    <div className={containerClass}>
      <InfoField
        icon="user-hands"
        label="Gender"
        value={<span className="capitalize">{patient.gender}</span>}
      />
      <InfoField
        icon="calendar"
        label="Birthday"
        value={
          <span className="whitespace-nowrap truncate">
            {formatDetailDate(patient.dateOfBirth, 'long')}
          </span>
        }
      />
      <InfoField icon="phone" label="Phone Number" value={patient.phone} />
      <InfoField
        icon="mail"
        label="Email"
        value={<span className="line-clamp-2 break-all">{patient.email || 'N/A'}</span>}
      />
      <InfoField
        icon="ruler"
        label="Height"
        value={patient.height ? `${patient.height} cm` : 'N/A'}
      />
      <InfoField
        icon="weight"
        label="Weight"
        value={patient.weight ? `${patient.weight} kg` : 'N/A'}
      />
      <InfoField icon="map" label="Address" value={formatAddress(patient.address)} />
      <InfoField
        icon="phone"
        label="Emergency Contact"
        value={
          <>
            {patient.emergencyContact?.fullName || 'N/A'}{' '}
            <span className="text-gray-400 font-normal">
              ({patient.emergencyContact?.phone || 'N/A'})
            </span>
          </>
        }
      />
    </div>
  );
};
