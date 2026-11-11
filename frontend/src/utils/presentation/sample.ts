/**
 * Sample and collection view-models / descriptors (no React).
 */

import {
  CONTAINER_TOP_COLOR_OPTIONS,
  CONTAINER_TYPE_CONFIG,
  type ContainerType,
  type Order,
  type RejectedSample,
  type Sample,
} from '@/types';
import { displayId } from '@/utils/id';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';
import {
  buildDescriptionItems,
  type FieldDescriptor,
} from './descriptors';

export function formatVolumeMl(volumeInMl: number): string {
  if (volumeInMl < 1) {
    return `${(volumeInMl * 1000).toFixed(0)}µL`;
  }
  return `${volumeInMl.toFixed(1)}mL`;
}

export function formatSampleStatusLabel(status: string): string {
  return formatStatusBadgeLabel(status);
}

export function formatSampleTypeLabel(sampleType: string): string {
  return formatStatusBadgeLabel(sampleType);
}

export interface SampleCollectionViewModel {
  isPending: boolean;
  isRejected: boolean;
  isCollected: boolean;
  rejectedSample: RejectedSample | null;
  hasCollection: boolean;
  collectedAt?: string;
  collectedBy?: string;
  collectedVolume?: number;
  remainingVolume?: number;
  collectionNotes?: string;
  containerColor?: string;
  colorName?: string;
  containerType?: ContainerType | string;
  effectiveContainerType: ContainerType;
}

function readCollectionTimestamps(sample: Sample, hasCollection: boolean) {
  if (!hasCollection) {
    return {};
  }
  return {
    collectedAt: 'collectedAt' in sample ? sample.collectedAt : undefined,
    collectedBy: 'collectedBy' in sample ? sample.collectedBy : undefined,
    collectedVolume: 'collectedVolume' in sample ? sample.collectedVolume : undefined,
    remainingVolume: 'remainingVolume' in sample ? sample.remainingVolume : undefined,
    collectionNotes: 'collectionNotes' in sample ? sample.collectionNotes : undefined,
  };
}

function readContainerFields(sample: Sample, isCollected: boolean, isRejected: boolean) {
  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_TOP_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label ?? 'N/A'
    : undefined;
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample
      ? sample.actualContainerType
      : sample.requiredContainerTypes?.[0];
  const effectiveContainerType: ContainerType =
    (containerType as ContainerType) ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');
  return { containerColor, colorName, containerType, effectiveContainerType };
}

export function getSampleCollectionViewModel(sample: Sample): SampleCollectionViewModel {
  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;
  const hasCollection = (isCollected || isRejected) && 'collectedAt' in sample;
  const timestamps = readCollectionTimestamps(sample, hasCollection);
  const container = readContainerFields(sample, isCollected, isRejected);

  return {
    isPending,
    isRejected,
    isCollected,
    rejectedSample,
    hasCollection,
    ...timestamps,
    ...container,
  };
}

export function resolveCollectionPatientName(
  pendingPatientFullName: string | undefined,
  order: Order | undefined
): string {
  return pendingPatientFullName || order?.patientName || 'Unknown';
}

export function deriveCollectionModalFields(
  sample: Sample,
  order: Order | undefined,
  pendingPatientFullName: string | undefined
) {
  const vm = getSampleCollectionViewModel(sample);
  const patientName = resolveCollectionPatientName(pendingPatientFullName, order);

  return {
    isPending: vm.isPending,
    isRejected: vm.isRejected,
    isCollected: vm.isCollected,
    rejectedSample: vm.rejectedSample,
    containerColor: vm.containerColor,
    colorName: vm.colorName ?? 'N/A',
    effectiveContainerType: vm.effectiveContainerType,
    patientName,
    collectedAt: vm.collectedAt,
    collectedBy: vm.collectedBy,
    collectedVolume: vm.collectedVolume,
    remainingVolume: vm.remainingVolume,
    collectionNotes: vm.collectionNotes,
  };
}

function appendPendingContainerDescriptors(
  descriptors: FieldDescriptor[],
  sample: Sample
): void {
  if (sample.status !== 'pending' || !sample.requiredContainerTypes?.length) {
    return;
  }
  descriptors.push({
    id: 'containers',
    label: 'Containers',
    value: sample.requiredContainerTypes
      .map(t => CONTAINER_TYPE_CONFIG[t]?.label ?? t)
      .join(', '),
  });
}

function appendCollectionDescriptors(
  descriptors: FieldDescriptor[],
  sample: Sample
): void {
  const vm = getSampleCollectionViewModel(sample);
  if (!vm.hasCollection) {
    return;
  }

  descriptors.push(
    {
      id: 'collected',
      label: 'Collected',
      timestamp: vm.collectedAt,
      user: vm.collectedBy,
    },
    {
      id: 'volCollected',
      label: 'Vol. collected',
      value:
        vm.collectedVolume !== undefined ? formatVolumeMl(vm.collectedVolume) : undefined,
    },
    {
      id: 'remaining',
      label: 'Remaining',
      value:
        vm.remainingVolume !== undefined ? formatVolumeMl(vm.remainingVolume) : undefined,
    }
  );

  if (vm.containerType) {
    const containerLabel =
      CONTAINER_TYPE_CONFIG[vm.effectiveContainerType]?.label ?? vm.effectiveContainerType;
    const containerText =
      vm.containerColor && vm.colorName
        ? `${containerLabel} · ${vm.colorName} top`
        : containerLabel;
    descriptors.push({ id: 'container', label: 'Container', value: containerText });
  }
}

function appendRecollectionDescriptors(
  descriptors: FieldDescriptor[],
  sample: Sample
): void {
  if (!sample.isRecollection) {
    return;
  }
  descriptors.push(
    {
      id: 'recollect',
      label: 'Recollect #',
      value: String(sample.recollectionAttempt ?? '—'),
    },
    {
      id: 'original',
      label: 'Original',
      value:
        sample.originalSampleId != null
          ? displayId.sample(sample.originalSampleId)
          : undefined,
    },
    { id: 'reason', label: 'Reason', value: sample.recollectionReason }
  );
}

export function getSampleCollectionFieldDescriptors(sample: Sample): FieldDescriptor[] {
  const descriptors: FieldDescriptor[] = [
    { id: 'status', label: 'Status', value: formatSampleStatusLabel(sample.status) },
    { id: 'type', label: 'Type', value: formatSampleTypeLabel(sample.sampleType) },
    {
      id: 'priority',
      label: 'Priority',
      value: sample.priority ? formatStatusBadgeLabel(sample.priority) : undefined,
    },
    { id: 'required', label: 'Required', value: formatVolumeMl(sample.requiredVolume) },
  ];

  appendPendingContainerDescriptors(descriptors, sample);
  appendCollectionDescriptors(descriptors, sample);
  appendRecollectionDescriptors(descriptors, sample);

  return descriptors;
}

export function buildSampleCollectionDescriptionItems(sample: Sample) {
  return buildDescriptionItems(getSampleCollectionFieldDescriptors(sample));
}
