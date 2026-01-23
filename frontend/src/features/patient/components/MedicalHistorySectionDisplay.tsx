/**
 * MedicalHistorySectionDisplay Component
 * Displays patient medical history (read-only display version)
 */

import React from 'react';
import type { Patient } from '@/types';
import { InfoField } from './InfoField';
import { formatList } from '../utils/patientDetailUtils';

export interface MedicalHistorySectionDisplayProps {
  patient: Patient;
  layout?: 'grid' | 'column';
}

export const MedicalHistorySectionDisplay: React.FC<MedicalHistorySectionDisplayProps> = ({
  patient,
  layout = 'column',
}) => {
  const containerClass = layout === 'grid'
    ? 'grid grid-cols-1 sm:grid-cols-2 gap-5'
    : 'flex flex-col gap-4';

  return (
    <div className={containerClass}>
      <InfoField
        icon="info-circle"
        label="Chronic Disease"
        value={formatList(patient.medicalHistory?.chronicConditions)}
      />
      <InfoField
        icon="medicine"
        label="Current Medications"
        value={formatList(patient.medicalHistory?.currentMedications)}
      />
      <InfoField
        icon="health"
        label="Surgery"
        value={formatList(patient.medicalHistory?.previousSurgeries)}
      />
      <InfoField
        icon="users-group"
        label="Family Disease"
        value={patient.medicalHistory?.familyHistory || 'None'}
      />
      <InfoField
        icon="alert-circle"
        label="Allergies"
        value={formatList(patient.medicalHistory?.allergies)}
      />
    </div>
  );
};
