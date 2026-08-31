/**
 * FilterFactory — renders the appropriate filter control for the bar (FilterBar).
 * Dispatch lives in utils/renderFilterControl; bar and modal share the same control map.
 */

import React from 'react';
import type { FilterControl, FilterValues } from '../types';
import { renderFilterControl } from '../utils/renderFilterControl';

export interface FilterFactoryProps {
  control: FilterControl;
  value: FilterValues;
  onChange: (key: string, value: unknown) => void;
  className?: string;
}

export const FilterFactory: React.FC<FilterFactoryProps> = ({
  control,
  value,
  onChange,
  className,
}) => {
  const filterValue = value[control.key];
  const handleChange = (newValue: unknown) => onChange(control.key, newValue);
  return (
    <>
      {renderFilterControl(control, filterValue, handleChange, {
        variant: 'bar',
        className,
      })}
    </>
  );
};
