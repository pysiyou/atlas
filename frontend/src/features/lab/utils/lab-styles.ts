/**
 * Lab Card Style Constants
 * Uses shared typography tokens where they match; lab-specific tokens for section titles etc.
 */

import { TEXT_METADATA, BODY_SECONDARY } from '@/shared/constants';

// Typography Constants (shared tokens for body/metadata; lab-specific for title/section)
export const LAB_CARD_TYPOGRAPHY = {
  // Test/Item Names (primary emphasis)
  title: 'text-sm font-medium text-text-primary',

  // Section Headers (lab-specific: uppercase/tracking)
  sectionTitle: 'text-xxs font-medium text-text-tertiary uppercase tracking-wide',

  // Patient Names (medium emphasis within text-xs context)
  patientName: 'font-medium text-text-primary',

  // Standard Body Text – shared token
  bodyText: BODY_SECONDARY,

  // Metadata/Secondary Text – shared token
  metadata: TEXT_METADATA,

  // Separator/Divider Text
  separator: 'text-text-disabled',

  // Emphasized Inline Text
  emphasizedInline: 'text-text-secondary',

  // Flags Text (in red context)
  flagText: 'text-xs text-red-600',
  flagTitle: 'text-xxs font-medium text-red-600 uppercase tracking-wide',
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
    'border border-border hover:border hover:border-sky-200 hover:bg-sky-50/30 transition-all duration-200',

  // Content section (gray background)
  contentSection: 'bg-app-bg rounded p-2 border border-border',

  // Flags section (red background)
  flagsSection: 'bg-red-50 rounded p-2 border border-red-200',
} as const;

// List Item Constants
export const LAB_CARD_LIST_ITEMS = {
  // Test list item
  testItem: 'flex items-center text-xs text-text-secondary',

  // List bullet (gray)
  bullet: 'w-1 h-1 rounded-full bg-neutral-400 mr-2',

  // List bullet (red for flags)
  bulletRed: 'w-1 h-1 rounded-full bg-red-500 mr-2',

  // Test name in list
  testName: 'font-medium mr-1',

  // Test code in list
  testCode: 'text-brand font-mono',
} as const;

// Context Row Constants (Patient/Order info)
export const LAB_CARD_CONTEXT = {
  // Container for context row
  container: 'flex items-center gap-2 text-xs text-text-tertiary flex-wrap',

  // Patient name styling
  patientName: 'font-medium text-text-primary',

  // Separator between items
  separator: 'text-text-disabled',
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
