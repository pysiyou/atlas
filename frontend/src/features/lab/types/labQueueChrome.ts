/**
 * DTO-native chrome for lab order-test queue rows (entry, validation, escalation).
 */
import type { LabWorklistAllowedActions } from '@/types/lab-operations';
import type { StatusPresentation } from '@/types/labProjection';
import type { EntryQueueRow, ValidationQueueRow, EscalationQueueItem } from './queues';
import { copyWorklistLabProjection } from '../utils/worklistRowContext';
import {
  deriveOrderTestQueueState,
  type LabWorkItemProjectionLike,
  type OrderTestQueueState,
} from '../utils/queueDisplay';
import type { Order, OrderTest, Patient, Sample, TestStatus } from '@/types';
import type { PendingEscalationItem } from '../api/results';
import type { WorklistLabProjection } from '../utils/worklistRowContext';
import {
  deriveRetestContextFromRow,
  type TestRetestContext,
} from '../utils/deriveRetestContext';

export type LabQueueRowDto = EntryQueueRow | ValidationQueueRow | EscalationQueueItem;

/** Fields shared by queue cards, badges, and left columns. */
export interface LabOrderTestQueueRow {
  orderTestId: number;
  orderId: number;
  patientId?: number;
  patientName: string;
  testCode: string;
  testName: string;
  sampleType?: string;
  sampleId?: number | null;
  priority?: string;
  status: string;
  orderDate?: string;
  collectedAt?: string | null;
  collectedBy?: string | null;
  resultEnteredAt?: string | null;
  enteredBy?: string | null;
  isRetest?: boolean;
  retestOfTestId?: number | null;
  retestNumber?: number;
  sampleIsRecollection?: boolean;
  sampleRecollectionAttempt?: number | null;
  sampleOriginalSampleId?: number | null;
  hasCriticalValues?: boolean;
  flags?: string[] | null;
  results?: Record<string, unknown> | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  statusPresentation?: StatusPresentation | null;
  referentDoctorName?: string | null;
  reasonCode?: string | null;
  sampleStatus?: string | null;
  sampleRecollectionReason?: string | null;
  ticketMetadata?: Record<string, unknown> | null;
  allowForceValidate?: boolean;
  severity?: string | null;
  lab?: WorklistLabProjection;
}

/** Queue chrome plus fields used by lab detail modals (API snapshot or order merge). */
export interface LabModalWorkItem extends LabOrderTestQueueRow {
  technicianNotes?: string | null;
  validationNotes?: string | null;
  criticalNotificationSent?: boolean;
  criticalNotifiedAt?: string | null;
  criticalNotifiedTo?: string | null;
  criticalAcknowledgedAt?: string | null;
}

function orderTestIdFromDto(row: LabQueueRowDto): number {
  if ('orderTestId' in row) return row.orderTestId;
  return row.id;
}

function labProjectionFromDto(row: LabQueueRowDto): WorklistLabProjection {
  return copyWorklistLabProjection(row as Parameters<typeof copyWorklistLabProjection>[0]);
}

function applyModalFieldsFromDto(
  base: LabModalWorkItem,
  row: LabQueueRowDto
): void {
  if ('technicianNotes' in row) {
    base.technicianNotes = row.technicianNotes;
  }
  if ('validationNotes' in row) {
    base.validationNotes = row.validationNotes;
  }
  if ('criticalNotificationSent' in row) {
    base.criticalNotificationSent = row.criticalNotificationSent;
  }
}

export function labModalWorkItemFromDto(row: LabQueueRowDto): LabModalWorkItem {
  const lab = labProjectionFromDto(row);
  const base: LabModalWorkItem = {
    orderTestId: orderTestIdFromDto(row),
    orderId: row.orderId,
    patientId: row.patientId,
    patientName: row.patientName,
    testCode: row.testCode,
    testName: row.testName,
    sampleType: row.sampleType,
    sampleId: row.sampleId ?? undefined,
    priority: row.priority,
    status: row.status,
    orderDate: row.orderDate,
    allowedActions: row.allowedActions ?? undefined,
    denyReason: row.denyReason,
    denyMessage: row.denyMessage,
    statusPresentation: 'statusPresentation' in row ? row.statusPresentation ?? undefined : undefined,
    referentDoctorName: row.referentDoctorName,
    lab,
    isRetest: row.isRetest,
    retestOfTestId: row.retestOfTestId,
    retestNumber: row.retestNumber,
  };

  if ('collectedAt' in row) {
    base.collectedAt = row.collectedAt;
  }
  if ('hasCriticalValues' in row) {
    base.resultEnteredAt = row.resultEnteredAt;
    base.enteredBy = row.enteredBy;
    base.hasCriticalValues = row.hasCriticalValues;
    base.flags = row.flags;
    base.results = row.results as Record<string, unknown> | null;
    if ('sampleStatus' in row) {
      base.sampleStatus = row.sampleStatus;
    }
  }
  if ('ticketMetadata' in row) {
    base.sampleIsRecollection = row.sampleIsRecollection;
    base.sampleOriginalSampleId = row.sampleOriginalSampleId;
    base.sampleRecollectionAttempt = row.sampleRecollectionAttempt;
    base.sampleRecollectionReason = row.sampleRecollectionReason;
    base.collectedAt = row.collectedAt;
    base.collectedBy = row.collectedBy;
    base.resultEnteredAt = row.resultEnteredAt;
    base.enteredBy = row.enteredBy;
    base.reasonCode = row.reasonCode ?? undefined;
    base.ticketMetadata = row.ticketMetadata as Record<string, unknown> | null;
    base.allowForceValidate = row.allowForceValidate;
    base.severity = row.severity;
    base.hasCriticalValues = row.hasCriticalValues;
    base.flags = row.flags;
    base.results = row.results as Record<string, unknown> | null;
    if ('sampleStatus' in row) {
      base.sampleStatus = row.sampleStatus as string | null | undefined;
    }
  } else if ('collectedAt' in row && !('hasCriticalValues' in row)) {
    base.collectedAt = row.collectedAt;
  }

  applyModalFieldsFromDto(base, row);
  return base;
}

export function labModalWorkItemFromPendingEscalation(item: PendingEscalationItem): LabModalWorkItem {
  return labModalWorkItemFromDto(item);
}

/** Build modal work item from loaded order + order test (TestDetailModal primary path). */
export function labModalWorkItemFromOrder(
  order: Order,
  orderTest: OrderTest,
  patient?: Patient | null,
  activeSample?: Sample | null
): LabModalWorkItem {
  const collectedAt =
    activeSample && 'collectedAt' in activeSample ? activeSample.collectedAt : undefined;
  const collectedBy =
    activeSample && 'collectedBy' in activeSample ? activeSample.collectedBy : undefined;

  return {
    orderTestId: orderTest.id!,
    orderId: order.orderId,
    patientId: order.patientId,
    patientName: patient?.fullName ?? order.patientName,
    testName: orderTest.testName,
    testCode: orderTest.testCode,
    sampleType: orderTest.sampleType,
    sampleId: orderTest.sampleId ?? activeSample?.sampleId,
    collectedAt,
    collectedBy,
    sampleStatus: activeSample?.status,
    sampleIsRecollection: activeSample?.isRecollection,
    sampleOriginalSampleId: activeSample?.originalSampleId,
    sampleRecollectionReason: activeSample?.recollectionReason,
    sampleRecollectionAttempt: activeSample?.recollectionAttempt,
    priority: order.priority,
    status: orderTest.status,
    orderDate: order.orderDate,
    resultEnteredAt: orderTest.resultEnteredAt,
    enteredBy: orderTest.enteredBy,
    isRetest: orderTest.isRetest,
    retestOfTestId: orderTest.retestOfTestId,
    retestNumber: orderTest.retestNumber,
    referentDoctorName: order.referentDoctorName,
    results: (orderTest.results ?? undefined) as Record<string, unknown> | undefined,
    flags: orderTest.flags,
    technicianNotes: orderTest.technicianNotes,
    validationNotes: orderTest.validationNotes,
    hasCriticalValues: orderTest.hasCriticalValues,
    lab: orderTest.lab as WorklistLabProjection | undefined,
    denyReason: orderTest.lab?.denyReason ?? null,
    denyMessage: orderTest.lab?.denyMessage ?? null,
    statusPresentation: orderTest.lab?.statusPresentation,
    allowedActions: orderTest.lab?.allowedActions,
  };
}

/** Overlay API snapshot gates/presentation onto an order-built work item. */
export function mergeLabModalWorkItem(
  base: LabModalWorkItem,
  overlay?: LabModalWorkItem
): LabModalWorkItem {
  if (!overlay || overlay.orderTestId !== base.orderTestId) {
    return base;
  }
  return {
    ...base,
    denyReason: base.denyReason ?? overlay.denyReason,
    denyMessage: base.denyMessage ?? overlay.denyMessage,
    lab: base.lab ?? overlay.lab,
    statusPresentation: base.statusPresentation ?? overlay.statusPresentation ?? undefined,
    allowedActions: base.allowedActions ?? overlay.allowedActions,
  };
}

export function labProjectionFromRow(row: LabQueueRowDto): WorklistLabProjection {
  return labProjectionFromDto(row);
}

function toLabWorkItemProjectionLike(lab: WorklistLabProjection): LabWorkItemProjectionLike {
  return {
    ...lab,
    pipelineStage: lab.pipelineStage ?? undefined,
    denyReason: lab.denyReason,
    denyMessage: lab.denyMessage,
    attentionReason: lab.attentionReason,
    attentionLabel: lab.attentionLabel,
    allowedActions: lab.allowedActions ?? undefined,
  };
}

export function retestContextFromRow(row: LabOrderTestQueueRow): TestRetestContext {
  return deriveRetestContextFromRow(row);
}

export function queueStateFromRow(row: LabOrderTestQueueRow): OrderTestQueueState {
  const labProjection = row.lab ?? labProjectionFromRow(row as LabQueueRowDto);
  const lab = toLabWorkItemProjectionLike(labProjection);
  return deriveOrderTestQueueState(
    { status: row.status as TestStatus, isRetest: row.isRetest },
    {
      serverDenyReason: row.denyReason,
      serverDenyMessage: row.denyMessage,
      serverAttentionReason: lab.attentionReason,
      lab,
    }
  );
}
