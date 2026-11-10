/**
 * Entry queue — OpenAPI worklist row helpers (no TestWithContext in the list pipeline).
 */
import type { EntryWorklistItem } from '@/types/labWorklist';

export type EntryQueueRow = EntryWorklistItem;

export function findEntryRowById(
  rows: EntryQueueRow[],
  orderTestId: number
): EntryQueueRow | undefined {
  return rows.find(row => row.orderTestId === orderTestId);
}
