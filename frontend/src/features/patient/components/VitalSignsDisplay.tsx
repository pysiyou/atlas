/**
 * VitalSignsDisplay Component
 * Displays patient vital signs in a modern, card-based layout (read-only)
 */

import React from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui';
import type { VitalSigns } from '@/types/patient';
import { ICONS } from '@/utils';
import { getBadgeAppearance } from '@/shared/theme/theme';

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
    icon: ICONS.dataFields.thermometer,
    normalRange: { min: 36.5, max: 37.3 },
    criticalRange: { min: 30.0, max: 45.0 },
  },
  {
    key: 'heartRate',
    label: 'Heart Rate',
    unit: 'BPM',
    icon: ICONS.dataFields.stethoscope,
    normalRange: { min: 60, max: 100 },
    criticalRange: { min: 30, max: 250 },
  },
  {
    key: 'systolicBP',
    label: 'Systolic BP',
    unit: 'mmHg',
    icon: ICONS.dataFields.medicalKit,
    normalRange: { min: 0, max: 119.9 },
    criticalRange: { min: 50, max: 250 },
  },
  {
    key: 'diastolicBP',
    label: 'Diastolic BP',
    unit: 'mmHg',
    icon: ICONS.dataFields.medicalKit,
    normalRange: { min: 0, max: 79.9 },
    criticalRange: { min: 30, max: 150 },
  },
  {
    key: 'respiratoryRate',
    label: 'Respiratory Rate',
    unit: '/min',
    icon: ICONS.dataFields.health,
    normalRange: { min: 12, max: 20 },
    criticalRange: { min: 4, max: 60 },
  },
  {
    key: 'oxygenSaturation',
    label: 'O₂ Saturation',
    unit: '%',
    icon: ICONS.dataFields.health,
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
 * Gets color classes based on vital sign status and theme appearance
 */
const getStatusColors = (status: VitalStatus, appearance: 'unified' | 'tinted') => {
  if (appearance === 'unified') {
    // Unified: neutral background, colored text/icons
    const base = {
      bg: 'bg-badge',
      border: 'border-stroke shadow-sm',
    };
    switch (status) {
      case 'normal':
        return { ...base, icon: 'text-success-text-strong', value: 'text-success-text-strong', dot: 'bg-success-text-strong' };
      case 'borderline':
        return { ...base, icon: 'text-warning-text-strong', value: 'text-warning-text-strong', dot: 'bg-warning-text-strong' };
      case 'abnormal':
        return { ...base, icon: 'text-danger-fg-strong', value: 'text-danger-fg-strong', dot: 'bg-danger-text-strong' };
    }
  }

  // Tinted: colored backgrounds
  switch (status) {
    case 'normal':
      return {
        bg: 'bg-success-bg',
        border: 'border-success-border',
        icon: 'text-success-text',
        value: 'text-success-text',
        dot: 'bg-success',
      };
    case 'borderline':
      return {
        bg: 'bg-warning-bg',
        border: 'border-warning-border',
        icon: 'text-warning-text',
        value: 'text-warning-text',
        dot: 'bg-warning',
      };
    case 'abnormal':
      return {
        bg: 'bg-danger-bg',
        border: 'border-stroke-error',
        icon: 'text-danger-fg',
        value: 'text-danger-fg',
        dot: 'bg-danger',
      };
  }
};

export const VitalSignsDisplay: React.FC<VitalSignsDisplayProps> = ({ vitalSigns }) => {
  const appearance = getBadgeAppearance();

  if (!vitalSigns) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="text-center">
          <Icon name={ICONS.dataFields.stethoscope} className="w-12 h-12 text-fg-disabled mx-auto mb-2" />
          <p className="text-sm text-fg-subtle">No vital signs recorded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {VITAL_SIGNS_CONFIG.map(config => {
        const value = vitalSigns[config.key];
        // Skip if value is undefined or null (partial vital signs)
        if (value === undefined || value === null) return null;

        const status = getVitalStatus(value, config.normalRange, config.criticalRange);
        const colors = getStatusColors(status, appearance);

        return (
          <div
            key={config.key}
            className={`
              ${colors.bg} ${colors.border}
              border rounded-lg p-3
            `}
          >
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <Icon name={config.icon} className={`w-4 h-4 ${colors.icon} shrink-0`} />
              <span className="text-xs font-medium text-fg-subtle uppercase tracking-wide whitespace-nowrap truncate">
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
