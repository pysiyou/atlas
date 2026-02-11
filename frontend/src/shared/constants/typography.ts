/**
 * Shared typography constants for data-type symmetry across tables and detail views.
 * Use these so identical data types (e.g. Patient ID, Order ID, Test ID) share the same
 * typography, weight, and color everywhere.
 */

/** Primary ID cell: Patient ID, Order ID, Test ID, Code in table cells. Uses theme --text. */
export const DATA_ID_PRIMARY =
  'text-xs text-text-primary font-mono truncate block';

/** Primary ID inline (e.g. inside flex); same as primary but no block */
export const DATA_ID_PRIMARY_INLINE =
  'text-xs text-text-primary font-mono truncate';

/** Primary ID when rendered as a clickable control (e.g. button); add hover:underline only */
export const DATA_ID_PRIMARY_CLICKABLE =
  'text-xs text-text-primary font-mono hover:underline truncate block max-w-full';

/** Secondary ID under a name (e.g. patient ID under patient name, test code under test name) */
export const DATA_ID_SECONDARY = 'text-xxs text-text-tertiary  truncate font-mono';

/** Detail row label: consistent scale for field labels in DetailField, InfoField, DetailsTable */
export const DETAIL_LABEL = 'text-xs text-text-tertiary';

/** Detail row value: consistent scale for field values */
export const DETAIL_VALUE = 'text-sm text-text-primary';

/** Amount/currency cell: consistent styling for price and amount columns */
export const DATA_AMOUNT = 'text-sm text-text-primary';

/** Metadata/secondary label text (e.g. timestamps, captions) */
export const TEXT_METADATA = 'text-xs text-text-tertiary';

/** Body text secondary (e.g. descriptions, list content) */
export const BODY_SECONDARY = 'text-xs text-text-secondary';

/** Detail page title (h1); consistent across Patient/Order/Catalog headers */
export const DETAIL_TITLE = 'text-sm font-medium text-text-primary';

/** Detail page subtitle (under title) */
export const DETAIL_SUBTITLE = 'text-xs text-text-tertiary';

/** List/page title (matches PageHeaderBar) */
export const PAGE_TITLE = 'text-lg font-light text-text-primary';
