/**
 * Test workflow header badges (entry / validation / escalation).
 * Collection badges live in LabWorkflowCollectionBadges.tsx.
 */

import { memo, type ReactNode } from 'react';
import { Badge, Icon, type BadgeSize } from '@/components';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/config/icons';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import { OrderTestStatusBadge } from '@/features/orders';
import {
  LabPriorityBadge,
  SampleStatusBadge,
  SampleTypeBadge,
} from './LabDomainBadges';
import { QueueAgeBadge } from './QueueAgeBadge';
import { StatusPresentationStack } from '@/components/display/StatusPresentationBadge';
import { FlagCountBadge } from './LabResultStatusBadges';
import { LabRejectionTailBadgesFromTest } from './LabRejectionTailBadges';
import { CompactMd } from './LabWorkflowBadgeChrome';

export {
  CollectionHeaderBadges,
  type CollectionHeaderBadgesProps,
} from './LabWorkflowCollectionBadges';

export interface TestHeaderBadgesProps {
  test: TestWithContext;
  variant?: 'entry' | 'validation' | 'escalation';
  size?: BadgeSize;
  showStatus?: boolean;
  queueSince?: string;
  emphasizeCritical?: boolean;
  flagCount?: number;
  reasonCode?: string;
  trailing?: ReactNode;
}

function compactBadgeSize(size: BadgeSize): 'xs' | 'sm' {
  return size === 'md' ? 'sm' : size;
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
  queueSince,
  emphasizeCritical = false,
  flagCount,
  reasonCode,
  trailing,
}: TestHeaderBadgesProps) {
  const showPriority = test.priority === 'urgent' || test.priority === 'high';
  const compactSize = compactBadgeSize(size);
  const rejectionTail = <LabRejectionTailBadgesFromTest test={test} size={size} />;

  if (variant === 'escalation') {
    return (
      <>
        <TestStatusChip test={test} size={size} variant="escalation" />
        {reasonCode ? (
          <Badge variant="warning" size={size}>
            {reasonCode}
          </Badge>
        ) : null}
        {showPriority && test.priority ? <LabPriorityBadge priority={test.priority} size={size} /> : null}
        {test.sampleType ? <SampleTypeBadge sampleType={test.sampleType} size={size} /> : null}
        {trailing}
        {rejectionTail}
      </>
    );
  }

  return (
    <>
      {variant === 'validation' && emphasizeCritical && test.hasCriticalValues ? (
        <Badge variant="danger" size={size} className="flex items-center gap-space-1">
          <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
          CRITICAL
        </Badge>
      ) : showPriority && test.priority ? (
        <LabPriorityBadge priority={test.priority} size={size} />
      ) : null}
      {test.sampleType ? <SampleTypeBadge sampleType={test.sampleType} size={size} /> : null}
      {showStatus ? (
        <CompactMd>
          <TestStatusChip test={test} size={size} variant={variant} />
        </CompactMd>
      ) : null}
      {queueSince ? (
        <CompactMd>
          <QueueAgeBadge since={queueSince} />
        </CompactMd>
      ) : null}
      {variant === 'validation' && flagCount != null && flagCount > 0 ? (
        <FlagCountBadge count={flagCount} size={compactSize} />
      ) : null}
      {trailing}
      {rejectionTail}
    </>
  );
}

export const TestHeaderBadges = memo(TestHeaderBadgesView);
TestHeaderBadges.displayName = 'TestHeaderBadges';
