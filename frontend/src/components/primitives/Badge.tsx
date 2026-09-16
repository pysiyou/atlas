/**
 * Badge, TagChip, RemovableTag, and FilterChip.
 */

import React from 'react';
import { cn } from '@/utils';
import { getBadgeAppearance } from '@/components/theme/theme';
import { ICONS } from '@/config/icons';
import { Icon, type IconName } from './Icon';
import {
  CONTAINER_STYLES,
  DISPLAY_LABELS,
  getColorStyles,
  resolveColor,
  type BadgeVariant,
} from './badgeStyles';

export type { BadgeColor, BadgeVariant } from './badgeStyles';

const SIZES = {
  xs: 'px-1.5 py-0.5 text-[10px] gap-1',
  sm: 'px-2 py-0.5 text-xs gap-1.5',
  md: 'px-2.5 py-1 text-sm gap-1.5',
} as const;

const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
} as const;

export type BadgeSize = keyof typeof SIZES;

const SELECTION_CHIP = {
  unified: {
    surface: 'bg-badge border border-border-default shadow-sm',
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

function selectionChipClasses() {
  return SELECTION_CHIP[getBadgeAppearance()];
}

const FILTER_CHIP_SIZE = {
  xs: 'px-2 py-1 text-xxs gap-1',
  sm: 'px-2 py-1.5 text-xs gap-1',
} as const;

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  strikethrough?: boolean;
  pulse?: boolean;
  icon?: IconName | React.ReactNode;
  dot?: boolean;
  uppercase?: boolean;
}

const UNIFIED_BASE = 'bg-badge border border-border-default shadow-sm';

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'sm',
  strikethrough = false,
  pulse,
  icon,
  dot = false,
  uppercase = true,
  children,
  ...props
}) => {
  const normalizedVariant = String(variant).toLowerCase();
  const appearance = getBadgeAppearance();
  const isContainer = normalizedVariant.startsWith('container-');
  const containerStyle = isContainer ? CONTAINER_STYLES[normalizedVariant] : null;
  const color = resolveColor(normalizedVariant);
  const { className: colorClass, dotClassName } = getColorStyles(color, appearance);
  const content =
    children ??
    (variant !== 'neutral' && variant !== 'default'
      ? (DISPLAY_LABELS[normalizedVariant] ?? String(variant).replace(/-/g, ' ').toUpperCase())
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
        'inline-flex items-center font-normal rounded whitespace-nowrap',
        uppercase && 'uppercase tracking-wide',
        SIZES[size],
        isContainer
          ? containerStyle
          : [appearance === 'unified' ? UNIFIED_BASE : '', colorClass],
        strikethrough && 'line-through',
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClassName)} aria-hidden />
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
  size = 'sm',
  emphasis = 'default',
  children,
  ...props
}) => {
  const chip = selectionChipClasses();
  return (
    <div
      className={cn(
        'inline-flex max-w-full shrink-0 items-center rounded font-normal normal-case tracking-normal',
        SIZES[size],
        chip.surface,
        emphasis === 'code' ? chip.code : chip.text,
        className
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
  size = 'sm',
  onRemove,
  removeAriaLabel,
  children,
  ...props
}) => {
  const chip = selectionChipClasses();
  return (
    <div
      className={cn(
        'inline-flex max-w-full shrink-0 items-center gap-2 rounded font-normal normal-case tracking-normal',
        SIZES[size],
        chip.surface,
        className
      )}
      {...props}
    >
      {children}
      <button
        type="button"
        onClick={onRemove}
        className="-mr-0.5 ml-0.5 flex shrink-0 items-center justify-center rounded-full p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-brand/30"
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
      'inline-flex cursor-pointer items-center rounded border font-normal transition-colors',
      FILTER_CHIP_SIZE[size],
      active
        ? 'border-brand bg-brand-muted text-brand hover:border-brand-hover'
        : 'border-border-default bg-surface text-text-secondary hover:border-border-hover hover:bg-surface-hover hover:text-text-primary',
      className
    )}
    {...props}
  >
    {icon ? <Icon name={icon} className="h-3 w-3 shrink-0" /> : null}
    <span>{children}</span>
  </button>
);
