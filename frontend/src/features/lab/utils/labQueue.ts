import type { SampleRequirement } from './labSample';
import { PRIORITY_LEVEL_VALUES } from '@/types';
import { differenceInHours, parseISO, isValid } from 'date-fns';
import { LAB_CONFIG } from '@/features/lab/constants/labConstants';
import type {
  OrderTest,
  PaymentStatus,
  SampleStatus,
  TestStatus,
  Order,
  Patient,
  Sample,
  SampleType,
  TestWithContext,
} from '@/types';
import type { SampleCollectionQueueItem } from '../types';
import type {
  CollectionWorklistItem,
  EntryWorklistItem,
  ValidationWorklistItem,
} from '../api/worklists';

/** Lab queue priority, age, derived work-item state, and worklist mapping. */

const PRIORITY_RANK: Record<string, number> = Object.fromEntries(
  PRIORITY_LEVEL_VALUES.map((level, index) => [level, index])
);

export function compareQueuePriority(
  aPriority: string | undefined,
  bPriority: string | undefined,
  aSince: string | undefined,
  bSince: string | undefined
): number {
  const aRank = PRIORITY_RANK[aPriority ?? 'medium'] ?? 1;
  const bRank = PRIORITY_RANK[bPriority ?? 'medium'] ?? 1;
  if (aRank !== bRank) {
    return bRank - aRank;
  }

  const aTime = aSince ? new Date(aSince).getTime() : Number.MAX_SAFE_INTEGER;
  const bTime = bSince ? new Date(bSince).getTime() : Number.MAX_SAFE_INTEGER;
  return aTime - bTime;
}

type QueueAgeVariant = 'default' | 'warning' | 'danger';

export interface QueueAgeInfo {
  label: string;
  variant: QueueAgeVariant;
  hours: number;
}

/** Computes queue age label and urgency variant from an ISO timestamp. */
export function getQueueAgeInfo(
  since: string | undefined | null,
  turnaroundHours?: number
): QueueAgeInfo | null {
  if (!since) return null;

  const date = parseISO(since);
  if (!isValid(date)) return null;

  const hours = Math.max(0, differenceInHours(new Date(), date));
  const label = hours < 1 ? '<1h waiting' : `${hours}h waiting`;

  const warningThreshold =
    turnaroundHours != null && turnaroundHours > 0
      ? Math.min(turnaroundHours * 0.5, LAB_CONFIG.QUEUE_AGE_WARNING_HOURS)
      : LAB_CONFIG.QUEUE_AGE_WARNING_HOURS;
  const criticalThreshold =
    turnaroundHours != null && turnaroundHours > 0
      ? Math.min(turnaroundHours, LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS)
      : LAB_CONFIG.QUEUE_AGE_CRITICAL_HOURS;

  let variant: QueueAgeVariant = 'default';
  if (hours >= criticalThreshold) {
    variant = 'danger';
  } else if (hours >= warningThreshold) {
    variant = 'warning';
  }

  return { label, variant, hours };
}

export type OrderTestQueueStage =
  | 'awaiting_collection'
  | 'awaiting_results'
  | 'awaiting_validation'
  | 'awaiting_supervisor'
  | 'completed'
  | 'cancelled';

export type OrderTestBlockReason =
  | 'payment_unpaid'
  | 'specimen_recollection'
  | 'sample_rejected'
  | 'retest_pending'
  | 'critical_value'
  | 'amendment_pending'
  | 'retry_limit'
  | 'recollection_limit'
  | 'supervisor_review'
  | 'recollection_approval';

export interface OrderTestQueueContext {
  paymentStatus?: PaymentStatus;
  sampleStatus?: SampleStatus;
  sampleIsRecollection?: boolean;
  escalationReasonCode?: string | null;
}

export interface OrderTestQueueState {
  stage: OrderTestQueueStage;
  blockedReason: OrderTestBlockReason | null;
  label: string;
}

const BLOCKED_LABELS: Record<OrderTestBlockReason, string> = {
  payment_unpaid: 'Payment required',
  specimen_recollection: 'Recollection required',
  sample_rejected: 'Sample rejected',
  retest_pending: 'Re-test in progress',
  critical_value: 'Critical value — supervisor review',
  amendment_pending: 'Amendment pending',
  retry_limit: 'Re-test limit reached',
  recollection_limit: 'Recollection limit reached',
  supervisor_review: 'Supervisor approval required',
  recollection_approval: 'Recollection awaiting supervisor approval',
};

function stageFromTestStatus(status: TestStatus): OrderTestQueueStage {
  switch (status) {
    case 'pending':
      return 'awaiting_collection';
    case 'sample-collected':
      return 'awaiting_results';
    case 'resulted':
      return 'awaiting_validation';
    case 'escalated':
      return 'awaiting_supervisor';
    case 'validated':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'awaiting_collection';
  }
}

/**
 * Derive queue stage and optional blockage reason for an order test.
 */
export function deriveOrderTestQueueState(
  test: Pick<OrderTest, 'status' | 'isRetest'>,
  context: OrderTestQueueContext = {}
): OrderTestQueueState {
  const status = test.status as TestStatus;
  const stage = stageFromTestStatus(status);

  let blockedReason: OrderTestBlockReason | null = null;

  if (context.paymentStatus === 'unpaid' && stage === 'awaiting_collection') {
    blockedReason = 'payment_unpaid';
  } else if (status === 'escalated') {
    if (context.escalationReasonCode === 'CRIT-VAL') {
      blockedReason = 'critical_value';
    } else if (context.escalationReasonCode === 'AMEND-RES') {
      blockedReason = 'amendment_pending';
    } else if (context.escalationReasonCode === 'LIMIT-HIT') {
      blockedReason = 'retry_limit';
    } else if (context.escalationReasonCode === 'REJ-SAMP') {
      blockedReason = 'recollection_limit';
    } else {
      blockedReason = 'supervisor_review';
    }
  } else if (context.sampleStatus === 'rejected') {
    blockedReason = 'sample_rejected';
  } else if (context.sampleIsRecollection && stage === 'awaiting_collection') {
    blockedReason = 'specimen_recollection';
  } else if (test.isRetest && stage === 'awaiting_results') {
    blockedReason = 'retest_pending';
  }

  const label = blockedReason ? BLOCKED_LABELS[blockedReason] : stageLabel(stage);

  return { stage, blockedReason, label };
}

function stageLabel(stage: OrderTestQueueStage): string {
  switch (stage) {
    case 'awaiting_collection':
      return 'Awaiting collection';
    case 'awaiting_results':
      return 'Awaiting results';
    case 'awaiting_validation':
      return 'Awaiting validation';
    case 'awaiting_supervisor':
      return 'Supervisor review';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return 'In progress';
  }
}

export function getBlockedReasonLabel(reason: OrderTestBlockReason): string {
  return BLOCKED_LABELS[reason];
}

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

export function mapValidationWorklistToOrderTestContext(
  item: ValidationWorklistItem
): TestWithContext {
  return {
    id: item.orderTestId,
    orderId: item.orderId,
    patientId: item.patientId,
    testCode: item.testCode,
    testName: item.testName,
    status: item.status,
    sampleType: item.sampleType,
    priority: item.priority,
    patientName: item.patientName,
    orderDate: item.orderDate,
    resultEnteredAt: item.resultEnteredAt ?? undefined,
    hasCriticalValues: item.hasCriticalValues,
  } as TestWithContext;
}

