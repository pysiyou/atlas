/**
 * VitalsSection Component
 * 
 * Displays and allows editing of patient vital signs in a modern 3-column grid layout.
 * Includes normal range hints for each vital sign.
 */

import React from 'react';
import { Input } from '@/shared/ui';
import type { VitalSigns } from '@/types/patient';

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
  min: number;
  max: number;
  step: number;
  normalRange: string;
}

const VITALS_CONFIG: VitalConfig[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    min: 30.0,
    max: 45.0,
    step: 0.1,
    normalRange: 'Normal: 36.5-37.3°C',
  },
  {
    key: 'heartRate',
    label: 'Heart Rate',
    unit: 'BPM',
    min: 30,
    max: 250,
    step: 1,
    normalRange: 'Normal: 60-100 BPM',
  },
  {
    key: 'systolicBP',
    label: 'Systolic BP',
    unit: 'mmHg',
    min: 50,
    max: 250,
    step: 1,
    normalRange: 'Normal: <120 mmHg',
  },
  {
    key: 'diastolicBP',
    label: 'Diastolic BP',
    unit: 'mmHg',
    min: 30,
    max: 150,
    step: 1,
    normalRange: 'Normal: <80 mmHg',
  },
  {
    key: 'respiratoryRate',
    label: 'Respiratory Rate',
    unit: '/min',
    min: 4,
    max: 60,
    step: 1,
    normalRange: 'Normal: 12-20 /min',
  },
  {
    key: 'oxygenSaturation',
    label: 'O₂ Saturation',
    unit: '%',
    min: 50,
    max: 100,
    step: 1,
    normalRange: 'Normal: 95-100%',
  },
];

/**
 * VitalsSection - Displays vital signs in a 3-column grid with normal range hints
 */
export const VitalsSection: React.FC<VitalsSectionProps> = ({
  vitalSigns,
  errors = {},
  onFieldChange,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {VITALS_CONFIG.map((config) => {
        const fieldName = config.key;
        const value = vitalSigns[fieldName] || '';
        const error = errors[fieldName];

        return (
          <div key={config.key} className="space-y-1">
            <Input
              label={config.label}
              name={fieldName}
              type="number"
              value={value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFieldChange(fieldName, e.target.value)
              }
              error={error}
              min={config.min}
              max={config.max}
              step={config.step}
              placeholder={`${config.min}-${config.max} ${config.unit}`}
              className="w-full"
            />
            {/* Normal Range Hint */}
            <p className="text-xxs text-gray-400 font-normal ml-0.5">
              {config.normalRange}
            </p>
          </div>
        );
      })}
    </div>
  );
};
