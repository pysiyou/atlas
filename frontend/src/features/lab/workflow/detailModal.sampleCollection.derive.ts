/**
 * Sample collection detail modal — derived sample/order fields (pure logic).
 */

import type { ContainerType, Order, RejectedSample, Sample } from '@/types';
import { CONTAINER_COLOR_OPTIONS } from '@/types';

export function deriveCollectionStatus(sample: Sample) {
  const isPending = sample.status === 'pending';
  const isRejected = sample.status === 'rejected';
  const isCollected = sample.status === 'collected';
  const rejectedSample = isRejected ? (sample as RejectedSample) : null;
  return { isPending, isRejected, isCollected, rejectedSample };
}

export function deriveCollectionContainerInfo(
  sample: Sample,
  isCollected: boolean,
  isRejected: boolean
) {
  const hasContainerInfo = (isCollected || isRejected) && 'actualContainerColor' in sample;
  const containerColor = hasContainerInfo ? sample.actualContainerColor : undefined;
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label || 'N/A'
    : 'N/A';
  const containerType =
    hasContainerInfo && 'actualContainerType' in sample
      ? sample.actualContainerType
      : sample.requiredContainerTypes?.[0];
  const effectiveContainerType: ContainerType =
    (containerType as ContainerType) ||
    (sample.sampleType === 'urine' || sample.sampleType === 'stool' ? 'cup' : 'tube');

  return { containerColor, colorName, effectiveContainerType };
}

export function deriveCollectionTimestamps(
  sample: Sample,
  isCollected: boolean,
  isRejected: boolean
) {
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

  return { collectedAt, collectedBy, collectedVolume, remainingVolume, collectionNotes };
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
  const { isPending, isRejected, isCollected, rejectedSample } = deriveCollectionStatus(sample);
  const { containerColor, colorName, effectiveContainerType } = deriveCollectionContainerInfo(
    sample,
    isCollected,
    isRejected
  );
  const timestamps = deriveCollectionTimestamps(sample, isCollected, isRejected);
  const patientName = resolveCollectionPatientName(pendingPatientFullName, order);

  return {
    isPending,
    isRejected,
    isCollected,
    rejectedSample,
    containerColor,
    colorName,
    effectiveContainerType,
    patientName,
    ...timestamps,
  };
}
