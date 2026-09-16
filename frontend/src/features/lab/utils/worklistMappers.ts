/**
 * Map server worklist items to existing lab view types.
 */
import type { Order, Patient, Sample, SampleType, TestWithContext } from '@/types';
import type { SampleRequirement } from './sampleHelpers';
import type { SampleCollectionQueueItem } from '../types';
import type { CollectionWorklistItem, EntryWorklistItem } from '../api/worklists.service';

export function mapCollectionWorklistToSampleDisplay(item: CollectionWorklistItem): SampleCollectionQueueItem {
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

  const order = {
    orderId: item.orderId,
    patientId: item.patientId,
    patientName: item.patientName,
    orderDate: item.orderDate,
    totalPrice: 0,
    paymentStatus: item.paymentStatus,
    overallStatus: 'in-progress',
    priority: item.priority,
    tests: [],
    createdBy: '',
    createdAt: item.orderDate,
    updatedAt: item.orderDate,
  } as Order;

  const patient = {
    id: item.patientId,
    fullName: item.patientName,
    dateOfBirth: '',
    gender: 'male',
    phone: '',
    address: '',
    emergencyContact: { name: '', phone: '' },
    medicalHistory: [],
    registrationDate: item.orderDate,
    createdBy: '',
    updatedBy: '',
    createdAt: item.orderDate,
    updatedAt: item.orderDate,
  } as unknown as Patient;

  const requirement: SampleRequirement = {
    sampleType: item.sampleType as SampleType,
    testCodes: item.testCodes,
    totalVolume: 0,
    containerTypes: [],
    containerTopColors: [],
    priority: item.priority,
    orderId: item.orderId,
  };

  return { sample, order, patient, priority: item.priority, requirement };
}

export function mapEntryWorklistToOrderTestContext(item: EntryWorklistItem): TestWithContext {
  return {
    id: item.orderTestId,
    orderId: item.orderId,
    patientId: item.patientId,
    testCode: item.testCode,
    testName: item.testName,
    status: item.status,
    sampleId: item.sampleId ?? undefined,
    sampleType: item.sampleType,
    priority: item.priority,
    patientName: item.patientName,
    orderDate: item.orderDate,
    collectedAt: item.collectedAt ?? undefined,
    isRetest: item.isRetest,
  } as TestWithContext;
}
