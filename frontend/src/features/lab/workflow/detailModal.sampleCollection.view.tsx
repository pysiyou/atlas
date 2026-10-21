/**
 * Sample collection detail modal — shell and body when sample is loaded.
 */

import type { ContainerType, Order, Sample, Test } from '@/types';
import { QueueModalShell, labModalHeaderContext } from './detailModalLayout';
import { CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { SampleCollectionCardLeftColumn } from './queueCardLeftColumn';
import { LabRelatedSamplesPanel } from '../components/LabRelatedWorkflowPanel';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import {
  SampleCollectionDetailContent,
  SampleCollectionDetailFooter,
} from './detailModal.sampleCollection.helpers';
import { LabEventLogPanel } from '@/features/audit';
import type { deriveCollectionModalFields } from './detailModal.sampleCollection.derive';

type CollectionFields = ReturnType<typeof deriveCollectionModalFields>;

export function SampleCollectionDetailModalView({
  isOpen,
  onClose,
  isActive = true,
  sample,
  order,
  requirement,
  pendingSampleDisplay,
  onCollect,
  readOnly,
  isPopoverSubmitting,
  onPopoverSubmittingChange,
  testDetails,
  testNames,
  fields,
  getUserName,
  openSampleDetail,
}: {
  isOpen: boolean;
  onClose: () => void;
  isActive?: boolean;
  sample: Sample;
  order: Order | undefined;
  requirement?: SampleCollectionQueueItem['requirement'];
  pendingSampleDisplay?: SampleCollectionQueueItem;
  onCollect?: (
    display: SampleCollectionQueueItem,
    volume: number,
    notes?: string,
    selectedColor?: string,
    containerType?: ContainerType
  ) => void;
  readOnly: boolean;
  isPopoverSubmitting: boolean;
  onPopoverSubmittingChange: (submitting: boolean) => void;
  testDetails: Test[];
  testNames: string[];
  fields: CollectionFields;
  getUserName: (userId: string) => string;
  openSampleDetail: (sampleId: string | number) => void;
}) {
  const {
    isPending,
    isRejected,
    isCollected,
    rejectedSample,
    containerColor,
    colorName,
    effectiveContainerType,
    patientName,
    collectedAt,
    collectedBy,
    collectedVolume,
    remainingVolume,
    collectionNotes,
  } = fields;

  const headerBadges = (
    <CollectionHeaderBadges
      sample={sample}
      isPending={isPending}
      isCollected={isCollected}
      isRejected={isRejected}
      statusPresentation={pendingSampleDisplay?.statusPresentation}
    />
  );
  const { title: modalTitle, subtitle: modalSubtitle } = labModalHeaderContext({
    stage: 'collection',
    contextLabel: patientName,
    orderId: sample.orderId,
    badges: headerBadges,
  });

  const headerLeftColumn = (
    <SampleCollectionCardLeftColumn
      patientName={patientName}
      orderId={sample.orderId}
      referringPhysician={order?.referringPhysician}
      orderDate={order?.orderDate}
      sample={sample}
      isPending={isPending}
      isCollected={isCollected}
      isRejected={isRejected}
      rejectedSample={rejectedSample}
      requiredVolume={sample.requiredVolume}
      collectedVolume={collectedVolume}
      effectiveContainerType={effectiveContainerType}
      containerColor={containerColor}
      colorName={colorName}
      collectedAt={collectedAt}
      collectedBy={collectedBy}
      tone="modal"
    />
  );

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
      onPopoverSubmittingChange={onPopoverSubmittingChange}
    />
  );

  return (
    <QueueModalShell
      isOpen={isOpen}
      onClose={onClose}
      isActive={isActive}
      disableClose={isPopoverSubmitting}
      title={modalTitle}
      subtitle={modalSubtitle}
      headerLeftColumn={headerLeftColumn}
      footer={readOnly ? undefined : footerContent}
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
        getUserName={getUserName}
        collectionNotes={collectionNotes}
        collectedAt={collectedAt}
        collectedBy={collectedBy}
        collectedVolume={collectedVolume}
        remainingVolume={remainingVolume}
        effectiveContainerType={effectiveContainerType}
        containerColor={containerColor}
        colorName={colorName}
        requirement={requirement}
        showBarcode={(isCollected || isRejected) && sample.sampleId != null}
      />
      <LabRelatedSamplesPanel sample={sample} isOpen={isOpen} onOpenSample={openSampleDetail} />
      {sample.sampleId != null && <LabEventLogPanel sampleId={Number(sample.sampleId)} />}
    </QueueModalShell>
  );
}
