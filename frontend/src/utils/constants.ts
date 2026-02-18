/**
 * UI Constants
 * Shared pagination sizes, display limits, empty-state copy, and typography class strings.
 */

// ---------------------------------------------------------------------------
// Pagination & Display Limits
// ---------------------------------------------------------------------------

export const PAGINATION_SIZES = [10, 20, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 20;

export const MAX_DISPLAY_ITEMS = {
  TESTS_IN_CARD: 2,
  TESTS_IN_TABLE: 2,
  DOTS_IN_TIMELINE: 6,
} as const;

export const PRICE_RANGE = {
  MIN: 0,
  MAX: 10000,
} as const;

export const AGE_RANGE = {
  MIN: 0,
  MAX: 120,
} as const;

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

export const DEFAULT_EMPTY_TITLE = 'No data available';
export const DEFAULT_EMPTY_DESCRIPTION = 'Try adjusting filters or add new items.';
export const DEFAULT_EMPTY_DESCRIPTION_SEARCH =
  "Try adjusting your search or filters to find what you're looking for.";
export const DEFAULT_EMPTY_DESCRIPTION_FILTERS = 'Try adjusting your search or filters.';
export const DEFAULT_EMPTY_ICON = 'document' as const;
export const EMPTY_ICON_SEARCH = 'search' as const;
export const DEFAULT_EMPTY_TITLE_NO_MATCHES = 'No Matches Found';

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/** Primary ID cell in table rows (patient/order/test/code). */
export const DATA_ID_PRIMARY = 'text-xs text-text-primary font-mono truncate block';

/** Primary ID inline (no block). */
export const DATA_ID_PRIMARY_INLINE = 'text-xs text-text-primary font-mono truncate';

/** Primary ID as a clickable control. */
export const DATA_ID_PRIMARY_CLICKABLE =
  'text-xs text-text-primary font-mono hover:underline truncate block max-w-full';

/** Secondary ID under a name (e.g. patient ID under patient name). */
export const DATA_ID_SECONDARY = 'text-xxs text-text-tertiary  truncate font-mono';

/** Detail row label. */
export const DETAIL_LABEL = 'text-xs text-text-tertiary';

/** Detail row value. */
export const DETAIL_VALUE = 'text-xs text-text-primary';

/** Amount/currency cell. */
export const DATA_AMOUNT = 'text-sm text-text-primary';

/** Metadata/secondary label text (timestamps, captions). */
export const TEXT_METADATA = 'text-xs text-text-tertiary';

/** Body text secondary (descriptions, list content). */
export const BODY_SECONDARY = 'text-xs text-text-secondary';

/** Detail page title (h1). */
export const DETAIL_TITLE = 'text-sm font-medium text-text-primary';

/** Detail page subtitle (under title). */
export const DETAIL_SUBTITLE = 'text-xs text-text-tertiary';

/** List/page title. */
export const PAGE_TITLE = 'text-lg font-light text-text-primary';
