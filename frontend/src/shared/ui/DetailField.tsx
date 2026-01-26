import React from 'react';
import { Badge, type BadgeVariant } from './Badge';
import { formatDate } from '@/utils';
import { useUserLookup } from '@/hooks/queries';

/**
 * Badge configuration for DetailField
 */
interface BadgeConfig {
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
 * DetailField display variants
 * - default: horizontal layout with label left, value right
 * - stacked: vertical layout with timestamp on first line, user on second
 * - inline: compact inline layout
 */
type DetailFieldVariant = 'default' | 'stacked' | 'inline';

interface DetailFieldProps {
  /** Field label text */
  label: string;
  /** Direct value to display (used if no timestamp/badge provided) */
  value?: React.ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** CSS classes for the label */
  labelClassName?: string;
  /** CSS classes for the value */
  valueClassName?: string;
  /** Layout variant */
  variant?: DetailFieldVariant;
  /** Timestamp to auto-format with formatDate (renders in stacked layout if user provided) */
  timestamp?: string;
  /** User ID to display with getUserName (appears below timestamp in stacked layout) */
  user?: string;
  /** Badge configuration for rendering value as a Badge */
  badge?: BadgeConfig;
}

/**
 * Reusable detail field component for displaying label-value pairs uniformly
 *
 * Supports multiple patterns:
 * 1. Simple value: <DetailField label="Name" value="John" />
 * 2. Badge value: <DetailField label="Status" badge={{ value: "active", variant: "success" }} />
 * 3. Timestamp: <DetailField label="Created" timestamp="2024-01-01" />
 * 4. Timestamp + User: <DetailField label="Collected" timestamp="2024-01-01" user="user123" />
 *
 * @example
 * // Simple value
 * <DetailField label="Patient Name" value="John Doe" />
 *
 * @example
 * // Badge value
 * <DetailField label="Sample ID" badge={{ value: "SAM-001", variant: "primary" }} />
 *
 * @example
 * // Timestamp with user (stacked layout)
 * <DetailField label="Collected" timestamp={sample.collectedAt} user={sample.collectedBy} />
 */
export const DetailField: React.FC<DetailFieldProps> = ({
  label,
  value,
  className = '',
  labelClassName = 'text-text-tertiary text-xs',
  valueClassName = 'font-medium text-text-primary text-right text-xs',
  variant = 'default',
  timestamp,
  user,
  badge,
}) => {
  const { getUserName } = useUserLookup();

  /**
   * Renders the value portion of the field based on props priority:
   * 1. badge - renders as Badge component
   * 2. timestamp - renders formatted date, optionally with user below
   * 3. value - renders as-is
   */
  const renderValue = () => {
    // Badge rendering takes priority
    if (badge && badge.value) {
      return (
        <Badge variant={badge.variant || 'primary'} size={badge.size || 'xs'} className={badge.className}>
          {badge.value.toUpperCase()}
        </Badge>
      );
    }

    // Timestamp rendering (with optional user in stacked layout)
    if (timestamp) {
      const formattedDate = formatDate(timestamp);
      const userName = user ? getUserName(user) : null;

      // Stacked layout: date on top, user below
      if (userName) {
        return (
          <div className="text-right text-xs">
            <div className="text-xs text-text-primary">{formattedDate}</div>
            <div className="text-xs text-text-tertiary">by {userName}</div>
          </div>
        );
      }

      // Simple timestamp without user
      return <span className="text-xs text-text-primary">{formattedDate}</span>;
    }

    // Default: render value as-is
    return value;
  };

  // Inline variant uses more compact styling
  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
        <span className={labelClassName}>{label}:</span>
        <span className={valueClassName}>{renderValue()}</span>
      </span>
    );
  }

  // Default and stacked variants use the same container layout
  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <span className={labelClassName}>{label}</span>
      <span className={valueClassName}>{renderValue()}</span>
    </div>
  );
};
