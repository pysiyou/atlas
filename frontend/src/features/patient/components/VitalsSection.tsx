/**
 * VitalsSection Component
 *
 * Displays and allows editing of patient vital signs in a modern 3-column grid layout.
 * Includes normal range hints for each vital sign.
 */

import React from 'react';
import { Icon, type IconName } from '@/shared/ui';
import type { VitalSigns } from '@/types/patient';
import { ICONS } from '@/utils';

export interface VitalsSectionProps {
  /** Current vital signs data */
  vitalSigns: {
    temperature?: string;
    heartRate?: string;
    systolicBP?: string;
    diastolicBP?: string;
    respiratoryRate?: string;
    oxygenSaturation?: string;
  };
  /** Form errors */
  errors?: Record<string, string>;
  /** Callback when a field changes */
  onFieldChange: (field: string, value: string) => void;
  /** Keys that have no value from patient (partial vitals): show N/A and disable */
  emptyKeysReadOnly?: ReadonlySet<string>;
}

/**
 * Vital sign configuration with normal ranges and validation
 */
interface VitalConfig {
  key: keyof VitalSigns;
  label: string;
  unit: string;
  icon: IconName;
  min: number;
  max: number;
  step: number;
  normalRange: { min: number; max: number };
  normalRangeText: string;
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
    normalRangeText: 'Normal: 36.5-37.3°C',
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
    normalRangeText: 'Normal: 60-100 BPM',
  },
  {
    key: 'systolicBP',
    label: 'Systolic BP',
    unit: 'mmHg',
    icon: ICONS.dataFields.heartPulse,
    min: 50,
    max: 250,
    step: 1,
    normalRange: { min: 0, max: 119.9 }, // Normal: <120
    normalRangeText: 'Normal: <120 mmHg',
  },
  {
    key: 'diastolicBP',
    label: 'Diastolic BP',
    unit: 'mmHg',
    icon: ICONS.dataFields.heartPulse,
    min: 30,
    max: 150,
    step: 1,
    normalRange: { min: 0, max: 79.9 }, // Normal: <80
    normalRangeText: 'Normal: <80 mmHg',
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
    normalRangeText: 'Normal: 12-20 /min',
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
    normalRangeText: 'Normal: 95-100%',
  },
];

/**
 * Determine vital sign status based on value and normal range
 */
const getVitalStatus = (
  value: number | undefined,
  normalRange: { min: number; max: number }
): 'normal' | 'borderline' | 'abnormal' | null => {
  if (value === undefined || value === null || isNaN(value)) {
    return null;
  }

  const { min, max } = normalRange;

  // Check if within normal range
  if (value >= min && value <= max) {
    return 'normal';
  }

  // Calculate how far outside normal range (percentage)
  let deviation = 0;
  if (value < min) {
    deviation = ((min - value) / min) * 100;
  } else {
    deviation = ((value - max) / max) * 100;
  }

  // Borderline: within 20% of normal range
  // Abnormal: more than 20% outside normal range
  if (deviation <= 20) {
    return 'borderline';
  }

  return 'abnormal';
};

/**
 * Get status colors for vital sign indicators
 */
const getStatusColors = (status: 'normal' | 'borderline' | 'abnormal' | null) => {
  if (!status) {
    return {
      border: 'border-border-strong',
      text: 'text-text-tertiary',
      bg: 'bg-transparent',
    };
  }

  switch (status) {
    case 'normal':
      return {
        border: 'border-feedback-success-border',
        text: 'text-feedback-success-text',
        bg: 'bg-feedback-success-bg-strong',
      };
    case 'borderline':
      return {
        border: 'border-feedback-warning-border',
        text: 'text-feedback-warning-text',
        bg: 'bg-feedback-warning-bg-strong',
      };
    case 'abnormal':
      return {
        border: 'border-feedback-danger-border',
        text: 'text-feedback-danger-text',
        bg: 'bg-feedback-danger-bg-strong',
      };
  }
};

/**
 * VitalsSection - Displays vital signs in a 3-column grid matching result entry form layout
 */
export const VitalsSection: React.FC<VitalsSectionProps> = ({
  vitalSigns,
  errors = {},
  onFieldChange,
  emptyKeysReadOnly,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {VITALS_CONFIG.map(config => {
        const fieldName = config.key;
        const value = vitalSigns[fieldName] || '';
        const error = errors[fieldName];
        const numericValue = value ? parseFloat(value) : undefined;
        const status = getVitalStatus(numericValue, config.normalRange);
        const statusColors = getStatusColors(status);
        const isAbnormal = status === 'abnormal';
        const isNa = !value && emptyKeysReadOnly?.has(fieldName);

        const refRange = `${config.normalRange.min}-${config.normalRange.max}`;

        return (
          <div key={config.key} className="group">
            <div className="flex justify-between items-baseline mb-1 gap-2">
              <label
                htmlFor={isNa ? undefined : `vital-${fieldName}`}
                className={`text-xs font-medium truncate min-w-0 ${isNa ? 'text-text-tertiary cursor-default' : 'text-text-tertiary cursor-pointer'}`}
              >
                {config.label}
              </label>
              <div className="flex items-center gap-1 min-w-0 shrink-0 max-w-[50%]">
                {isAbnormal && !isNa && (
                  <Icon name={ICONS.actions.dangerSquare} className="w-3 h-3 text-feedback-danger-text shrink-0" />
                )}
                <span className="text-xxs text-text-tertiary truncate">Ref: {refRange}</span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Icon name={config.icon} className={`w-4 h-4 shrink-0 ${isNa ? 'text-text-muted/70' : 'text-text-muted'}`} />
              </div>

              {isNa ? (
                <div
                  className="w-full rounded border border-border-default bg-muted/30 px-3 py-1.5 text-sm pl-10 pr-12 text-text-tertiary"
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
                    value={value}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      onFieldChange(fieldName, e.target.value)
                    }
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    placeholder="--"
                    className={`
                      w-full rounded border px-3 py-1.5 text-sm bg-surface-default pl-10
                      ${error ? 'border-border-error focus:border-border-error focus:ring-2 focus:ring-action-danger focus:ring-opacity-20' : 'border-border-default focus:border-action-primary focus:ring-2 focus:ring-action-primary focus:ring-opacity-20'}
                      pr-12
                      [appearance:textfield]
                      [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0
                      [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0
                      ${status ? statusColors.border : ''}
                      ${status ? statusColors.bg : ''}
                    `}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none max-w-[40%]">
                    <span className="text-xs text-text-tertiary select-none truncate">{config.unit}</span>
                  </div>
                  {isAbnormal && (
                    <div className="absolute -bottom-5 left-0 text-xxs text-feedback-danger-text font-medium">
                      Abnormal value
                    </div>
                  )}
                </>
              )}
            </div>

            {error && <p className="mt-1 text-sm text-feedback-danger-text">{error}</p>}
          </div>
        );
      })}
    </div>
  );
};
