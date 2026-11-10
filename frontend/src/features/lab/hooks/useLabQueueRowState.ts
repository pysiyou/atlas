/**
 * Queue work-item state from an OpenAPI worklist / escalation row.
 */
import { useMemo } from 'react';
import type { LabOrderTestQueueRow, LabQueueRowDto } from '../types/labQueueChrome';
import { labModalWorkItemFromDto, queueStateFromRow } from '../types/labQueueChrome';
import type { OrderTestQueueState } from '../utils/queueDisplay';

export function useLabQueueRowState(row: LabQueueRowDto | LabOrderTestQueueRow): OrderTestQueueState {
  return useMemo(() => {
    const normalized =
      'orderTestId' in row && typeof row.orderTestId === 'number'
        ? (row as LabOrderTestQueueRow)
        : labModalWorkItemFromDto(row as LabQueueRowDto);
    return queueStateFromRow(normalized);
  }, [row]);
}
