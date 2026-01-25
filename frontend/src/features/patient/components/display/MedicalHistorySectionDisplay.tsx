/**
 * MedicalHistorySectionDisplay Component
 * Displays patient medical history (read-only display version)
 */

import React from 'react';
import type { Patient } from '@/types';
import { InfoField } from './InfoField';
import { formatList, formatFamilyHistory } from '../../utils/patientDetailUtils';
import { ICONS } from '@/utils/icon-mappings';

export interface MedicalHistorySectionDisplayProps {
  patient: Patient;
  layout?: 'grid' | 'column';
}

export const MedicalHistorySectionDisplay: React.FC<MedicalHistorySectionDisplayProps> = ({
  patient,
  layout = 'column',
}) => {
  const containerClass =
    layout === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-4';

  return (
    <div className={containerClass}>
      <InfoField
        icon={ICONS.medicalHistory.chronicCondition}
        label="Chronic Disease"
        value={formatList(patient.medicalHistory?.chronicConditions)}
      />
      <InfoField
        icon={ICONS.medicalHistory.medication}
        label="Current Medications"
        value={formatList(patient.medicalHistory?.currentMedications)}
      />
      <InfoField
        icon={ICONS.medicalHistory.surgery}
        label="Surgery"
        value={formatList(patient.medicalHistory?.previousSurgeries)}
      />
      <InfoField
        icon={ICONS.medicalHistory.familyHistory}
        label="Family Disease"
        value={formatFamilyHistory(patient.medicalHistory?.familyHistory)}
      />
      <InfoField
        icon={ICONS.medicalHistory.allergy}
        label="Allergies"
        value={formatList(patient.medicalHistory?.allergies)}
      />
    </div>
  );
};
