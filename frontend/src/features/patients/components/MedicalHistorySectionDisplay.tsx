/**
 * MedicalHistorySectionDisplay Component
 * Displays patient medical history (read-only display version)
 */

import React from 'react';
import type { Patient } from '@/types';
import { DetailField } from '@/components/display/DetailField';
import { formatList, formatFamilyHistory } from '../utils/patientFormatters';
import { ICONS } from '@/config/icons';

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
      <DetailField
        icon={ICONS.medicalHistory.chronicCondition}
        label="Chronic Disease"
        value={formatList(patient.medicalHistory?.chronicConditions)}
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.medicalHistory.medication}
        label="Current Medications"
        value={formatList(patient.medicalHistory?.currentMedications)}
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.medicalHistory.surgery}
        label="Surgery"
        value={formatList(patient.medicalHistory?.previousSurgeries)}
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.medicalHistory.familyHistory}
        label="Family Disease"
        value={formatFamilyHistory(patient.medicalHistory?.familyHistory)}
        orientation="vertical"
      />
      <DetailField
        icon={ICONS.medicalHistory.allergy}
        label="Allergies"
        value={formatList(patient.medicalHistory?.allergies)}
        orientation="vertical"
      />
    </div>
  );
};
