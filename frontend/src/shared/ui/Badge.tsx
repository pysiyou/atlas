import React from 'react';
import { cn } from '@/utils';
import { getBadgeAppearance } from '@/shared/theme/theme';
import { Icon, type IconName } from './Icon';
import {
  type BadgeColor,
  type BadgeVariant,
  type BadgeSize,
  resolveColor,
  getColorStyles,
  CONTAINER_STYLES,
  DISPLAY_LABELS,
  CRITICAL_VARIANTS,
  SIZES,
  ICON_SIZES,
} from './badgeHelpers';

// Re-export types for convenience
export type { BadgeColor, BadgeVariant, BadgeSize };

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color variant - can be semantic (info, success) or domain (ordered, blood) */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Apply strikethrough styling */
  strikethrough?: boolean;
  /** Enable pulsing animation */
  pulse?: boolean;
  /** Icon to display */
  icon?: IconName | React.ReactNode;
  /** Show dot indicator (default: false) */
  dot?: boolean;
}

/** Base classes for unified appearance (neutral bg, colored text + dot) */
const UNIFIED_BASE = 'bg-badge border border-border-default shadow-sm';

/** Base classes for tinted appearance (colored bg, no border) */
const TINTED_BASE = '';

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'sm',
  strikethrough = false,
  pulse,
  icon,
  dot = false,
  children,
  ...props
}) => {
  const normalizedVariant = String(variant).toLowerCase();
  const appearance = getBadgeAppearance();

  // Check for container variants first (special solid colors)
  const isContainer = normalizedVariant.startsWith('container-');
  const containerStyle = isContainer ? CONTAINER_STYLES[normalizedVariant] : null;

  // Resolve to semantic color and get styles
  const color = resolveColor(normalizedVariant);
  const { className: colorClass, dotClassName } = getColorStyles(color, appearance);

  // Auto-generate label if no children
  const content = children ?? (
    variant !== 'neutral' && variant !== 'default'
      ? DISPLAY_LABELS[normalizedVariant] ?? String(variant).replace(/-/g, ' ').toUpperCase()
      : null
  );

  // Auto-pulse for critical variants
  const shouldPulse = pulse ?? CRITICAL_VARIANTS.has(normalizedVariant);

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    return <Icon name={icon as IconName} className={ICON_SIZES[size]} />;
  };

  const iconElement = renderIcon();
  const showDot = dot && !isContainer && dotClassName;

  return (
    <span
      className={cn(
        'inline-flex items-center font-normal rounded whitespace-nowrap',
        SIZES[size],
        isContainer ? containerStyle : [
          appearance === 'unified' ? UNIFIED_BASE : TINTED_BASE,
          colorClass,
        ],
        strikethrough && 'line-through',
        shouldPulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClassName)}
          aria-hidden
        />
      )}
      {iconElement}
      {content}
    </span>
  );
};

/**
 * Convenience component for status display
 */
export const StatusBadge: React.FC<Omit<BadgeProps, 'variant'> & { status: string }> = ({
  status,
  children,
  ...props
}) => (
  <Badge variant={status} {...props}>
    {children}
  </Badge>
);

/**
 * Convenience component for priority display
 */
export const PriorityBadge: React.FC<Omit<BadgeProps, 'variant'> & { priority: string }> = ({
  priority,
  ...props
}) => (
  <Badge variant={priority} {...props} />
);
