/**
 * Test workflow header badges (entry / validation / escalation) — enums only on cards.
 * Collection badges live in LabWorkflowCollectionBadges.tsx.
 */

import { memo, type ReactNode } from 'react';
import { type BadgeSize } from '@/components';
import type { TestWithContext } from '@/types';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import { OrderTestStatusBadge } from '@/features/orders';
import {
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from './LabDomainBadges';
import { StatusPresentationStack } from '@/components/display/StatusPresentationBadge';
import { LabCardMetaRow, QueueAgeMeta, TestRejectionTailMeta } from './LabCardMetaRow';

export {
  CollectionHeaderBadges,
  CollectionCardMeta,
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
  const presentation = test.lab?.statusPresentation ?? null;
  if (presentation) {
    return <StatusPresentationStack presentation={presentation} size={size} />;
  }
  if (variant === 'escalation') {
    return <SampleStatusBadge status="escalated" size={size} />;
  }
  if (test.status) {
    return <OrderTestStatusBadge status={test.status} size={size} />;
  }
  return null;
}

function TestHeaderBadgesView({
  test,
  variant = 'entry',
  size = LAB_CARD_BADGE_SIZE,
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

export function TestCardMeta({
  test,
  variant = 'entry',
  queueSince,
  emphasizeCritical = false,
  flagCount,
  reasonCode,
}: TestCardMetaProps) {
  return (
    <>
      <LabCardMetaRow>
        {queueSince ? <QueueAgeMeta since={queueSince} /> : null}
        {variant === 'validation' && emphasizeCritical && test.hasCriticalValues ? (
          <span className="text-danger-fg font-normal">Critical values</span>
        ) : null}
        {variant === 'validation' && flagCount != null && flagCount > 0 ? (
          <span>{flagCount} flag{flagCount !== 1 ? 's' : ''}</span>
        ) : null}
        {variant === 'escalation' && reasonCode ? <span>Reason: {reasonCode}</span> : null}
      </LabCardMetaRow>
      <TestRejectionTailMeta test={test} />
    </>
  );
}
