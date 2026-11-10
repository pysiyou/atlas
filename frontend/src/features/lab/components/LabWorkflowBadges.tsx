/**
 * Test workflow header badges (entry / validation / escalation) — enums only on cards.
 * Collection badges live in LabWorkflowCollectionBadges.tsx.
 */

import { memo, type ReactNode } from 'react';
import type { BadgeSize } from '@/components/primitives';
import { WORKLIST_CARD_BADGE_SIZE } from '@/theme/recipes';
import {
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from './LabDomainBadges';
import { StatusPresentationBadge } from '@/utils/presentation';
import { useLabHeaderCompact } from './LabWorkflowHeader';
import {
  LabCardMetaRow,
  LabModalMetaRow,
  QueueAgeMeta,
  TestRejectionTailMeta,
} from './LabCardMetaRow';
import type { LabOrderTestQueueRow } from '../types/labQueueChrome';

export {
  CollectionHeaderBadges,
  CollectionCardAlerts,
  CollectionModalMeta,
  type CollectionHeaderBadgesProps,
  type CollectionCardMetaProps,
} from './LabWorkflowCollectionBadges';

export interface TestHeaderBadgesProps {
  row: LabOrderTestQueueRow;
  variant?: 'entry' | 'validation' | 'escalation';
  size?: BadgeSize;
  showStatus?: boolean;
  trailing?: ReactNode;
}

function TestStatusChip({
  row,
  size,
  variant,
}: {
  row: LabOrderTestQueueRow;
  size: BadgeSize;
  variant: 'entry' | 'validation' | 'escalation';
}) {
  const compact = useLabHeaderCompact();
  const presentation = row.statusPresentation ?? row.lab?.statusPresentation;
  if (variant === 'escalation' && !presentation) {
    return <SampleStatusBadge status="escalated" size={size} />;
  }
  if (row.status || presentation) {
    return (
      <StatusPresentationBadge
        status={row.status ?? 'pending'}
        presentation={presentation}
        layout={compact ? 'compact' : 'stack'}
        size={size}
      />
    );
  }
  return null;
}

function TestHeaderBadgesView({
  row,
  variant = 'entry',
  size = WORKLIST_CARD_BADGE_SIZE,
  showStatus = false,
  trailing,
}: TestHeaderBadgesProps) {
  const showPriority = row.priority === 'urgent' || row.priority === 'high';

  if (variant === 'escalation') {
    return (
      <>
        <TestStatusChip row={row} size={size} variant="escalation" />
        {showPriority && row.priority ? <LabPriorityBadge priority={row.priority} size={size} /> : null}
        {row.sampleType ? <SampleTypeBadge sampleType={row.sampleType} size={size} /> : null}
        {trailing}
      </>
    );
  }

  return (
    <>
      {showPriority && row.priority ? <LabPriorityBadge priority={row.priority} size={size} /> : null}
      {row.sampleType ? <SampleTypeBadge sampleType={row.sampleType} size={size} /> : null}
      {showStatus ? <TestStatusChip row={row} size={size} variant={variant} /> : null}
      {trailing}
    </>
  );
}

export const TestHeaderBadges = memo(TestHeaderBadgesView);
TestHeaderBadges.displayName = 'TestHeaderBadges';

export interface TestCardMetaProps {
  row: LabOrderTestQueueRow;
  variant?: 'entry' | 'validation' | 'escalation';
  queueSince?: string;
  emphasizeCritical?: boolean;
  flagCount?: number;
  reasonCode?: string;
}

function TestOperationalMeta({
  row,
  variant = 'entry',
  queueSince,
  emphasizeCritical = false,
  flagCount,
  reasonCode,
  MetaRow,
}: TestCardMetaProps & { MetaRow: typeof LabCardMetaRow | typeof LabModalMetaRow }) {
  return (
    <>
      <MetaRow>
        {queueSince ? <QueueAgeMeta since={queueSince} /> : null}
        {variant === 'validation' && emphasizeCritical && row.hasCriticalValues ? (
          <span className="text-danger-fg font-normal">Critical values</span>
        ) : null}
        {variant === 'validation' && flagCount != null && flagCount > 0 ? (
          <span>{flagCount} flag{flagCount !== 1 ? 's' : ''}</span>
        ) : null}
        {variant === 'escalation' && reasonCode ? <span>Reason: {reasonCode}</span> : null}
      </MetaRow>
      <TestRejectionTailMeta row={row} />
    </>
  );
}

/** Queue card — same operational meta as modal (card typography). */
export function TestCardAlerts(props: TestCardMetaProps) {
  return <TestOperationalMeta {...props} MetaRow={LabCardMetaRow} />;
}

/** Detail modal — full operational meta. */
export function TestModalMeta(props: TestCardMetaProps) {
  return <TestOperationalMeta {...props} MetaRow={LabModalMetaRow} />;
}
