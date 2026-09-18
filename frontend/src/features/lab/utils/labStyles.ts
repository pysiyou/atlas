/**
 * Lab Card Style Constants
 * Typography and wells come from theme recipes; layout objects stay here.
 */

import { PANEL, RADIUS, SURFACE, TONE, TYPE } from '@/components/theme/recipes';
import type { BadgeSize } from '@/components';

/** Canonical Badge size for lab cards — uses theme BADGE.size.xs. */
export const LAB_CARD_BADGE_SIZE: BadgeSize = 'xs';

/** Collection / entry / validation queue panel — matches ListView table shell inside app well. */
export const LAB_WORKFLOW_QUEUE_SHELL =
  `${PANEL.raisedShadowSm} flex flex-1 flex-col min-w-0 min-h-0` as const;

/** Shared lab header rows (modals; cards can reuse audit/badge row tokens) */
export const LAB_HEADER = {
  /** Space between identity / badges / audit blocks */
  stack: 'flex flex-col gap-2 min-w-0',
  cardStack: 'flex flex-col gap-0.5 min-w-0',
  row: 'min-h-0 min-w-0 w-full leading-snug',
  badgeRow: 'flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-hidden',
  /** Space between multiple audit lines within the audit block */
  auditStack: 'flex flex-col gap-0.5 min-w-0',
  /** Labels (e.g. "Requested", "collected") — values use emphasizedInline (primary) */
  auditLine: TYPE.label,
} as const;

/** Lab detail modal layout — header metadata + grid field stacks */
export const LAB_MODAL_DETAIL = {
  headerStack: LAB_HEADER.stack,
  headerRow: LAB_HEADER.row,
  sectionStack: 'space-y-3',
} as const;

// Typography Constants (shared tokens for body/metadata; lab-specific for title/section)
export const LAB_CARD_TYPOGRAPHY = {
  title: TYPE.detailTitle,
  sectionTitle: TYPE.sectionTitle,
  sectionContent: TYPE.value,
  fieldLabel: TYPE.label,
  fieldValue: TYPE.value,
  patientName: 'font-normal text-text-primary capitalize',
  bodyText: TYPE.label,
  metadata: TYPE.meta,
  separator: 'text-text-disabled',
  emphasizedInline: 'text-text-primary',
  flagText: `text-xs ${TONE.danger.fg}`,
  flagTitle: `${TYPE.sectionTitle} ${TONE.danger.fg}`,
} as const;

/** Shared inset for titled panels on lab cards (tighter top than sides/bottom). */
const LAB_CARD_PANEL_INSET = 'px-2 pb-2 pt-1';

// Spacing Constants
export const LAB_CARD_SPACING = {
  // Card internal gaps
  cardGap: 'gap-1',

  // Section content margins
  sectionTitleMargin: 'mb-1',

  // Flags section title margin
  flagsTitleMargin: 'mb-1',

  // List item spacing
  listGap: 'space-y-1',

  // Flags list spacing
  flagsListGap: 'space-y-0.5',

  // Row padding
  rowPadding: 'py-0',

  // Content section padding
  contentPadding: 'p-4',

  // Flags section padding
  flagsPadding: 'p-2',

  // Badge group gap
  badgeGap: 'gap-3',

  // Action group gap
  actionGap: 'gap-2',
} as const;

// Container Constants
export const LAB_CARD_CONTAINERS = {
  // Main card wrapper
  cardWrapper: 'cursor-pointer',

  // Card base styling (applied via Card component)
  cardBase: 'shadow-sm hover:bg-surface-hover transition-colors duration-200',

  contentSection: `${SURFACE.recessed} ${RADIUS.field} ${LAB_CARD_PANEL_INSET}`,
  flagsSection: `${SURFACE.dangerWell} ${RADIUS.field} ${LAB_CARD_PANEL_INSET}`,
} as const;

// List Item Constants
export const LAB_CARD_LIST_ITEMS = {
  // Test list item
  testItem: `flex items-center ${LAB_CARD_TYPOGRAPHY.sectionContent}`,

  // List bullet (gray)
  bullet: 'w-1 h-1 rounded-full bg-text-muted mr-2',

  // List bullet (red for flags)
  bulletRed: `w-1 h-1 rounded-full ${TONE.danger.fill} mr-2`,

  // Test name in list
  testName: `font-normal mr-1 ${LAB_CARD_TYPOGRAPHY.fieldValue}`,
} as const;

// Context Row Constants (Patient/Order info)
export const LAB_CARD_CONTEXT = {
  container:
    `flex items-center gap-x-2 gap-y-0 ${TYPE.meta} flex-wrap min-w-0 w-full leading-snug`,
  patientName: 'font-normal text-text-primary capitalize',
  separator: 'text-text-disabled select-none',
  inlineDot: '•',
} as const;

export const LAB_CARD_HEADER = {
  /** Identity row; actions float top-right so they don't stretch row height */
  identityShell: 'relative min-w-0 w-full',
  identityPadActions: 'pe-[5.5rem] sm:pe-28',
  actionColumn:
    'absolute top-0 right-0 z-10 flex max-w-[46%] shrink-0 flex-wrap items-start justify-end gap-2',
} as const;

/** Narrow / list-padding workflow cards (breakpoint mobile layouts) */
export const LAB_MOBILE_CARD = {
  surface: 'flex flex-col h-full min-h-0',
  stack: 'flex flex-col min-h-0 min-w-0 w-full flex-1 gap-1.5',
  titleHead:
    'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-2 gap-y-0.5 items-start',
  title: `m-0 col-start-1 row-start-1 ${TYPE.detailTitle} truncate leading-snug normal-case`,
  subline:
    `col-start-1 row-start-2 flex items-center gap-1.5 min-w-0 ${TYPE.label} leading-snug`,
  sublineName: 'truncate capitalize font-normal text-text-secondary',
  metaLine: `${TYPE.label} leading-snug`,
  body: `${TYPE.label} leading-snug`,
  footer: 'flex items-center justify-between gap-2 pt-2 mt-auto border-t border-border-subtle',
  badgeRail: 'flex min-w-0 flex-1 flex-wrap items-center gap-1.5',
  actionRail: 'flex shrink-0 items-center justify-end gap-1.5',
  titleAside: 'col-start-2 row-start-1 shrink-0',
} as const;
