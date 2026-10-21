/** Badges and inline highlights. */

import { ICON_SIZE } from './type';
import { SPACING, RADIUS } from './spacing';

const BADGE_TYPE = 'type-badge';

export const BADGE = {
  /** Drop default badge border when embedded in DataTable cells. */
  tableEmbed: 'border-none',
  size: {
    xs: `px-space-2 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact}`,
    sm: `px-space-2 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact}`,
    md: `px-space-3 py-space-1-5 ${BADGE_TYPE} ${SPACING.gapInline}`,
  },
  icon: {
    xs: `${ICON_SIZE.sm}`,
    sm: `${ICON_SIZE.sm}`,
    md: `${ICON_SIZE.md}`,
  },
  filterChip: {
    xs: `px-space-3 py-space-1 ${BADGE_TYPE} ${SPACING.gapCompact}`,
    sm: `px-space-3 py-space-1-5 ${BADGE_TYPE} ${SPACING.gapCompact}`,
  },
} as const;

export const INLINE_HIGHLIGHT = {
  root: `box-decoration-clone inline max-w-full align-baseline break-words leading-inherit font-[inherit] text-text-primary py-[0.06em] px-[0.22em] pb-[0.08em] ${RADIUS.inline}`,
  wash: {
    neutral: 'bg-inline-highlight-neutral',
    primary: 'bg-inline-highlight-primary',
    success: 'bg-inline-highlight-success',
    warning: 'bg-inline-highlight-warning',
    danger: 'bg-inline-highlight-danger',
    info: 'bg-inline-highlight-info',
    purple: 'bg-inline-highlight-neutral',
    pink: 'bg-inline-highlight-neutral',
    teal: 'bg-inline-highlight-neutral',
    orange: 'bg-inline-highlight-neutral',
    indigo: 'bg-inline-highlight-neutral',
    cyan: 'bg-inline-highlight-neutral',
    muted: 'bg-inline-highlight-neutral',
  },
  /** Status icons (same as Alert / Callout); no icon when variant is unmapped (e.g. primary). */
  defaultIcon: {
    warning: 'warning',
    info: 'info-circle',
    danger: 'alert-circle',
    success: 'check-circle',
  },
  icon: {
    sm: 'me-[0.35em] inline-block h-[0.85em] w-[0.85em] min-h-2.5 min-w-2.5 shrink-0 align-[-0.1em] text-current',
    md: 'me-[0.4em] inline-block h-[0.9em] w-[0.9em] min-h-3 min-w-3 shrink-0 align-[-0.1em] text-current',
  },
  decoration: {
    underline: 'underline underline-offset-[0.15em] decoration-text-primary/50',
  },
} as const;
