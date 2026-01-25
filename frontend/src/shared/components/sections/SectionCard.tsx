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
import { sectionCard } from '@/shared/design-system/tokens/components/shared';

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
    <div className={`${sectionCard.container} ${className}`}>
      {/* Header */}
      <div
        className={`${sectionCard.header} ${collapsible ? sectionCard.headerCollapsible : ''}`}
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          {icon && <Icon name={icon} className={sectionCard.icon} />}
          <h3 className={sectionCard.title}>{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {headerRight}
          {collapsible && (
            <Icon
              name={isExpanded ? ICONS.actions.chevronUp : ICONS.actions.chevronDown}
              className="w-4 h-4 text-gray-400"
            />
          )}
        </div>
      </div>

      {/* Content */}
      {(!collapsible || isExpanded) && <div className={`${sectionCard.content} ${contentClassName}`}>{children}</div>}
    </div>
  );
};
