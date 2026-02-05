/**
 * Shared typography constants for data-type symmetry across tables and detail views.
 * Use these so identical data types (e.g. Patient ID, Order ID, Test ID) share the same
 * typography, weight, and color everywhere.
 */

/** Primary ID cell: Patient ID, Order ID, Test ID, Code in table cells */
export const DATA_ID_PRIMARY =
  'text-xs text-brand font-mono truncate block';

/** Primary ID inline (e.g. inside flex); same as primary but no block */
export const DATA_ID_PRIMARY_INLINE =
  'text-xs text-brand font-mono truncate';

/** Primary ID when rendered as a clickable control (e.g. button); add hover:underline only */
export const DATA_ID_PRIMARY_CLICKABLE =
  'text-xs text-brand font-mono hover:underline truncate block max-w-full';

/** Secondary ID under a name (e.g. patient ID under patient name, test code under test name) */
export const DATA_ID_SECONDARY = 'text-xxs text-brand truncate font-mono';

/** Detail row label: consistent scale for field labels in DetailField, InfoField, DetailsTable */
export const DETAIL_LABEL = 'text-xs text-fg-subtle';

/** Detail row value: consistent scale for field values */
export const DETAIL_VALUE = 'text-sm text-fg';

/** Amount/currency cell: consistent styling for price and amount columns */
export const DATA_AMOUNT = 'text-sm text-fg';

/** Metadata/secondary label text (e.g. timestamps, captions) */
export const TEXT_METADATA = 'text-xs text-fg-subtle';

/** Body text secondary (e.g. descriptions, list content) */
export const BODY_SECONDARY = 'text-xs text-fg-muted';
