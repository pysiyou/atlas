/**
 * Maps flat worklist DTOs to legacy Sample/Order shapes for workflow actions.
 * For display-only UI, use `@/features/shared/entityPresentation` and `@/hooks/presentationHooks`.
 */
import type { SampleRequirement } from './labSample';
import type { Sample, SampleType } from '@/types';
import type { CollectionQueueRow } from '../types/queues';
import type {
  CollectionWorklistItem,
  EntryWorklistItem,
  ValidationWorklistItem,
} from '../api/worklists';

/** Map a collection worklist API row to a queue card/modal row (no synthetic Order/Patient). */
export function worklistItemToQueueRow(item: CollectionWorklistItem): CollectionQueueRow {
  const isCollectedLike = item.status === 'collected' || item.status === 'rejected';
  const sample = {
    sampleId: item.sampleId,
    orderId: item.orderId,
    sampleType: item.sampleType as SampleType,
    status: item.status,
    testCodes: item.testCodes,
    requiredVolume: 0,
    priority: item.priority,
    requiredContainerTypes: [],
    requiredContainerColors: [],
    isRecollection: item.isRecollection,
    originalSampleId: item.originalSampleId ?? undefined,
    originalSampleCollectedAt: item.originalSampleCollectedAt ?? undefined,
    recollectionReason: item.recollectionReason ?? undefined,
    recollectionAttempt: item.recollectionAttempt ?? 1,
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

  const requirement: SampleRequirement = {
    sampleType: item.sampleType as SampleType,
    testCodes: item.testCodes,
    totalVolume: 0,
    containerTypes: [],
    containerTopColors: [],
    priority: item.priority,
    orderId: item.orderId,
  };

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

