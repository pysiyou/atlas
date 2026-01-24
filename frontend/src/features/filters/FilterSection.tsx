/**
 * FilterSection Component
 * Collapsible section wrapper for filter controls
 */

import React, { useState } from 'react';
import { Icon } from '@/shared/ui/Icon';
import { cn } from '@/utils';

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
    <div className={cn('border-b border-gray-200 last:border-b-0', className)}>
      {/* Section header - compact */}
      <button
        onClick={toggleCollapse}
        disabled={!collapsible}
        className={cn(
          'w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors',
          collapsible && 'hover:bg-gray-50 cursor-pointer',
          !collapsible && 'cursor-default'
        )}
      >
        <div className="flex items-center gap-1.5">
          <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded-full bg-sky-500 text-white text-xxs font-medium">
              {activeCount}
            </span>
          )}
        </div>

        {collapsible && (
          <Icon
            name="chevron-down"
            className={cn(
              'w-3.5 h-3.5 text-gray-400 transition-transform',
              isCollapsed && 'rotate-180'
            )}
          />
        )}
      </button>

      {/* Section content - compact */}
      {(!collapsible || !isCollapsed) && (
        <div className="px-3 pb-2">
          <div className="flex flex-wrap gap-2">{children}</div>
        </div>
      )}
    </div>
  );
};
