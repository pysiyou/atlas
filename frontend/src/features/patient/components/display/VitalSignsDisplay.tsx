/**
 * VitalSignsDisplay Component
 * Displays patient vital signs in a modern, card-based layout (read-only)
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';
import type { VitalSigns } from '@/types/patient';

export interface VitalSignsDisplayProps {
  vitalSigns?: VitalSigns;
}

type VitalStatus = 'normal' | 'borderline' | 'abnormal';

interface VitalSignConfig {
  key: keyof VitalSigns;
  label: string;
  unit: string;
  icon: IconName;
  normalRange: { min: number; max: number };
  criticalRange: { min: number; max: number };
}

const VITAL_SIGNS_CONFIG: VitalSignConfig[] = [
  {
    key: 'temperature',
    label: 'Temperature',
    unit: '°C',
    icon: 'thermometer-landing-page',
    normalRange: { min: 36.5, max: 37.3 },
    criticalRange: { min: 30.0, max: 45.0 },
  },
  {
    key: 'heartRate',
    label: 'Heart Rate',
    unit: 'BPM',
    icon: 'stethoscope',
    normalRange: { min: 60, max: 100 },
    criticalRange: { min: 30, max: 250 },
  },
  {
    key: 'systolicBP',
    label: 'Systolic BP',
    unit: 'mmHg',
    icon: 'medical-kit',
    normalRange: { min: 0, max: 119.9 },
    criticalRange: { min: 50, max: 250 },
  },
  {
    key: 'diastolicBP',
    label: 'Diastolic BP',
    unit: 'mmHg',
    icon: 'medical-kit',
    normalRange: { min: 0, max: 79.9 },
    criticalRange: { min: 30, max: 150 },
  },
  {
    key: 'respiratoryRate',
    label: 'Respiratory Rate',
    unit: '/min',
    icon: 'health',
    normalRange: { min: 12, max: 20 },
    criticalRange: { min: 4, max: 60 },
  },
  {
    key: 'oxygenSaturation',
    label: 'O₂ Saturation',
    unit: '%',
    icon: 'health',
    normalRange: { min: 95, max: 100 },
    criticalRange: { min: 50, max: 100 },
  },
];

/**
 * Determines the status of a vital sign based on normal ranges
 */
const getVitalStatus = (
  value: number,
  normalRange: { min: number; max: number },
  criticalRange?: { min: number; max: number }
): VitalStatus => {
  if (criticalRange) {
    if (value < criticalRange.min || value > criticalRange.max) {
      return 'abnormal';
    }
  }
  if (value >= normalRange.min && value <= normalRange.max) {
    return 'normal';
  }
  return 'borderline';
};

/**
 * Gets color classes based on vital sign status
 */
const getStatusColors = (status: VitalStatus) => {
  switch (status) {
    case 'normal':
      return {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        icon: 'text-emerald-600',
        value: 'text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case 'borderline':
      return {
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        icon: 'text-amber-600',
        value: 'text-amber-700',
        dot: 'bg-amber-500',
      };
    case 'abnormal':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'text-red-600',
        value: 'text-red-700',
        dot: 'bg-red-500',
      };
  }
};

export const VitalSignsDisplay: React.FC<VitalSignsDisplayProps> = ({ vitalSigns }) => {
  if (!vitalSigns) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <Icon name="stethoscope" className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No vital signs recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {VITAL_SIGNS_CONFIG.map(config => {
        const value = vitalSigns[config.key];
        if (value === undefined) return null;

        const status = getVitalStatus(value, config.normalRange, config.criticalRange);
        const colors = getStatusColors(status);

        return (
          <div
            key={config.key}
            className={`
              ${colors.bg} ${colors.border}
              border rounded-lg p-3
              transition-all duration-200
              hover:shadow-sm
            `}
          >
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <Icon name={config.icon} className={`w-4 h-4 ${colors.icon} shrink-0`} />
              <span className="text-xs font-medium text-gray-700 uppercase tracking-wide whitespace-nowrap truncate">
                {config.label}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-1 min-w-0">
                <span className={`text-xl font-bold ${colors.value} leading-none`}>
                  {value.toFixed(config.key === 'temperature' ? 1 : 0)}
                </span>
                <span className={`text-xs font-medium ${colors.value} opacity-70`}>
                  {config.unit}
                </span>
              </div>
              <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
