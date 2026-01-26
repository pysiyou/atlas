/**
 * DateRangeFilter Component
 * 
 * Self-contained date range filter with calendar picker.
 * Manages its own state and provides a clean interface for date range selection.
 */

import React from 'react';
import { DateRangeControl } from '../filter-controls/DateRangeControl';
import type { DateRangeFilterControl } from '../types';

/**
 * Props for DateRangeFilter component
 */
export interface DateRangeFilterProps {
  /** Current date range value */
  value: [Date, Date] | null;
  /** Callback when date range changes */
  onChange: (value: [Date, Date] | null) => void;
  /** Filter configuration */
  config: DateRangeFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * DateRangeFilter Component
 * 
 * Wrapper around DateRangeControl that provides a consistent interface
 * for the filter factory pattern.
 * 
 * @component
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <DateRangeControl
      value={value}
      onChange={onChange}
      config={config}
      className={className}
    />
  );
};
