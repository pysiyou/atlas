/**
 * Command center shared layout, surface, and tone styles.
 */

import type { TestStatus } from '@/types/enums/generated/test';

export type CommandCenterKpiTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral';

export type CommandCenterTimelineTone = 'problem' | 'resolution' | 'neutral';

export type CommandCenterTextTone = 'default' | 'success' | 'warning' | 'danger';

export const COMMAND_CENTER_TEXT = {
  panelTitle: 'text-text-primary',
  panelMeta: 'text-text-tertiary',
  sectionTitle: 'text-text-tertiary',
  sectionAside: 'text-text-tertiary',
  summary: 'text-text-tertiary',
  label: 'text-text-primary',
  value: 'text-text-primary',
  detail: 'text-text-tertiary',
  centerLabel: 'text-text-primary',
  centerDetail: 'text-text-tertiary',
  empty: 'text-text-tertiary',
} as const;

export const COMMAND_CENTER_TEXT_TONE: Record<CommandCenterTextTone, string> = {
  default: COMMAND_CENTER_TEXT.value,
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
};

export type CommandCenterBadgeTextTone = 'danger' | 'warning' | 'info' | 'success' | 'neutral';

/** Category badge text — matches pre-Badge pill emphasis colors */
export const COMMAND_CENTER_BADGE_TEXT: Record<CommandCenterBadgeTextTone, string> = {
  danger: 'text-danger-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  info: 'text-info-fg-emphasis',
  success: 'text-success-fg-emphasis',
  neutral: 'text-text-secondary',
};

export function resolveCommandCenterTextTone(
  tone: CommandCenterTextTone = 'default',
  active = true,
): string {
  if (!active || tone === 'default') return COMMAND_CENTER_TEXT.value;
  return COMMAND_CENTER_TEXT_TONE[tone];
}

/** @deprecated Use COMMAND_CENTER_TEXT_TONE */
export const COMMAND_CENTER_TYPE = COMMAND_CENTER_TEXT;

export const DELTA_TONE_CLASS = COMMAND_CENTER_TEXT_TONE;

export const COMMAND_CENTER_PANEL = {
  shell: 'h-full bg-surface rounded border border-border-default shadow-sm overflow-hidden flex flex-col',
  header: 'shrink-0 px-4 py-2.5 border-b border-border-default flex items-center gap-3',
  headerBetween: 'shrink-0 px-4 py-2.5 border-b border-border-default flex items-center justify-between gap-3',
  title: `text-sm font-light ${COMMAND_CENTER_TEXT.panelTitle}`,
  meta: `flex h-6 shrink-0 items-center text-xxs ${COMMAND_CENTER_TEXT.panelMeta}`,
  body: 'flex-1 min-h-0 overflow-hidden',
  page: 'flex-1 min-h-0 min-w-0 overflow-hidden bg-surface-page p-2',
} as const;

export const COMMAND_CENTER_SECTION = {
  /** Inner panel section heading (e.g. Shift Output, Wait Per Step). */
  title: `text-xxs font-medium uppercase tracking-wide ${COMMAND_CENTER_TEXT.sectionTitle}`,
  /** Footer note under a section or panel body. */
  summary: `text-xxs leading-snug ${COMMAND_CENTER_TEXT.summary}`,
  /** Right-aligned section context (counts, totals). */
  aside: `shrink-0 text-xxs tabular-nums ${COMMAND_CENTER_TEXT.sectionAside}`,
  statLabel: `text-xxs font-medium uppercase tracking-wide ${COMMAND_CENTER_TEXT.sectionTitle}`,
} as const;

export const COMMAND_CENTER_KPI = {
  tile:
    'group relative flex min-w-0 flex-1 items-center gap-2.5 rounded border border-border-default bg-gradient-to-br from-surface via-surface to-surface-page/80 px-2.5 py-2 transition-all duration-200 hover:border-border-hover hover:shadow-sm',
  tileInteractive: 'cursor-pointer',
  tileLink: 'min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30',
  tileWrap: 'min-w-0 flex-1',
  iconWrap: 'flex h-8 w-8 shrink-0 items-center justify-center rounded bg-surface-hover',
  label: 'truncate text-xxs uppercase tracking-wide text-text-tertiary',
  value: 'text-lg font-semibold leading-none tabular-nums',
  context: 'truncate text-xxs font-light leading-none text-text-tertiary tabular-nums',
  ringTrack: 'text-border-subtle',
} as const;

export const COMMAND_CENTER_KPI_TONE_ICON: Record<CommandCenterKpiTone, string> = {
  brand: 'text-brand',
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
  neutral: 'text-text-secondary',
};

export const COMMAND_CENTER_KPI_TONE_VALUE: Record<CommandCenterKpiTone, string> = {
  brand: 'text-text-primary',
  success: 'text-success-fg-emphasis',
  warning: 'text-warning-fg-emphasis',
  danger: 'text-danger-fg-emphasis',
  neutral: 'text-text-primary',
};

export const COMMAND_CENTER_KPI_RING_TONE: Record<CommandCenterKpiTone, string> = {
  brand: 'text-brand',
  success: 'text-success-fg',
  warning: 'text-warning-fg',
  danger: 'text-danger-fg',
  neutral: 'text-text-secondary',
};

export const COMMAND_CENTER_PIPELINE_BAR: Record<TestStatus, string> = {
  pending: 'bg-chart-axis',
  'sample-collected': 'bg-info-fg-emphasis',
  resulted: 'bg-warning-fg-emphasis',
  validated: 'bg-success-fg-emphasis',
  escalated: 'bg-danger-fg-emphasis',
  cancelled: 'bg-border-strong',
  superseded: 'bg-border-strong',
  removed: 'bg-border-strong',
};

export const COMMAND_CENTER_TIMELINE = {
  toneDot: {
    problem: 'bg-danger-fg-emphasis',
    resolution: 'bg-success-fg-emphasis',
    neutral: 'bg-brand',
  } satisfies Record<CommandCenterTimelineTone, string>,
  connectorStem: 'bg-brand',
  eventDot: 'relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full border-2 border-surface',
  eventDotTrack: 'relative flex w-2.5 shrink-0 flex-col items-center self-stretch',
  eventConnectorStem:
    'pointer-events-none absolute top-[1.375rem] bottom-0 w-px -translate-x-1/2 left-1/2',
  groupHeader: 'flex items-center gap-2 py-2 sticky top-0 z-1 bg-surface/95 backdrop-blur-sm',
  groupDivider: 'flex-1 h-px bg-border-subtle',
  groupLabel: 'text-xxs font-light text-text-tertiary uppercase tracking-widest',
  eventRow: 'flex items-start gap-2.5 relative',
  eventBody: 'flex-1 min-w-0 pb-3',
  eventTitleRow: 'flex flex-wrap items-center gap-x-2 gap-y-1',
  eventAction: 'text-sm font-light text-text-primary',
  eventDetails: 'flex flex-wrap items-center gap-x-1 gap-y-0.5 mt-0.5',
  eventMeta: 'text-xs text-text-tertiary mt-1',
  loadMore: 'px-4 py-2 flex justify-center border-t border-border-subtle',
  retryLink: 'text-sm text-brand hover:underline',
  retryLinkDisabled: 'text-sm text-brand hover:underline disabled:opacity-60',
} as const;

export const COMMAND_CENTER_SELECT = {
  base:
    'h-6 min-w-23 appearance-none rounded border border-border-default bg-surface pl-3 pr-7 text-xxs leading-none text-text-secondary text-center cursor-pointer transition-colors duration-200 hover:border-border-hover hover:bg-surface-hover hover:text-text-primary focus:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand focus-visible:ring-opacity-20',
  chevron: 'pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-text-tertiary',
} as const;
