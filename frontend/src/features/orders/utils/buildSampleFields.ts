/**
 * Field configs for order test detail sample panels.
 */

import type { DescriptionListItemConfig } from '@/components/display/DescriptionList';
import {
  CONTAINER_COLOR_OPTIONS,
  CONTAINER_CONFIG,
  type ContainerType,
  type Sample,
} from '@/types';
import { formatVolume } from '@/features/lab';
import { displayId } from '@/utils';
import { formatStatusBadgeLabel } from '@/utils/statusBadge';

interface SampleCollectionSlice {
  hasCollection: boolean;
  collectedAt?: string;
  collectedBy?: string;
  collectedVolume?: number;
  remainingVolume?: number;
  containerColor?: string;
  containerType?: ContainerType | string;
  colorName?: string;
}

function getSampleCollectionSlice(sample: Sample): SampleCollectionSlice {
  const isCollected = sample.status === 'collected';
  const isRejected = sample.status === 'rejected';
  const hasCollection = (isCollected || isRejected) && 'collectedAt' in sample;

  const collectedAt =
    hasCollection && 'collectedAt' in sample ? sample.collectedAt : undefined;
  const collectedBy =
    hasCollection && 'collectedBy' in sample ? sample.collectedBy : undefined;
  const collectedVolume =
    hasCollection && 'collectedVolume' in sample ? sample.collectedVolume : undefined;
  const remainingVolume =
    hasCollection && 'remainingVolume' in sample ? sample.remainingVolume : undefined;
  const containerColor =
    hasCollection && 'actualContainerColor' in sample ? sample.actualContainerColor : undefined;
  const containerType =
    hasCollection && 'actualContainerType' in sample
      ? sample.actualContainerType
      : sample.requiredContainerTypes?.[0];
  const colorName = containerColor
    ? CONTAINER_COLOR_OPTIONS.find(opt => opt.value === containerColor)?.label ?? 'N/A'
    : undefined;

  return {
    hasCollection,
    collectedAt,
    collectedBy,
    collectedVolume,
    remainingVolume,
    containerColor,
    containerType,
    colorName,
  };
}

function appendPendingContainerFields(
  fields: DescriptionListItemConfig[],
  sample: Sample
): void {
  if (sample.status !== 'pending' || !sample.requiredContainerTypes?.length) {
    return;
  }
  fields.push({
    label: 'Containers',
    value: sample.requiredContainerTypes
      .map(t => CONTAINER_CONFIG[t]?.label ?? t)
      .join(', '),
  });
}

function appendCollectionDescriptionItems(
  fields: DescriptionListItemConfig[],
  slice: SampleCollectionSlice
): void {
  if (!slice.hasCollection) {
    return;
  }
  fields.push(
    { label: 'Collected', timestamp: slice.collectedAt, user: slice.collectedBy },
    {
      label: 'Vol. collected',
      value:
        slice.collectedVolume !== undefined ? formatVolume(slice.collectedVolume) : undefined,
    },
    {
      label: 'Remaining',
      value:
        slice.remainingVolume !== undefined ? formatVolume(slice.remainingVolume) : undefined,
    }
  );
  if (slice.containerType) {
    const containerLabel =
      CONTAINER_CONFIG[slice.containerType as ContainerType]?.label ?? slice.containerType;
    const containerText =
      slice.containerColor && slice.colorName
        ? `${containerLabel} · ${slice.colorName} top`
        : containerLabel;
    fields.push({ label: 'Container', value: containerText });
  }
}

function appendRecollectionFields(fields: DescriptionListItemConfig[], sample: Sample): void {
  if (!sample.isRecollection) {
    return;
  }
  fields.push(
    { label: 'Recollect #', value: String(sample.recollectionAttempt ?? '—') },
    {
      label: 'Original',
      value:
        sample.originalSampleId != null
          ? displayId.sample(sample.originalSampleId)
          : undefined,
    },
    { label: 'Reason', value: sample.recollectionReason }
  );
}

export function buildSampleFields(sample: Sample): DescriptionListItemConfig[] {
  const slice = getSampleCollectionSlice(sample);

  const fields: DescriptionListItemConfig[] = [
    { label: 'Status', value: formatStatusBadgeLabel(sample.status) },
    { label: 'Type', value: formatStatusBadgeLabel(sample.sampleType) },
    {
      label: 'Priority',
      value: sample.priority ? formatStatusBadgeLabel(sample.priority) : undefined,
    },
    { label: 'Required', value: formatVolume(sample.requiredVolume) },
  ];

  appendPendingContainerFields(fields, sample);
  appendCollectionDescriptionItems(fields, slice);
  appendRecollectionFields(fields, sample);

  return fields;
}
