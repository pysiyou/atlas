/**
 * Workflow queue cards, segment tabs, and mobile list card chrome.
 */

import { CONTROL } from './control';
import { FIELD_ERROR } from './misc';
import { LIST_MARKER } from './markers';
import { PANEL } from './panel';
import { RADIUS, SHADOW, SPACING } from './spacing';
import { SURFACE } from './surface';
import { TONE } from './tone';
import { TYPE } from './type';

/** Default badge density on queue cards (`xs` | `sm` | `md`). */
export const QUEUE_CARD_BADGE_SIZE = 'xs' as const;

export const WORKFLOW_QUEUE_SHELL =
  `${PANEL.raisedShadowSm} flex flex-1 flex-col min-w-0 min-h-0` as const;

export const SEGMENT_TABS = {
  rail: `bg-surface-hover p-space-0-5 ${RADIUS.field} flex items-center gap-space-0-5`,
  buttonBase: `relative flex items-center gap-space-1-5 px-space-2-5 py-space-1 ${RADIUS.field} ${TYPE.meta} font-normal transition-all duration-200 cursor-pointer`,
  buttonActive: `bg-surface ${TONE.brand.fg} ${CONTROL.segmentActive}`,
  buttonInactive: 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover',
  iconActive: TONE.brand.fg,
  iconInactive: 'text-text-disabled',
  countBadgeMargin: 'ml-space-1',
} as const;

export const WORKFLOW_HEADER = {
  stack: `flex flex-col ${SPACING.gapInline} min-w-0`,
  cardStack: `flex flex-col ${SPACING.gapHairline} min-w-0`,
  row: 'min-h-0 min-w-0 w-full leading-snug',
  badgeRow: `flex min-w-0 flex-1 flex-wrap items-center ${SPACING.gapInline} overflow-hidden`,
  auditStack: `flex flex-col ${SPACING.gapHairline} min-w-0`,
  auditLine: TYPE.label,
} as const;

export const MODAL_DETAIL_LAYOUT = {
  headerStack: WORKFLOW_HEADER.stack,
  headerRow: WORKFLOW_HEADER.row,
  sectionStack: SPACING.stackRelaxed,
} as const;

export const MODAL_HEADER_LAYOUT = {
  identityBlock: 'min-w-0 w-full',
  badgeRow: `flex min-w-0 flex-wrap items-center ${SPACING.gapInline}`,
  metaRow: `min-w-0 w-full ${TYPE.label} leading-snug`,
} as const;

export const MODAL_HEADER_TYPE = {
  auditLine: TYPE.label,
  meta: TYPE.label,
  sectionTitle: TYPE.panelTitle,
} as const;

export const QUEUE_CARD_ALERT = {
  row: `flex min-w-0 w-full flex-col ${SPACING.gapHairline} ${TYPE.label} leading-snug`,
} as const;

export const QUEUE_CARD_TYPE = {
  title: TYPE.detailTitle,
  sectionTitle: TYPE.sectionTitle,
  sectionContent: TYPE.value,
  fieldLabel: TYPE.label,
  fieldValue: TYPE.value,
  primaryText: 'font-normal text-text-primary capitalize',
  bodyText: TYPE.label,
  metadata: TYPE.label,
  separator: LIST_MARKER.inlineSeparator,
  emphasizedInline: 'text-text-primary',
  flagText: `${FIELD_ERROR}`,
  flagTitle: `${TYPE.sectionTitle} ${TONE.danger.fg}`,
} as const;

const QUEUE_CARD_PANEL_INSET = 'px-space-2 pb-space-2 pt-space-1';

export const QUEUE_CARD_SPACING = {
  cardGap: 'gap-space-1',
  sectionTitleMargin: 'mb-space-1',
  flagsTitleMargin: 'mb-space-1',
  listGap: 'space-y-space-1',
  flagsListGap: 'space-y-space-0-5',
  rowPadding: 'py-0',
  contentPadding: 'p-panel',
  flagsPadding: 'p-space-2',
  badgeGap: 'gap-space-3',
  actionGap: 'gap-space-2',
} as const;

export const QUEUE_CARD_SURFACE = {
  cardWrapper: 'cursor-pointer',
  cardBase: `${SHADOW.subtle} hover:bg-surface-hover transition-colors duration-200`,
  contentSection: `${SURFACE.recessed} ${RADIUS.field} ${QUEUE_CARD_PANEL_INSET}`,
  flagsSection: `${SURFACE.dangerWell} ${RADIUS.field} ${QUEUE_CARD_PANEL_INSET}`,
} as const;

export const QUEUE_CARD_LIST_ITEM = {
  row: `flex items-center ${QUEUE_CARD_TYPE.sectionContent}`,
  bullet: `${LIST_MARKER.dot} mr-space-2`,
  bulletDanger: `${LIST_MARKER.dotDanger} mr-space-2`,
  label: `font-normal mr-space-1 ${QUEUE_CARD_TYPE.fieldValue}`,
} as const;

export const IDENTITY_INLINE = {
  container:
    `flex items-baseline gap-x-space-2 gap-y-0 ${TYPE.label} flex-wrap min-w-0 w-full leading-snug`,
  primaryText: 'font-normal text-text-primary capitalize',
  separator: LIST_MARKER.inlineSeparator,
  inlineDot: LIST_MARKER.inlineDot,
} as const;

export const IDENTITY_STACK = {
  primaryLine: `flex items-baseline gap-x-space-2 gap-y-0 ${TYPE.label} flex-wrap min-w-0 w-full leading-snug`,
  secondaryLine: `flex items-baseline gap-x-space-2 gap-y-0 ${TYPE.label} flex-wrap min-w-0 w-full leading-snug`,
  secondaryText: 'font-normal text-text-secondary',
  secondaryDate: `whitespace-nowrap tabular-nums ${TYPE.label} text-text-secondary`,
} as const;

export const CARD_HEADER_GRID = {
  shell: 'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-x-space-2',
  shellWithActions:
    'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_auto] items-start gap-x-space-2',
  leftColumn: `col-start-1 flex min-w-0 flex-col ${SPACING.gapHairline}`,
  badgeColumn:
    'col-start-2 row-start-1 flex shrink-0 flex-nowrap items-start justify-end gap-space-1 self-start leading-none',
  badgeColumnBeforeActions: 'mr-space-4',
  actionColumn:
    'col-start-3 row-start-1 z-10 flex shrink-0 flex-wrap items-start justify-end gap-space-2 self-start',
} as const;

export const CARD_ACTIONS_ROW = {
  actions: 'flex flex-wrap items-center justify-end gap-space-2 pt-space-1',
} as const;

export const MOBILE_LIST_CARD = {
  surface: 'flex flex-col h-full min-h-0',
  stack: 'flex flex-col min-h-0 min-w-0 w-full flex-1 gap-space-1-5',
  titleHead:
    'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-space-2 gap-y-space-0-5 items-start',
  title: `m-0 col-start-1 row-start-1 ${TYPE.detailTitle} truncate leading-snug normal-case`,
  subline: `col-start-1 row-start-2 flex items-center gap-space-1-5 min-w-0 ${TYPE.label} leading-snug`,
  sublineSecondary: 'truncate capitalize font-normal text-text-secondary',
  metaLine: `${TYPE.label} leading-snug`,
  body: `${TYPE.label} leading-snug`,
  footer: 'flex items-center justify-between gap-space-2 pt-space-1 mt-auto',
  badgeRail: 'flex min-w-0 flex-1 flex-wrap items-center gap-space-1-5',
  actionRail: 'flex shrink-0 items-center justify-end gap-space-1-5',
  titleAside: 'col-start-2 row-start-1 shrink-0',
} as const;
