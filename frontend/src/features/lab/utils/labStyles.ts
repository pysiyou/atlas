/**
 * Lab Card Style Constants
 * Uses shared typography tokens where they match; lab-specific tokens for section titles etc.
 */

import { TEXT_METADATA, BODY_SECONDARY, ENTITY_ID } from '@/utils/constants';
import type { BadgeSize } from '@/components/primitives/badgeHelpers';

/** Compact lab workflow badges (cards, modals, queue age) */
export const LAB_CARD_BADGE_SIZE: BadgeSize = 'xs';

/** Entity ID typography — matches card context row and modal header */
export const LAB_ENTITY_ID = ENTITY_ID;

/** Detail grid value cell for PAT/ORD/SAM/TST codes (no nested span) */
export const LAB_DETAIL_ID_VALUE = `${LAB_ENTITY_ID} font-normal text-right block`;

/** Inline IDs in timeline detail chips and dividers */
export const LAB_ENTITY_ID_INLINE = `${LAB_ENTITY_ID} font-normal`;

/** Shared lab header rows (modals; cards can reuse audit/badge row tokens) */
export const LAB_HEADER = {
  /** Space between identity / badges / audit blocks */
  stack: 'flex flex-col gap-2 min-w-0',
  cardStack: 'flex flex-col gap-0.5 min-w-0',
  row: 'min-h-0 min-w-0 w-full leading-snug',
  badgeRow: 'flex min-w-0 flex-1 flex-wrap items-center gap-2 overflow-hidden',
  /** Space between multiple audit lines within the audit block */
  auditStack: 'flex flex-col gap-0.5 min-w-0',
  auditLine: TEXT_METADATA,
} as const;

/** Lab detail modal layout — header metadata + grid field stacks */
export const LAB_MODAL_DETAIL = {
  headerStack: LAB_HEADER.stack,
  headerRow: LAB_HEADER.row,
  sectionStack: 'space-y-3',
} as const;

// Typography Constants (shared tokens for body/metadata; lab-specific for title/section)
export const LAB_CARD_TYPOGRAPHY = {
  // Test/Item Names (primary emphasis)
  title: 'text-sm font-medium text-text-primary',

  // Section Headers (lab-specific: uppercase/tracking)
  sectionTitle: 'text-xxs font-medium text-text-tertiary uppercase tracking-wide',

  // Patient Names (within text-xs context)
  patientName: 'font-normal text-text-primary capitalize',

  // Standard Body Text – shared token
  bodyText: BODY_SECONDARY,

  // Metadata/Secondary Text – shared token
  metadata: TEXT_METADATA,

  // Separator/Divider Text
  separator: 'text-text-disabled',

  // Emphasized Inline Text
  emphasizedInline: 'text-text-secondary',

  // Flags Text (in red context)
  flagText: 'text-xs text-danger-fg',
  flagTitle: 'text-xxs font-medium text-danger-fg uppercase tracking-wide',
} as const;

/** Section container titles — matches InfoBanner / “Required for” on lab cards */
export const LAB_SECTION_PANEL = {
  wrapper: 'bg-surface-page',
  header: 'px-2 py-2',
  title: LAB_CARD_TYPOGRAPHY.sectionTitle,
  content: 'p-2',
} as const;

// Spacing Constants
export const LAB_CARD_SPACING = {
  // Card internal gaps
  cardGap: 'gap-1',

  // Section content margins
  sectionTitleMargin: 'mb-1.5',

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

  // Content section (gray background)
  contentSection: 'bg-surface-page rounded p-2 border border-border-default',

  // Flags section (red background)
  flagsSection: 'bg-danger-bg rounded p-2 border border-danger-stroke',
} as const;

// List Item Constants
export const LAB_CARD_LIST_ITEMS = {
  // Test list item
  testItem: 'flex items-center text-xs text-text-secondary',

  // List bullet (gray)
  bullet: 'w-1 h-1 rounded-full bg-neutral-400 mr-2',

  // List bullet (red for flags)
  bulletRed: 'w-1 h-1 rounded-full bg-danger-text mr-2',

  // Test name in list
  testName: 'font-normal mr-1',

  // Test code in list
  testCode: 'entity-id',
} as const;

// Context Row Constants (Patient/Order info)
export const LAB_CARD_CONTEXT = {
  container:
    'flex items-center gap-x-2 gap-y-0 text-xs text-text-tertiary flex-wrap min-w-0 w-full leading-snug',
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
  stack: 'flex flex-col min-h-0 min-w-0 w-full flex-1 gap-1.5',
  titleHead:
    'grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_auto] gap-x-2 gap-y-0.5 items-start',
  title: 'm-0 col-start-1 row-start-1 text-sm font-normal text-text-primary truncate leading-snug normal-case',
  subline:
    'col-start-1 row-start-2 flex items-center gap-1.5 min-w-0 text-xs text-text-secondary leading-snug',
  sublineName: 'truncate capitalize font-normal text-text-secondary',
  metaLine: 'text-xs text-text-tertiary leading-snug',
  body: 'text-xs text-text-secondary leading-snug',
  footer: 'flex items-center justify-between gap-2 pt-2 mt-auto border-t border-border-subtle',
  badgeRail: 'flex min-w-0 flex-1 flex-wrap items-center gap-1.5',
  actionRail: 'flex shrink-0 items-center justify-end gap-1.5',
  titleAside: 'col-start-2 row-start-1 shrink-0',
} as const;
