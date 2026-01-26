/**
 * MultiSelectFilter Component
 * 
 * Self-contained multi-select filter with dropdown.
 * Manages its own state and provides a clean interface for multi-select operations.
 */

import React from 'react';
import { MultiSelectControl } from '../filter-controls/MultiSelectControl';
import type { MultiSelectFilterControl } from '../types';

/**
 * Props for MultiSelectFilter component
 */
export interface MultiSelectFilterProps {
  /** Currently selected option IDs */
  value: string[];
  /** Callback when selection changes */
  onChange: (value: string[]) => void;
  /** Filter configuration */
  config: MultiSelectFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * MultiSelectFilter Component
 * 
 * Wrapper around MultiSelectControl that provides a consistent interface
 * for the filter factory pattern.
 * 
 * @component
 */
export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <MultiSelectControl
      value={value}
      onChange={onChange}
      config={config}
      className={className}
    />
  );
};
