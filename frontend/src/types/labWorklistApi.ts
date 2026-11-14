/**
 * Lab worklist DTOs aligned with backend `app.domains.lab.schemas.worklists`.
 * OpenAPI export historically omitted worklist response models; keep in sync with Pydantic.
 */
import type { components } from '@/lib/api/types/generated/api';

export type CollectionWorklistItem = components['schemas']['CollectionWorklistItem'];
export type LabWorklistAllowedActions = components['schemas']['LabWorklistAllowedActions'];
export type StatusPresentation = components['schemas']['StatusPresentation'];

type TestStatus = components['schemas']['TestStatus'];
type SampleStatus = components['schemas']['SampleStatus'];
type PriorityLevel = components['schemas']['PriorityLevel'];
type Gender = components['schemas']['Gender'];

/** Parameter code → entered value map on validation worklist rows */
export type TestResultsDict = Record<string, string | number | null>;

export type LabPipelineStage = NonNullable<CollectionWorklistItem['pipelineStage']>;
export type QueueAgeBand = NonNullable<CollectionWorklistItem['queueAgeBand']>;

export interface WorklistPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Shared worklist row fields for entry + validation queues */
interface WorklistRowCore {
  orderTestId: number;
  orderId: number;
  patientId: number;
  patientName: string;
  testCode: string;
  testName: string;
  sampleType: string;
  priority: PriorityLevel;
  status: TestStatus;
  orderDate: string;
  waitingHours: number;
  turnaroundHours: number;
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
  testCategory?: string | null;
  pipelineStage?: LabPipelineStage | null;
  attentionReason?: string | null;
  attentionLabel?: string | null;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  statusPresentation?: StatusPresentation | null;
  queueAgeBand?: QueueAgeBand | null;
  priorityRank?: number | null;
}

export interface EntryWorklistItem extends WorklistRowCore {
  sampleId: number | null;
  collectedAt: string | null;
  isRetest: boolean;
  retestOfTestId?: number | null;
  retestNumber: number;
}

export interface ValidationWorklistItem extends WorklistRowCore {
  sampleId?: number | null;
  sampleStatus?: SampleStatus | null;
  results?: TestResultsDict | null;
  flags?: string[] | null;
  enteredBy?: string | null;
  isRetest: boolean;
  retestOfTestId?: number | null;
  retestNumber: number;
  resultEnteredAt: string | null;
  hasCriticalValues: boolean;
}

export type DashboardWorklistStage = 'collection' | 'entry' | 'validation';

export interface DashboardWorklistItem {
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
  stage: DashboardWorklistStage;
  activityAt: string;
  orderDate: string;
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
  testCategory?: string | null;
  attentionReason?: string | null;
  attentionLabel?: string | null;
  statusPresentation?: StatusPresentation | null;
}

export type WorklistReferentDoctorFields = Pick<
  CollectionWorklistItem,
  | 'referentDoctorId'
  | 'referentDoctorName'
  | 'referentDoctorEmail'
  | 'referentDoctorPhone'
  | 'referentDoctorHospital'
  | 'referentDoctorUsername'
>;

export type WorklistAttentionFields = Pick<
  CollectionWorklistItem,
  'attentionReason' | 'attentionLabel'
>;

export type WorklistActionGateFields = Pick<
  CollectionWorklistItem,
  'pipelineStage' | 'allowedActions' | 'denyReason' | 'denyMessage' | 'statusPresentation'
>;