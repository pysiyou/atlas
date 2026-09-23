/**
 * MedicalHistorySectionDisplay
 * Read-only medical history in a two-column vertical flow.
 */

import React from 'react';
import type { Patient } from '@/types';
import { DetailField } from '@/components/display/DetailField';
import { formatList, formatFamilyHistory, formatLifestyle } from '../utils/patientFormatters';
import { ICONS } from '@/config/icons';
import { TONE } from '@/components/theme/recipes';
import { DetailFieldsColumnFlow } from '@/components';

export interface MedicalHistorySectionDisplayProps {
  patient: Patient;
}

export const MedicalHistorySectionDisplay: React.FC<MedicalHistorySectionDisplayProps> = ({
  patient,
}) => {
  const history = patient.medicalHistory;
  const allergies = history?.allergies ?? [];
  const hasAllergies = allergies.length > 0;

  return (
    <div className="flex min-h-0 h-full flex-col">
      <DetailFieldsColumnFlow>
        <DetailField
          icon={ICONS.medicalHistory.allergy}
          label="Allergies"
          value={
            <span className={hasAllergies ? TONE.danger.fg : undefined}>
              {formatList(allergies)}
            </span>
          }
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.medicalHistory.chronicCondition}
          label="Chronic Disease"
          value={formatList(history?.chronicConditions)}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.medicalHistory.medication}
          label="Current Medications"
          value={formatList(history?.currentMedications)}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.medicalHistory.surgery}
          label="Surgery"
          value={formatList(history?.previousSurgeries)}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.medicalHistory.familyHistory}
          label="Family Disease"
          value={formatFamilyHistory(history?.familyHistory)}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.health}
          label="Lifestyle"
          value={formatLifestyle(history?.lifestyle)}
          orientation="vertical"
        />
      </DetailFieldsColumnFlow>
    </div>
  );
};
