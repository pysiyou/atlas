/**
 * CollectionCard — responsive card for sample collection (mobile + desktop).
 */

import React, { useMemo } from 'react';
import { Badge, Card, IconButton } from '@/components';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { getTestNames } from '@/features/catalog/testLookup';
import { useLabCardClickGuard } from '@/features/lab/hooks';
import { useResponsiveCard } from '../components/useResponsiveCard';
import { LabCard, TestList } from '../components/LabCard';
import { CollectionHeaderBadges } from '../components/labWorkflowBadges';
import { collectionHeaderAudit } from '../components/labHeader';
import { LabMobileCardHeader, labMobileCardSurfaceClassName } from '../components/labMobileCardHeader';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { CollectionPopover } from './CollectionPopover';
import { CollectionRejectionPopover } from './CollectionRejectionPopover';
import { handlePrintCollectionLabel, getEffectiveContainerType } from '../utils/labHelpers';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import type { ContainerType, Sample, RejectedSample } from '@/types';
import type { SampleDisplay, SampleRequirement } from '@/features/lab/types';

export interface CollectionCardProps {
  display: SampleDisplay;
  onCollect: (
    display: SampleDisplay,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  isCollecting?: boolean;
  isMobile?: boolean;
}

interface CollectionCardSharedData {
  display: SampleDisplay;
  sample: Sample;
  requirement: SampleRequirement;
  onCollect: CollectionCardProps['onCollect'];
  patientName: string;
  testNames: string[];
  handleCardClick: (e?: React.MouseEvent) => void;
  isCollecting: boolean;
}

function useCollectionCardData(props: CollectionCardProps): CollectionCardSharedData | null {
  const { display, onCollect, isCollecting = false } = props;
  const { getPatientName } = usePatientNameLookup();
  const { tests } = useTestCatalog();
  const { openModal } = useModal();

  const { sample, requirement } = display;

  const openSampleModal = useMemo(() => {
    return () => {
      const isPending = sample?.status === 'pending';
      const isCollected = sample?.status === 'collected';
      const isRejected = sample?.status === 'rejected';

      if ((isCollected || isRejected) && sample?.sampleId) {
        openModal(ModalType.SAMPLE_DETAIL, { sampleId: sample.sampleId.toString() });
      } else if (isPending) {
        openModal(ModalType.SAMPLE_DETAIL, { pendingSampleDisplay: display, onCollect });
      }
    };
  }, [sample, display, onCollect, openModal]);

  const handleCardClick = useLabCardClickGuard(openSampleModal);

  if (!sample || !requirement) return null;

  const patientName = getPatientName(display.order.patientId);
  const testNames = requirement.testCodes ? getTestNames(requirement.testCodes, tests) : [];

  return {
    display,
    sample,
    requirement,
    onCollect,
    patientName,
    testNames,
    handleCardClick,
    isCollecting,
  };
}

function CollectionCardDesktop({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
}: CollectionCardSharedData) {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isRecollection = sample.isRecollection === true;
  const paymentBlocked = isPending && order.paymentStatus === 'unpaid';
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

  return (
    <LabCard
      onClick={handleCardClick}
      className={isRejected ? 'border-warning-stroke-emphasis' : ''}
      context={{
        patientName,
        patientId: display.order.patientId,
        orderId: order.orderId,
        sampleId: sample.sampleId,
        entityCode: sample.sampleType.toUpperCase(),
        referringPhysician: order.referringPhysician,
      }}
      auditLines={collectionHeaderAudit({
        sampleId: sample.sampleId,
        collectedAt,
        collectedBy,
        isRecollection,
        originalSampleId: sample.originalSampleId,
        originalSampleCollectedAt: sample.originalSampleCollectedAt,
      })}
      badges={
        <CollectionHeaderBadges
          sample={sample}
          isPending={isPending}
          isCollected={isCollected}
          isRejected={isRejected}
          rejectedSample={rejectedSample}
          orderDate={order.orderDate}
          paymentBlocked={paymentBlocked}
          requiredVolume={requirement.totalVolume}
          collectedVolume={collectedVolume}
          containerColor={containerColor}
          effectiveContainerType={effectiveContainerType}
          colorName={colorName}
          showBarcode={isCollected && !!sample.sampleId}
        />
      }
      actions={
        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
          {isPending ? (
            <CollectionPopover
              requirement={requirement}
              patientName={patientName}
              testName={testNames.join(', ')}
              isRecollection={isRecollection}
              onConfirm={(volume, notes, color, containerType) =>
                onCollect(display, volume, notes, color, containerType)
              }
            />
          ) : isCollected && sample.sampleId ? (
            <>
              <CollectionRejectionPopover
                sampleId={sample.sampleId.toString()}
                testCodes={sample.testCodes ?? []}
                sampleType={sample.sampleType}
                patientName={patientName}
                isRecollection={isRecollection}
              />
              <IconButton
                onClick={() => handlePrintCollectionLabel(display, patientName)}
                variant="print"
                size="sm"
                title="Print Sample Label"
              />
            </>
          ) : null}
        </div>
      }
      content={
        <TestList
          tests={testNames.map((name, i) => ({ name, code: requirement.testCodes[i] || '' }))}
        />
      }
      contentTitle="Required for"
    />
  );
}

function CollectionCardMobile({
  display,
  sample,
  requirement,
  onCollect,
  patientName,
  testNames,
  handleCardClick,
  isCollecting,
}: CollectionCardSharedData) {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isRecollection = sample.isRecollection === true;
  const paymentBlocked = isPending && order.paymentStatus === 'unpaid';
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
  const testCount = testNames.length;

  const statusAside = isPending ? (
    <Badge variant="pending" size="xs" />
  ) : isCollected ? (
    <Badge variant="collected" size="xs" />
  ) : isRejected ? (
    <Badge variant="rejected" size="xs" />
  ) : null;

  const actions = isPending ? (
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
  );

  return (
    <Card
      padding="list"
      hover
      className={labMobileCardSurfaceClassName()}
      onClick={() => handleCardClick()}
    >
      <LabMobileCardHeader
        context={{
          patientName,
          patientId: display.order.patientId,
          orderId: order.orderId,
          sampleId: sample.sampleId,
          entityCode: sample.sampleType.toUpperCase(),
        }}
        titleAside={statusAside}
        auditLines={collectionHeaderAudit({
          sampleId: sample.sampleId,
          collectedAt,
          collectedBy,
          isRecollection,
          originalSampleId: sample.originalSampleId,
          originalSampleCollectedAt: sample.originalSampleCollectedAt,
        })}
        badges={
          <CollectionHeaderBadges
            sample={sample}
            isPending={isPending}
            isCollected={isCollected}
            isRejected={isRejected}
            rejectedSample={rejectedSample}
            orderDate={order.orderDate}
            paymentBlocked={paymentBlocked}
            requiredVolume={requirement.totalVolume}
            collectedVolume={collectedVolume}
            containerColor={containerColor}
            effectiveContainerType={effectiveContainerType}
            colorName={colorName}
            size="xs"
          />
        }
        actions={actions}
      >
        <p className={LAB_MOBILE_CARD.body}>
          {testCount} test{testCount !== 1 ? 's' : ''}: {testNames.slice(0, 2).join(', ')}
          {testCount > 2 && ` +${testCount - 2} more`}
        </p>
      </LabMobileCardHeader>
    </Card>
  );
}

export const CollectionCard: React.FC<CollectionCardProps> = props => {
  const sharedData = useCollectionCardData(props);

  const card = useResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as CollectionCardSharedData,
    renderMobile: CollectionCardMobile,
    renderDesktop: CollectionCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
