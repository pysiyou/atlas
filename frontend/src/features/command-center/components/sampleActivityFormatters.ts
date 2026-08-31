/**
 * Sample category activity formatters: collect, reject, recollection request.
 */
import { displayId } from '@/utils/id';
import type { LabOperationRecord } from '@/types/lab-operations';
import type { ActivityLines } from './activityTypes';

export function formatSampleCollect(log: LabOperationRecord, performer: string): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'collected sample' },
      { type: 'badge', value: displayId.sample(log.entityId), variant: 'collected', isId: true },
    ],
    [
      { type: 'text', value: 'Sample status set to' },
      { type: 'badge', value: 'COLLECTED', variant: 'collected' },
    ],
  ];
}

export function formatSampleReject(log: LabOperationRecord, performer: string): ActivityLines {
  const lines: ActivityLines = [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'rejected sample' },
      { type: 'badge', value: displayId.sample(log.entityId), variant: 'rejected', isId: true },
    ],
    [
      { type: 'text', value: 'Sample status set to' },
      { type: 'badge', value: 'REJECTED', variant: 'rejected' },
    ],
  ];
  if (log.comment) {
    lines.push([
      { type: 'text', value: 'Reason:' },
      { type: 'badge', value: log.comment, variant: 'muted' },
    ]);
  }
  return lines;
}

export function formatSampleRecollectionRequest(
  log: LabOperationRecord,
  performer: string
): ActivityLines {
  return [
    [
      { type: 'name', value: performer },
      { type: 'text', value: 'requested a new collection for sample' },
      { type: 'badge', value: displayId.sample(log.entityId), variant: 'pending', isId: true },
    ],
    [
      { type: 'text', value: 'Recollection requested; sample remains' },
      { type: 'badge', value: 'PENDING', variant: 'pending' },
    ],
  ];
}
