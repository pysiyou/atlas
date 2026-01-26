/**
 * ActiveFilterBadges Component
 * Display active filters as dismissible badges
 */

import React from 'react';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';
import { ICONS } from '@/utils/icon-mappings';
import type { ActiveFilterBadge } from './types';
import { format } from 'date-fns';

/**
 * Props for ActiveFilterBadges component
 */
export interface ActiveFilterBadgesProps {
  /** Array of active filter badges */
  badges: ActiveFilterBadge[];
  /** Callback when a badge is removed */
  onRemove: (key: string) => void;
  /** Callback when "Clear all" is clicked */
  onClearAll?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * Format filter value for display
 */
function formatFilterValue(value: unknown, key?: string): string {
  if (value === null || value === undefined) return '';

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return '';

    // Date range
    if (value.length === 2 && value[0] instanceof Date && value[1] instanceof Date) {
      const [start, end] = value;
      if (start.getTime() === end.getTime()) {
        return format(start, 'dd MMM yyyy');
      }
      return `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
    }

    // Age range or price range
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      const [min, max] = value;
      // Check if it's a price range by key name or value range
      const isPriceRange = key === 'priceRange' || (max > 1000 && max <= 100000);

      if (isPriceRange) {
        if (min === 0 && max === 10000) return '';
        return `${min.toLocaleString()} - ${max.toLocaleString()}`;
      }
      // Age range
      if (min === 0 && max === 150) return '';
      return `${min} - ${max} yrs`;
    }

    // Array of strings
    if (value.length === 1) {
      return String(value[0]);
    }
    return `${value.length} selected`;
  }

  if (value instanceof Date) {
    return format(value, 'dd MMM yyyy');
  }

  return String(value);
}

/**
 * ActiveFilterBadges Component
 *
 * Displays active filters as dismissible badges with:
 * - Filter name and value
 * - Remove button for each badge
 * - "Clear all" button when multiple filters are active
 *
 * @component
 */
export const ActiveFilterBadges: React.FC<ActiveFilterBadgesProps> = ({
  badges,
  onRemove,
  onClearAll,
  className,
}) => {
  // Filter out badges with empty display values
  const validBadges = badges.filter(badge => {
    const displayValue = formatFilterValue(badge.rawValue, badge.key);
    return displayValue && displayValue.trim().length > 0;
  });

  // Don't render if there are no valid badges
  if (validBadges.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 flex-wrap px-3 py-1.5 bg-app-bg border-b border-border',
        className
      )}
    >
      <div className="flex items-center gap-1 text-xxs font-medium text-text-muted">
        <Icon name={ICONS.actions.filter} className="w-3 h-3" />
        <span>Active:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {validBadges.map(badge => {
          const displayValue = formatFilterValue(badge.rawValue, badge.key);

          return (
            <div
              key={badge.key}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-surface border border-border-strong rounded text-xxs"
            >
              <span className="font-medium text-text-secondary">{badge.label}:</span>
              <span className="text-text-tertiary">{displayValue}</span>
              <button
                onClick={() => onRemove(badge.key)}
                className="ml-0.5 p-0.5 hover:bg-neutral-100 rounded transition-colors cursor-pointer"
                aria-label={`Remove ${badge.label} filter`}
              >
                <Icon
                  name={ICONS.actions.closeCircle}
                  className="w-2.5 h-2.5 text-text-disabled hover:text-text-tertiary"
                />
              </button>
            </div>
          );
        })}
      </div>

      {validBadges.length > 1 && onClearAll && (
        <button
          onClick={onClearAll}
          className="ml-auto text-xxs font-medium text-brand hover:text-brand-dark transition-colors cursor-pointer"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
