/**
 * Badge, TagChip, RemovableTag, and FilterChip.
 */

import React from 'react';
import { cn } from '@/utils';
import { useBadgeAppearance } from '@/components/theme/theme';
import { ICONS } from '@/config/icons';
import { Icon, type IconName } from './Icon';
import { BADGE, CONTROL, RADIUS } from '@/components/theme/recipes';
import {
  CONTAINER_STYLES,
  getColorStyles,
  resolveColor,
  type BadgeVariant,
} from './badgeStyles';
import { STATUS_BADGE_DISPLAY_LABELS, resolveStatusBadgeLabel } from '@/utils/statusBadge';

export type { BadgeColor, BadgeVariant } from './badgeStyles';

export type BadgeSize = keyof typeof BADGE.size;

const SIZES = BADGE.size;
const ICON_SIZES = BADGE.icon;
const FILTER_CHIP_SIZE = BADGE.filterChip;

const SELECTION_CHIP = {
  unified: {
    surface: 'bg-badge border border-border-default',
    text: 'text-text-primary',
    code: 'text-brand',
    remove: 'text-text-tertiary hover:text-text-secondary',
  },
  tinted: {
    surface: 'bg-brand-muted border border-brand/20',
    text: 'text-text-primary',
    code: 'text-brand',
    remove: 'text-brand/60 hover:text-brand',
  },
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  pulse?: boolean;
  icon?: IconName | React.ReactNode;
  dot?: boolean;
  uppercase?: boolean;
  /** Explicit label; when omitted, children or status display labels may apply. */
  label?: React.ReactNode;
}

const UNIFIED_BASE = 'bg-badge border border-border-default';

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'xs',
  pulse,
  icon,
  dot = false,
  uppercase = true,
  label,
  children,
  ...props
}) => {
  const normalizedVariant = String(variant).toLowerCase();
  const appearance = useBadgeAppearance();
  const isContainer = normalizedVariant.startsWith('container-');
  const containerStyle = isContainer ? CONTAINER_STYLES[normalizedVariant] : null;
  const color = resolveColor(normalizedVariant);
  const { className: colorClass, dotClassName } = getColorStyles(color, appearance);
  const content =
    label ??
    children ??
    (variant !== 'neutral' && variant !== 'default'
      ? (STATUS_BADGE_DISPLAY_LABELS[normalizedVariant] ??
        resolveStatusBadgeLabel(normalizedVariant) ??
        String(variant).replace(/-/g, ' ').toUpperCase())
      : null);

  const iconElement = !icon
    ? null
    : React.isValidElement(icon)
      ? icon
      : <Icon name={icon as IconName} className={ICON_SIZES[size]} />;
  const showDot = dot && !isContainer && dotClassName;

  return (
    <span
      className={cn(
        `inline-flex items-center font-normal ${RADIUS.field} whitespace-nowrap`,
        uppercase && 'uppercase tracking-normal',
        isContainer ? containerStyle : null,
        pulse && 'animate-pulse',
        className,
        SIZES[size],
        !isContainer && appearance === 'unified' ? UNIFIED_BASE : null,
        !isContainer ? colorClass : null
      )}
      {...props}
    >
      {showDot && (
        <span className={cn(`w-1 h-1 ${RADIUS.pill} shrink-0`, dotClassName)} aria-hidden />
      )}
      {iconElement}
      {content}
    </span>
  );
};

export interface TagChipProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: BadgeSize;
  emphasis?: 'default' | 'code';
}

export const TagChip: React.FC<TagChipProps> = ({
  className,
  size = 'xs',
  emphasis = 'default',
  children,
  ...props
}) => {
  const chip = SELECTION_CHIP[useBadgeAppearance()];
  return (
    <div
      className={cn(
        `inline-flex max-w-full shrink-0 items-center ${RADIUS.field} font-normal normal-case tracking-normal`,
        chip.surface,
        emphasis === 'code' ? chip.code : chip.text,
        className,
        SIZES[size]
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export interface RemovableTagProps extends React.HTMLAttributes<HTMLDivElement> {
  onRemove: () => void;
  removeAriaLabel: string;
  size?: BadgeSize;
}

export const RemovableTag: React.FC<RemovableTagProps> = ({
  className,
  size = 'xs',
  onRemove,
  removeAriaLabel,
  children,
  ...props
}) => {
  const chip = SELECTION_CHIP[useBadgeAppearance()];
  return (
    <div
      className={cn(
        `inline-flex max-w-full shrink-0 items-center gap-space-2 ${RADIUS.field} font-normal normal-case tracking-normal`,
        chip.surface,
        className,
        SIZES[size]
      )}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        className={`-mr-space-0-5 ml-space-0-5 flex shrink-0 items-center justify-center ${RADIUS.pill} p-space-0-5 transition-colors ${CONTROL.focusSubtle}`}
        aria-label={removeAriaLabel}
      >
        <Icon name={ICONS.actions.closeCircle} className={cn('h-3 w-3', chip.remove)} />
      </button>
    </div>
  );
};

export interface FilterChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: IconName;
  size?: keyof typeof FILTER_CHIP_SIZE;
}

export const FilterChip: React.FC<FilterChipProps> = ({
  active = false,
  icon,
  size = 'xs',
  className,
  children,
  type = 'button',
  ...props
}) => (
  <button
    type={type}
    className={cn(
      `inline-flex cursor-pointer items-center ${RADIUS.field} border font-normal transition-colors`,
      active
        ? 'border-brand bg-brand-muted text-brand hover:border-brand-hover'
        : 'border-border-default bg-surface text-text-secondary hover:border-border-hover hover:bg-surface-hover hover:text-text-primary',
      className,
      FILTER_CHIP_SIZE[size]
    )}
    {...props}
  >
    {icon ? <Icon name={icon} className="h-3 w-3 shrink-0" /> : null}
    <span>{children}</span>
  </button>
);
