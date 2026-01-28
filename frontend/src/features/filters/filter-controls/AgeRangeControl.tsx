/**
 * AgeRangeControl Component
 * Enhanced age range slider for filters
 */

import React from 'react';
import { AgeFilter } from '@/features/patient/components/AgeFilter';
import type { AgeRangeFilterControl } from '../types';

/**
 * Props for AgeRangeControl component
 */
export interface AgeRangeControlProps {
  /** Current age range value */
  value: [number, number];
  /** Callback when age range changes */
  onChange: (value: [number, number]) => void;
  /** Filter control configuration */
  config: AgeRangeFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * AgeRangeControl Component
 *
 * Wraps the existing AgeFilter component with the new filter control interface.
 *
 * @component
 */
export const AgeRangeControl: React.FC<AgeRangeControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <AgeFilter
      value={value}
      onChange={onChange}
      min={config.min ?? 0}
      max={config.max ?? 150}
      placeholder={config.placeholder || 'Filter by age range'}
      className={className}
    />
  );
};
