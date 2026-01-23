/**
 * SectionCard - Standardized section container component
 *
 * Provides a consistent card-based section layout with optional collapsible functionality.
 * Used in detail views for organizing related information.
 */

import React, { useState } from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';

export interface SectionCardProps {
  /** Section title */
  title: string;
  /** Optional icon to display before title */
  icon?: IconName;
  /** Optional content for the right side of the header */
  headerRight?: React.ReactNode;
  /** Section content */
  children: React.ReactNode;
  /** Whether the section can be collapsed */
  collapsible?: boolean;
  /** Default expanded state (only applies if collapsible) */
  defaultExpanded?: boolean;
  /** Additional CSS classes for the container */
  className?: string;
  /** Additional CSS classes for the content area */
  contentClassName?: string;
}

/**
 * SectionCard component
 *
 * @example
 * ```tsx
 * <SectionCard title="General Info" icon="user">
 *   <InfoField label="Name" value={patient.name} />
 *   <InfoField label="Age" value={patient.age} />
 * </SectionCard>
 * ```
 */
export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  icon,
  headerRight,
  children,
  collapsible = false,
  defaultExpanded = true,
  className = '',
  contentClassName = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    if (collapsible) {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 ${
          collapsible ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''
        }`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className="w-4 h-4 text-gray-500" />}
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {collapsible && (
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              className="w-4 h-4 text-gray-400"
            />
          )}
        </div>
      </div>

      {/* Content */}
      {(!collapsible || isExpanded) && <div className={`p-4 ${contentClassName}`}>{children}</div>}
    </div>
  );
};
