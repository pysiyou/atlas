/**
 * CollectionMobileCard - Mobile-friendly card component for sample collection
 *
 * Simplified card layout for small screens, similar to PatientCard/PaymentCard style.
 * Shows essential information in a compact, touch-friendly format.
 */

import React from 'react';
import { Badge, Avatar, IconButton } from '@/shared/ui';
import { formatVolume } from '@/utils';
import { displayId } from '@/utils/id-display';
import { getTestNames } from '@/utils/typeHelpers';
import { usePatientNameLookup, useTestCatalog } from '@/hooks/queries';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import type { ContainerType } from '@/types';
import type { SampleDisplay } from '../types';
import { CollectionPopover } from './CollectionPopover';

interface CollectionMobileCardProps {
  display: SampleDisplay;
  onCollect: (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
}

export const CollectionMobileCard: React.FC<CollectionMobileCardProps> = ({
  display,
  onCollect,
}) => {
  const { openModal } = useModal();
  const { getPatientName } = usePatientNameLookup();
  const { tests } = useTestCatalog();

  const { sample, order, requirement } = display;
  if (!sample || !requirement) return null;

  const patientName = getPatientName(order.patientId);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];
  const testCount = testNames.length;

  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const isRecollection = sample.isRecollection === true;

  const collectedVolume =
    (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;

  const handleCardClick = () => {
    if ((isCollected || isRejected) && sample.sampleId) {
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId.toString() });
    } else if (isPending) {
      openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-surface border border-border rounded-lg p-3 shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer flex flex-col h-full"
    >
      {/* Header: Avatar (top left) + Status badge (top right) */}
      <div className="flex justify-between items-start mb-3 pb-3 border-b border-border">
        <Avatar
          primaryText={patientName}
          primaryTextClassName="font-semibold"
          secondaryText={displayId.order(order.orderId)}
          secondaryTextClassName="text-text-tertiary"
          size="xs"
        />
        {isPending ? (
          <Badge variant="warning" size="xs">
            PENDING
          </Badge>
        ) : isCollected ? (
          <Badge variant="success" size="xs">
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
          <div className="text-xs text-text-secondary">
            {isPending
              ? `${formatVolume(requirement.totalVolume)} required`
              : collectedVolume !== undefined
                ? `${formatVolume(collectedVolume)} ${isRejected ? 'was collected' : 'collected'}`
                : null}
          </div>
          <div className="text-xs text-text-primary">
            {testCount} test{testCount !== 1 ? 's' : ''}: {testNames.slice(0, 2).join(', ')}
            {testCount > 2 && ` +${testCount - 2} more`}
          </div>
        </div>
      </div>

      {/* Bottom section: Badges (left) + Action button (right) */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-3">
        <div className="flex items-center gap-2">
          <Badge variant={sample.sampleType} size="xs" />
          {sample.priority && <Badge variant={sample.priority} size="xs" />}
          {isRecollection && (
            <Badge variant="warning" size="xs">
              RECOLLECTION
            </Badge>
          )}
        </div>
        {isPending ? (
          <div onClick={e => e.stopPropagation()}>
            <CollectionPopover
              requirement={requirement}
              patientName={patientName}
              testName={testNames.join(', ')}
              isRecollection={
                isRecollection || (sample.rejectionHistory && sample.rejectionHistory.length > 0)
              }
              onConfirm={(volume, notes, color, containerType) =>
                onCollect(display, volume, notes, color, containerType)
              }
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
    </div>
  );
};
