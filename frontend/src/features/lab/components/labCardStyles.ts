/**
 * Lab Card Style Tokens
 * Unified style system for all lab workflow cards
 */

// Typography Tokens
export const LAB_CARD_TYPOGRAPHY = {
  // Test/Item Names (primary emphasis)
  title: 'text-sm font-medium text-gray-900',

  // Section Headers (small caps style)
  sectionTitle: 'text-xxs font-medium text-gray-500 uppercase tracking-wide',

  // Patient Names (medium emphasis within text-xs context)
  patientName: 'font-medium text-gray-900',

  // Standard Body Text
  bodyText: 'text-xs text-gray-700',

  // Metadata/Secondary Text
  metadata: 'text-xs text-gray-500',

  // Separator/Divider Text
  separator: 'text-gray-300',

  // Emphasized Inline Text
  emphasizedInline: 'text-gray-700',

  // Flags Text (in red context)
  flagText: 'text-xs text-red-700',
  flagTitle: 'text-xxs font-medium text-red-700 uppercase tracking-wide',
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
    'border border-gray-200 hover:border hover:border-blue-100 hover:bg-blue-50 transition-all duration-200',

  // Content section (gray background)
  contentSection: 'bg-gray-50 rounded p-2 border border-gray-100',

  // Flags section (red background)
  flagsSection: 'bg-red-50 rounded p-2 border border-red-100',
} as const;

// List Item Tokens
export const LAB_CARD_LIST_ITEMS = {
  // Test list item
  testItem: 'flex items-center text-xs text-gray-700',

  // List bullet (gray)
  bullet: 'w-1.5 h-1.5 rounded-full bg-gray-400 mr-2',

  // List bullet (red for flags)
  bulletRed: 'w-1.5 h-1.5 rounded-full bg-red-500 mr-2',

  // Test name in list
  testName: 'font-medium mr-1',

  // Test code in list
  testCode: 'text-gray-500',
} as const;

// Context Row Tokens (Patient/Order info)
export const LAB_CARD_CONTEXT = {
  // Container for context row
  container: 'flex items-center gap-2 text-xs text-gray-500 flex-wrap',

  // Patient name styling
  patientName: 'font-medium text-gray-900',

  // Separator between items
  separator: 'text-gray-300',
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
