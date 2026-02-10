/**
 * Lab Card Style Constants
 * Uses shared typography tokens where they match; lab-specific tokens for section titles etc.
 */

import { TEXT_METADATA, BODY_SECONDARY } from '@/shared/constants';

// Typography Constants (shared tokens for body/metadata; lab-specific for title/section)
export const LAB_CARD_TYPOGRAPHY = {
  // Test/Item Names (primary emphasis)
  title: 'text-sm font-medium text-fg',

  // Section Headers (lab-specific: uppercase/tracking)
  sectionTitle: 'text-xxs font-medium text-fg-subtle uppercase tracking-wide',

  // Patient Names (medium emphasis within text-xs context)
  patientName: 'font-medium text-fg capitalize',

  // Standard Body Text – shared token
  bodyText: BODY_SECONDARY,

  // Metadata/Secondary Text – shared token
  metadata: TEXT_METADATA,

  // Separator/Divider Text
  separator: 'text-fg-disabled',

  // Emphasized Inline Text
  emphasizedInline: 'text-fg-muted',

  // Flags Text (in red context)
  flagText: 'text-xs text-danger-fg',
  flagTitle: 'text-xxs font-medium text-danger-fg uppercase tracking-wide',
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
  cardBase:
    'shadow-sm hover:bg-panel-hover transition-colors duration-200',

  // Content section (gray background)
  contentSection: 'bg-canvas rounded p-2 border border-stroke',

  // Flags section (red background)
  flagsSection: 'bg-danger-bg rounded p-2 border border-danger-border',
} as const;

// List Item Constants
export const LAB_CARD_LIST_ITEMS = {
  // Test list item
  testItem: 'flex items-center text-xs text-fg-muted',

  // List bullet (gray)
  bullet: 'w-1 h-1 rounded-full bg-neutral-400 mr-2',

  // List bullet (red for flags)
  bulletRed: 'w-1 h-1 rounded-full bg-danger-text mr-2',

  // Test name in list
  testName: 'font-medium mr-1',

  // Test code in list
  testCode: 'text-brand font-mono',
} as const;

// Context Row Constants (Patient/Order info)
export const LAB_CARD_CONTEXT = {
  // Container for context row
  container: 'flex items-center gap-2 text-xs text-fg-subtle flex-wrap',

  // Patient name styling
  patientName: 'font-medium text-fg capitalize',

  // Separator between items
  separator: 'text-fg-disabled',
} as const;

// Header Row Constants (Badges & Actions)
export const LAB_CARD_HEADER = {
  // Container for badges and actions
  container: 'flex items-center justify-between gap-3 flex-wrap py-0',

  // Left side (badges)
  badgeGroup: 'flex items-center gap-3 flex-wrap',

  // Right side (actions)
  actionGroup: 'flex items-center gap-2 flex-wrap',
} as const;
