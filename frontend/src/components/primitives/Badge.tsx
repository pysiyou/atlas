/**
 * Badge (single module).
 * Domain colors in COLOR_MAP; appearance from getBadgeAppearance().
 */

import React from 'react';
import { cn } from '@/utils';
import { getBadgeAppearance } from '@/components/theme/theme';
import { ICONS } from '@/config/icons';
import { Icon, type IconName } from './Icon';

export type BadgeColor =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'purple'
  | 'pink'
  | 'teal'
  | 'orange'
  | 'indigo'
  | 'cyan'
  | 'muted';

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

const ORDER_COLOR_MAP: Record<string, BadgeColor> = {
  ordered: 'info',
  'in-progress': 'warning',
  completed: 'success',
  cancelled: 'danger',
};

const SAMPLE_COLOR_MAP: Record<string, BadgeColor> = {
  pending: 'neutral',
  collected: 'info',
  received: 'info',
  accessioned: 'info',
  'sample-collected': 'info',
  resulted: 'purple',
  validated: 'success',
  cancelled: 'danger',
  escalated: 'danger',
  superseded: 'neutral',
  removed: 'neutral',
  stored: 'teal',
  disposed: 'neutral',
};

const PAYMENT_COLOR_MAP: Record<string, BadgeColor> = {
  unpaid: 'danger',
  pending: 'warning',
  partial: 'orange',
  paid: 'success',
  refunded: 'info',
  cancelled: 'neutral',
};

const CATALOG_COLOR_MAP: Record<string, BadgeColor> = {
  active: 'success',
  inactive: 'neutral',
  deprecated: 'warning',
  draft: 'info',
  blood: 'danger',
  urine: 'warning',
  stool: 'orange',
  swab: 'info',
  tissue: 'purple',
  csf: 'teal',
  sputum: 'indigo',
  plasma: 'pink',
  serum: 'cyan',
  other: 'neutral',
};

const MISC_COLOR_MAP: Record<string, BadgeColor> = {
  default: 'neutral',
  primary: 'primary',
  secondary: 'neutral',
  outline: 'neutral',
  ghost: 'neutral',
  error: 'danger',
  rejected: 'danger',
  escalated: 'danger',
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
  male: 'info',
  female: 'pink',
  friend: 'purple',
  child: 'info',
  parent: 'success',
  sibling: 'danger',
  spouse: 'warning',
  'chronic-condition': 'orange',
  medication: 'info',
  allergy: 'danger',
  surgery: 'purple',
  administrator: 'danger',
  receptionist: 'info',
  'lab-technician': 'success',
  'lab-technician-plus': 'purple',
  pathologist: 'purple',
};

const COLOR_MAP: Record<string, BadgeColor> = {
  danger: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'info',
  neutral: 'neutral',
  ...MISC_COLOR_MAP,
  ...ORDER_COLOR_MAP,
  ...SAMPLE_COLOR_MAP,
  ...PAYMENT_COLOR_MAP,
  ...CATALOG_COLOR_MAP,
};

export type BadgeVariant = BadgeColor | keyof typeof COLOR_MAP | (string & {});

const UNIFIED_STYLES: Record<BadgeColor, { text: string; dot: string }> = {
  neutral: { text: 'text-text-secondary', dot: 'bg-text-tertiary' },
  primary: { text: 'text-brand', dot: 'bg-brand' },
  success: { text: 'text-success-fg-emphasis', dot: 'bg-success-fg-emphasis' },
  warning: { text: 'text-warning-fg-emphasis', dot: 'bg-warning-fg-emphasis' },
  danger: { text: 'text-danger-fg-emphasis', dot: 'bg-danger-fg-emphasis' },
  info: { text: 'text-info-fg-emphasis', dot: 'bg-info-fg-emphasis' },
  purple: { text: 'text-purple-fg-emphasis', dot: 'bg-purple-fg-emphasis' },
  pink: { text: 'text-pink-fg-emphasis', dot: 'bg-pink-fg-emphasis' },
  teal: { text: 'text-teal-fg-emphasis', dot: 'bg-teal-fg-emphasis' },
  orange: { text: 'text-orange-fg-emphasis', dot: 'bg-orange-fg-emphasis' },
  indigo: { text: 'text-indigo-fg-emphasis', dot: 'bg-indigo-fg-emphasis' },
  cyan: { text: 'text-cyan-fg-emphasis', dot: 'bg-cyan-fg-emphasis' },
  muted: { text: 'text-text-tertiary', dot: 'bg-text-muted' },
};

const TINTED_STYLES: Record<BadgeColor, string> = {
  neutral: 'bg-neutral-200 text-text-primary',
  primary: 'bg-brand text-on-brand',
  success: 'bg-success-bg-emphasis text-success-fg-emphasis',
  warning: 'bg-warning-bg-emphasis text-warning-fg-emphasis',
  danger: 'bg-danger-bg-emphasis text-danger-fg-emphasis',
  info: 'bg-info-bg text-info-fg-emphasis',
  purple: 'bg-purple-bg-emphasis text-purple-fg-emphasis',
  pink: 'bg-pink-bg-emphasis text-pink-fg-emphasis',
  teal: 'bg-teal-bg-emphasis text-teal-fg-emphasis',
  orange: 'bg-orange-bg-emphasis text-orange-fg-emphasis',
  indigo: 'bg-indigo-bg-emphasis text-indigo-fg-emphasis',
  cyan: 'bg-cyan-bg-emphasis text-cyan-fg-emphasis',
  muted: 'bg-neutral-200 text-text-tertiary',
};

const CONTAINER_STYLES: Record<string, string> = {
  'container-red': 'bg-container-red-bg text-container-red-text',
  'container-yellow': 'bg-container-yellow-bg text-container-yellow-text',
  'container-purple': 'bg-container-purple-bg text-container-purple-text',
  'container-blue': 'bg-container-blue-bg text-container-blue-text',
  'container-green': 'bg-container-green-bg text-container-green-text',
  'container-gray': 'bg-container-gray-bg text-container-gray-text',
  'container-black': 'bg-container-black-bg text-container-black-text',
};

const DISPLAY_LABELS: Record<string, string> = {
  pending: 'PENDING',
  'sample-collected': 'COLLECTED',
  'in-progress': 'IN PROGRESS',
  resulted: 'RESULTED',
  validated: 'VALIDATED',
  cancelled: 'CANCELLED',
  escalated: 'ESCALATED',
  superseded: 'SUPERSEDED',
  removed: 'REMOVED',
  'chronic-condition': 'CHRONIC',
  'credit-card': 'CREDIT CARD',
  'debit-card': 'DEBIT CARD',
  'bank-transfer': 'BANK TRANSFER',
  'mobile-money': 'MOBILE MONEY',
  're-test': 'RE-TEST',
  're-collect': 'RE-COLLECT',
  escalate: 'ESCALATE',
  authorize_retest: 'AUTHORIZE RE-TEST',
  authorize_recollect: 'AUTHORIZE RE-COLLECT',
  apply_amendment: 'APPLY AMENDMENT',
  cancel_test: 'CANCEL TEST',
};

/** Unified = neutral surface + colored text; tinted = filled chip. */
// eslint-disable-next-line react-refresh/only-export-components -- single module: Badge + shared color/tag API
export function getColorStyles(color: BadgeColor, appearance: 'unified' | 'tinted') {
  if (appearance === 'tinted') {
    return { className: TINTED_STYLES[color], dotClassName: '' };
  }
  const u = UNIFIED_STYLES[color];
  return { className: u.text, dotClassName: u.dot };
}

// eslint-disable-next-line react-refresh/only-export-components -- single module: Badge + shared color/tag API
export function resolveColor(variant: string): BadgeColor {
  return COLOR_MAP[variant.toLowerCase()] ?? 'neutral';
}

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
  /** Force uppercase label text (default: true). Set false for proper nouns such as parameter names. */
  uppercase?: boolean;
}

const UNIFIED_BASE = 'bg-badge border border-border-default shadow-sm';
const TINTED_BASE = '';

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
  const shouldPulse = pulse === true;

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
        uppercase && 'uppercase tracking-wide',
        SIZES[size],
        isContainer
          ? containerStyle
          : [appearance === 'unified' ? UNIFIED_BASE : TINTED_BASE, colorClass],
        strikethrough && 'line-through',
        shouldPulse && 'animate-pulse',
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
  /** Accent for catalog codes, prices, entity IDs */
  emphasis?: 'default' | 'code';
}

/** Read-only selection chip (same surface as input tags, filters). */
export const TagChip: React.FC<TagChipProps> = ({
  className,
  size = 'sm',
  emphasis = 'default',
  children,
  ...props
}) => {
  const chip = selectionChipClasses();
  const textClass = emphasis === 'code' ? chip.code : chip.text;
  return (
    <div
      className={cn(
        'inline-flex max-w-full shrink-0 items-center rounded font-normal normal-case tracking-normal',
        SIZES[size],
        chip.surface,
        textClass,
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

/** Tag chip with dismiss control (TagInput, order selects). */
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

/** Toggleable filter / date preset chip. */
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
