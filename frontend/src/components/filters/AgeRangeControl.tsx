/**
 * AgeRangeControl — filter-factory adapter for AgeFilter.
 */

import React from 'react';
import { AgeFilter } from './AgeFilter';
import type { AgeRangeFilterControl } from './types';

export interface AgeRangeControlProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  config: AgeRangeFilterControl;
  className?: string;
  histogram?: number[];
}

export const AgeRangeControl: React.FC<AgeRangeControlProps> = ({
  value,
  onChange,
  config,
  className,
  histogram,
}) => (
  <AgeFilter
    value={value}
    onChange={onChange}
    min={config.min ?? 0}
    max={config.max ?? 150}
    placeholder={config.placeholder || 'Filter by age range'}
    className={className}
    histogram={histogram}
  />
);
