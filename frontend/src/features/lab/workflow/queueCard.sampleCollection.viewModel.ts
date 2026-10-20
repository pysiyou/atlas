/**
 * Sample collection queue card — derived view-model from queue item + sample.
 */

import { CONTAINER_COLOR_OPTIONS, type Sample, type RejectedSample } from '@/types';
import type { SampleCollectionQueueItem } from '@/types/lab-operations';
import { getEffectiveContainerType } from '../utils';
import { isLabActionAllowed } from '../utils/queueDisplay';

export function getSampleCollectionViewModel(display: SampleCollectionQueueItem, sample: Sample) {
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
    collectAllowed: isLabActionAllowed(display.allowedActions, 'collect'),
    collectDisabledTitle: display.denyMessage ?? undefined,
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
