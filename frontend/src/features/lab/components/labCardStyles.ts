/**
 * Lab Card Style Tokens
 * Unified style system for all lab workflow cards
 */
import { semanticColors, brandColors, neutralColors } from '@/shared/design-system/tokens/colors';

// Typography Tokens
export const LAB_CARD_TYPOGRAPHY = {
  // Test/Item Names (primary emphasis)
  title: `text-sm font-medium ${neutralColors.text.primary}`,

  // Section Headers (small caps style)
  sectionTitle: `text-xxs font-medium ${neutralColors.text.muted} uppercase tracking-wide`,

  // Patient Names (medium emphasis within text-xs context)
  patientName: `font-medium ${neutralColors.text.primary}`,

  // Standard Body Text
  bodyText: `text-xs ${neutralColors.text.secondary}`,

  // Metadata/Secondary Text
  metadata: `text-xs ${neutralColors.text.muted}`,

  // Separator/Divider Text
  separator: `${neutralColors.text.disabled}`,

  // Emphasized Inline Text
  emphasizedInline: `${neutralColors.text.secondary}`,

  // Flags Text (in red context)
  flagText: `text-xs ${semanticColors.danger.textLightMedium}`,
  flagTitle: `text-xxs font-medium ${semanticColors.danger.textLightMedium} uppercase tracking-wide`,
} as const;

// Spacing Tokens
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

// Container Tokens
export const LAB_CARD_CONTAINERS = {
  // Main card wrapper
  cardWrapper: 'cursor-pointer',

  // Card base styling (applied via Card component)
  cardBase:
    `border ${neutralColors.border.default} hover:border hover:${brandColors.primary.borderLighter} hover:${brandColors.primary.backgroundLightBg} transition-all duration-200`,

  // Content section (gray background)
  contentSection: `bg-app-bg rounded p-2 border ${neutralColors.border.default}`,

  // Flags section (red background)
  flagsSection: `${semanticColors.danger.backgroundLight} rounded p-2 border ${semanticColors.danger.border}`,
} as const;

// List Item Tokens
export const LAB_CARD_LIST_ITEMS = {
  // Test list item
  testItem: `flex items-center text-xs ${neutralColors.text.secondary}`,

  // List bullet (gray)
  bullet: 'w-1 h-1 rounded-full bg-neutral-400 mr-2',

  // List bullet (red for flags)
  bulletRed: `w-1 h-1 rounded-full ${semanticColors.danger.backgroundMedium} mr-2`,

  // Test name in list
  testName: 'font-medium mr-1',

  // Test code in list
  testCode: `${neutralColors.text.muted}`,
} as const;

// Context Row Tokens (Patient/Order info)
export const LAB_CARD_CONTEXT = {
  // Container for context row
  container: `flex items-center gap-2 text-xs ${neutralColors.text.muted} flex-wrap`,

  // Patient name styling
  patientName: `font-medium ${neutralColors.text.primary}`,

  // Separator between items
  separator: `${neutralColors.text.disabled}`,
} as const;

// Header Row Tokens (Badges & Actions)
export const LAB_CARD_HEADER = {
  // Container for badges and actions
  container: 'flex items-center justify-between gap-3 flex-wrap py-0',

  // Left side (badges)
  badgeGroup: 'flex items-center gap-3 flex-wrap',

  // Right side (actions)
  actionGroup: 'flex items-center gap-2 flex-wrap',
} as const;
