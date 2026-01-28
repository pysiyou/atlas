/**
 * GeneralInfoSection Component
 * Displays patient general information
 */

import React from 'react';
import type { Patient } from '@/types';
import { InfoField } from '@/shared/components/sections/InfoField';
import { formatDetailDate, formatAddress } from '../utils/patient-formatters';
import { ICONS } from '@/utils/icon-mappings';

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
        icon={ICONS.dataFields.gender}
        label="Gender"
        value={<span className="capitalize">{patient.gender}</span>}
        orientation="vertical"
      />
      <InfoField
        icon={ICONS.dataFields.birthday}
        label="Birthday"
        value={
          <span className="whitespace-nowrap truncate">
            {formatDetailDate(patient.dateOfBirth, 'long')}
          </span>
        }
        orientation="vertical"
      />
      <InfoField icon={ICONS.dataFields.phone} label="Phone Number" value={patient.phone} orientation="vertical" />
      <InfoField
        icon={ICONS.dataFields.email}
        label="Email"
        value={<span className="line-clamp-2 break-all">{patient.email || 'N/A'}</span>}
        orientation="vertical"
      />
      <InfoField
        icon={ICONS.dataFields.height}
        label="Height"
        value={patient.height ? `${patient.height} cm` : 'N/A'}
        orientation="vertical"
      />
      <InfoField
        icon={ICONS.dataFields.weight}
        label="Weight"
        value={patient.weight ? `${patient.weight} kg` : 'N/A'}
        orientation="vertical"
      />
      <InfoField icon={ICONS.dataFields.address} label="Address" value={formatAddress(patient.address)} orientation="vertical" />
      <InfoField
        icon={ICONS.dataFields.phone}
        label="Emergency Contact"
        value={
          <>
            {patient.emergencyContact?.fullName || 'N/A'}{' '}
            <span className="text-text-disabled font-normal">
              ({patient.emergencyContact?.phone || 'N/A'})
            </span>
          </>
        }
        orientation="vertical"
      />
    </div>
  );
};
