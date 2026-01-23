/**
 * StatusFilter - Multi-select status filter component
 *
 * Provides a consistent multi-select filter for status-based filtering.
 * Supports custom badge rendering for visual feedback.
 */

import React from 'react';
import { Badge } from '@/shared/ui';
import type { BadgeVariant } from '@/shared/ui/Badge';

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
        <label className="text-xs font-medium text-gray-700">{label}</label>
        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            disabled={allSelected}
            className="text-xs text-sky-600 hover:text-sky-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearAll}
            disabled={noneSelected}
            className="text-xs text-sky-600 hover:text-sky-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
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
        <div className="text-xs text-gray-500">
          {selected.length} of {options.length} selected
        </div>
      )}
    </div>
  );
}
