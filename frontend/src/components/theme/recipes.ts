/**
 * Canonical type + surface + status-tone + chrome class recipes.
 * Author stacks here; shells and feature style modules re-export or compose them.
 */

export const TYPE = {
  pageTitle: 'text-lg font-light text-text-primary',
  detailTitle: 'text-sm font-medium text-text-primary',
  /** 40px page-panel header — sm + light, not the list pageTitle. */
  panelTitle: 'text-sm font-light text-text-primary',
  modalTitle: 'text-base font-medium text-text-primary',
  sectionTitle: 'text-xxs font-medium uppercase tracking-wide text-text-secondary',
  label: 'text-xs text-text-secondary',
  value: 'text-xs text-text-primary',
  meta: 'text-xs text-text-tertiary',
  amount: 'text-sm text-text-primary',
  caption: 'text-xxs text-text-tertiary',
} as const;

/** Status roles: fg/fill/well from semantic --{role}-* tokens. Workflow stage tokens stay separate. */
export const TONE = {
  neutral: {
    fg: 'text-text-secondary',
    fgEmphasis: 'text-text-secondary',
    fill: 'bg-text-tertiary',
    well: 'bg-surface-hover border border-border-default',
  },
  brand: {
    fg: 'text-brand',
    fgEmphasis: 'text-brand',
    fill: 'bg-brand',
    well: 'bg-brand-muted border border-brand',
  },
  info: {
    fg: 'text-info-fg',
    fgEmphasis: 'text-info-fg-emphasis',
    fill: 'bg-info-fg-emphasis',
    well: 'bg-info-bg border border-info-stroke',
  },
  success: {
    fg: 'text-success-fg',
    fgEmphasis: 'text-success-fg-emphasis',
    fill: 'bg-success-fg-emphasis',
    well: 'bg-success-bg border border-success-stroke',
  },
  warning: {
    fg: 'text-warning-fg',
    fgEmphasis: 'text-warning-fg-emphasis',
    fill: 'bg-warning-fg-emphasis',
    well: 'bg-warning-bg border border-warning-stroke',
  },
  danger: {
    fg: 'text-danger-fg',
    fgEmphasis: 'text-danger-fg-emphasis',
    fill: 'bg-danger-fg-emphasis',
    well: 'bg-danger-bg border border-danger-stroke',
  },
} as const;

export const SURFACE = {
  raised: 'bg-surface border border-border-default',
  recessed: 'bg-surface-page border border-border-default',
  dangerWell: TONE.danger.well,
  successWell: TONE.success.well,
  warningWell: TONE.warning.well,
  infoWell: TONE.info.well,
} as const;

/** Geometry roles from live usage — do not unify Panel vs Card. */
export const RADIUS = {
  control: 'rounded-control',
  card: 'rounded-card',
  overlay: 'rounded-overlay',
  notice: 'rounded-notice',
  pill: 'rounded-pill',
} as const;

export const CONTROL = {
  hoverBorder: 'hover:border-border-hover',
  focus: 'focus:outline-none focus:ring-1 focus:ring-brand focus:ring-opacity-20 focus:border-brand',
  focusWithin: 'focus-within:outline-none focus-within:border-brand focus-within:ring-1 focus-within:ring-brand focus-within:ring-opacity-20',
  error: 'border-border-error focus:border-border-error focus:ring-danger focus:ring-opacity-20',
  errorWithin: 'border-border-error focus-within:border-border-error focus-within:ring-danger focus-within:ring-opacity-20',
  height: 'h-control',
} as const;

/** Chip geometry. Font-size via CSS var (not text-*) so twMerge keeps status text-* colors. */
const BADGE_TYPE = '[font-size:var(--font-size-xs)]';

/** Chip geometry (type scale only). Color: badgeStyles + useBadgeAppearance() + semantic --badge / --*-fg. */
export const BADGE = {
  size: {
    xs: `px-2 py-1 ${BADGE_TYPE} gap-1.5 leading-none`,
    sm: `px-2 py-1 ${BADGE_TYPE} gap-1.5 leading-none`,
    md: `px-3 py-1.5 ${BADGE_TYPE} gap-2 leading-none`,
  },
  icon: {
    xs: 'w-3.5 h-3.5',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
  },
  filterChip: {
    xs: `px-3 py-1 ${BADGE_TYPE} gap-1.5 leading-none`,
    sm: `px-3 py-1.5 ${BADGE_TYPE} gap-1.5 leading-none`,
  },
} as const;
