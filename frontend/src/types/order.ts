/**
 * Order and Test Request Types
 */

// Import types from enums for local use
import type { TestStatus as TestStatusType } from './enums/test-status';
import type { OrderStatus as OrderStatusType } from './enums/order-status';
import type { PriorityLevel as PriorityLevelType } from './enums/priority-level';
import type { PaymentStatus as PaymentStatusType } from './enums/payment-status';

// Re-export types (Single Source of Truth)
export type { TestStatus } from './enums/test-status';
export type { OrderStatus } from './enums/order-status';
export type { PriorityLevel } from './enums/priority-level';
export type { PaymentStatus } from './enums/payment-status';

// Re-export the VALUES arrays for backwards compatibility
export { ORDER_STATUS_VALUES } from './enums/order-status';
export { PAYMENT_STATUS_VALUES } from './enums/payment-status';

// Local type aliases for use in this file
type TestStatus = TestStatusType;
type OrderStatus = OrderStatusType;
type PriorityLevel = PriorityLevelType;
type PaymentStatus = PaymentStatusType;

export type ResultStatus = 'normal' | 'high' | 'low' | 'critical' | 'critical-high' | 'critical-low';

export type ValidationDecision = 'approved' | 'rejected' | 'repeat-required';

/**
 * Type for result rejection during validation.
 * 're-test': Re-run test with same sample, creates new OrderTest
 * 're-collect': New sample required, triggers sample recollection
 */
export type ResultRejectionType = 're-test' | 're-collect';

/**
 * Record of a result rejection event during validation.
 * Stored in resultRejectionHistory array on OrderTest.
 */
export interface ResultRejectionRecord {
  rejectedAt: string;
  rejectedBy: string;
  rejectionReason: string;
  rejectionType: ResultRejectionType;
}

export interface TestResult {
  value: string | number;
  unit?: string;
  referenceRange?: string;
  status: ResultStatus;
}

export interface OrderTest {
  // Identity
  id?: string;                         // Unique ID (orderId_testCode or orderId_testCode_RT1 for retests)
  testCode: string;                    // Links to Test catalog
  testName: string;                    // From API relationship
  sampleType: string;                  // From API relationship

  // Order-specific state
  status: TestStatus;
  priceAtOrder: number;                // Snapshot for billing

  // Sample linkage
  sampleId?: string;                   // Links to Sample (assigned after sample generation)

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
  originalTestId?: string;
  repeatNumber?: number;

  // Re-test tracking (for result validation rejection flow)
  isRetest?: boolean;                   // True if this is a retest of a rejected result
  retestOfTestId?: string;              // Links to original OrderTest.id that was rejected
  retestNumber?: number;                // 0 = original, 1 = 1st retest, etc.
  retestOrderTestId?: string;           // Points to the new retest entry created after rejection

  // Result rejection history (for validation rejections)
  resultRejectionHistory?: ResultRejectionRecord[];

  // Critical values (order-specific)
  hasCriticalValues?: boolean;
  criticalNotificationSent?: boolean;
  criticalNotifiedAt?: string;
  criticalNotifiedTo?: string;
  criticalAcknowledgedAt?: string;
}

export interface Order {
  // Identity
  orderId: string;
  patientId: string;                   // Links to Patient
  patientName: string;                 // From API relationship
  orderDate: string;

  // Tests
  tests: OrderTest[];

  // Pricing (snapshot at order time)
  totalPrice: number;
  paymentStatus: PaymentStatus;
  overallStatus: OrderStatus;

  // Scheduling
  appointmentId?: string;              // Links to Appointment
  scheduledCollectionTime?: string;

  // Instructions
  specialInstructions?: string[];
  patientPrepInstructions?: string;
  clinicalNotes?: string;
  referringPhysician?: string;
  priority: PriorityLevel;

  // Metadata
  createdBy: string;
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
  orderIds: string[];
  patientCount: number;
  totalTests: number;
  priority: PriorityLevel;
  scheduledTime?: string;
  collectedBy?: string;
  collectedAt?: string;
  status: 'not-started' | 'in-progress' | 'completed';
}
