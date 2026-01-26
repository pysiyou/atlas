/**
 * SingleSelectFilter Component
 * 
 * Self-contained single-select filter with dropdown.
 * Manages its own state and provides a clean interface for single-select operations.
 */

import React from 'react';
import { SingleSelectControl } from '../filter-controls/SingleSelectControl';
import type { SingleSelectFilterControl } from '../types';

/**
 * Props for SingleSelectFilter component
 */
export interface SingleSelectFilterProps {
  /** Currently selected option ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (value: string | null) => void;
  /** Filter configuration */
  config: SingleSelectFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * SingleSelectFilter Component
 * 
 * Wrapper around SingleSelectControl that provides a consistent interface
 * for the filter factory pattern.
 * 
 * @component
 */
export const SingleSelectFilter: React.FC<SingleSelectFilterProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <SingleSelectControl
      value={value}
      onChange={onChange}
      config={config}
      className={className}
    />
  );
};
