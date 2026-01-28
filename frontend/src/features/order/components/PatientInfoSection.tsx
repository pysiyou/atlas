/**
 * PatientInfoSection Component
 * Displays patient information in order context
 */

import React from 'react';
import { Icon, Avatar } from '@/shared/ui';
import { calculateAge } from '@/utils';
import { displayId } from '@/utils';
import type { Patient } from '@/types';
import { InfoField } from '@/shared/components/sections/InfoField';
import { formatOrderDate } from '@/shared/utils/data/dateFormatters';
import { ICONS } from '@/utils';

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
          <Icon name={ICONS.dataFields.user} className="w-12 h-12 text-text-disabled mx-auto mb-2" />
          <p className="text-sm text-text-tertiary">Patient Not Found</p>
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
          secondaryTextClassName="font-mono text-brand"
          size="sm"
        />
      </div>
      <InfoField
        icon={ICONS.dataFields.userHands}
        label="Age & Gender"
        value={
          <span className="capitalize">
            {calculateAge(patient.dateOfBirth)} years old • {patient.gender}
          </span>
        }
        orientation="vertical"
      />
      <InfoField
        icon={ICONS.dataFields.dateOfBirth}
        label="Date of Birth"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(patient.dateOfBirth, 'long')}
          </span>
        }
        orientation="vertical"
      />
      <InfoField icon={ICONS.dataFields.phone} label="Phone" value={patient.phone} orientation="vertical" />
      {patient.email && (
        <InfoField
          icon={ICONS.dataFields.email}
          label="Email"
          value={<span className="line-clamp-2 break-all">{patient.email}</span>}
          orientation="vertical"
        />
      )}
    </div>
  );
};
