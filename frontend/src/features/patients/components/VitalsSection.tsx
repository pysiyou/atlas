/**
 * VitalsSection — patient vital signs in a 3-column grid with range hints.
 */

import React from 'react';
import { useController, type Control } from 'react-hook-form';
import { Icon, type IconName } from '@/components/primitives';
import type { VitalSigns } from '@/types/patient';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';
import { text, inputBase, inputError, FG } from '@/theme/recipes';
import { FIELD_ERROR, FIELD_ERROR_CAPTION, RADIUS, TONE } from '@/theme/recipes';
import type { PatientFormInput } from '../schemas/patientFormSchemas';
import { patientFieldError } from '../patientFormFieldError';
import { usePatientFormSection } from '../hooks/usePatientFormSection';

export interface VitalsSectionProps {
  emptyKeysReadOnly?: ReadonlySet<string>;
}

interface VitalConfig {
  key: keyof VitalSigns;
  label: string;
  unit: string;
  icon: IconName;
  min: number;
  max: number;
  step: number;
  normalRange: { min: number; max: number };
}

const VITALS_CONFIG: VitalConfig[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    icon: ICONS.dataFields.thermometer,
    min: 30.0,
    max: 45.0,
    step: 0.1,
    normalRange: { min: 36.5, max: 37.3 },
  },
  {
    key: 'heartRate',
    label: 'Heart Rate',
    unit: 'BPM',
    icon: 'stethoscope',
    min: 30,
    max: 250,
    step: 1,
    normalRange: { min: 60, max: 100 },
  },
  {
    key: 'systolicBP',
    label: 'Systolic BP',
    unit: 'mmHg',
    icon: ICONS.dataFields.heartPulse,
    min: 50,
    max: 250,
    step: 1,
    normalRange: { min: 0, max: 119.9 },
  },
  {
    key: 'diastolicBP',
    label: 'Diastolic BP',
    unit: 'mmHg',
    icon: ICONS.dataFields.heartPulse,
    min: 30,
    max: 150,
    step: 1,
    normalRange: { min: 0, max: 79.9 },
  },
  {
    key: 'respiratoryRate',
    label: 'Respiratory Rate',
    unit: '/min',
    icon: ICONS.dataFields.pulse,
    min: 4,
    max: 60,
    step: 1,
    normalRange: { min: 12, max: 20 },
  },
  {
    key: 'oxygenSaturation',
    label: 'O₂ Saturation',
    unit: '%',
    icon: ICONS.dataFields.blood,
    min: 50,
    max: 100,
    step: 1,
    normalRange: { min: 95, max: 100 },
  },
];

const getVitalStatus = (
  value: number | undefined,
  normalRange: { min: number; max: number },
): 'normal' | 'borderline' | 'abnormal' | null => {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return null;
  }
  const { min, max } = normalRange;
  if (value >= min && value <= max) {
    return 'normal';
  }
  let deviation = 0;
  if (value < min) {
    deviation = ((min - value) / min) * 100;
  } else {
    deviation = ((value - max) / max) * 100;
  }
  return deviation <= 20 ? 'borderline' : 'abnormal';
};

const getStatusColors = (status: 'normal' | 'borderline' | 'abnormal' | null) => {
  if (!status) {
    return {
      chrome: 'border-border-strong bg-transparent',
      text: FG.captionMuted,
    };
  }
  switch (status) {
    case 'normal':
      return {
        chrome: cn(TONE.success.well, 'bg-success-bg-emphasis'),
        text: TONE.success.fg,
      };
    case 'borderline':
      return {
        chrome: cn(TONE.warning.well, 'bg-warning-bg-emphasis'),
        text: TONE.warning.fg,
      };
    case 'abnormal':
      return {
        chrome: cn(TONE.danger.well, 'bg-danger-bg-emphasis'),
        text: TONE.danger.fg,
      };
  }
};

type VitalFieldName = `vitalSigns.${keyof VitalSigns}`;

interface VitalSignFieldProps {
  control: Control<PatientFormInput>;
  config: VitalConfig;
  error?: string;
  emptyKeysReadOnly?: ReadonlySet<string>;
}

const VitalSignField: React.FC<VitalSignFieldProps> = ({
  control,
  config,
  error,
  emptyKeysReadOnly,
}) => {
  const fieldName = config.key as keyof VitalSigns;
  const name = `vitalSigns.${fieldName}` as VitalFieldName;
  const { field } = useController({ control, name });

  const displayValue =
    field.value !== undefined && field.value !== null ? String(field.value) : '';
  const numericValue =
    field.value !== undefined && field.value !== null ? Number(field.value) : undefined;
  const status = getVitalStatus(numericValue, config.normalRange);
  const statusColors = getStatusColors(status);
  const isAbnormal = status === 'abnormal';
  const isNa = !displayValue && emptyKeysReadOnly?.has(fieldName);
  const refRange = `${config.normalRange.min}-${config.normalRange.max}`;

  return (
    <div className="group">
      <div className="flex justify-between items-baseline mb-space-1 gap-space-2">
        <label
          htmlFor={isNa ? undefined : `vital-${fieldName}`}
          className={cn(
            text({ role: 'body' }),
            'truncate min-w-0',
            FG.captionMuted,
            isNa ? 'cursor-default' : 'cursor-pointer',
          )}
        >
          {config.label}
        </label>
        <div className="flex items-center gap-space-1 min-w-0 shrink-0 max-w-[50%]">
          {isAbnormal && !isNa && (
            <Icon
              name={ICONS.actions.dangerSquare}
              className={`w-3 h-3 ${TONE.danger.fg} shrink-0`}
            />
          )}
          <span className={`${text({ role: 'caption' })} truncate`}>Ref: {refRange}</span>
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-space-3 flex items-center pointer-events-none z-10">
          <Icon
            name={config.icon}
            className={cn(
              'w-4 h-4 shrink-0 transition-colors',
              isNa ? `${FG.muted}/70` : `${FG.muted} group-hover:text-brand`,
            )}
          />
        </div>

        {isNa ? (
          <div
            className={cn(
              'w-full',
              RADIUS.field,
              'border border-border-default bg-surface-hover/30 px-space-3 py-space-1-5',
              text({ role: 'amount' }),
              FG.captionMuted,
              'pl-space-10 pr-space-12',
            )}
            aria-label={`${config.label} not provided`}
          >
            N/A
          </div>
        ) : (
          <>
            <input
              id={`vital-${fieldName}`}
              name={fieldName}
              type="number"
              value={displayValue}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                field.onChange(raw === '' ? undefined : parseFloat(raw));
              }}
              min={config.min}
              max={config.max}
              step={config.step}
              placeholder="--"
              className={cn(
                inputBase,
                'pl-space-10 pr-space-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0',
                error && inputError,
                status && statusColors.chrome,
              )}
            />
            <div className="absolute inset-y-0 right-0 pr-space-3 flex items-center pointer-events-none max-w-[40%]">
              <span className={`${text({ role: 'body', intent: 'muted' })} select-none truncate`}>
                {config.unit}
              </span>
            </div>
            {isAbnormal && (
              <div className={`absolute -bottom-space-5 left-0 ${FIELD_ERROR_CAPTION} font-normal`}>
                Abnormal value
              </div>
            )}
          </>
        )}
      </div>

      {error && <p className={`mt-space-1 ${FIELD_ERROR}`}>{error}</p>}
    </div>
  );
};

export const VitalsSection: React.FC<VitalsSectionProps> = ({ emptyKeysReadOnly }) => {
  const { control, errors } = usePatientFormSection();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-6">
      {VITALS_CONFIG.map(config => (
        <VitalSignField
          key={config.key}
          control={control}
          config={config}
          error={patientFieldError(errors, `vitalSigns.${config.key}`)}
          emptyKeysReadOnly={emptyKeysReadOnly}
        />
      ))}
    </div>
  );
};
