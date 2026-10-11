import { useMemo } from 'react';
import { CollectionCardAlerts, CollectionHeaderBadges } from '../components/LabWorkflowBadges';
import { collectionHeaderAudit } from '../constants/labWorkflowAuditLines';
import type { Sample } from '@/types';
import type { SampleCollectionQueueItem, SampleRequirement } from '@/types/lab-operations';
import { getSampleCollectionViewModel } from './queueCard.sampleCollection.viewModel';

export function useSampleCollectionCardHeader(
  display: SampleCollectionQueueItem,
  sample: Sample,
  requirement: SampleRequirement
) {
  const vm = getSampleCollectionViewModel(display, sample);

  const auditLines = useMemo(
    () =>
      collectionHeaderAudit(
        {
          sampleId: sample.sampleId,
          collectedAt: vm.collectedAt,
          collectedBy: vm.collectedBy,
          isRecollection: vm.isRecollection,
          originalSampleId: sample.originalSampleId,
          originalSampleCollectedAt: sample.originalSampleCollectedAt,
        },
        { omitSampleId: true }
      ),
    [
      sample.sampleId,
      vm.collectedAt,
      vm.collectedBy,
      vm.isRecollection,
      sample.originalSampleId,
      sample.originalSampleCollectedAt,
    ]
  );

  const alerts = (
    <CollectionCardAlerts
      sample={sample}
      isPending={vm.isPending}
      isCollected={vm.isCollected}
      isRejected={vm.isRejected}
      rejectedSample={vm.rejectedSample}
      orderDate={vm.order.orderDate}
      requiredVolume={requirement.totalVolume}
      collectedVolume={vm.collectedVolume}
      containerColor={vm.containerColor}
      effectiveContainerType={vm.effectiveContainerType}
      colorName={vm.colorName}
    />
  );

  const badges = (
    <CollectionHeaderBadges
      sample={sample}
      isPending={vm.isPending}
      isCollected={vm.isCollected}
      isRejected={vm.isRejected}
      statusPresentation={display.statusPresentation}
    />
  );

  return {
    vm,
    auditLines,
    alerts,
    badges,
  };
}
