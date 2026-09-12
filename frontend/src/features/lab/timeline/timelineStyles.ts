/**
 * Shared timeline layout and tone styles for lab activity feeds.
 */

export type CommandCenterTimelineTone = 'problem' | 'resolution' | 'neutral';

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
