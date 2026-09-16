/**
 * UI Constants
 * Shared pagination sizes, display limits, empty-state copy, and typography aliases.
 */

import { TYPE } from '@/components/theme/recipes';

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

// ---------------------------------------------------------------------------
// Entity ID typography (see theme.css --id-* tokens and .entity-id class)
// ---------------------------------------------------------------------------

/** Base entity ID style (patient, order, sample, test, catalog code, etc.). */
export const ENTITY_ID = 'entity-id';

/** Smaller / muted ID under a primary label. */
export const ENTITY_ID_SECONDARY = 'entity-id entity-id--secondary';

/** ID as a block-level truncated cell. */
export const ENTITY_ID_BLOCK = 'entity-id truncate block';

/** ID inline without block layout. */
export const ENTITY_ID_INLINE = 'entity-id truncate';

/** Clickable ID link style. */
export const ENTITY_ID_CLICKABLE = 'entity-id entity-id--clickable truncate block max-w-full';

/** True when a class string applies entity-id typography (used by Avatar, etc.). */
export function isEntityIdClassName(className?: string): boolean {
  return className?.includes('entity-id') ?? false;
}

/** Detail row label. */
export const DETAIL_LABEL = TYPE.label;

/** Key-value table label (e.g. catalog test detail). */
export const DETAIL_TABLE_LABEL = TYPE.sectionTitle;

/** Detail row value. */
export const DETAIL_VALUE = TYPE.value;

/** Amount/currency cell. */
export const DATA_AMOUNT = TYPE.amount;

/** Metadata/secondary label text (timestamps, captions). */
export const TEXT_METADATA = TYPE.meta;

/** Body text secondary (descriptions, list content). */
export const BODY_SECONDARY = TYPE.label;

/** Detail page title (h1). */
export const DETAIL_TITLE = TYPE.detailTitle;

/** Detail page subtitle (under title). */
export const DETAIL_SUBTITLE = TYPE.meta;

/** List/page title. */
export const PAGE_TITLE = TYPE.pageTitle;
