/**
 * StatusFilter - Multi-select status filter component
 *
 * Provides a consistent multi-select filter for status-based filtering.
 * Supports custom badge rendering for visual feedback.
 */

import React from 'react';
import { Badge } from '@/shared/ui';
import type { BadgeVariant } from '@/shared/ui/Badge';
import { filterComponents } from '@/shared/design-system/tokens/components/shared';

export interface StatusFilterProps<T extends string> {
  /** Filter label */
  label: string;
  /** Available status options */
  options: readonly T[];
  /** Currently selected statuses */
  selected: T[];
  /** Change handler */
  onChange: (selected: T[]) => void;
  /** Custom badge renderer (optional) */
  renderBadge?: (status: T) => React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatusFilter component
 *
 * @example
 * ```tsx
 * <StatusFilter
 *   label="Order Status"
 *   options={['pending', 'in-progress', 'completed']}
 *   selected={statusFilters}
 *   onChange={setStatusFilters}
 * />
 * ```
 */
export function StatusFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
  renderBadge,
  className = '',
}: StatusFilterProps<T>) {
  const toggleStatus = (status: T) => {
    if (selected.includes(status)) {
      onChange(selected.filter(s => s !== status));
    } else {
      onChange([...selected, status]);
    }
  };

  const selectAll = () => {
    onChange([...options]);
  };

  const clearAll = () => {
    onChange([]);
  };

  const allSelected = selected.length === options.length;
  const noneSelected = selected.length === 0;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header with label and actions */}
      <div className="flex items-center justify-between">
        <label className={filterComponents.label}>{label}</label>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            disabled={allSelected}
            className={filterComponents.link}
          >
            All
          </button>
          <span className={filterComponents.separator}>|</span>
          <button
            onClick={clearAll}
            disabled={noneSelected}
            className={filterComponents.link}
          >
            None
          </button>
        </div>
      </div>

      {/* Status options */}
      <div className="flex flex-wrap gap-2">
        {options.map(status => {
          const isSelected = selected.includes(status);

          return (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`transition-all ${
                isSelected ? 'opacity-100 scale-100' : 'opacity-50 scale-95 hover:opacity-75'
              }`}
            >
              {renderBadge ? (
                renderBadge(status)
              ) : (
                <Badge variant={status as BadgeVariant} size="sm">
                  {status}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      {!noneSelected && (
        <div className={filterComponents.resultCount}>
          {selected.length} of {options.length} selected
        </div>
      )}
    </div>
  );
}
