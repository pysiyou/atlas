/**
 * CareSnapshotSection
 * High-signal facts in a two-column vertical flow.
 */
/* eslint-disable react-refresh/only-export-components -- description builders exported for order detail */

import React from 'react';
import { Badge } from '@/components/primitives';
import { DescriptionItem } from '@/components/display';
import { TONE } from '@/theme/recipes';
import type { Patient } from '@/types';
import { cn, formatDate } from '@/utils';
import { IconKeys } from '@/config/icons';
import { isAffiliationActive } from '../utils/patientHelpers';
import {
  calculateBodyMassIndex,
  formatList,
  formatMeasurement } from '../utils/patientFormatters';
import { DescriptionColumns } from '@/components/display';

export interface CareSnapshotSectionProps {
  patient: Patient;
}

function bodyMassTone(category: string): string {
  if (category === 'Normal') return TONE.success.fg;
  if (category === 'Obese') return TONE.danger.fg;
  return TONE.warning.fg;
}

export function renderCareSnapshotDescriptionItems(patient: Patient): React.ReactElement[] {
  const allergies = patient.medicalHistory?.allergies ?? [];
  const hasAllergies = allergies.length > 0;
  const affiliation = patient.affiliation;
  const coverageActive = isAffiliationActive(affiliation);
  const bmi = calculateBodyMassIndex(patient.height, patient.weight);

  const items: React.ReactElement[] = [
    <DescriptionItem
      key="snapshot-allergies"
      icon={IconKeys.medicalHistory.allergy}
      label="Allergies"
      value={
        <span className={cn(hasAllergies && TONE.danger.fg, 'block')}>
          {formatList(allergies, 'None')}
        </span>
      }
      orientation="vertical"
    />,
  ];

  if (affiliation) {
    items.push(
      <DescriptionItem
        key="coverage"
        icon={IconKeys.ui.verified}
        label="Coverage"
        value={
          <Badge variant={coverageActive ? 'success' : 'danger'} size="xs">
            {coverageActive ? 'Active' : 'Expired'}
          </Badge>
        }
        orientation="vertical"
      />,
      <DescriptionItem
        key="assurance"
        icon={IconKeys.dataFields.document}
        label="Assurance"
        value={affiliation.assuranceNumber || 'N/A'}
        orientation="vertical"
      />,
      <DescriptionItem
        key="coverage-period"
        icon={IconKeys.dataFields.date}
        label="Coverage period"
        value={formatCoveragePeriod(affiliation.startDate, affiliation.endDate, coverageActive)}
        orientation="vertical"
      />
    );
  } else {
    items.push(
      <DescriptionItem
        key="coverage-none"
        icon={IconKeys.ui.shield}
        label="Coverage"
        value="No affiliation"
        orientation="vertical"
      />
    );
  }

  items.push(
    <DescriptionItem
      key="height"
      icon={IconKeys.dataFields.height}
      label="Height"
      value={formatMeasurement(patient.height, 'cm')}
      orientation="vertical"
    />,
    <DescriptionItem
      key="weight"
      icon={IconKeys.dataFields.weight}
      label="Weight"
      value={formatMeasurement(patient.weight, 'kg')}
      orientation="vertical"
    />,
    <DescriptionItem
      key="bmi"
      icon={IconKeys.dataFields.bmi}
      label="BMI"
      value={
        bmi ? (
          <span className={bodyMassTone(bmi.category)}>
            {bmi.value.toFixed(1)} · {bmi.category}
          </span>
        ) : (
          'N/A'
        )
      }
      orientation="vertical"
    />
  );

  return items;
}

export const CareSnapshotSection: React.FC<CareSnapshotSectionProps> = ({ patient }) => {
  return (
    <div className="flex min-h-0 h-full flex-col">
      <DescriptionColumns>{renderCareSnapshotDescriptionItems(patient)}</DescriptionColumns>
    </div>
  );
};

function formatCoveragePeriod(startDate: string, endDate: string, isActive: boolean): React.ReactNode {
  const start = formatDate(startDate) || 'N/A';
  const end = formatDate(endDate) || 'N/A';
  return (
    <span>
      {start} – <span className={isActive ? undefined : TONE.danger.fg}>{end}</span>
    </span>
  );
}
