/**
 * FilterFactory Component
 * 
 * Factory component that dynamically renders the appropriate filter control
 * based on the filter configuration type. This provides a clean abstraction
 * for rendering different filter types without complex switch statements.
 */

import React from 'react';
import type { FilterControl, FilterValues } from './types';
import {
  SearchFilter,
  DateRangeFilter,
  AgeRangeFilter,
  PriceRangeFilter,
  MultiSelectFilter,
  SingleSelectFilter,
} from './filters';

/**
 * Props for FilterFactory component
 */
export interface FilterFactoryProps {
  /** Filter control configuration */
  control: FilterControl;
  /** Current filter values */
  value: FilterValues;
  /** Callback when filter value changes */
  onChange: (key: string, value: unknown) => void;
  /** Custom className */
  className?: string;
}

/**
 * FilterFactory Component
 * 
 * Renders the appropriate filter component based on the control type.
 * Each filter component is self-contained and manages its own UI and interactions.
 * 
 * @component
 */
export const FilterFactory: React.FC<FilterFactoryProps> = ({
  control,
  value,
  onChange,
  className,
}) => {
  // Get the current value for this filter
  const filterValue = value[control.key];

  // Handle value changes
  const handleChange = (newValue: unknown) => {
    onChange(control.key, newValue);
  };

  // Render the appropriate filter component based on type
  switch (control.type) {
    case 'search':
      return (
        <SearchFilter
          value={(filterValue as string) || ''}
          onChange={handleChange}
          config={control}
          className={className}
        />
      );

    case 'dateRange':
      return (
        <DateRangeFilter
          value={(filterValue as [Date, Date] | null) || null}
          onChange={handleChange}
          config={control}
          className={className}
        />
      );

    case 'ageRange':
      return (
        <AgeRangeFilter
          value={(filterValue as [number, number]) || [control.min ?? 0, control.max ?? 150]}
          onChange={handleChange}
          config={control}
          className={className}
        />
      );

    case 'priceRange':
      return (
        <PriceRangeFilter
          value={(filterValue as [number, number]) || [control.min ?? 0, control.max ?? 10000]}
          onChange={handleChange}
          config={control}
          className={className}
        />
      );

    case 'multiSelect':
      return (
        <MultiSelectFilter
          value={(filterValue as string[]) || []}
          onChange={handleChange}
          config={control}
          className={className}
        />
      );

    case 'singleSelect':
      return (
        <SingleSelectFilter
          value={(filterValue as string | null) || null}
          onChange={handleChange}
          config={control}
          className={className}
        />
      );

    default: {
      // TypeScript exhaustiveness check
      const _exhaustive: never = control;
      console.warn('Unknown filter control type:', _exhaustive);
      return null;
    }
  }
};
