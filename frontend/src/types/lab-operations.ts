/**
 * Quality issue and lab operation types — aligned with backend contracts.
 */

import type { PaymentStatus, Sample } from '@/types';
import type { ContainerTopColor, ContainerType, SampleType } from '@/types';
import type {
  EscalationResolutionAction,
  PriorityLevel,
  QualityDomain,
  QualityIssueTargetType,
  QualityStage,
  RemedyType,
} from '@/types/enums';
import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labContract';

export type {
  EscalationReasonCode,
  EscalationResolutionAction,
  QualityDomain,
  QualityIssueTargetType,
  QualityStage,
  RemedyType,
} from '@/types/enums';

/** Collection requirement for a sample (shared with modal payloads and lab queue). */
export interface SampleCollectionRequirement {
  sampleType: SampleType;
  testCodes: string[];
  testNames?: string[];
  totalVolume: number;
  containerTypes: ContainerType[];
  containerTopColors: ContainerTopColor[];
  priority: PriorityLevel;
  orderId: number;
}

import type { LabWorklistAllowedActions } from '@/types/labWorklistApi';

/** Server-driven gates from lab worklist API (OpenAPI). */
export type { LabWorklistAllowedActions } from '@/types/labWorklistApi';

/**
 * Collection queue row mapped from `CollectionWorklistItem` (worklist-native fields only).
 */
export interface CollectionQueueRow {
  sample: Sample;
  patientId: number;
  patientName: string;
  orderId: number;
  orderDate: string;
  paymentStatus: PaymentStatus;
  priority: PriorityLevel;
  requirement: SampleCollectionRequirement;
  allowedActions?: LabWorklistAllowedActions;
  denyReason?: string | null;
  denyMessage?: string | null;
  statusPresentation?: import('@/types/labProjection').StatusPresentation | null;
  referentDoctorId?: number | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
}

/** Alias kept for existing lab collection imports. */
export type SampleCollectionQueueItem = CollectionQueueRow;

/** Alias used across lab collection code. */
export type SampleRequirement = SampleCollectionRequirement;

export interface QualityIssueTarget {
  type: QualityIssueTargetType;
  id: number;
}

export interface QualityIssueOptions {
  targetType: QualityIssueTargetType;
  targetId: number;
  orderId: number;
  testCode?: string;
  sampleId?: number;
  stage: QualityStage;
  allowedCriteria: string[];
  /** Remedies the operator may choose (validation destinations / sample unfinished fate). */
  allowedRemedies?: RemedyType[];
  /** Soft suggestion only — UI may pre-select; never auto-applied. */
  suggestedRemedy?: RemedyType;
  retestAttemptsUsed: number;
  retestAttemptsRemaining: number;
  recollectionAttemptsUsed: number;
  recollectionAttemptsRemaining: number;
  willEscalate: boolean;
  previewRemedy?: RemedyType;
  previewMessage: string;
  hasSpecimenCriteria?: boolean;
  hasAnalyticalCriteria?: boolean;
  resultedTestsCount?: number;
  validatedTestsCount?: number;
  unfinishedTestsCount?: number;
  awaitingRecollectionTestsCount?: number;
  sampleRejected?: boolean;
}

export interface ReportQualityIssueRequest {
  target: QualityIssueTarget;
  reason: string;
  notes?: string;
  preferredRemedy?: RemedyType;
}

export interface QualityIssueResult {
  success: boolean;
  remedy: RemedyType;
  message: string;
  qualityIssueId: number;
  orderId: number;
  testCode?: string;
  sampleId?: number;
  orderTestId?: number;
  createdTestId?: number;
  createdSampleId?: number;
  escalationRequired: boolean;
}

export interface QualityIssueRecord {
  id: number;
  orderId: number;
  orderTestId?: number;
  sampleId?: number;
  testCode?: string;
  stage: QualityStage;
  domain: QualityDomain;
  reason: string;
  notes?: string;
  remedy: RemedyType;
  createdTestId?: number;
  createdSampleId?: number;
  createdBy: string;
  createdAt: string;
}

export interface CriticalReadBackPayload {
  providerName: string;
  providerContact: string;
  notifiedAt: string;
  readBackConfirmed: boolean;
}

export interface EscalationResolveRequest {
  action: EscalationResolutionAction;
  validationNotes?: string;
  rejectionReason?: string;
  readBack?: CriticalReadBackPayload;
}

export interface EscalationResolveResult {
  success: boolean;
  action: EscalationResolutionAction;
  message: string;
  escalatedTestId: number;
  newTestId?: number;
  newSampleId?: number;
}

export const {
  MAX_RETEST_ATTEMPTS,
  MAX_RECOLLECTION_ATTEMPTS,
} = GENERATED_LAB_CONSTANTS;

export type {
  CollectionWorklistItem,
  DashboardWorklistItem,
  EntryWorklistItem,
  LabPipelineStage,
  ValidationWorklistItem,
  WorklistActionGateFields,
  WorklistAttentionFields,
  WorklistPagination,
  WorklistReferentDoctorFields,
} from '@/types/labWorklist';
