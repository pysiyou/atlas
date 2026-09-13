/**
 * Shared API constants.
 */
/** Default page size for server-paginated list views */
export const DEFAULT_LIST_PAGE_SIZE = 20;

/** Max records for reference-data bulk loads (catalog, affiliations, user lookup) */
export const REFERENCE_DATA_LIMIT = 1000;

/** Max records for workflow/dashboard views — not full-table scans */
export const WORKFLOW_QUERY_LIMIT = 500;

/** @deprecated Use paginated hooks, WORKFLOW_QUERY_LIMIT, or REFERENCE_DATA_LIMIT */
export const LEGACY_BULK_LIMIT = WORKFLOW_QUERY_LIMIT;
