/**
 * VitalsSection Component
 *
 * Displays and allows editing of patient vital signs in a modern 3-column grid layout.
 * Includes normal range hints for each vital sign.
 */

import React from 'react';
import { Icon, type IconName } from '@/shared/ui';
import type { VitalSigns } from '@/types/patient';
import { ICONS } from '@/utils/icon-mappings';

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
        border: 'border-green-300',
        text: 'text-success',
        bg: 'bg-green-100',
      };
    case 'borderline':
      return {
        border: 'border-yellow-300',
        text: 'text-warning',
        bg: 'bg-yellow-100',
      };
    case 'abnormal':
      return {
        border: 'border-red-300',
        text: 'text-danger',
        bg: 'bg-red-100',
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

        // Format reference range for display
        const refRange = `${config.normalRange.min}-${config.normalRange.max}`;

        return (
          <div key={config.key} className="group">
            {/* Label and reference range row */}
            <div className="flex justify-between items-baseline mb-1 gap-2">
              <label
                htmlFor={`vital-${fieldName}`}
                className="text-xxs font-medium text-text-tertiary cursor-pointer truncate min-w-0"
              >
                {config.label}
              </label>

              <div className="flex items-center gap-1 min-w-0 shrink-0 max-w-[50%]">
                {isAbnormal && (
                  <Icon name={ICONS.actions.dangerSquare} className="w-3 h-3 text-danger shrink-0" />
                )}
                <span className="text-xxs text-text-disabled truncate">Ref: {refRange}</span>
              </div>
            </div>

            {/* Input wrapper with relative positioning */}
            <div className="relative">
              {/* Icon (left, matches shared Input pattern; z-10 so it stacks above input) */}
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                <Icon name={config.icon} className="w-4 h-4 text-text-disabled shrink-0" />
              </div>

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
                  w-full rounded border px-3 py-1.5 text-sm bg-surface pl-10
                  ${error ? 'border-danger focus:border-danger focus:ring-2 focus:ring-danger/20' : 'border-border focus:border-brand focus:ring-2 focus:ring-brand/20'}
                  pr-12
                  [appearance:textfield]
                  [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0
                  [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0
                  ${status ? statusColors.border : ''}
                  ${status ? statusColors.bg : ''}
                `}
              />

              {/* Unit display (absolute positioned) */}
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none max-w-[40%]">
                <span className="text-xs text-text-disabled select-none truncate">{config.unit}</span>
              </div>

              {/* Abnormal value alert (absolute positioned below input) */}
              {isAbnormal && (
                <div className="absolute -bottom-5 left-0 text-xxs text-danger font-medium">
                  Abnormal value
                </div>
              )}
            </div>

            {/* Error message */}
            {error && <p className="mt-1 text-sm text-danger">{error}</p>}
          </div>
        );
      })}
    </div>
  );
};
