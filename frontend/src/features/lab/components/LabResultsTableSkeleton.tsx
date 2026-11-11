/**
 * Results table loading chrome — real column titles plus FieldsPlaceholder in the body.
 */

import { TableLoadingPlaceholder } from '@/components/data-table/TableLoadingPlaceholder';

export const LAB_RESULTS_TABLE_HEADERS = ['Parameter', 'Result', 'Reference interval'] as const;

/** Thin wrapper: lab result column titles + the shared table body placeholder. */
export function LabResultsTableSkeleton() {
  return <TableLoadingPlaceholder headers={LAB_RESULTS_TABLE_HEADERS} />;
}
