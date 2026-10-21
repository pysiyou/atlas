/**
 * Lab workflow cards, queue shells, and page tabs.
 */

import { CONTROL } from './control';
import { FIELD_ERROR } from './misc';
import { PANEL } from './panel';
import { RADIUS, SHADOW, SPACING } from './spacing';
import { SURFACE } from './surface';
import { TONE } from './tone';
import { TYPE } from './type';

/** Lab queue badge density (`xs` | `sm` | `md` — same as Badge `size`). */
export const LAB_CARD_BADGE_SIZE = 'xs' as const;

export const LAB_WORKFLOW_QUEUE_SHELL =
  `${PANEL.raisedShadowSm} flex flex-1 flex-col min-w-0 min-h-0` as const;

export const LAB_PAGE_TABS = {
  rail: `bg-surface-hover p-space-0-5 ${RADIUS.field} flex items-center gap-space-0-5`,
  buttonBase: `relative flex items-center gap-space-1-5 px-space-2-5 py-space-1 ${RADIUS.field} ${TYPE.meta} font-normal transition-all duration-200 cursor-pointer`,
  buttonActive: `bg-surface ${TONE.brand.fg} ${CONTROL.segmentActive}`,
  buttonInactive: 'text-text-tertiary hover:text-text-primary hover:bg-surface-hover',
  iconActive: TONE.brand.fg,
  iconInactive: 'text-text-disabled',
  countBadgeMargin: 'ml-space-1',
} as const;

export const LAB_HEADER = {
  stack: `flex flex-col ${SPACING.gapInline} min-w-0`,
  cardStack: `flex flex-col ${SPACING.gapHairline} min-w-0`,
  row: 'min-h-0 min-w-0 w-full leading-snug',
  badgeRow: `flex min-w-0 flex-1 flex-wrap items-center ${SPACING.gapInline} overflow-hidden`,
  auditStack: `flex flex-col ${SPACING.gapHairline} min-w-0`,
  auditLine: TYPE.label,
} as const;

export const LAB_MODAL_DETAIL = {
  headerStack: LAB_HEADER.stack,
  headerRow: LAB_HEADER.row,
  sectionStack: SPACING.stackRelaxed,
} as const;

export const LAB_MODAL_HEADER = {
  identityBlock: 'min-w-0 w-full',
  badgeRow: `flex min-w-0 flex-wrap items-center ${SPACING.gapInline}`,
  metaRow: `min-w-0 w-full ${TYPE.label} leading-snug`,
} as const;

export const LAB_MODAL_TYPOGRAPHY = {
  auditLine: TYPE.label,
  meta: TYPE.label,
  sectionTitle: TYPE.panelTitle,
} as const;

export const LAB_CARD_ALERT = {
  row: `flex min-w-0 w-full flex-col ${SPACING.gapHairline} ${TYPE.label} leading-snug`,
} as const;

export const LAB_CARD_TYPOGRAPHY = {
  title: TYPE.detailTitle,
  sectionTitle: TYPE.sectionTitle,
  sectionContent: TYPE.value,
  fieldLabel: TYPE.label,
  fieldValue: TYPE.value,
  patientName: 'font-normal text-text-primary capitalize',
  bodyText: TYPE.label,
  metadata: TYPE.label,
  separator: 'text-text-disabled',
  emphasizedInline: 'text-text-primary',
  flagText: `${FIELD_ERROR}`,
  flagTitle: `${TYPE.sectionTitle} ${TONE.danger.fg}`,
} as const;

const LAB_CARD_PANEL_INSET = 'px-space-2 pb-space-2 pt-space-1';

export const LAB_CARD_SPACING = {
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

export const LAB_CARD_CONTAINERS = {
  cardWrapper: 'cursor-pointer',
  cardBase: `${SHADOW.subtle} hover:bg-surface-hover transition-colors duration-200`,
  contentSection: `${SURFACE.recessed} ${RADIUS.field} ${LAB_CARD_PANEL_INSET}`,
  flagsSection: `${SURFACE.dangerWell} ${RADIUS.field} ${LAB_CARD_PANEL_INSET}`,
} as const;

export const LAB_CARD_LIST_ITEMS = {
  testItem: `flex items-center ${LAB_CARD_TYPOGRAPHY.sectionContent}`,
  bullet: `w-1 h-1 ${RADIUS.pill} bg-text-muted mr-space-2`,
  bulletRed: `w-1 h-1 ${RADIUS.pill} ${TONE.danger.fill} mr-space-2`,
  testName: `font-normal mr-space-1 ${LAB_CARD_TYPOGRAPHY.fieldValue}`,
} as const;

export const LAB_CARD_CONTEXT = {
  container:
    `flex items-baseline gap-x-space-2 gap-y-0 ${TYPE.label} flex-wrap min-w-0 w-full leading-snug`,
  patientName: 'font-normal text-text-primary capitalize',
  separator: 'text-text-disabled select-none',
  inlineDot: '•',
} as const;

export const LAB_CARD_QUEUE_IDENTITY = {
  primaryLine: `flex items-baseline gap-x-space-2 gap-y-0 ${TYPE.label} flex-wrap min-w-0 w-full leading-snug`,
  secondaryLine: `flex items-baseline gap-x-space-2 gap-y-0 ${TYPE.label} flex-wrap min-w-0 w-full leading-snug`,
  secondaryText: 'font-normal text-text-secondary',
  secondaryDate: `whitespace-nowrap tabular-nums ${TYPE.label} text-text-secondary`,
} as const;

/** @deprecated Use LAB_CARD_QUEUE_IDENTITY */
export const LAB_CARD_SAMPLE_IDENTITY = LAB_CARD_QUEUE_IDENTITY;

export const LAB_CARD_HEADER = {
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

export const LAB_CARD_FOOTER = {
  actions: 'flex flex-wrap items-center justify-end gap-space-2 pt-space-1',
} as const;

export const LAB_MOBILE_CARD = {
  surface: 'flex flex-col h-full min-h-0',
  stack: 'flex flex-col min-h-0 min-w-0 w-full flex-1 gap-space-1-5',
  titleHead:
    'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-space-2 gap-y-space-0-5 items-start',
  title: `m-0 col-start-1 row-start-1 ${TYPE.detailTitle} truncate leading-snug normal-case`,
  subline: `col-start-1 row-start-2 flex items-center gap-space-1-5 min-w-0 ${TYPE.label} leading-snug`,
  sublineName: 'truncate capitalize font-normal text-text-secondary',
  metaLine: `${TYPE.label} leading-snug`,
  body: `${TYPE.label} leading-snug`,
  footer: 'flex items-center justify-between gap-space-2 pt-space-1 mt-auto',
  badgeRail: 'flex min-w-0 flex-1 flex-wrap items-center gap-space-1-5',
  actionRail: 'flex shrink-0 items-center justify-end gap-space-1-5',
  titleAside: 'col-start-2 row-start-1 shrink-0',
} as const;
