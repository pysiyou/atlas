import React from 'react';
import { SPACING } from '@/components/theme/recipes';
import { DetailField } from './DetailField';
import type { BadgeVariant } from '@/components';

/**
 * Badge configuration for a field in the group
 */
interface FieldBadgeConfig {
  /** Badge text value */
  value: string;
  /** Badge variant for styling */
  variant?: BadgeVariant;
  /** Badge size */
  size?: 'xs' | 'sm' | 'md';
  /** Optional className for the badge */
  className?: string;
}

/**
 * Configuration for a single field in the DetailFieldGroup
 */
export interface DetailFieldConfig {
  label: string;
  value?: React.ReactNode;
  timestamp?: string;
  /** User id — resolved via {@link DetailFieldGroupProps.resolveUserDisplay}. */
  user?: string;
  userDisplay?: string;
  badge?: FieldBadgeConfig;
  valueClassName?: string;
  hidden?: boolean;
}

interface DetailFieldGroupProps {
  fields: DetailFieldConfig[];
  className?: string;
  spacing?: 'tight' | 'normal' | 'loose';
  /** Maps stored user ids to display names (feature layer). */
  resolveUserDisplay?: (userId: string) => string | undefined;
}

/**
 * Spacing class map for different gap sizes
 */
const SPACING_CLASSES = {
  tight: SPACING.stackCompact,
  normal: SPACING.stackNormal,
  loose: SPACING.stackRelaxed,
};

/**
 * DetailFieldGroup - Renders a vertical stack of DetailField components
 *
 * Filters out fields with no displayable value (empty value, timestamp, or badge)
 * and fields marked as hidden.
 *
 * @example
 * // Basic usage
 * <DetailFieldGroup
 *   fields={[
 *     { label: "Sample ID", badge: { value: "SAM-001", variant: "primary" } },
 *     { label: "Collected", timestamp: "2024-01-01T10:00:00Z", user: "user123" },
 *     { label: "Status", value: "Active" },
 *   ]}
 * />
 *
 * @example
 * // With conditional fields
 * <DetailFieldGroup
 *   fields={[
 *     { label: "Sample ID", badge: { value: sample.id, variant: "primary" } },
 *     { label: "Notes", value: sample.notes, hidden: !sample.notes },
 *   ]}
 * />
 */
export const DetailFieldGroup: React.FC<DetailFieldGroupProps> = ({
  fields,
  className = '',
  spacing = 'normal',
  resolveUserDisplay,
}) => {
  // Filter out fields that have no displayable content or are hidden
  const visibleFields = fields.filter(field => {
    // Skip hidden fields
    if (field.hidden) return false;

    // Include if any display value is present
    const hasValue = field.value !== undefined && field.value !== null && field.value !== '';
    const hasTimestamp = field.timestamp !== undefined && field.timestamp !== '';
    const hasBadge = field.badge?.value !== undefined && field.badge?.value !== '';

    return hasValue || hasTimestamp || hasBadge;
  });

  // Don't render anything if no visible fields
  if (visibleFields.length === 0) {
    return null;
  }

  return (
    <div className={`${SPACING_CLASSES[spacing]} ${className}`}>
      {visibleFields.map(field => (
        <DetailField
          key={field.label}
          label={field.label}
          value={field.value}
          timestamp={field.timestamp}
          userDisplay={
            field.userDisplay ??
            (field.user && resolveUserDisplay ? resolveUserDisplay(field.user) : undefined)
          }
          badge={field.badge}
          valueClassName={field.valueClassName}
        />
      ))}
    </div>
  );
};
