/**
 * Empty state copy and default icon names.
 * Use with EmptyState component; import ICONS from @/utils for icon components.
 */

/** Default title when no data is available */
export const DEFAULT_EMPTY_TITLE = 'No data available';

/** Default description for tables/lists (filters or add items) */
export const DEFAULT_EMPTY_DESCRIPTION = 'Try adjusting filters or add new items.';

/** Default description for search/filter empty results */
export const DEFAULT_EMPTY_DESCRIPTION_SEARCH = 'Try adjusting your search or filters to find what you\'re looking for.';

/** Shorter description for filter-only contexts (e.g. LabWorkflowView) */
export const DEFAULT_EMPTY_DESCRIPTION_FILTERS = 'Try adjusting your search or filters.';

/** Default icon name for generic empty state (use with ICONS.dataFields.document) */
export const DEFAULT_EMPTY_ICON = 'document' as const;

/** Icon name for search/no-results empty state (use with ICONS.actions.search) */
export const EMPTY_ICON_SEARCH = 'search' as const;

/** Title for no search matches */
export const DEFAULT_EMPTY_TITLE_NO_MATCHES = 'No Matches Found';
