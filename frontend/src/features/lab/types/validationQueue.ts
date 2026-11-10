/**
 * Validation queue — OpenAPI worklist row helpers.
 */
import type { ValidationWorklistItem } from '@/types/labWorklist';

export type ValidationQueueRow = ValidationWorklistItem;

export function findValidationRowById(
  rows: ValidationQueueRow[],
  orderTestId: number
): ValidationQueueRow | undefined {
  return rows.find(row => row.orderTestId === orderTestId);
}
