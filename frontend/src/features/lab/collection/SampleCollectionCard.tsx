/**
 * SampleCollectionCard — responsive card for sample collection (mobile + desktop).
 */
/* eslint-disable max-lines -- single module: shared view-model + mobile/desktop */

import React, { useMemo } from 'react';
import { actionButtonPreset, Card, IconButton } from '@/components';
import { SampleStatusBadge } from '../components/LabDomainBadges';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { useTestCatalog } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { getTestNames } from '@/features/catalog/testLookup';
import { useLabWorkflowCardClickGuard } from '@/features/lab/hooks';
import { useLabWorkflowResponsiveCard } from '../hooks/useLabWorkflowResponsiveCard';
import { LabWorkflowCardShell, TestList } from '../components/LabWorkflowCardShell';
import { CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { collectionHeaderAudit } from '../constants/labWorkflowAuditLines';
import { LabMobileCardHeader } from '../components/LabWorkflowMobileHeader';
import { LAB_MOBILE_CARD } from '../utils/labStyles';
import { SampleCollectionPopover } from './SampleCollectionPopover';
import { SampleRejectionPopover } from './SampleRejectionPopover';
import { printSampleCollectionLabel, getEffectiveContainerType } from '../utils';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import type { ContainerType, Sample, RejectedSample } from '@/types';
import type { SampleCollectionQueueItem, SampleRequirement } from '@/features/lab/types';

export interface CollectionCardProps {
  display: SampleCollectionQueueItem;
  onCollect: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  isCollecting?: boolean;
  isMobile?: boolean;
}

interface CollectionCardSharedData {
  display: SampleCollectionQueueItem;
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

  const handleCardClick = useLabWorkflowCardClickGuard(openSampleModal);

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

function getCollectionViewModel(display: SampleCollectionQueueItem, sample: Sample) {
  const { order } = display;
  const isPending = sample.status === 'pending';
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const isDone = isCollected || isRejected;
  const hasContainerInfo = isDone && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;

  return {
    order,
    isPending,
    isCollected,
    isRejected,
    isRecollection: sample.isRecollection === true,
    paymentBlocked: isPending && order.paymentStatus === 'unpaid',
    rejectedSample: isRejected ? (sample as RejectedSample) : null,
    containerColor,
    colorName: containerColor
      ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
      : 'N/A',
    effectiveContainerType: getEffectiveContainerType(
      hasContainerInfo && 'actualContainerType' in sample ? sample.actualContainerType : undefined,
      sample.sampleType
    ),
    collectedVolume: isDone && 'collectedVolume' in sample ? sample.collectedVolume : undefined,
    collectedAt: isDone && 'collectedAt' in sample ? sample.collectedAt : undefined,
    collectedBy: isDone && 'collectedBy' in sample ? sample.collectedBy : undefined,
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
  const {
    order,
    isPending,
    isCollected,
    isRejected,
    isRecollection,
    paymentBlocked,
    rejectedSample,
    containerColor,
    colorName,
    effectiveContainerType,
    collectedVolume,
    collectedAt,
    collectedBy,
  } = getCollectionViewModel(display, sample);

  return (
    <LabWorkflowCardShell
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
        <div className="flex items-center gap-space-2" onClick={e => e.stopPropagation()}>
          {isPending ? (
            <SampleCollectionPopover
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
              <SampleRejectionPopover
                sampleId={sample.sampleId.toString()}
                testCodes={sample.testCodes ?? []}
                sampleType={sample.sampleType}
                patientName={patientName}
                isRecollection={isRecollection}
              />
              <IconButton
                onClick={() => printSampleCollectionLabel(display, patientName)}
                {...actionButtonPreset('print')}
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
  const {
    order,
    isPending,
    isCollected,
    isRejected,
    isRecollection,
    paymentBlocked,
    rejectedSample,
    containerColor,
    colorName,
    effectiveContainerType,
    collectedVolume,
    collectedAt,
    collectedBy,
  } = getCollectionViewModel(display, sample);
  const testCount = testNames.length;

  const statusAside = isPending ? (
    <SampleStatusBadge status="pending" size="xs" />
  ) : isCollected ? (
    <SampleStatusBadge status="collected" size="xs" />
  ) : isRejected ? (
    <SampleStatusBadge status="rejected" size="xs" />
  ) : null;

  const actions = isPending ? (
    <SampleCollectionPopover
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
      {...actionButtonPreset('view')}
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
      padding="sm"
      hover
      className={LAB_MOBILE_CARD.surface}
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

export const SampleCollectionCard: React.FC<CollectionCardProps> = props => {
  const sharedData = useCollectionCardData(props);

  const card = useLabWorkflowResponsiveCard({
    item: props,
    deriveSharedData: () => sharedData as CollectionCardSharedData,
    renderMobile: CollectionCardMobile,
    renderDesktop: CollectionCardDesktop,
    isMobile: props.isMobile,
  });

  if (!sharedData) return null;

  return card;
};
