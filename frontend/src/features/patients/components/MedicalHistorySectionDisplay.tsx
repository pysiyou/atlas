/**
 * MedicalHistorySectionDisplay
 * Read-only medical history in a two-column vertical flow.
 */

import React from 'react';
import type { Patient } from '@/types';
import { DescriptionItem } from '@/components/display';
import { formatList, formatFamilyHistory, formatLifestyle } from '../utils/patientFormatters';
import { ICONS } from '@/config/icons';
import { TONE } from '@/theme/recipes';
import { DescriptionColumns } from '@/components/display';

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
      <DescriptionColumns>
        <DescriptionItem
          icon={ICONS.medicalHistory.allergy}
          label="Allergies"
          value={
            <span className={hasAllergies ? TONE.danger.fg : undefined}>
              {formatList(allergies)}
            </span>
          }
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.medicalHistory.chronicCondition}
          label="Chronic Disease"
          value={formatList(history?.chronicConditions)}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.medicalHistory.medication}
          label="Current Medications"
          value={formatList(history?.currentMedications)}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.medicalHistory.surgery}
          label="Surgery"
          value={formatList(history?.previousSurgeries)}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.medicalHistory.familyHistory}
          label="Family Disease"
          value={formatFamilyHistory(history?.familyHistory)}
          orientation="vertical"
        />
        <DescriptionItem
          icon={ICONS.dataFields.health}
          label="Lifestyle"
          value={formatLifestyle(history?.lifestyle)}
          orientation="vertical"
        />
      </DescriptionColumns>
    </div>
  );
};
