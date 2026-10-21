/** Status tone colors. */

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
