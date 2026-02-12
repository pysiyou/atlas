/**
 * Order and Test Request Types
 */

// Import types from enums for local use
import type { TestStatus as TestStatusType } from '@/shared/types/enums';
import type { OrderStatus as OrderStatusType } from '@/shared/types/enums';
import type { PriorityLevel as PriorityLevelType } from '@/shared/types/enums';
import type { PaymentStatus as PaymentStatusType } from '@/shared/types/enums';
import type { ResultStatus as ResultStatusType } from '@/shared/types/enums';
import type { ValidationDecision as ValidationDecisionType } from '@/shared/types/enums';

// Re-export types (Single Source of Truth)
export type { TestStatus } from '@/shared/types/enums';
export type { OrderStatus } from '@/shared/types/enums';
export type { PriorityLevel } from '@/shared/types/enums';
export type { PaymentStatus } from '@/shared/types/enums';
export type { ResultStatus } from '@/shared/types/enums';
export type { ValidationDecision } from '@/shared/types/enums';

// Re-export the VALUES arrays for backwards compatibility
export { ORDER_STATUS_VALUES } from '@/shared/types/enums';
export { PAYMENT_STATUS_VALUES } from '@/shared/types/enums';

// Local type aliases for use in this file
type TestStatus = TestStatusType;
type OrderStatus = OrderStatusType;
type PriorityLevel = PriorityLevelType;
type PaymentStatus = PaymentStatusType;
type ResultStatus = ResultStatusType;
type ValidationDecision = ValidationDecisionType;

/**
 * Type for result rejection during validation.
 * 're-test': Re-run test with same sample, creates new OrderTest
 * 're-collect': New sample required, triggers sample recollection
 * 'escalate': Escalate to supervisor when retest/recollect limits exceeded
 * 'authorize_retest': Escalation resolved with authorize re-test (history only)
 */
export type ResultRejectionType = 're-test' | 're-collect' | 'escalate' | 'authorize_retest';

/**
 * Record of a result rejection event during validation.
 * Stored in resultRejectionHistory array on OrderTest.
 * API may send either rejectionType/rejectionReason (camelCase) or type/reason.
 */
export interface ResultRejectionRecord {
  id?: number;
  resultId?: number;
  rejectedAt: string;
  rejectedBy: string;
  rejectionType?: ResultRejectionType;
  type?: ResultRejectionType;
  rejectionReason?: string;
  reason?: string;
  notes?: string;
}

/** Reads rejection type from either API shape (rejectionType or type). */
export function getResultRejectionType(record: ResultRejectionRecord): ResultRejectionType | undefined {
  return record.rejectionType ?? record.type;
}

export interface TestResult {
  value: string | number;
  unit?: string;
  referenceRange?: string;
  status: ResultStatus;
}

export interface OrderTest {
  // Identity
  id?: number; // Integer ID, displayed as TST{id}
  testCode: string; // Links to Test catalog
  testName: string; // From API relationship
  sampleType: string; // From API relationship

  // Order-specific state
  status: TestStatus;
  priceAtOrder: number; // Snapshot for billing

  // Sample linkage
  sampleId?: number; // Links to Sample (assigned after sample generation)

  // Results (order-specific)
  results: Record<string, TestResult> | null;
  resultEnteredAt?: string;
  enteredBy?: string;

  // Validation (order-specific)
  resultValidatedAt?: string;
  validatedBy?: string;
  validationNotes?: string;

  // Flags and notes
  flags?: string[];
  technicianNotes?: string;

  // Reflex/Repeat (order-specific)
  isReflexTest?: boolean;
  triggeredBy?: string;
  reflexRule?: string;
  isRepeatTest?: boolean;
  repeatReason?: string;
  originalTestId?: number;
  repeatNumber?: number;

  // Re-test tracking (for result validation rejection flow)
  isRetest?: boolean; // True if this is a retest of a rejected result
  retestOfTestId?: number; // Links to original OrderTest.id that was rejected
  retestNumber?: number; // 0 = original, 1 = 1st retest, etc.
  retestOrderTestId?: number; // Points to the new retest entry created after rejection

  // Result rejection history (for validation rejections)
  resultRejectionHistory?: ResultRejectionRecord[];

  // Critical values (order-specific)
  hasCriticalValues?: boolean;
  criticalNotificationSent?: boolean;
  criticalNotifiedAt?: string;
  criticalNotifiedTo?: string;
  criticalAcknowledgedAt?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  // Identity
  orderId: number; // Integer ID, displayed as ORD{id}
  patientId: number; // Links to Patient
  patientName: string; // From API relationship
  orderDate: string;

  // Tests
  tests: OrderTest[];

  // Pricing (snapshot at order time)
  totalPrice: number;
  paymentStatus: PaymentStatus;
  overallStatus: OrderStatus;

  // Scheduling
  appointmentId?: number; // Links to Appointment
  scheduledCollectionTime?: string;

  // Instructions
  specialInstructions?: string[];
  patientPrepInstructions?: string;
  clinicalNotes?: string;
  referringPhysician?: string;
  priority: PriorityLevel;

  // Delivery tracking (optional - for detailed timeline)
  deliveredAt?: string; // When results were delivered
  deliveredBy?: string; // User who delivered results
  deliveryMethod?: 'email' | 'portal' | 'print' | 'sms';

  // Payment tracking (optional - for detailed timeline)
  paidAt?: string; // When payment was received
  paymentMethod?: string; // How payment was made

  // Metadata
  createdBy: string; // Backend returns string user ID
  createdAt: string;
  updatedAt: string;
}

export interface ValidationRecord {
  validatedBy: string;
  validatedAt: string;
  decision: ValidationDecision;
  validationNotes?: string;
  criticalValuesNotified: boolean;
  rejectionReason?: string;
}

// Batch collection grouping
export interface BatchCollectionGroup {
  batchId: string;
  sampleType: string;
  orderIds: number[];
  patientCount: number;
  totalTests: number;
  priority: PriorityLevel;
  scheduledTime?: string;
  collectedBy?: string;
  collectedAt?: string;
  status: 'not-started' | 'in-progress' | 'completed';
}
