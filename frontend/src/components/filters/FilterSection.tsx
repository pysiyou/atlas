/**
 * FilterSection Component
 * Collapsible section wrapper for filter controls
 */

import React, { useState } from 'react';
import { FILTER_SECTION_TYPE, RADIUS } from '@/components/theme/recipes';
import { Icon } from '@/components';
import { cn } from '@/utils';
import { ICONS } from '@/config/icons';

/**
 * Props for FilterSection component
 */
export interface FilterSectionProps {
  /** Section title */
  title: string;
  /** Whether this section is collapsible */
  collapsible?: boolean;
  /** Whether section is collapsed by default */
  defaultCollapsed?: boolean;
  /** Number of active filters in this section */
  activeCount?: number;
  /** Section content */
  children: React.ReactNode;
  /** Custom className */
  className?: string;
}

/**
 * FilterSection Component
 *
 * Provides a collapsible section wrapper for filter controls.
 * Shows active filter count and allows expanding/collapsing.
 *
 * @component
 */
export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  collapsible = false,
  defaultCollapsed = false,
  activeCount = 0,
  children,
  className,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  /**
   * Toggle collapse state
   */
  const toggleCollapse = () => {
    if (collapsible) {
      setIsCollapsed(prev => !prev);
    }
  };

  return (
    <div className={cn('border-b border-border-default last:border-b-0', className)}>
      {/* Section header - compact */}
      <button
        onClick={toggleCollapse}
        disabled={!collapsible}
        className={cn(
          'w-full flex items-center justify-between px-space-3 py-space-1-5 text-left transition-colors',
          collapsible && 'hover:bg-surface-page cursor-pointer',
          !collapsible && 'cursor-default'
        )}
      >
        <div className="flex items-center gap-space-1-5">
          <h3 className={FILTER_SECTION_TYPE.heading}>
            {title}
          </h3>
          {activeCount > 0 && (
            <span className={`inline-flex items-center justify-center min-w-[18px] h-4 px-space-1 ${RADIUS.pill} bg-brand text-on-brand ${FILTER_SECTION_TYPE.countBadge}`}>
              {activeCount}
            </span>
          )}
        </div>

        {collapsible && (
          <Icon
            name={ICONS.actions.chevronDown}
            className={cn(
              'w-3.5 h-3.5 text-text-disabled transition-transform',
              isCollapsed && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Section content - compact */}
      {(!collapsible || !isCollapsed) && (
        <div className="px-space-3 pb-space-2">
          <div className="flex flex-wrap gap-space-2">{children}</div>
        </div>
      )}
    </div>
  );
};
