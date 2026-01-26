/**
 * AgeRangeFilter Component
 * 
 * Self-contained age range filter with dual-handle slider.
 * Manages its own state and provides a clean interface for age range selection.
 */

import React from 'react';
import { AgeRangeControl } from '../filter-controls/AgeRangeControl';
import type { AgeRangeFilterControl } from '../types';

/**
 * Props for AgeRangeFilter component
 */
export interface AgeRangeFilterProps {
  /** Current age range value */
  value: [number, number];
  /** Callback when age range changes */
  onChange: (value: [number, number]) => void;
  /** Filter configuration */
  config: AgeRangeFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * AgeRangeFilter Component
 * 
 * Wrapper around AgeRangeControl that provides a consistent interface
 * for the filter factory pattern.
 * 
 * @component
 */
export const AgeRangeFilter: React.FC<AgeRangeFilterProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <AgeRangeControl
      value={value}
      onChange={onChange}
      config={config}
      className={className}
    />
  );
};
