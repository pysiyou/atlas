/**
 * Lab queue row types — OpenAPI worklist DTOs and thin helpers.
 */

import type { CollectionQueueRow, SampleCollectionQueueItem } from '@/types/lab-operations';
import type { EntryWorklistItem, ValidationWorklistItem } from '@/types/labWorklist';
import type { PendingEscalationItem } from '../api/results';

export type { CollectionQueueRow, SampleCollectionQueueItem };

export type EntryQueueRow = EntryWorklistItem;

/** Locate an entry worklist row by `orderTestId`. */
export function findEntryRowById(
  rows: EntryQueueRow[],
  orderTestId: number
): EntryQueueRow | undefined {
  if (!Number.isFinite(orderTestId)) return undefined;
  return rows.find(row => row.orderTestId === orderTestId);
}

export type ValidationQueueRow = ValidationWorklistItem;

/** Locate a validation worklist row by `orderTestId`. */
export function findValidationRowById(
  rows: ValidationQueueRow[],
  orderTestId: number
): ValidationQueueRow | undefined {
  if (!Number.isFinite(orderTestId)) return undefined;
  return rows.find(row => row.orderTestId === orderTestId);
}

export type EscalationQueueItem = PendingEscalationItem;
