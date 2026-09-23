/**
 * CareSnapshotSection
 * High-signal facts in a two-column vertical flow.
 */

import React from 'react';
import { Badge, DetailField } from '@/components';
import { TONE } from '@/components/theme/recipes';
import type { Patient, VitalSigns } from '@/types';
import { cn, formatDate } from '@/utils';
import { ICONS } from '@/config/icons';
import { isAffiliationActive } from '../utils/patientHelpers';
import {
  calculateBodyMassIndex,
  formatList,
  formatMeasurement,
} from '../utils/patientFormatters';
import { DetailFieldsColumnFlow } from '@/components';

export interface CareSnapshotSectionProps {
  patient: Patient;
}

function bodyMassTone(category: string): string {
  if (category === 'Normal') return TONE.success.fg;
  if (category === 'Obese') return TONE.danger.fg;
  return TONE.warning.fg;
}

function formatBloodPressure(
  systolic: number | null | undefined,
  diastolic: number | null | undefined
): string | null {
  const hasSystolic = typeof systolic === 'number' && Number.isFinite(systolic);
  const hasDiastolic = typeof diastolic === 'number' && Number.isFinite(diastolic);
  if (!hasSystolic && !hasDiastolic) return null;
  if (hasSystolic && hasDiastolic) return `${systolic}/${diastolic} mmHg`;
  if (hasSystolic) return `${systolic} mmHg systolic`;
  return `${diastolic} mmHg diastolic`;
}

function hasNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export const CareSnapshotSection: React.FC<CareSnapshotSectionProps> = ({ patient }) => {
  const allergies = patient.medicalHistory?.allergies ?? [];
  const hasAllergies = allergies.length > 0;
  const affiliation = patient.affiliation;
  const coverageActive = isAffiliationActive(affiliation);
  const bmi = calculateBodyMassIndex(patient.height, patient.weight);
  const vitals = patient.vitalSigns;
  const temperature = vitals?.temperature;
  const heartRate = vitals?.heartRate;
  const respiratoryRate = vitals?.respiratoryRate;
  const oxygenSaturation = vitals?.oxygenSaturation;
  const bloodPressure = formatBloodPressure(vitals?.systolicBP, vitals?.diastolicBP);
  const hasVitals = hasRecordedVitals(vitals);

  return (
    <div className="flex min-h-0 h-full flex-col">
      <DetailFieldsColumnFlow>
        <DetailField
          icon={ICONS.medicalHistory.allergy}
          label="Allergies"
          value={
            <span className={cn(hasAllergies && TONE.danger.fg, 'block')}>
              {formatList(allergies, 'None')}
            </span>
          }
          orientation="vertical"
        />

        {affiliation ? (
          <>
            <DetailField
              icon={ICONS.ui.shieldCheck}
              label="Coverage"
              value={
                <Badge variant={coverageActive ? 'success' : 'danger'} size="xs">
                  {coverageActive ? 'Active' : 'Expired'}
                </Badge>
              }
              orientation="vertical"
            />
            <DetailField
              icon={ICONS.dataFields.document}
              label="Assurance"
              value={affiliation.assuranceNumber || 'N/A'}
              orientation="vertical"
            />
            <DetailField
              icon={ICONS.dataFields.date}
              label="Coverage period"
              value={formatCoveragePeriod(
                affiliation.startDate,
                affiliation.endDate,
                coverageActive
              )}
              orientation="vertical"
            />
          </>
        ) : (
          <DetailField
            icon={ICONS.ui.shield}
            label="Coverage"
            value="No affiliation"
            orientation="vertical"
          />
        )}

        <DetailField
          icon={ICONS.dataFields.height}
          label="Height"
          value={formatMeasurement(patient.height, 'cm')}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.weight}
          label="Weight"
          value={formatMeasurement(patient.weight, 'kg')}
          orientation="vertical"
        />
        <DetailField
          icon={ICONS.dataFields.health}
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

        {hasVitals ? (
          <>
            {hasNumber(temperature) && (
              <DetailField
                icon={ICONS.dataFields.thermometer}
                label="Temperature"
                value={`${temperature} °C`}
                orientation="vertical"
              />
            )}
            {hasNumber(heartRate) && (
              <DetailField
                icon={ICONS.dataFields.heartPulse}
                label="Heart Rate"
                value={`${heartRate} bpm`}
                orientation="vertical"
              />
            )}
            {bloodPressure && (
              <DetailField
                icon={ICONS.dataFields.heartPulse}
                label="Blood Pressure"
                value={bloodPressure}
                orientation="vertical"
              />
            )}
            {hasNumber(respiratoryRate) && (
              <DetailField
                icon={ICONS.dataFields.pulse}
                label="Respiratory Rate"
                value={`${respiratoryRate} /min`}
                orientation="vertical"
              />
            )}
            {hasNumber(oxygenSaturation) && (
              <DetailField
                icon={ICONS.dataFields.blood}
                label="O₂ Saturation"
                value={`${oxygenSaturation}%`}
                orientation="vertical"
              />
            )}
          </>
        ) : (
          <DetailField
            icon={ICONS.dataFields.stethoscope}
            label="Vitals"
            value="Not recorded"
            orientation="vertical"
          />
        )}
      </DetailFieldsColumnFlow>
    </div>
  );
};

function hasRecordedVitals(vitals: VitalSigns | null | undefined): boolean {
  if (!vitals) return false;
  return (
    hasNumber(vitals.temperature) ||
    hasNumber(vitals.heartRate) ||
    hasNumber(vitals.systolicBP) ||
    hasNumber(vitals.diastolicBP) ||
    hasNumber(vitals.respiratoryRate) ||
    hasNumber(vitals.oxygenSaturation)
  );
}

function formatCoveragePeriod(startDate: string, endDate: string, isActive: boolean): React.ReactNode {
  const start = formatDate(startDate) || 'N/A';
  const end = formatDate(endDate) || 'N/A';
  return (
    <span>
      {start} – <span className={isActive ? undefined : TONE.danger.fg}>{end}</span>
    </span>
  );
}
