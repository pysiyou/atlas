/**
 * CollectionCard - Responsive card component for sample collection workflow
 *
 * Displays sample information with collection/rejection actions.
 * Supports both desktop (LabCard) and mobile layouts via isMobile prop.
 */

import React from 'react';
import { Badge, Card, Icon, IconButton, Alert, Avatar } from '@/shared/ui';
import Barcode from 'react-barcode';
import type { ContainerType, RejectedSample } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { usePatientNameLookup, useTestCatalog, useRejectSample } from '@/hooks/queries';
import { toast } from '@/shared/components/feedback';
import { logger } from '@/utils/logger';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { getTestNames } from '@/utils/typeHelpers';
import { getContainerIconColor, getCollectionRequirements, formatVolume } from '@/utils';
import { displayId } from '@/utils';
import { LabCard, TestList } from '../components/LabCard';
import { CollectionPopover } from './CollectionPopover';
import { CollectionRejectionPopover } from './CollectionRejectionPopover';
import {
  handlePrintCollectionLabel,
  getEffectiveContainerType,
} from '../utils/lab-helpers';
import { formatRejectionReasons } from '../utils/lab-formatters';
import type { SampleDisplay } from '../types';
import { orderHasValidatedTests } from '@/features/order/utils';
import { ICONS, getContainerIcon } from '@/utils';

interface CollectionCardProps {
  display: SampleDisplay;
  onCollect: (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  /** When true, renders mobile-optimized layout */
  isMobile?: boolean;
}

// High complexity and large function are necessary for comprehensive collection card with multiple statuses, actions, and conditional rendering
// eslint-disable-next-line max-lines-per-function, complexity
export const CollectionCard: React.FC<CollectionCardProps> = ({ display, onCollect, isMobile = false }) => {
  const { openModal } = useModal();
  const { getPatientName } = usePatientNameLookup();
  const { tests } = useTestCatalog();
  const rejectSampleMutation = useRejectSample();

  const { sample, order, requirement } = display;
  if (!sample || !requirement) return null;

  const patientName = getPatientName(order.patientId);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];

  // Status flags
  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;
  const isRecollection = sample.isRecollection === true;

  // Container info (available for collected and rejected samples)
  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.name || 'N/A'
    : 'N/A';
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
  const effectiveContainerType = getEffectiveContainerType(containerType, sample.sampleType);

  // Collection info
  const collectedVolume =
    (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const collectedAt =
    (isCollected || isRejected) && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy =
    (isCollected || isRejected) && 'collectedBy' in sample ? sample.collectedBy : undefined;

  const handleCardClick = (e?: React.MouseEvent) => {
    if (e) {
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('form') ||
        target.closest('[data-popover-content]')
      ) {
        return;
      }
    }

    if ((isCollected || isRejected) && sample.sampleId) {
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId.toString() });
    } else if (isPending) {
      openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
    }
  };

  // Check if sample rejection should be blocked due to validated tests in the order
  const hasValidatedTests = orderHasValidatedTests(order);

  // Mobile layout
  if (isMobile) {
    const testCount = testNames.length;

    return (
      <Card padding="list" hover className="flex flex-col h-full" onClick={() => handleCardClick()}>
        {/* Header: Avatar (top left) + Status badge (top right) */}
        <div className="flex justify-between items-start mb-3 pb-3 border-b border-border">
          <Avatar
            primaryText={patientName}
            primaryTextClassName="font-semibold"
            secondaryText={displayId.order(order.orderId)}
            secondaryTextClassName="text-brand font-mono"
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
      </Card>
    );
  }

  // Desktop layout (LabCard)
  // Build badges (ordered by importance)
  const badges = (
    <>
      <h3 className="text-sm font-medium text-text-primary">{patientName}</h3>
      {sample.priority && <Badge variant={sample.priority} size="sm" />}
      <Badge variant={sample.sampleType} size="sm" />
      <Badge size="sm" variant="default" className="text-text-tertiary">
        {isPending
          ? `${formatVolume(requirement.totalVolume)} required`
          : `${formatVolume(collectedVolume!)} ${isRejected ? 'was collected' : 'collected'}`}
      </Badge>
      {(isCollected || isRejected) && containerColor && (
        <span
          className="flex items-center"
          title={`Container: ${effectiveContainerType}, Color: ${colorName}`}
        >
          <Icon
            name={getContainerIcon(effectiveContainerType)}
            className={`w-6 h-6 ${getContainerIconColor(containerColor)}`}
          />
        </span>
      )}
      {getCollectionRequirements(sample.sampleType).isDerived && (
        <Badge size="sm" variant="default" className="text-text-tertiary">
          {getCollectionRequirements(sample.sampleType).label}
        </Badge>
      )}
      {isCollected && sample.sampleId && (
        <div className="flex items-center">
          <Barcode
            value={displayId.sample(sample.sampleId)}
            height={15}
            displayValue={false}
            background="transparent"
            margin={0}
          />
        </div>
      )}
    </>
  );

  // Build actions
  const actions = (
    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
      {isPending ? (
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
      ) : isRejected ? (
        <Badge size="sm" variant="rejected" />
      ) : (
        <>
          <Badge size="sm" variant="collected" />
          {sample.sampleId && (
            <>
              {/* Block sample rejection if order has validated tests to prevent contradiction */}
              {hasValidatedTests ? (
                <IconButton
                  variant="delete"
                  size="sm"
                  title="Cannot reject: order has validated tests"
                  disabled
                />
              ) : (
                <CollectionRejectionPopover
                  sampleId={sample.sampleId.toString()}
                  sampleType={sample.sampleType}
                  patientName={patientName}
                  isRecollection={isRecollection}
                  rejectionHistoryCount={sample.rejectionHistory?.length || 0}
                  onReject={async (reasons, notes, requireRecollection) => {
                    try {
                      await rejectSampleMutation.mutateAsync({
                        sampleId: sample.sampleId.toString(),
                        reasons,
                        notes,
                        requireRecollection,
                      });
                      toast.success({
                        title: requireRecollection
                          ? 'Sample rejected - recollection will be requested'
                          : 'Sample rejected',
                        subtitle: 'The sample has been rejected. Recollection will be requested if you chose that option.',
                      });
                    } catch (error) {
                      logger.error(
                        'Failed to reject sample',
                        error instanceof Error ? error : undefined
                      );
                      toast.error({
                        title: 'Failed to reject sample',
                        subtitle: 'The rejection could not be saved. Please try again or check the sample status.',
                      });
                    }
                  }}
                />
              )}
              <IconButton
                onClick={() => handlePrintCollectionLabel(display, patientName)}
                variant="print"
                size="sm"
                title="Print Sample Label"
              />
            </>
          )}
        </>
      )}
    </div>
  );

  // Recollection banner (only for pending recollection samples)
  const recollectionBanner =
    isPending && isRecollection
      ? (() => {
          const rejectionCount = sample.rejectionHistory?.length || 0;
          const lastRejection = sample.rejectionHistory?.[rejectionCount - 1];
          const reasonsText = formatRejectionReasons(lastRejection?.rejectionReasons);
          return (
            <Alert variant="warning" className="py-2">
              <div className="space-y-0.5">
                <p className="font-medium text-xs">Recollection Required</p>
                <p className="text-xxs opacity-90 leading-tight">
                  {reasonsText
                    ? `Reason: ${reasonsText}.`
                    : sample.recollectionReason || 'Previous sample was rejected.'}
                </p>
              </div>
            </Alert>
          );
        })()
      : undefined;

  // Additional info for recollection samples
  const additionalInfo =
    (isRecollection && sample.originalSampleId) || rejectedSample?.recollectionSampleId ? (
      <div className="flex items-center gap-2 flex-wrap">
        {isRecollection && sample.originalSampleId && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection of <span className="font-mono text-white">{displayId.sample(sample.originalSampleId)}</span>
          </Badge>
        )}
        {rejectedSample?.recollectionSampleId && (
          <Badge size="sm" variant="info" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection requested: <span className="font-mono text-white">{displayId.sample(rejectedSample.recollectionSampleId)}</span>
          </Badge>
        )}
      </div>
    ) : undefined;

  return (
    <LabCard
      onClick={handleCardClick}
      className={isRejected ? 'border-amber-500' : ''}
      context={{
        orderId: order.orderId,
        referringPhysician: order.referringPhysician,
      }}
      sampleInfo={
        (isCollected || isRejected) && sample.sampleId
          ? { sampleId: sample.sampleId, collectedAt, collectedBy }
          : undefined
      }
      additionalInfo={additionalInfo}
      badges={badges}
      actions={actions}
      recollectionBanner={recollectionBanner}
      content={
        <TestList
          tests={testNames.map((name, i) => ({ name, code: requirement.testCodes[i] || '' }))}
        />
      }
      contentTitle="Required for"
    />
  );
};
