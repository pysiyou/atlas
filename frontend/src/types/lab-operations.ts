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
  | 'sample_collect'
  | 'sample_reject'
  | 'sample_recollection_request'
  | 'result_entry'
  | 'result_validation_approve'
  | 'result_validation_reject_retest'
  | 'result_validation_reject_recollect';

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
  rejectionType: 're-test' | 're-collect';
}

/**
 * Request body for combined reject and recollect operation
 */
export interface RejectAndRecollectRequest {
  rejectionReasons: string[];
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
  newSample: {
    sampleId: number;
    status: string;
    priority: string;
    isRecollection: boolean;
    originalSampleId: number;
    recollectionAttempt: number;
  };
  recollectionAttempt: number;
  message: string;
}

/**
 * Audit log record for lab operations
 */
export interface LabOperationRecord {
  id: number;
  operationType: LabOperationType;
  entityType: 'sample' | 'test' | 'order';
  entityId: number;
  performedBy: number;
  performedAt: string;
  beforeState: Record<string, unknown>;
  afterState: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Constants matching backend limits
 */
export const MAX_RETEST_ATTEMPTS = 3;
export const MAX_RECOLLECTION_ATTEMPTS = 3;

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
