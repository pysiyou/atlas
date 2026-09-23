/**
 * UI Constants
 * Shared pagination sizes, display limits, empty-state copy, and typography aliases.
 */

import { EMPTY_COPY, emptySubtitle, emptyTitle } from '@/components/display/emptyStateCopy';
import { DETAIL_TYPE, TYPE, TABLE_TYPE } from '@/components/theme/recipes';

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

export const DEFAULT_EMPTY_TITLE = EMPTY_COPY.data.title;
export const DEFAULT_EMPTY_DESCRIPTION = EMPTY_COPY.data.description;
export const DEFAULT_EMPTY_DESCRIPTION_SEARCH = emptySubtitle(
  'results',
  'your search or filters match records',
);
export const DEFAULT_EMPTY_DESCRIPTION_FILTERS = emptySubtitle(
  'results',
  'your filters match records',
);
export const DEFAULT_EMPTY_ICON = 'database' as const;
export const EMPTY_ICON_SEARCH = 'search' as const;
export const DEFAULT_EMPTY_TITLE_NO_MATCHES = emptyTitle('matching results');

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

/** Detail row label — prefer DETAIL_TYPE from recipes for new code. */
export const DETAIL_LABEL = DETAIL_TYPE.label;

/** Key-value table label (e.g. catalog test detail). */
export const DETAIL_TABLE_LABEL = DETAIL_TYPE.sectionTitleCompact;

/** Detail row value. */
export const DETAIL_VALUE = DETAIL_TYPE.value;

/** Amount/currency in forms, receipts, non-table surfaces. */
export const DATA_AMOUNT = TYPE.amount;

/** Table currency cells — prefer in *Table.config.tsx. */
export const TABLE_DATA_AMOUNT = TABLE_TYPE.amount;

/** Metadata/secondary label text (timestamps, captions). */
export const TEXT_METADATA = DETAIL_TYPE.meta;

/** Body text secondary (descriptions, list content). */
export const BODY_SECONDARY = DETAIL_TYPE.label;

/** Detail page title (h1). */
export const DETAIL_TITLE = DETAIL_TYPE.title;

/** Detail page subtitle (under title). */
export const DETAIL_SUBTITLE = DETAIL_TYPE.subtitle;

/** List/page title. */
export const PAGE_TITLE = TYPE.pageTitle;
