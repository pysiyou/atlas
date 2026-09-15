/**
 * Workflow header badges — same order on cards and modals.
 *
 * Collection: priority → sample type → queue age → payment → volume → container →
 * derived label → status → recollection link → barcode → rejection tail
 *
 * Tests: critical/priority → sample type → status → queue age → blocked → extras → tail
 * Escalation: escalated → reason → blocked → priority → sample type → extras → tail
 */

import React, { type ReactNode } from 'react';
import { Badge, Icon, EntityId } from '@/components';
import type { BadgeSize } from '@/components';
import Barcode from 'react-barcode';
import type { ContainerType, ContainerTopColor, Sample, RejectedSample, TestWithContext } from '@/types';
import { CONTAINER_CONFIG } from '@/types';
import { displayId } from '@/utils';
import {
  formatVolume,
  getCollectionRequirements,
  getContainerIconColor,
} from '@/features/lab/utils';
import { getContainerIcon, ICONS } from '@/config/icons';
import { LAB_CARD_BADGE_SIZE } from '../utils/labStyles';
import { QueueAgeBadge } from './QueueAgeBadge';
import { BlockedReasonBadge, FlagCountBadge } from './StatusBadges';
import {
  LabRejectionTailBadgesFromSample,
  LabRejectionTailBadgesFromTest,
} from './LabRejectionTailBadges';
import { useLabHeaderCompact } from './labHeader';

function CompactOnly({
  children,
  className = 'hidden lg:inline-flex items-center',
}: {
  children: ReactNode;
  className?: string;
}) {
  const compact = useLabHeaderCompact();
  if (!compact) return <>{children}</>;
  return <span className={className}>{children}</span>;
}

function CompactMd({
  children,
  className = 'hidden md:inline-flex items-center',
}: {
  children: ReactNode;
  className?: string;
}) {
  const compact = useLabHeaderCompact();
  if (!compact) return <>{children}</>;
  return <span className={className}>{children}</span>;
}

function compactBadgeSize(size: BadgeSize): 'xs' | 'sm' {
  return size === 'md' ? 'sm' : size;
}

export interface CollectionHeaderBadgesProps {
  sample: Sample;
  isPending: boolean;
  isCollected: boolean;
  isRejected: boolean;
  rejectedSample?: RejectedSample | null;
  orderDate?: string;
  paymentBlocked?: boolean;
  requiredVolume?: number;
  collectedVolume?: number;
  containerColor?: ContainerTopColor | string;
  effectiveContainerType?: ContainerType;
  colorName?: string;
  size?: BadgeSize;
  showBarcode?: boolean;
  containerIconClassName?: string;
}

export const CollectionHeaderBadges = React.memo(function CollectionHeaderBadges({
  sample,
  isPending,
  isCollected,
  isRejected,
  rejectedSample = null,
  orderDate,
  paymentBlocked = false,
  requiredVolume,
  collectedVolume,
  containerColor,
  effectiveContainerType,
  colorName = 'N/A',
  size = LAB_CARD_BADGE_SIZE,
  showBarcode = false,
  containerIconClassName = 'w-6 h-6',
}: CollectionHeaderBadgesProps) {
  const priority = sample.priority;
  const showPriority = priority === 'urgent' || priority === 'high';
  const hasContainer = (isCollected || isRejected) && containerColor && effectiveContainerType;
  const required = requiredVolume ?? sample.requiredVolume;
  const compactSize = compactBadgeSize(size);

  return (
    <>
      {showPriority && priority && <Badge variant={priority} size={size} />}
      <Badge variant={sample.sampleType} size={size} />
      {isPending && orderDate && (
        <CompactMd>
          <QueueAgeBadge since={orderDate} />
        </CompactMd>
      )}
      {paymentBlocked && <BlockedReasonBadge label="Payment required" size={compactSize} />}
      {isPending && required != null && (
        <CompactOnly>
          <Badge size={size} variant="default" className="text-text-tertiary">
            {formatVolume(required)} required
          </Badge>
        </CompactOnly>
      )}
      {(isCollected || isRejected) && collectedVolume != null && (
        <CompactOnly>
          <Badge size={size} variant="default" className="text-text-tertiary">
            {formatVolume(collectedVolume)} {isRejected ? 'was collected' : 'collected'}
          </Badge>
        </CompactOnly>
      )}
      {(isCollected || isRejected) && required != null && (
        <CompactOnly>
          <Badge size={size} variant="default" className="text-text-tertiary">
            {formatVolume(required)} required
          </Badge>
        </CompactOnly>
      )}
      {hasContainer && (
        <CompactOnly className="hidden lg:inline-flex items-center">
          <span
            className="flex items-center"
            title={`Container: ${CONTAINER_CONFIG[effectiveContainerType!]?.label || effectiveContainerType}, Color: ${colorName}`}
          >
            <Icon
              name={getContainerIcon(effectiveContainerType!)}
              className={`${containerIconClassName} ${getContainerIconColor(containerColor as ContainerTopColor)}`}
            />
          </span>
        </CompactOnly>
      )}
      {getCollectionRequirements(sample.sampleType).isDerived && (
        <CompactOnly>
          <Badge size={size} variant="default" className="text-text-tertiary">
            {getCollectionRequirements(sample.sampleType).label}
          </Badge>
        </CompactOnly>
      )}
      <Badge
        variant={isPending ? 'pending' : isRejected ? 'rejected' : 'collected'}
        size={size}
      />
      {isRejected && rejectedSample?.recollectionSampleId && (
        <CompactOnly>
          <Badge size={size} variant="info" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection requested:{' '}
            <EntityId type="sample" value={rejectedSample.recollectionSampleId} />
          </Badge>
        </CompactOnly>
      )}
      {showBarcode && isCollected && sample.sampleId && (
        <CompactOnly className="hidden lg:inline-flex items-center">
          <div className="flex items-center">
            <Barcode
              value={displayId.sample(sample.sampleId)}
              height={15}
              displayValue={false}
              background="transparent"
              lineColor="var(--text)"
              margin={0}
            />
          </div>
        </CompactOnly>
      )}
      <LabRejectionTailBadgesFromSample sample={sample} size={size} />
    </>
  );
});

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

export const TestHeaderBadges = React.memo(function TestHeaderBadges({
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
  const tail = <LabRejectionTailBadgesFromTest test={test} size={size} />;
  const compactSize = compactBadgeSize(size);

  if (variant === 'escalation') {
    return (
      <>
        <Badge variant="escalated" size={size} />
        {reasonCode && (
          <Badge variant="warning" size={size}>
            {reasonCode}
          </Badge>
        )}
        {blockedLabel && <BlockedReasonBadge label={blockedLabel} size={compactSize} />}
        {showPriority && test.priority && <Badge variant={test.priority} size={size} />}
        {test.sampleType && <Badge variant={test.sampleType} size={size} />}
        {trailing}
        {tail}
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
      {test.sampleType && <Badge variant={test.sampleType} size={size} />}
      {showStatus && test.status && (
        <CompactMd>
          <Badge variant={test.status} size={size} />
        </CompactMd>
      )}
      {queueSince && (
        <CompactMd>
          <QueueAgeBadge since={queueSince} />
        </CompactMd>
      )}
      {blockedLabel && <BlockedReasonBadge label={blockedLabel} size={compactSize} />}
      {variant === 'validation' && flagCount != null && flagCount > 0 && (
        <FlagCountBadge count={flagCount} size={compactSize} />
      )}
      {trailing}
      {tail}
    </>
  );
});
