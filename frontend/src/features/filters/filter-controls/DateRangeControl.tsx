/**
 * DateRangeControl Component
 * Enhanced date range picker for filters
 */

import React from 'react';
import { DateFilter } from '@/shared/ui';
import type { DateRangeFilterControl } from '../types';

/**
 * Props for DateRangeControl component
 */
export interface DateRangeControlProps {
  /** Current date range value */
  value: [Date, Date] | null;
  /** Callback when date range changes */
  onChange: (value: [Date, Date] | null) => void;
  /** Filter control configuration */
  config: DateRangeFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * DateRangeControl Component
 *
 * Wraps the existing DateFilter component with the new filter control interface.
 *
 * @component
 */
export const DateRangeControl: React.FC<DateRangeControlProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <DateFilter
      value={value}
      onChange={onChange}
      placeholder={config.placeholder || 'Filter by date range'}
      className={className}
    />
  );
};
