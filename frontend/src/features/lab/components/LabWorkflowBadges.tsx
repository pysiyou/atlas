/**
 * Test workflow header badges (entry / validation / escalation).
 * Collection badges live in LabWorkflowCollectionBadges.tsx.
 */

import { memo, type ReactNode } from 'react';
import { Badge, Icon, type BadgeSize } from '@/components';
import type { TestWithContext } from '@/types';
import { ICONS } from '@/config/icons';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import { QueueAgeBadge } from './QueueAgeBadge';
import { BlockedReasonBadge, FlagCountBadge } from './LabResultStatusBadges';
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
  blockedLabel?: string;
  emphasizeCritical?: boolean;
  flagCount?: number;
  reasonCode?: string;
  trailing?: ReactNode;
}

function compactBadgeSize(size: BadgeSize): 'xs' | 'sm' {
  return size === 'md' ? 'sm' : size;
}

function TestHeaderBadgesView({
  test,
  variant = 'entry',
  size = LAB_CARD_BADGE_SIZE,
  showStatus = false,
  queueSince,
  blockedLabel,
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
        <Badge variant="escalated" size={size} />
        {reasonCode ? (
          <Badge variant="warning" size={size}>
            {reasonCode}
          </Badge>
        ) : null}
        {blockedLabel ? <BlockedReasonBadge label={blockedLabel} size={compactSize} /> : null}
        {showPriority && test.priority ? <Badge variant={test.priority} size={size} /> : null}
        {test.sampleType ? <Badge variant={test.sampleType} size={size} /> : null}
        {trailing}
        {rejectionTail}
      </>
    );
  }

  return (
    <>
      {variant === 'validation' && emphasizeCritical && test.hasCriticalValues ? (
        <Badge variant="danger" size={size} className="flex items-center gap-1">
          <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
          CRITICAL
        </Badge>
      ) : showPriority && test.priority ? (
        <Badge variant={test.priority} size={size} />
      ) : null}
      {test.sampleType ? <Badge variant={test.sampleType} size={size} /> : null}
      {showStatus && test.status ? (
        <CompactMd>
          <Badge variant={test.status} size={size} />
        </CompactMd>
      ) : null}
      {queueSince ? (
        <CompactMd>
          <QueueAgeBadge since={queueSince} />
        </CompactMd>
      ) : null}
      {blockedLabel ? <BlockedReasonBadge label={blockedLabel} size={compactSize} /> : null}
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
