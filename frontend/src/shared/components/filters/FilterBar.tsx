/**
 * FilterBar - Container component for filter controls
 *
 * Provides a consistent layout and styling for filter sections.
 * Supports collapsible filters and result count display.
 */

import React, { useState } from 'react';
import { Icon } from '@/shared/ui';

export interface FilterBarProps {
  /** Filter components to display */
  children: React.ReactNode;
  /** Callback when reset is clicked */
  onReset?: () => void;
  /** Number of results (optional) */
  resultCount?: number;
  /** Whether filters are collapsible */
  collapsible?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * FilterBar component
 *
 * @example
 * ```tsx
 * <FilterBar resultCount={filteredItems.length} onReset={handleReset}>
 *   <SearchFilter value={search} onChange={setSearch} />
 *   <StatusFilter options={statuses} selected={selected} onChange={setSelected} />
 * </FilterBar>
 * ```
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  onReset,
  resultCount,
  collapsible = false,
  defaultExpanded = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`border-b border-gray-200 bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
          {resultCount !== undefined && (
            <span className="text-xs text-gray-500">
              {resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className="text-xs text-sky-600 hover:text-sky-700 font-medium transition-colors"
            >
              Reset All
            </button>
          )}
          {collapsible && (
            <button
              onClick={toggleExpanded}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter content */}
      {(!collapsible || isExpanded) && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
};
