// Sample Types - Physical sample entity

// Import types from enums for local use
import type { SampleType as SampleTypeEnum } from './enums/sample-type';
import type { ContainerType as ContainerTypeEnum, ContainerTopColor as ContainerTopColorEnum } from './enums/container';
import type { RejectionReason as RejectionReasonEnum } from './enums/rejection-reason';

// Re-export types (Single Source of Truth)
export type { SampleType } from './enums/sample-type';
export type { SampleStatus } from './enums/sample-status';
export type { ContainerType, ContainerTopColor } from './enums/container';
export type { RejectionReason } from './enums/rejection-reason';

// Re-export the VALUES arrays for backwards compatibility
export { SAMPLE_TYPE_VALUES } from './enums/sample-type';
export { SAMPLE_STATUS_VALUES } from './enums/sample-status';
export { CONTAINER_TYPE_VALUES, CONTAINER_COLOR_VALUES } from './enums/container';
export { REJECTION_REASON_VALUES } from './enums/rejection-reason';

// Local type aliases for use in this file
type SampleType = SampleTypeEnum;
type ContainerType = ContainerTypeEnum;
type ContainerTopColor = ContainerTopColorEnum;
type RejectionReason = RejectionReasonEnum;

/**
 * Single rejection record in the history
 */
export interface RejectionRecord {
  rejectedAt: string;
  rejectedBy: string;
  rejectionReasons: RejectionReason[];
  rejectionNotes?: string;
  recollectionRequired: boolean;
}

/**
 * Base sample fields - always present regardless of status
 */
interface BaseSample {
  sampleId: number;                    // Integer ID, displayed as SAM{id}
  orderId: number;                     // Links to Order (no patientId/patientName)
  sampleType: SampleType;

  // What this sample is for
  testCodes: string[];                 // Links to Test catalog (no testNames)
  requiredVolume: number;
  priority: 'routine' | 'urgent' | 'stat';

  // Required specs (what catalog says we need)
  requiredContainerTypes: ContainerType[];
  requiredContainerColors: ContainerTopColor[];

  // Rejection history - tracks all rejection attempts
  rejectionHistory?: RejectionRecord[];

  // Recollection tracking (present if this sample is a recollection)
  isRecollection?: boolean;
  originalSampleId?: number;           // The rejected sample this replaces
  recollectionReason?: string;
  recollectionAttempt?: number;        // 1 = original, 2 = 1st recollection, etc.

  // Timestamps
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}

/**
 * Sample in pending state (not yet collected)
 */
export interface PendingSample extends BaseSample {
  status: 'pending';
}

/**
 * Sample in collected state
 */
export interface CollectedSample extends BaseSample {
  status: 'collected';

  // Collection info (always present after collection)
  collectedAt: string;
  collectedBy: string;
  collectedVolume: number;

  // Actual container used (singular - choice made at collection)
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;

  // Optional collection fields
  collectionNotes?: string;
  remainingVolume?: number;

  // Quality assessment
  qualityIssues?: RejectionReason[];
  qualityNotes?: string;
}

/**
 * Sample in rejected state
 */
export interface RejectedSample extends BaseSample {
  status: 'rejected';

  // Originally collected info
  collectedAt: string;
  collectedBy: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;

  // Rejection info
  rejectedAt: string;
  rejectedBy: string;
  rejectionReasons: RejectionReason[];
  rejectionNotes?: string;

  // If recollection ordered
  recollectionRequired: boolean;
  recollectionSampleId?: number;
}

/**
 * Unified Sample type - discriminated union by status
 */
export type Sample = PendingSample | CollectedSample | RejectedSample;

/**
 * Type guard to check if sample is collected
 */
export function isCollectedSample(sample: Sample): sample is CollectedSample {
  return sample.status === 'collected';
}

/**
 * Type guard to check if sample is pending
 */
export function isPendingSample(sample: Sample): sample is PendingSample {
  return sample.status === 'pending';
}

/**
 * Type guard to check if sample is rejected
 */
export function isRejectedSample(sample: Sample): sample is RejectedSample {
  return sample.status === 'rejected';
}
