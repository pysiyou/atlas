/**
 * SampleCollectionDetailModal - Extended view for sample details
 *
 * Provides a full view of sample information including collection requirements,
 * rejection details, and linked tests.
 *
 * Uses centralized components:
 * - DetailGrid with sections config for consistent layout
 * - Panel for custom sections
 * - LabModalHeader sampleInfo for collection metadata (same as entry/validation modals)
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query';
import { sampleAPI } from '../api/samples';
import type { ContainerType, RejectedSample } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';
import { labModalSubtitle } from '../components/LabWorkflowModalSubtitles';
import { SampleCollectionDetailFooter } from './SampleCollectionDetailFooter';
import { buildCollectionDetailGridSections } from './SampleCollectionDetailSections';
import { SampleCollectionDetailContent } from './SampleCollectionDetailSections';
import { LabWorkflowDetailModal, ModalFooter } from '../components/LabWorkflowDetailModal';
import { collectionHeaderAudit } from '../constants/labWorkflowAuditLines';
import { CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { useTestCatalog } from '@/features/catalog';
import { useUserLookup } from '@/lib/api/users';
import { usePatientNameLookup } from '@/features/patients';
import { useOrderLookup } from '@/features/orders';
import { useSampleLookup } from '../api/samples';
import { getTestNames } from '@/features/catalog/testLookup';
import { LabEntityTimelinePanel } from '../components/LabEntityTimelinePanel';
import { actionButtonPreset, Button, EntityId } from '@/components';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';

interface CollectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sampleId?: string;
  pendingSampleDisplay?: SampleCollectionQueueItem;
  onCollect?: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  readOnly?: boolean;
}

// Large component is necessary for comprehensive collection detail modal with multiple sections, status management, and conditional rendering
// eslint-disable-next-line max-lines-per-function
export const SampleCollectionDetailModal: React.FC<CollectionDetailModalProps> = ({
  isOpen,
  onClose,
  sampleId,
  pendingSampleDisplay,
  onCollect,
  readOnly = false,
  // High complexity is necessary for comprehensive modal content with multiple conditional sections and state management
  // eslint-disable-next-line complexity
}) => {
  const { getUserName } = useUserLookup();
  const { getSample } = useSampleLookup();
  const { getPatientName } = usePatientNameLookup();
  const { getOrder } = useOrderLookup();
  const { tests = [] } = useTestCatalog();
  const [isPopoverSubmitting, setIsPopoverSubmitting] = useState(false);

  const getTest = useCallback((code: string) => tests.find(t => t.code === code), [tests]);

  const cachedSample = sampleId ? getSample(sampleId) : undefined;
  const { data: fetchedSample } = useQuery({
    queryKey: queryKeys.samples.byId(sampleId ?? ''),
    queryFn: () => sampleAPI.getById(sampleId!),
    enabled: isOpen && !!sampleId && !cachedSample,
  });
  const sample = cachedSample ?? fetchedSample ?? pendingSampleDisplay?.sample;
  const order = pendingSampleDisplay?.order || (sample ? getOrder(sample.orderId) : undefined);
  const requirement = pendingSampleDisplay?.requirement;

  const testDetails = useMemo(() => {
    if (!sample?.testCodes) return [];
    const seen = new Set<string>();
    return sample.testCodes
      .map(code => tests.find(t => t.code === code))
      .filter((test): test is NonNullable<typeof test> => test !== undefined)
      .filter(test => {
        if (seen.has(test.code)) return false;
        seen.add(test.code);
        return true;
      });
  }, [sample, tests]);

  if (!sample) return null;

  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;

  const patientId = order?.patientId || 0;
  const patientName =
    pendingSampleDisplay?.patient?.fullName ||
    (order ? getPatientName(order.patientId) : 'Unknown');
  const orderId = sample.orderId;
  const testNames = sample.testCodes ? getTestNames(sample.testCodes, tests) : [];

  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample
      ? sample.actualContainerType
      : sample.requiredContainerTypes?.[0]; // Fallback to first required for pending or defaults
  const effectiveContainerType: ContainerType =
    (containerType as ContainerType) ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');

  const collectedAt =
    (isCollected || isRejected) && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy =
    (isCollected || isRejected) && 'collectedBy' in sample ? sample.collectedBy : undefined;
  const collectedVolume =
    (isCollected || isRejected) && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const remainingVolume =
    (isCollected || isRejected) && 'remainingVolume' in sample ? sample.remainingVolume : undefined;
  const collectionNotes =
    (isCollected || isRejected) && 'collectionNotes' in sample ? sample.collectionNotes : undefined;

  // Build header badges
  const paymentBlocked = isPending && order?.paymentStatus === 'unpaid';

  const headerBadges = (
    <CollectionHeaderBadges
      sample={sample}
      isPending={isPending}
      isCollected={isCollected}
      isRejected={isRejected}
      rejectedSample={rejectedSample}
      orderDate={order?.orderDate}
      paymentBlocked={paymentBlocked}
      requiredVolume={sample.requiredVolume}
      collectedVolume={collectedVolume}
      containerColor={containerColor}
      effectiveContainerType={effectiveContainerType}
      colorName={colorName}
      containerIconClassName="w-7 h-7"
    />
  );

  // Build footer content
  const footerContent = (
    <SampleCollectionDetailFooter
      sample={sample}
      order={order}
      isPending={isPending}
      isRejected={isRejected}
      isCollected={isCollected}
      rejectedSample={rejectedSample}
      pendingSampleDisplay={pendingSampleDisplay}
      patientName={patientName}
      testNames={testNames}
      onCollect={onCollect}
      onClose={onClose}
      onPopoverSubmittingChange={setIsPopoverSubmitting}
    />
  );

  const gridSections = buildCollectionDetailGridSections({
    sample,
    isPending,
    isRejected,
    isCollected,
    collectedAt,
    collectedBy,
    collectedVolume,
    remainingVolume,
    effectiveContainerType,
    containerColor,
    colorName,
    requirement,
    getUserName,
  });

  return (
    <LabWorkflowDetailModal
      isOpen={isOpen}
      onClose={onClose}
      disableClose={isPopoverSubmitting}
      title={<EntityId type="sample" value={sample.sampleId} />}
      subtitle={labModalSubtitle('collection')}
      headerBadges={headerBadges}
      contextInfo={{
        patientName,
        patientId,
        orderId,
        entityCode: sample.sampleType.toUpperCase(),
        referringPhysician: order?.referringPhysician,
        sampleId: sample.sampleId,
      }}
      headerAudit={collectionHeaderAudit({
        sampleId: sample.sampleId,
        collectedAt,
        collectedBy,
        isRecollection: sample.isRecollection,
        originalSampleId: sample.originalSampleId,
        originalSampleCollectedAt: sample.originalSampleCollectedAt,
      })}
      footer={
        readOnly ? (
          <ModalFooter statusMessage="">
            <Button onClick={onClose} {...actionButtonPreset('cancel')} size="md" layout="icon-text">Close</Button>
          </ModalFooter>
        ) : (
          footerContent
        )
      }
    >
      <SampleCollectionDetailContent
        sample={sample}
        isPending={isPending}
        isRejected={isRejected}
        isCollected={isCollected}
        rejectedSample={rejectedSample}
        testNames={testNames}
        testDetails={testDetails}
        testCodes={sample.testCodes || []}
        getTest={getTest}
        getUserName={getUserName}
        collectionNotes={collectionNotes}
        gridSections={gridSections}
        showBarcode={(isCollected || isRejected) && sample.sampleId != null}
      />
      {sample.sampleId && (
        <LabEntityTimelinePanel entityType="sample" entityId={Number(sample.sampleId)} />
      )}
    </LabWorkflowDetailModal>
  );
};
