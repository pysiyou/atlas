/**
 * PriceRangeFilter Component
 * 
 * Self-contained price range filter with dual-handle slider.
 * Manages its own state and provides a clean interface for price range selection.
 */

import React from 'react';
import { PriceRangeControl } from '../filter-controls/PriceRangeControl';
import type { PriceRangeFilterControl } from '../types';

/**
 * Props for PriceRangeFilter component
 */
export interface PriceRangeFilterProps {
  /** Current price range value */
  value: [number, number];
  /** Callback when price range changes */
  onChange: (value: [number, number]) => void;
  /** Filter configuration */
  config: PriceRangeFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * PriceRangeFilter Component
 * 
 * Wrapper around PriceRangeControl that provides a consistent interface
 * for the filter factory pattern.
 * 
 * @component
 */
export const PriceRangeFilter: React.FC<PriceRangeFilterProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <PriceRangeControl
      value={value}
      onChange={onChange}
      config={config}
      className={className}
    />
  );
};
