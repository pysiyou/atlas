/**
 * MedicalHistorySectionDisplay
 * Read-only medical history in a two-column vertical flow.
 */
/* eslint-disable react-refresh/only-export-components -- description builders exported for order detail */

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

export function renderMedicalHistoryDescriptionItems(patient: Patient): React.ReactElement[] {
  const history = patient.medicalHistory;
  const allergies = history?.allergies ?? [];
  const hasAllergies = allergies.length > 0;

  return [
    <DescriptionItem
      key="allergies"
      icon={ICONS.medicalHistory.allergy}
      label="Allergies"
      value={
        <span className={hasAllergies ? TONE.danger.fg : undefined}>{formatList(allergies)}</span>
      }
      orientation="vertical"
    />,
    <DescriptionItem
      key="chronic"
      icon={ICONS.medicalHistory.chronicCondition}
      label="Chronic Disease"
      value={formatList(history?.chronicConditions)}
      orientation="vertical"
    />,
    <DescriptionItem
      key="medications"
      icon={ICONS.medicalHistory.medication}
      label="Current Medications"
      value={formatList(history?.currentMedications)}
      orientation="vertical"
    />,
    <DescriptionItem
      key="surgery"
      icon={ICONS.medicalHistory.surgery}
      label="Surgery"
      value={formatList(history?.previousSurgeries)}
      orientation="vertical"
    />,
    <DescriptionItem
      key="family"
      icon={ICONS.medicalHistory.familyHistory}
      label="Family Disease"
      value={formatFamilyHistory(history?.familyHistory)}
      orientation="vertical"
    />,
    <DescriptionItem
      key="lifestyle"
      icon={ICONS.dataFields.health}
      label="Lifestyle"
      value={formatLifestyle(history?.lifestyle)}
      orientation="vertical"
    />,
  ];
}

export const MedicalHistorySectionDisplay: React.FC<MedicalHistorySectionDisplayProps> = ({
  patient,
}) => {
  return (
    <div className="flex min-h-0 h-full flex-col">
      <DescriptionColumns>{renderMedicalHistoryDescriptionItems(patient)}</DescriptionColumns>
    </div>
  );
};
