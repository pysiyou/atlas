/**
 * Pure builders for collection queue / modal operational meta rows.
 */

import type { ContainerType, ContainerTopColor, RejectedSample, Sample } from '@/types';
import { CONTAINER_TYPE_CONFIG } from '@/types';
import { LAB_CONFIG } from '../constants';
import { formatVolume, getCollectionRequirements } from './labSample';

export type CollectionOperationalMetaItem =
  | { type: 'queue-age'; since: string }
  | { type: 'text'; text: string; className?: string }
  | { type: 'recollection-requested'; recollectionSampleId: number };

export interface BuildCollectionOperationalMetaItemsInput {
  sample: Sample;
  isPending: boolean;
  isCollected: boolean;
  isRejected: boolean;
  rejectedSample?: RejectedSample | null;
  orderDate?: string;
  requiredVolume?: number;
  collectedVolume?: number;
  effectiveContainerType?: ContainerType;
  containerColor?: ContainerTopColor | string;
  colorName?: string;
}

function appendPendingMetaItems(
  items: CollectionOperationalMetaItem[],
  input: BuildCollectionOperationalMetaItemsInput
): void {
  if (!input.isPending) {
    return;
  }
  const required = input.requiredVolume ?? input.sample.requiredVolume;
  if (input.orderDate) {
    items.push({ type: 'queue-age', since: input.orderDate });
  }
  if (required != null) {
    items.push({ type: 'text', text: `${formatVolume(required)} required` });
  }
}

function appendCollectedVolumeMetaItems(
  items: CollectionOperationalMetaItem[],
  input: BuildCollectionOperationalMetaItemsInput
): void {
  const { isCollected, isRejected, collectedVolume, requiredVolume, sample } = input;
  if (!isCollected && !isRejected) {
    return;
  }
  const required = requiredVolume ?? sample.requiredVolume;
  if (collectedVolume != null) {
    const suffix = isRejected ? 'was collected' : 'collected';
    items.push({ type: 'text', text: `${formatVolume(collectedVolume)} ${suffix}` });
  }
  if (required != null) {
    items.push({ type: 'text', text: `${formatVolume(required)} required` });
  }
}

function appendContainerMetaItem(
  items: CollectionOperationalMetaItem[],
  input: BuildCollectionOperationalMetaItemsInput
): void {
  const { isCollected, isRejected, effectiveContainerType, containerColor, colorName } = input;
  const hasContainer =
    (isCollected || isRejected) && Boolean(effectiveContainerType && containerColor);
  if (!hasContainer || !effectiveContainerType) {
    return;
  }
  const label = CONTAINER_TYPE_CONFIG[effectiveContainerType]?.label ?? effectiveContainerType;
  const capSuffix =
    colorName && colorName !== 'N/A' ? ` · ${colorName} cap` : '';
  items.push({ type: 'text', text: `${label}${capSuffix}` });
}

function appendDerivedSampleMetaItem(
  items: CollectionOperationalMetaItem[],
  sample: Sample
): void {
  const derived = getCollectionRequirements(sample.sampleType);
  if (derived.isDerived) {
    items.push({ type: 'text', text: derived.label });
  }
}

function appendRecollectionMetaItems(
  items: CollectionOperationalMetaItem[],
  input: BuildCollectionOperationalMetaItemsInput
): void {
  const { isRejected, rejectedSample, sample } = input;
  if (isRejected && rejectedSample?.recollectionSampleId) {
    items.push({
      type: 'recollection-requested',
      recollectionSampleId: rejectedSample.recollectionSampleId,
    });
  }
  const attempt = sample.recollectionAttempt ?? 1;
  const max = LAB_CONFIG.MAX_RECOLLECTION_ATTEMPTS;
  const showAttemptAlert = sample.isRecollection && attempt > 1;
  if (showAttemptAlert) {
    items.push({
      type: 'text',
      text: `Attempt ${attempt}/${max}`,
      className: attempt >= max - 1 ? 'text-warning-fg' : undefined,
    });
  }
}

export function buildCollectionOperationalMetaItems(
  input: BuildCollectionOperationalMetaItemsInput
): CollectionOperationalMetaItem[] {
  const items: CollectionOperationalMetaItem[] = [];
  appendPendingMetaItems(items, input);
  appendCollectedVolumeMetaItems(items, input);
  appendContainerMetaItem(items, input);
  appendDerivedSampleMetaItem(items, input.sample);
  appendRecollectionMetaItems(items, input);
  return items;
}
