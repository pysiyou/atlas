/**
 * Lab Operations Types
 *
 * Centralized type definitions for laboratory operations including
 * rejection actions, options, and results.
 */

/**
 * Action to take when rejecting a result or sample
 */
export type RejectionAction =
  | 'retest_same_sample' // Use existing sample, run test again
  | 'recollect_new_sample' // Get new sample from patient
  | 'escalate'; // Limits exceeded, need supervisor

/**
 * Source of the rejection
 */
export type RejectionSource =
  | 'sample_collection' // Rejected during/after collection
  | 'result_validation'; // Rejected during result validation

/**
 * Lab operation types for audit tracking
 */
export type LabOperationType =
  // Sample Operations
  | 'sample_collect'
  | 'sample_reject'
  | 'sample_recollection_request'
  // Result Operations
  | 'result_entry'
  | 'result_validation_approve'
  | 'result_validation_reject_retest'
  | 'result_validation_reject_recollect'
  | 'result_validation_escalate'
  | 'escalation_resolution_authorize_retest'
  | 'escalation_resolution_authorize_recollect'
  | 'escalation_resolution_force_validate'
  | 'escalation_resolution_final_reject'
  | 'escalation_trigger_crit_val'
  | 'escalation_trigger_rej_samp'
  | 'escalation_trigger_limit_hit'
  | 'escalation_trigger_amend_res'
  // Order Operations
  | 'order_status_change'
  | 'test_removed'
  | 'test_added'
  // Critical Value Operations
  | 'critical_value_detected'
  | 'critical_value_notified'
  | 'critical_value_acknowledged';

/**
 * Available rejection action with metadata
 */
export interface AvailableAction {
  action: RejectionAction;
  enabled: boolean;
  disabledReason?: string;
  label: string;
  description: string;
}

/**
 * Response from the rejection options endpoint
 */
export interface RejectionOptionsResponse {
  canRetest: boolean;
  retestAttemptsRemaining: number;
  canRecollect: boolean;
  recollectionAttemptsRemaining: number;
  availableActions: AvailableAction[];
  escalationRequired: boolean;
  allowedRejectionCriteria?: string[];
}

/**
 * Result of a rejection operation
 */
export interface RejectionResult {
  success: boolean;
  action: RejectionAction;
  message: string;
  originalTestId: number;
  newTestId?: number;
  newSampleId?: number;
  escalationRequired: boolean;
}

/**
 * Request body for rejecting test results
 */
export interface RejectionRequest {
  rejectionReason: string;
  rejectionNotes?: string;
}

/**
 * Escalation resolution actions (admin/labtech_plus only)
 */
export type EscalationResolutionAction = 'force_validate' | 'authorize_retest' | 'authorize_recollect' | 'final_reject';

export type EscalationReasonCode = 'CRIT-VAL' | 'REJ-SAMP' | 'LIMIT-HIT' | 'AMEND-RES';

export interface CriticalReadBackPayload {
  providerName: string;
  providerContact: string;
  notifiedAt: string;
  readBackConfirmed: boolean;
}

/**
 * Request body for resolving an escalated test
 */
export interface EscalationResolveRequest {
  action: EscalationResolutionAction;
  validationNotes?: string;
  rejectionReason?: string;
  readBack?: CriticalReadBackPayload;
}

/**
 * Result of resolving an escalated test (POST .../escalation/resolve).
 * action is one of force_validate | authorize_retest | final_reject, not RejectionAction.
 */
export interface EscalationResolveResult {
  success: boolean;
  action: EscalationResolutionAction;
  message: string;
  originalTestId: number;
  newTestId?: number;
  newSampleId?: number;
  escalationRequired: boolean;
}

/**
 * Request body for combined reject and recollect operation
 */
export interface RejectAndRecollectRequest {
  rejectionReason: string;
  rejectionNotes?: string;
  recollectionReason?: string;
}

/**
 * Response from combined reject and recollect operation
 */
export interface RejectAndRecollectResponse {
  rejectedSample: {
    sampleId: number;
    status: string;
    rejectedAt: string | null;
    recollectionSampleId: number | null;
  };
  newSample?: {
    sampleId: number;
    status: string;
    priority: string;
    isRecollection: boolean;
    originalSampleId: number;
    recollectionAttempt: number;
  } | null;
  recollectionAttempt?: number | null;
  escalatedForSupervisorRecollection?: boolean;
  message: string;
}

/**
 * Audit log record for lab operations
 */
export interface LabOperationRecord {
  id: number;
  operationType: LabOperationType;
  entityType: 'sample' | 'test' | 'order' | 'order_test';
  entityId: number;
  performedBy: string;
  performedByName?: string | null;
  performedAt: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  operationData?: Record<string, unknown> | null;
  comment?: string | null;
}

/**
 * Constants matching backend limits
 */
export const MAX_RETEST_ATTEMPTS = 2;
export const MAX_RECOLLECTION_ATTEMPTS = 2;

/**
 * Map legacy rejection types to new action types
 */
export function mapRejectionTypeToAction(rejectionType: 're-test' | 're-collect'): RejectionAction {
  return rejectionType === 're-test' ? 'retest_same_sample' : 'recollect_new_sample';
}

/**
 * Map new action types to legacy rejection types (for backwards compatibility)
 */
export function mapActionToRejectionType(action: RejectionAction): 're-test' | 're-collect' | null {
  switch (action) {
    case 'retest_same_sample':
      return 're-test';
    case 'recollect_new_sample':
      return 're-collect';
    default:
      return null;
  }
}
