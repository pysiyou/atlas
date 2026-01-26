/**
 * SearchFilter Component
 * 
 * Self-contained search filter with debouncing and clear functionality.
 * Manages its own internal state and debouncing logic.
 */

import React from 'react';
import { SearchControl } from '../filter-controls/SearchControl';
import type { SearchFilterControl } from '../types';

/**
 * Props for SearchFilter component
 */
export interface SearchFilterProps {
  /** Current search value */
  value: string;
  /** Callback when search value changes */
  onChange: (value: string) => void;
  /** Filter configuration */
  config: SearchFilterControl;
  /** Custom className */
  className?: string;
}

/**
 * SearchFilter Component
 * 
 * Wrapper around SearchControl that provides a consistent interface
 * for the filter factory pattern.
 * 
 * @component
 */
export const SearchFilter: React.FC<SearchFilterProps> = ({
  value,
  onChange,
  config,
  className,
}) => {
  return (
    <SearchControl
      value={value}
      onChange={onChange}
      placeholder={config.placeholder || `Search ${config.label.toLowerCase()}...`}
      debounceMs={config.debounceMs}
      className={className}
    />
  );
};
