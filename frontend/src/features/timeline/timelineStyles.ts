import { RADIUS, TYPE } from '@/components/theme/recipes';

export const TIMELINE_STYLES = {
  connectorStem: 'bg-border-strong',
  eventDot: `relative z-10 mt-space-1-5 h-2.5 w-2.5 shrink-0 ${RADIUS.pill} border-2`,
  eventDotTrack: 'relative flex w-2.5 shrink-0 flex-col items-center self-stretch',
  eventConnectorStem:
    'pointer-events-none absolute top-[1.375rem] bottom-0 w-px -translate-x-1/2 left-1/2',
  groupHeader: 'flex items-center gap-space-2 py-space-2 sticky top-0 z-1 bg-surface/95 backdrop-blur-sm',
  groupDivider: 'flex-1 h-px bg-border-subtle',
  groupLabel: `${TYPE.sectionTitle} tracking-widest`,
  /** Matches LabAttentionFeed row: accent + `min-w-0 flex-1 space-y-1` content */
  eventRow: 'flex min-w-0 items-stretch gap-space-2 relative',
  eventBody: 'min-w-0 flex-1 space-y-space-1 pb-space-3',
  /** Same weight as detail line; xs size only — avoid primary + panelTitle (reads bold). */
  eventHeadline: 'min-w-0 text-xs font-normal text-text-primary',
  eventDetails: 'flex flex-wrap items-center gap-x-space-1 gap-y-space-0-5',
  eventDetailText: TYPE.label,
  eventMeta: TYPE.meta,
  loadMore: 'px-space-4 py-space-2 flex justify-center border-t border-border-subtle',
  retryLink: 'text-xs text-brand hover:underline',
  retryLinkDisabled: 'text-xs text-brand hover:underline disabled:opacity-60',
} as const;

/** @deprecated Use TIMELINE_STYLES */
export const COMMAND_CENTER_TIMELINE = TIMELINE_STYLES;
