/**
 * Monitor worklist table — status column aligns with order detail tests table.
 */
import React from 'react';
import { SampleStatusBadge } from '../components/LabDomainBadges';
import { BlockedReasonBadge } from '../components/LabResultStatusBadges';
import { BLOCKED_LABELS } from '@/types/generated/labBlockers';
import type { TestStatus } from '@/types';
import type { LabOrderTableRow } from './LabOrdersTable';

const PENDING_BLOCKED_LABELS = new Set<string>([
  BLOCKED_LABELS.payment_unpaid,
  BLOCKED_LABELS.specimen_recollection,
]);

function shouldShowPendingForBlockedLabel(blockedLabel: string | null | undefined): boolean {
  return blockedLabel != null && PENDING_BLOCKED_LABELS.has(blockedLabel);
}

/** Sort/filter accessor for the status column. */
export function getLabMonitorTableStatusKey(row: LabOrderTableRow): string {
  if (row.status === 'superseded') return row.status;
  if (shouldShowPendingForBlockedLabel(row.blockedLabel)) return 'pending';
  return row.blockedLabel ?? row.status;
}

export function renderLabMonitorTableStatusCell(row: LabOrderTableRow): React.ReactNode {
  if (row.status === 'superseded') {
    return <SampleStatusBadge status="superseded" size="xs" />;
  }
  if (shouldShowPendingForBlockedLabel(row.blockedLabel)) {
    return <SampleStatusBadge status="pending" size="xs" />;
  }
  if (row.blockedLabel) {
    return <BlockedReasonBadge label={row.blockedLabel} size="xs" showIcon={false} />;
  }
  return <SampleStatusBadge status={row.status as TestStatus} size="xs" />;
}
