/**
 * CollectionCardMobile - Mobile layout for sample collection workflow
 */

import React from 'react';
import { Badge, Card } from '@/components';
import { Avatar, IconButton } from '@/components';
import { displayId } from '@/utils';
import { formatVolume } from '@/features/lab/utils';
import { BlockedReasonBadge } from '../../components/StatusBadges';
import { QueueAgeBadge } from '../../components/QueueAgeBadge';
import { CollectionPopover } from '../CollectionPopover';
import type { CollectionCardSharedData } from './hooks';

export const CollectionCardMobile: React.FC<CollectionCardSharedData> = ({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
  isCollecting,
}) => {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isRecollection = sample.isRecollection === true;
  const paymentBlocked = isPending && order.paymentStatus === 'unpaid';
  
  const collectedVolume =
    (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const testCount = testNames.length;

  return (
    <Card padding="list" hover className="flex flex-col h-full" onClick={() => handleCardClick()}>
      {/* Header: Avatar (top left) + Status badge (top right) */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-border-default">
        <Avatar
          primaryText={patientName}
          primaryTextClassName="font-normal capitalize"
          secondaryText={displayId.order(order.orderId)}
          secondaryTextClassName="entity-id"
          size="xs"
        />
        {isPending ? (
          <Badge variant="pending" size="xs">
            PENDING
          </Badge>
        ) : isCollected ? (
          <Badge variant="collected" size="xs">
            COLLECTED
          </Badge>
        ) : isRejected ? (
          <Badge variant="rejected" size="xs">
            REJECTED
          </Badge>
        ) : null}
      </div>

      {/* Content: Volume, tests */}
      <div className="grow">
        <div className="space-y-1">
          <div className="text-xs text-text-tertiary">
            {isPending
              ? `${formatVolume(requirement.totalVolume)} required`
              : collectedVolume !== undefined
                ? `${formatVolume(collectedVolume)} ${isRejected ? 'was collected' : 'collected'}`
                : null}
          </div>
          <div className="text-xs text-text-secondary">
            {testCount} test{testCount !== 1 ? 's' : ''}: {testNames.slice(0, 2).join(', ')}
            {testCount > 2 && ` +${testCount - 2} more`}
          </div>
        </div>
      </div>

      {/* Bottom section: Badges (left) + Action button (right) */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-3">
        <div className="flex items-center gap-2">
          <Badge variant={sample.sampleType} size="xs" />
          {(sample.priority === 'urgent' || sample.priority === 'high') && (
            <Badge variant={sample.priority} size="xs" />
          )}
          {isRecollection && (
            <Badge variant="warning" size="xs">
              RECOLLECTION
            </Badge>
          )}
          {paymentBlocked && <BlockedReasonBadge label="Payment required" />}
          {isPending && <QueueAgeBadge since={order.orderDate} />}
        </div>
        {isPending ? (
          <div onClick={e => e.stopPropagation()}>
            <CollectionPopover
              requirement={requirement}
              patientName={patientName}
              testName={testNames.join(', ')}
              isRecollection={isRecollection}
              onConfirm={(volume, notes, color, containerType) =>
                onCollect(display, volume, notes, color, containerType)
              }
              isSubmitting={isCollecting}
            />
          </div>
        ) : (
          <IconButton
            variant="view"
            size="sm"
            title="View Details"
            onClick={e => {
              e.stopPropagation();
              handleCardClick();
            }}
          />
        )}
      </div>
    </Card>
  );
};
