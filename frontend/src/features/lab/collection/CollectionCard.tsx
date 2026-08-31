/**
 * CollectionCard - Responsive card component for sample collection workflow
 *
 * Displays sample information with collection/rejection actions.
 * Supports both desktop (LabCard) and mobile layouts via isMobile prop.
 *
 * Refactored: inline rejection handler extracted to useCollectionCardActions hook;
 * mobile and desktop layouts extracted into named sub-components.
 */

/* eslint-disable max-lines */

import React from 'react';
import { Badge, Card, Icon, IconButton, Avatar } from '@/components';
import Barcode from 'react-barcode';
import type { ContainerType, RejectedSample, Sample, RejectionReason } from '@/types';
import { CONTAINER_COLOR_OPTIONS, CONTAINER_CONFIG } from '@/types';
import { useTestCatalog } from '@/features/catalog/api/tests.api';
import { usePatientNameLookup } from '@/features/patients/api/patients.api';
import { useRejectSampleHandler } from '@/features/lab/collection/useRejectSampleHandler';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { getTestNames } from '@/features/catalog/utils';
import { getContainerIconColor, getCollectionRequirements, formatVolume } from '@/features/lab/utils';
import { displayId } from '@/utils';
import { LabCard, TestList } from '@/features/lab/components/LabCard';
import { AttemptIndicator } from '@/features/lab/components/AttemptIndicator';
import { QueueAgeBadge } from '@/features/lab/components/QueueAgeBadge';
import { useLabCardClickGuard } from '@/features/lab/hooks';
import { LAB_CONFIG } from '@/features/lab/constants';
import { CollectionPopover } from './CollectionPopover';
import { CollectionRejectionPopover } from './CollectionRejectionPopover';
import { handlePrintCollectionLabel, getEffectiveContainerType } from '@/features/lab/utils/labHelpers';
import { formatRejectionReasons } from '@/features/lab/utils/labFormatters';
import type { SampleDisplay, SampleRequirement } from '@/features/lab/types';
import { orderHasValidatedTests } from '@/features/orders/utils';
import { getContainerIcon } from '@/config/icons';
import { ICONS } from '@/config/icons';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CollectionCardProps {
  display: SampleDisplay;
  onCollect: (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  /** When true, collect mutation is in progress (show loading in collection popover) */
  isCollecting?: boolean;
  /** When true, renders mobile-optimized layout */
  isMobile?: boolean;
}

/** Props shared by both layout sub-components — sample and requirement are already narrowed. */
interface CardLayoutProps {
  display: SampleDisplay;
  sample: Sample;
  requirement: SampleRequirement;
  onCollect: CollectionCardProps['onCollect'];
  patientName: string;
  testNames: string[];
  handleCardClick: (e?: React.MouseEvent) => void;
  handleRejectSample: (reasons: string[], notes: string, requireRecollection: boolean) => Promise<void>;
  hasValidatedTests: boolean;
  isRejecting: boolean;
  isCollecting: boolean;
}

// ─── useCollectionCardActions ─────────────────────────────────────────────────

function useCollectionCardActions(
  display: SampleDisplay,
  onCollect: CollectionCardProps['onCollect']
) {
  const { openModal } = useModal();
  const { rejectSample, isRejecting } = useRejectSampleHandler();
  const { sample, order } = display;

  const openSampleModal = () => {
    const isPending = sample?.status === 'pending';
    const isCollected = sample?.status === 'collected';
    const isRejected = sample?.status === 'rejected';
    if ((isCollected || isRejected) && sample?.sampleId) {
      openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId.toString() });
    } else if (isPending) {
      openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
    }
  };

  const handleCardClick = useLabCardClickGuard(openSampleModal);

  const handleRejectSample = async (
    reasons: string[],
    notes: string,
    requireRecollection: boolean
  ) => {
    if (!sample?.sampleId) return;
    await rejectSample(sample.sampleId, reasons as RejectionReason[], notes, requireRecollection);
  };

  const hasValidatedTests = orderHasValidatedTests(order);

  return { handleCardClick, handleRejectSample, hasValidatedTests, isRejecting };
}

// ─── CollectionCardMobile ─────────────────────────────────────────────────────

function CollectionCardMobile({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
  isCollecting,
}: CardLayoutProps) {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isRecollection = sample.isRecollection === true;
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
          {/* Only show priority badge if urgent or high */}
          {(sample.priority === 'urgent' || sample.priority === 'high') && (
            <Badge variant={sample.priority} size="xs" />
          )}
          {isRecollection && (
            <Badge variant="warning" size="xs">
              RECOLLECTION
            </Badge>
          )}
          {isPending && <QueueAgeBadge since={order.orderDate} />}
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
}

// ─── CollectionCardDesktop ────────────────────────────────────────────────────

// eslint-disable-next-line max-lines-per-function, complexity
function CollectionCardDesktop({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
  handleRejectSample,
  hasValidatedTests,
  isRejecting,
}: CardLayoutProps) {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isRecollection = sample.isRecollection === true;
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;

  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined;
  const effectiveContainerType = getEffectiveContainerType(containerType, sample.sampleType);
  const collectedVolume =
    (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const collectedAt =
    (isCollected || isRejected) && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy =
    (isCollected || isRejected) && 'collectedBy' in sample ? sample.collectedBy : undefined;

  const badges = (
    <>
      {/* Attempt indicator for recollections */}
      {isRecollection && sample.rejectionHistory && sample.rejectionHistory.length > 0 && (
        <AttemptIndicator
          attemptNumber={sample.rejectionHistory.length + 1}
          maxAttempts={LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS}
          type="recollection"
          previousReason={(() => {
            const last = sample.rejectionHistory[sample.rejectionHistory.length - 1];
            if (!last) return undefined;
            if (last.rejectionReasons) return formatRejectionReasons(last.rejectionReasons) ?? undefined;
            return last.rejectionNotes ?? undefined;
          })()}
        />
      )}
      <h3 className="text-sm font-medium text-text-primary capitalize">{patientName}</h3>
      {/* Only show priority badge if urgent or high */}
      {(sample.priority === 'urgent' || sample.priority === 'high') && (
        <Badge variant={sample.priority} size="sm" />
      )}
      <Badge variant={sample.sampleType} size="sm" />
      {isPending && <QueueAgeBadge since={order.orderDate} />}
      <Badge size="sm" variant="default" className="text-text-tertiary">
        {isPending
          ? `${formatVolume(requirement.totalVolume)} required`
          : `${formatVolume(collectedVolume!)} ${isRejected ? 'was collected' : 'collected'}`}
      </Badge>
      {(isCollected || isRejected) && containerColor && (
        <span
          className="flex items-center"
          title={`Container: ${CONTAINER_CONFIG[effectiveContainerType]?.label || effectiveContainerType}, Color: ${colorName}`}
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
            lineColor="var(--text)"
            margin={0}
          />
        </div>
      )}
    </>
  );

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
              {hasValidatedTests ? (
                <IconButton
                  variant="reject"
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
                  isSubmitting={isRejecting}
                  onReject={handleRejectSample}
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

  const additionalInfo =
    (isRecollection && sample.originalSampleId) || rejectedSample?.recollectionSampleId ? (
      <div className="flex items-center gap-2 flex-wrap">
        {isRecollection && sample.originalSampleId && (
          <Badge size="sm" variant="warning" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection of{' '}
            <span className="font-mono text-brand">
              {displayId.sample(sample.originalSampleId)}
            </span>
          </Badge>
        )}
        {rejectedSample?.recollectionSampleId && (
          <Badge size="sm" variant="info" className="flex items-center gap-1">
            <Icon name={ICONS.actions.alertCircle} className="w-3 h-3" />
            Recollection requested:{' '}
            <span className="font-mono text-brand">
              {displayId.sample(rejectedSample.recollectionSampleId)}
            </span>
          </Badge>
        )}
      </div>
    ) : undefined;

  return (
    <LabCard
      onClick={handleCardClick}
      className={isRejected ? 'border-warning-stroke-emphasis' : ''}
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
      content={
        <TestList
          tests={testNames.map((name, i) => ({ name, code: requirement.testCodes[i] || '' }))}
        />
      }
      contentTitle="Required for"
    />
  );
}

// ─── CollectionCard (dispatcher) ─────────────────────────────────────────────

export const CollectionCard: React.FC<CollectionCardProps> = ({
  display,
  onCollect,
  isCollecting = false,
  isMobile = false,
}) => {
  const { getPatientName } = usePatientNameLookup();
  const { tests } = useTestCatalog();
  // Hook must be called before any early return (rules-of-hooks)
  const { handleCardClick, handleRejectSample, hasValidatedTests, isRejecting } =
    useCollectionCardActions(display, onCollect);

  const { sample, requirement } = display;
  if (!sample || !requirement) return null;

  const patientName = getPatientName(display.order.patientId);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];

  const sharedProps: CardLayoutProps = {
    display,
    sample,
    requirement,
    onCollect,
    patientName,
    testNames,
    handleCardClick,
    handleRejectSample,
    hasValidatedTests,
    isRejecting,
    isCollecting,
  };

  if (isMobile) {
    return <CollectionCardMobile {...sharedProps} />;
  }

  return <CollectionCardDesktop {...sharedProps} />;
};
