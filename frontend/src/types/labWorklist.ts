/**
 * Lab worklist DTO shapes — shared by API client and queue UI.
 */

import type {
  ContainerTopColor,
  ContainerType,
  Gender,
  PaymentStatus,
  PriorityLevel,
  SampleStatus,
  TestStatus,
} from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import type { LabWorklistAllowedActions } from '@/types/lab-operations';

export type { LabWorklistAllowedActions };

export type LabPipelineStage =
  | 'collection'
  | 'entry'
  | 'validation'
  | 'escalation'
  | 'completed'
  | 'cancelled';

export interface WorklistPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface WorklistReferentDoctorFields {
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
}

export interface WorklistAttentionFields {
  attentionReason?: string | null;
  attentionLabel?: string | null;
}

export interface WorklistActionGateFields {
  pipelineStage?: LabPipelineStage | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  statusPresentation?: StatusPresentation | null;
}

type WorklistRowMeta = WorklistReferentDoctorFields &
  WorklistAttentionFields &
  WorklistActionGateFields;

export type CollectionWorklistItem = WorklistRowMeta & {
  sampleId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  sampleType: string;
  status: SampleStatus;
  priority: PriorityLevel;
  paymentStatus: PaymentStatus;
  orderDate: string;
  testCodes: string[];
  isRecollection: boolean;
  originalSampleId?: number | null;
  originalSampleCollectedAt?: string | null;
  recollectionReason?: string | null;
  recollectionAttempt?: number;
  waitingHours: number;
  turnaroundHours: number;
  actualContainerType?: ContainerType | null;
  actualContainerColor?: ContainerTopColor | null;
  collectedAt?: string | null;
  collectedBy?: string | null;
  collectedVolume?: number | null;
  testName?: string | null;
  testCategory?: string | null;
};

export type EntryWorklistItem = WorklistRowMeta & {
  orderTestId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  testCode: string;
  testName: string;
  sampleId?: number | null;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  collectedAt?: string | null;
  orderDate: string;
  waitingHours: number;
  turnaroundHours: number;
  isRetest: boolean;
  retestOfTestId?: number | null;
  retestNumber?: number;
  testCategory?: string | null;
};

export type DashboardWorklistItem = WorklistReferentDoctorFields &
  WorklistAttentionFields & {
    orderTestId: number;
    orderId: number;
    patientId: number;
    patientName: string;
    patientDob: string;
    patientGender: Gender;
    testCode: string;
    testName: string;
    sampleType: string;
    priority: PriorityLevel;
    status: TestStatus;
    stage: 'collection' | 'entry' | 'validation';
    activityAt: string;
    orderDate: string;
    testCategory?: string | null;
    statusPresentation?: StatusPresentation | null;
  };

export type ValidationWorklistItem = WorklistRowMeta & {
  orderTestId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  testCode: string;
  testName: string;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  sampleId?: number | null;
  sampleStatus?: SampleStatus | null;
  results?: Record<string, unknown> | null;
  flags?: string[] | null;
  enteredBy?: string | null;
  isRetest?: boolean;
  retestOfTestId?: number | null;
  retestNumber?: number;
  resultEnteredAt?: string | null;
  orderDate: string;
  waitingHours: number;
  turnaroundHours: number;
  hasCriticalValues: boolean;
  testCategory?: string | null;
};
