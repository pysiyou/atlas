/**
 * FilterBar - Container component for filter controls
 *
 * Provides a consistent layout and styling for filter sections.
 * Supports collapsible filters and result count display.
 */

import React, { useState } from 'react';
import { Icon } from '@/shared/ui';
import { ICONS } from '@/utils/icon-mappings';
import { filterComponents } from '@/shared/design-system/tokens/components/shared';

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
    <div className={`${filterComponents.bar.container} ${className}`}>
      {/* Header */}
      <div className={filterComponents.bar.header}>
        <div className="flex items-center gap-3">
          <h3 className={filterComponents.bar.title}>Filters</h3>
          {resultCount !== undefined && (
            <span className={filterComponents.resultCount}>
              {resultCount.toLocaleString()} result{resultCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onReset && (
            <button
              onClick={onReset}
              className={filterComponents.bar.resetButton}
            >
              Reset All
            </button>
          )}
          {collapsible && (
            <button
              onClick={toggleExpanded}
              className={filterComponents.bar.toggleButton}
              aria-label={isExpanded ? 'Collapse filters' : 'Expand filters'}
            >
              <Icon name={isExpanded ? ICONS.actions.chevronUp : ICONS.actions.chevronDown} className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter content */}
      {(!collapsible || isExpanded) && <div className={filterComponents.bar.content}>{children}</div>}
    </div>
  );
};
