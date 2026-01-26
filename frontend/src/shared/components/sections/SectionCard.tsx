/**
 * SectionCard - Standardized section container component
 *
 * Provides a consistent card-based section layout with optional collapsible functionality.
 * Used in detail views for organizing related information.
 */

import React, { useState } from 'react';
import { Icon } from '@/shared/ui';
import type { IconName } from '@/shared/ui/Icon';
import { ICONS } from '@/utils/icon-mappings';

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
    <div className={`bg-surface rounded-lg border border-border shadow-sm ${className}`}>
      {/* Header */}
      <div
        className={`flex items-center justify-between p-4 border-b border-border ${collapsible ? 'cursor-pointer hover:bg-surface-hover transition-colors' : ''}`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className="w-5 h-5 text-text-secondary" />}
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {collapsible && (
            <Icon
              name={isExpanded ? ICONS.actions.chevronUp : ICONS.actions.chevronDown}
              className="w-4 h-4 text-text-disabled"
            />
          )}
        </div>
      </div>

      {/* Content */}
      {(!collapsible || isExpanded) && <div className={`p-6 space-y-4 ${contentClassName}`}>{children}</div>}
    </div>
  );
};
