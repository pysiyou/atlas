/**
 * UI Constants
 * Shared pagination sizes, display limits, empty-state copy, and typography aliases.
 */

import { EMPTY_COPY, emptySubtitle, emptyTitle } from '@/components/display/emptyStateCopy';

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
// Entity ID typography (see theme.css --id-* tokens and .entity-id class)
// ---------------------------------------------------------------------------

/** Base entity ID style (patient, order, sample, test, catalog code, etc.). */
export const ENTITY_ID = 'entity-id';

/** Smaller / muted ID under a primary label. */
export const ENTITY_ID_SECONDARY = 'entity-id entity-id--secondary';

/** Secondary ID as a left-aligned table/card sub-line (block, full width). */
export const ENTITY_ID_SECONDARY_BLOCK =
  'entity-id entity-id--secondary truncate block max-w-full w-full text-left self-start';

/** Muted ID in queue/modal headers — same size as primary IDs, secondary color only. */
export const ENTITY_ID_HEADER_SECONDARY = 'entity-id entity-id--header-secondary';

/** ID as a block-level truncated cell. */
export const ENTITY_ID_BLOCK = 'entity-id truncate block';

/** ID inline without block layout. */
export const ENTITY_ID_INLINE = 'entity-id truncate';

/** Clickable ID link style. */
export const ENTITY_ID_CLICKABLE = 'entity-id entity-id--clickable truncate block max-w-full';

