import { FORM_TAB_TITLE, INLINE_LINK, RADIUS, TYPE } from '@/components/theme/recipes';

/** Activity feed — step indicator + headline / details / meta (matches attention feed typography). */
export const TIMELINE_STYLES = {
  scroll: 'overflow-y-auto bg-transparent pr-space-1',
  connectorStem: 'bg-border-strong',
  eventDot: `relative z-10 mt-space-1-5 h-2 w-2 shrink-0 ${RADIUS.pill} border-2`,
  eventDotTrack: 'relative flex w-2 shrink-0 flex-col items-center self-stretch',
  eventConnectorStem:
    'pointer-events-none absolute top-[0.875rem] bottom-0 w-px -translate-x-1/2 left-1/2',
  groupHeader: 'sticky top-0 z-[1] flex items-center gap-space-2 bg-transparent py-space-2',
  groupDivider: 'flex-1 h-px bg-border-subtle',
  groupLabel: `${TYPE.sectionTitle} tracking-widest`,
  postList: 'space-y-0',
  /** Matches LabAttentionFeed row: accent + `min-w-0 flex-1 space-y-1` content */
  eventRow: 'flex min-w-0 items-stretch gap-space-2 relative',
  eventBody: 'min-w-0 flex-1 space-y-space-1 pb-space-3',
  eventHeadline: `min-w-0 ${FORM_TAB_TITLE} text-text-primary`,
  eventDetails: 'flex flex-wrap items-center gap-x-space-1 gap-y-space-0-5',
  eventDetailText: TYPE.label,
  eventMeta: TYPE.meta,
  threadMarker: `pb-space-2 pl-space-4 ${TYPE.meta}`,
  loadMore: 'flex justify-center border-t border-border-subtle bg-transparent px-space-4 py-space-2',
  retryLink: INLINE_LINK,
  retryLinkDisabled: `${INLINE_LINK} disabled:opacity-60`,
} as const;
