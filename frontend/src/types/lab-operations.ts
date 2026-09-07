/**
 * Quality issue and lab operation types — aligned with backend contracts.
 */

import { GENERATED_LAB_CONSTANTS } from '@/types/generated/labConstants';

export type QualityIssueTargetType = 'sample' | 'test';

export type QualityStage = 'collection' | 'validation' | 'entry';

export type QualityDomain = 'specimen' | 'analytical' | 'clinical';

export type RemedyType =
  | 'retry_same_sample'
  | 'recollect'
  | 'request_recollection'
  | 'escalate'
  | 'cancel';

export type RecollectionRequestStatus =
  | 'pending-approval'
  | 'approved'
  | 'denied'
  | 'fulfilled'
  | 'cancelled';

export type EscalationResolutionAction =
  | 'force_validate'
  | 'authorize_retest'
  | 'authorize_recollect'
  | 'apply_amendment'
  | 'cancel_test';

export type EscalationReasonCode = 'CRIT-VAL' | 'REJ-SAMP' | 'LIMIT-HIT' | 'AMEND-RES';

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
  awaitingRecollectionTestsCount?: number;
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
  recollectionRequestId?: number;
  escalationRequired: boolean;
}

export interface RecollectionRequestSummary {
  id: number;
  orderId: number;
  qualityIssueId?: number;
  rejectedSampleId: number;
  orderTestId?: number;
  stage: QualityStage;
  status: RecollectionRequestStatus;
  reason: string;
  notes?: string;
  testCodes: string[];
  affectedOrderTestIds: number[];
  recollectionAttemptsUsed: number;
  recollectionAttemptsRemaining: number;
  requiresSupervisorOverride: boolean;
  requestedByUserId: string;
  reviewedByUserId?: string;
  reviewNotes?: string;
  reviewedAt?: string;
  createdSampleId?: number;
  createdTestId?: number;
  createdAt: string;
  patientId?: number;
  patientName?: string;
  orderNumber?: string;
  sampleType?: string;
}

export interface RecollectionRequestResult {
  success: boolean;
  message: string;
  requestId: number;
  status: RecollectionRequestStatus;
  createdSampleId?: number;
  createdTestId?: number;
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

export type LabOperationType =
  | 'sample_collect'
  | 'sample_reject'
  | 'sample_recollection_request'
  | 'result_entry'
  | 'result_validation_approve'
  | 'quality_issue_reported'
  | 'escalation_resolution_authorize_retest'
  | 'escalation_resolution_authorize_recollect'
  | 'escalation_resolution_force_validate'
  | 'escalation_resolution_apply_amendment'
  | 'escalation_resolution_cancel_test'
  | 'escalation_trigger_crit_val'
  | 'escalation_trigger_rej_samp'
  | 'escalation_trigger_limit_hit'
  | 'escalation_trigger_amend_res'
  | 'order_status_change'
  | 'test_removed'
  | 'test_added'
  | 'critical_value_detected'
  | 'critical_value_notified'
  | 'critical_value_acknowledged';

export const {
  MAX_RETEST_ATTEMPTS,
  MAX_RECOLLECTION_ATTEMPTS,
} = GENERATED_LAB_CONSTANTS;

export interface LabOperationRecord {
  id: number;
  operationType: LabOperationType;
  entityType: 'sample' | 'test' | 'order' | 'order_test' | 'quality_issue';
  entityId: number;
  performedBy: string;
  performedByName?: string | null;
  performedAt: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  operationData?: Record<string, unknown> | null;
  comment?: string | null;
}
