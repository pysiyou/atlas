/**
 * Maps flat worklist DTOs to Sample shapes used by collection workflow actions.
 * For display-only UI, use `@/features/shared` and `@/hooks`.
 */
import type { SampleRequirement } from './labSample';
import type { Sample, SampleType, ContainerType, ContainerTopColor } from '@/types';
import type { CollectionQueueRow } from '../types/queues';
import type {
  CollectionWorklistItem,
  EntryWorklistItem,
  ValidationWorklistItem,
} from '../api/worklists';

function buildRequirement(item: CollectionWorklistItem): SampleRequirement {
  const requiredVolume = item.requiredVolume ?? 0;
  const targetVolume = item.optimalVolume ?? 0;
  return {
    sampleType: item.sampleType as SampleType,
    testCodes: item.testCodes,
    totalVolume: requiredVolume,
    targetVolume,
    containerTypes: (item.requiredContainerTypes ?? []) as ContainerType[],
    containerTopColors: (item.requiredContainerColors ?? []) as ContainerTopColor[],
    priority: item.priority,
    orderId: item.orderId,
  };
}

/** Map a collection worklist API row to a queue card/modal row (no synthetic Order/Patient). */
export function worklistItemToQueueRow(item: CollectionWorklistItem): CollectionQueueRow {
  const isCollectedLike = item.status === 'collected' || item.status === 'rejected';
  const requiredVolume = item.requiredVolume ?? 0;
  const sample = {
    sampleId: item.sampleId,
    orderId: item.orderId,
    sampleType: item.sampleType as SampleType,
    status: item.status,
    testCodes: item.testCodes,
    requiredVolume,
    optimalVolume: item.optimalVolume ?? 0,
    priority: item.priority,
    requiredContainerTypes: (item.requiredContainerTypes ?? []) as ContainerType[],
    requiredContainerColors: (item.requiredContainerColors ?? []) as ContainerTopColor[],
    isRecollection: item.isRecollection,
    originalSampleId: item.originalSampleId ?? undefined,
    originalSampleCollectedAt: item.originalSampleCollectedAt ?? undefined,
    recollectionSampleId: item.recollectionSampleId ?? undefined,
    recollectionReason: item.recollectionReason ?? undefined,
    recollectionAttempt: item.recollectionAttempt ?? 1,
    isAliquot: item.isAliquot ?? false,
    parentSampleId: item.parentSampleId ?? undefined,
    createdBy: '',
    updatedBy: '',
    createdAt: item.orderDate,
    updatedAt: item.orderDate,
    ...(isCollectedLike
      ? {
          collectedAt: item.collectedAt ?? item.orderDate,
          collectedBy: item.collectedBy ?? '',
          collectedVolume: item.collectedVolume ?? 0,
          actualContainerType: item.actualContainerType ?? undefined,
          actualContainerColor: item.actualContainerColor ?? undefined,
        }
      : {}),
  } as Sample;

  const requirement = buildRequirement(item);

  return {
    sample,
    patientId: item.patientId,
    patientName: item.patientName,
    orderId: item.orderId,
    orderDate: item.orderDate,
    paymentStatus: item.paymentStatus,
    priority: item.priority,
    requirement,
    allowedActions: item.allowedActions,
    denyReason: item.denyReason ?? null,
    denyMessage: item.denyMessage ?? null,
    statusPresentation: item.statusPresentation ?? null,
    referentDoctorId: item.referentDoctorId ?? null,
    referentDoctorName: item.referentDoctorName ?? null,
    referentDoctorEmail: item.referentDoctorEmail ?? null,
    referentDoctorPhone: item.referentDoctorPhone ?? null,
    referentDoctorHospital: item.referentDoctorHospital ?? null,
    referentDoctorUsername: item.referentDoctorUsername ?? null,
  };
}

export function worklistItemToEntryRow(item: EntryWorklistItem): EntryWorklistItem {
  return item;
}

export function worklistItemToValidationRow(item: ValidationWorklistItem): ValidationWorklistItem {
  return item;
}