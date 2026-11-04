/**
 * Shared API constants.
 */
/** Default page size for server-paginated list views */
export const DEFAULT_LIST_PAGE_SIZE = 20;

/** Standard rows-per-page choices for server list footers (includes {@link DEFAULT_LIST_PAGE_SIZE}). */
export const LIST_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/** Max records for reference-data bulk loads (catalog, affiliations, user lookup) */
export const REFERENCE_DATA_LIMIT = 1000;

/** Max records for workflow/dashboard views — not full-table scans */
export const WORKFLOW_QUERY_LIMIT = 500;
