/**
 * Test workflow header badges (entry / validation / escalation) — enums only on cards.
 * Collection badges live in LabWorkflowCollectionBadges.tsx.
 */

import { memo, type ReactNode } from 'react';
import type { BadgeSize } from '@/components/primitives';
import type { TestWithContext } from '@/types';
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

export {
  CollectionHeaderBadges,
  CollectionCardAlerts,
  CollectionModalMeta,
  type CollectionHeaderBadgesProps,
  type CollectionCardMetaProps,
} from './LabWorkflowCollectionBadges';

export interface TestHeaderBadgesProps {
  test: TestWithContext;
  variant?: 'entry' | 'validation' | 'escalation';
  size?: BadgeSize;
  showStatus?: boolean;
  trailing?: ReactNode;
}

function TestStatusChip({
  test,
  size,
  variant,
}: {
  test: TestWithContext;
  size: BadgeSize;
  variant: 'entry' | 'validation' | 'escalation';
}) {
  const compact = useLabHeaderCompact();
  if (variant === 'escalation' && !test.lab?.statusPresentation) {
    return <SampleStatusBadge status="escalated" size={size} />;
  }
  if (test.status || test.lab?.statusPresentation) {
    return (
      <StatusPresentationBadge
        status={test.status ?? 'pending'}
        presentation={test.lab?.statusPresentation}
        layout={compact ? 'compact' : 'stack'}
        size={size}
      />
    );
  }
  return null;
}

function TestHeaderBadgesView({
  test,
  variant = 'entry',
  size = WORKLIST_CARD_BADGE_SIZE,
  showStatus = false,
  trailing,
}: TestHeaderBadgesProps) {
  const showPriority = test.priority === 'urgent' || test.priority === 'high';

  if (variant === 'escalation') {
    return (
      <>
        <TestStatusChip test={test} size={size} variant="escalation" />
        {showPriority && test.priority ? <LabPriorityBadge priority={test.priority} size={size} /> : null}
        {test.sampleType ? <SampleTypeBadge sampleType={test.sampleType} size={size} /> : null}
        {trailing}
      </>
    );
  }

  return (
    <>
      {showPriority && test.priority ? <LabPriorityBadge priority={test.priority} size={size} /> : null}
      {test.sampleType ? <SampleTypeBadge sampleType={test.sampleType} size={size} /> : null}
      {showStatus ? <TestStatusChip test={test} size={size} variant={variant} /> : null}
      {trailing}
    </>
  );
}

export const TestHeaderBadges = memo(TestHeaderBadgesView);
TestHeaderBadges.displayName = 'TestHeaderBadges';

export interface TestCardMetaProps {
  test: TestWithContext;
  variant?: 'entry' | 'validation' | 'escalation';
  queueSince?: string;
  emphasizeCritical?: boolean;
  flagCount?: number;
  reasonCode?: string;
}

function TestOperationalMeta({
  test,
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
        {variant === 'validation' && emphasizeCritical && test.hasCriticalValues ? (
          <span className="text-danger-fg font-normal">Critical values</span>
        ) : null}
        {variant === 'validation' && flagCount != null && flagCount > 0 ? (
          <span>{flagCount} flag{flagCount !== 1 ? 's' : ''}</span>
        ) : null}
        {variant === 'escalation' && reasonCode ? <span>Reason: {reasonCode}</span> : null}
      </MetaRow>
      <TestRejectionTailMeta test={test} />
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
