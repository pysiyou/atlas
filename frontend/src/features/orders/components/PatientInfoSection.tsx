/**
 * PatientInfoSection Component
 * Displays patient information in order context
 */

import React from 'react';
import { TYPE } from '@/components/theme/recipes';
import { Icon, DetailField, EntityId } from '@/components';
import { calculateAge } from '@/utils';
import type { Patient } from '@/types';
import { formatOrderDate } from '@/utils/date';
import { ICONS, getDataFieldIcon } from '@/config/icons';

import { formatAddress } from '@/features/patients';

import { ORDER_DETAIL_INFO_FIELDS_LAYOUT } from './OrderInfoSection';

export interface PatientInfoSectionProps {
  patient: Patient | null;
  onViewPatient?: () => void;
}

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({
  patient,
  onViewPatient: _onViewPatient,
}) => {
  const containerClass = ORDER_DETAIL_INFO_FIELDS_LAYOUT;

  if (!patient) {
    return (
      <div className="flex items-center justify-center h-full min-h-50">
        <div className="text-center">
          <Icon
            name={ICONS.dataFields.user}
            className="w-12 h-12 text-text-disabled mx-auto mb-space-2"
          />
          <p className={`${TYPE.amount} text-text-tertiary`}>Patient Not Found</p>
        </div>
      </div>
    );
  }

  const age =
    patient.dateOfBirth != null && patient.dateOfBirth !== ''
      ? calculateAge(patient.dateOfBirth)
      : null;
  const showAge = age != null && Number.isFinite(age);

  return (
    <div className={containerClass}>
      <DetailField
        icon={getDataFieldIcon('user')}
        label="Patient ID"
        value={<EntityId type="patient" value={patient.id} />}
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.dataFields.userHands}
        label="Patient Name"
        value={patient.fullName}
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.dataFields.gender}
        label="Gender"
        value={<span className="capitalize">{patient.gender}</span>}
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.dataFields.dateOfBirth}
        label="Date of Birth"
        value={
          <span className="whitespace-nowrap truncate">
            {formatOrderDate(patient.dateOfBirth, 'long')}
            {showAge ? (
              <span className="text-text-secondary"> ({age} years old)</span>
            ) : null}
          </span>
        }
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.dataFields.phone}
        label="Phone"
        value={patient.phone}
        orientation="vertical"
      />
      {patient.email && (
        <DetailField
          icon={ICONS.dataFields.email}
          label="Email"
          value={<span className="line-clamp-2 break-all">{patient.email}</span>}
          orientation="vertical"
        />
      )}
      <DetailField
        icon={ICONS.dataFields.address}
        label="Address"
        value={<span className="line-clamp-3 wrap-break-word">{formatAddress(patient.address)}</span>}
        orientation="vertical"
      />
    </div>
  );
};
