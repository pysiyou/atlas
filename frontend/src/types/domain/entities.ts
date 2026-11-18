/**
 * Domain entities (hand-written).
 * Style spec: see `types/index.ts` (sections: patient → order → sample → user → catalog → payments).
 */
import type {
  Gender,
  AffiliationDuration,
  Relationship,
  TestStatus,
  OrderStatus,
  PriorityLevel,
  PaymentStatus,
  PaymentMethod,
  ResultStatus,
  ValidationDecision,
  SampleType,
  ContainerType,
  ContainerTopColor,
  UserRole,
} from '../generated/enums';
import type {
  ApiOrderableTestResponse,
  ApiOrderableTestSummaryResponse,
  ApiCatalogAnalyteEntry,
} from '@/lib/api/types';

// =============================================================================
// patient
// =============================================================================
/** Patient registration, affiliation, and enriched list context. */

/** Affiliation pricing from catalog API. */
export interface AffiliationPricing {
  duration: AffiliationDuration;
  price: number;
  isActive: boolean;
}

/** Plan row for affiliation selector UI. */
export interface AffiliationPlan {
  duration: AffiliationDuration;
  label: string;
  price: number;
  monthlyPrice: number;
  isBestValue?: boolean;
}

export interface Affiliation {
  assuranceNumber: string; // Payer member ID (12-digit numeric when generated)
  startDate: string; // ISO date
  endDate: string; // ISO date (calculated from duration)
  duration: AffiliationDuration; // Duration in months
}

export interface EmergencyContact {
  fullName: string;
  relationship: Relationship;
  phone: string;
  email?: string;
}

export interface Address {
  street: string;
  city: string;
  postalCode: string;
}

export interface MedicalHistory {
  chronicConditions: string[];
  currentMedications: string[];
  allergies: string[];
  previousSurgeries: string[];
  /** Backend uses list[str]; we send array, store as string in form (semicolon-delimited) */
  familyHistory: string | string[];
  lifestyle: {
    smoking: boolean;
    alcohol: boolean;
  };
}

export interface Patient {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  email?: string;
  height?: number; // Height in centimeters
  weight?: number; // Weight in kilograms
  address: Address;
  affiliation?: Affiliation;
  emergencyContact: EmergencyContact;
  medicalHistory: MedicalHistory;
  registrationDate: string;
  createdBy: string; // Backend returns string user ID
  createdAt: string;
  updatedAt: string;
  updatedBy: string; // Backend returns string user ID
}

/**
 * PatientContext — Superset type for all patient-facing views.
 *
 * Combines the full Patient record with pre-computed order statistics
 * to avoid redundant Order[] lookups in every component that renders
 * patient cards, rows, or detail views.
 *
 * Built by `usePaginatedPatientContextList` — joins paginated patients with per-patient orders.
 * No additional API calls required.
 *
 * Consumers: PatientList, PatientDetail, PatientTableConfig
 */
export interface PatientContext extends Patient {
  /** Total number of orders for this patient. */
  orderCount: number;
  /** Most recent order date (ISO string), or undefined if no orders. */
  lastOrderDate?: string;
  /** Most recent order's overall status, or undefined if no orders. */
  lastOrderStatus?: string;
  /** Whether the patient has any unpaid orders. */
  hasUnpaidOrders: boolean;
}


// =============================================================================
// order
// =============================================================================
/** Orders, order tests, results, and batch collection grouping. */

/**
 * Type for result rejection during validation (legacy labels for display only).
 */
export type ResultRejectionType =
  | 're-test'
  | 're-collect'
  | 'escalate'
  | 'authorize_retest'
  | 'authorize_recollect'
  | 'cancel_test';

export interface TestResult {
  value: string | number;
  unit?: string;
  referenceRange?: string;
  status: ResultStatus;
}

export interface OrderTest {
  // Identity
  id?: number;
  testCode: string; // Catalog mnemonic (CBC, CMP, TSH)
  testName: string; // From API relationship
  sampleType: string; // From API relationship

  // Order-specific state
  status: TestStatus;
  priceAtOrder: number; // Snapshot for billing

  // Sample linkage
  sampleId?: string; // Links to Sample (assigned after sample generation)

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

  // Reflex (order-specific)
  isReflexTest?: boolean;
  triggeredBy?: string;
  reflexRule?: string;

  // Re-test tracking (for result validation rejection flow)
  isRetest?: boolean; // True if this is a retest of a rejected result
  retestOfTestId?: number; // Links to original OrderTest.id that was rejected
  retestNumber?: number; // 0 = original, 1 = 1st retest, etc.
  retestOrderTestId?: number; // Points to the new retest entry created after rejection

  // Critical values (order-specific)
  hasCriticalValues?: boolean;
  criticalNotificationSent?: boolean;
  criticalNotifiedAt?: string;
  criticalNotifiedTo?: string;
  criticalAcknowledgedAt?: string;

  /** Server lab projection when order is loaded with lab enrichment. */
  lab?: import('@/lib/api/types').LabWorkItemProjection | null;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export function getOrderTests(order: Pick<Order, 'tests' | 'testCount'>): OrderTest[] {
  return order.tests ?? [];
}

export function getOrderTestCount(order: Pick<Order, 'tests' | 'testCount'>): number {
  return order.testCount ?? order.tests?.length ?? 0;
}

export interface LatestPaymentSnippet {
  paymentId: string;
  paymentMethod: string;
  paidAt: string;
}

export interface Order {
  // Identity
  orderId: string;
  placerNumber?: string | null;
  patientId: string;
  patientName: string; // From API relationship
  patientDob?: string;
  patientGender?: Gender;
  orderDate: string;

  // Tests (omitted on summary list responses — use testCount / testCodes)
  tests?: OrderTest[];
  testCount?: number;
  testCodes?: string[];
  testNames?: string[];
  latestPayment?: LatestPaymentSnippet | null;

  // Pricing (snapshot at order time)
  totalPrice: number;
  paymentStatus: PaymentStatus;
  overallStatus: OrderStatus;
  statusPresentation?: import('@/lib/api/types').StatusPresentation | null;

  // Scheduling
  scheduledCollectionTime?: string;

  // Instructions
  specialInstructions?: string[];
  patientPrepInstructions?: string;
  clinicalNotes?: string;
  referentDoctorId?: string | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  doctorApprovedBy?: string | null;
  doctorApprovedAt?: string | null;
  referentDoctorUsername?: string | null;
  priority: PriorityLevel;

  // Delivery tracking (optional - for detailed timeline)
  deliveredAt?: string; // When results were delivered
  deliveredBy?: string; // User who delivered results
  deliveryMethod?: 'email' | 'portal' | 'print' | 'sms';

  // Payment tracking (optional - for detailed timeline)
  paidAt?: string; // When payment was received
  paymentMethod?: string; // How payment was made

  // Metadata
  createdBy: string; // Logged-in user id at registration
  createdAt: string;
  updatedAt: string;
}

/** Runtime-validated order shape (forms/mutations) — use Order from schemas for form inference. */

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


// =============================================================================
// sample
// =============================================================================
/** Physical sample entity (pending, collected, rejected). */

interface BaseSample {
  sampleId: string;
  orderId: string;
  sampleType: SampleType;
  testCodes: string[];
  requiredVolume: number;
  priority: PriorityLevel;
  requiredContainerTypes: ContainerType[];
  requiredContainerColors: ContainerTopColor[];
  isRecollection?: boolean;
  originalSampleId?: string;
  originalSampleCollectedAt?: string;
  recollectionReason?: string;
  recollectionAttempt?: number;
  parentSampleId?: string | null;
  isAliquot?: boolean;
  aliquotIndex?: number | null;
  aliquotVolume?: number | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface PendingSample extends BaseSample {
  status: 'pending';
}

export interface CollectedSample extends BaseSample {
  status: 'collected';
  collectedAt: string;
  collectedBy: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
  remainingVolume?: number;
  qualityIssues?: RejectionReasonId[];
  qualityNotes?: string;
}

export interface RejectedSample extends BaseSample {
  status: 'rejected';
  collectedAt: string;
  collectedBy: string;
  collectedVolume: number;
  actualContainerType: ContainerType;
  actualContainerColor: ContainerTopColor;
  collectionNotes?: string;
  rejectedAt: string;
  rejectedBy: string;
  rejectionReasons?: string[];
  rejectionNotes?: string;
  recollectionRequired: boolean;
  recollectionSampleId?: string;
}

export type Sample = PendingSample | CollectedSample | RejectedSample;

export function isCollectedSample(sample: Sample): sample is CollectedSample {
  return sample.status === 'collected';
}

export function isRejectedSample(sample: Sample): sample is RejectedSample {
  return sample.status === 'rejected';
}


// =============================================================================
// user
// =============================================================================
/** Staff users and authenticated session shape. */
export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Authenticated session user (subset of User) */
export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
}


// =============================================================================
// catalog
// =============================================================================
/** Test catalog: app models (camelCase) and wire shapes (catalog JSON). */
/**
 * Test category types - expanded to match catalog categories
 */
export type TestCategory =
  | 'hematology'
  | 'biochemistry'
  | 'microbiology'
  | 'serology'
  | 'urinalysis'
  | 'imaging'
  | 'immunology'
  | 'molecular'
  | 'toxicology'
  | 'coagulation'
  | 'chemistry'; // Alias for biochemistry

/**
 * Value type for test result items
 */
export type ValueType = 'NUMERIC' | 'SELECT' | 'TEXT';

/**
 * Demographic-specific reference range entry
 */
export interface DemographicRange {
  low?: number;
  high?: number;
  /** Qualitative / interpretive reference (e.g. Negative, Clear). */
  text?: string;
}

/**
 * Reference range structure from catalog - supports demographic-specific ranges
 */
export interface CatalogReferenceRange {
  adult_general?: DemographicRange;
  adult_male?: DemographicRange;
  adult_female?: DemographicRange;
  pediatric?: DemographicRange;
  /** @deprecated Legacy flat shape on the range object */
  low?: number;
  high?: number;
  [bandKey: string]: DemographicRange | number | undefined;
}

/**
 * Critical range for alerting
 */
export interface CriticalRange {
  low?: number;
  high?: number;
}

/** Demographic reference range row (catalog / display). */
export interface ReferenceRange {
  min?: number;
  max?: number;
  text?: string;
  gender?: 'male' | 'female';
  ageMin?: number;
  ageMax?: number;
  criticalLow?: number; // Below this is critical
  criticalHigh?: number; // Above this is critical
}

/** Registry reason id (contracts/orderable-tests.json / analytes.json rejection criteria). */
export type RejectionReasonId = string;

/** Wire shape (catalog JSON) — snake_case field names. */
/**
 * Sample requirements from catalog
 */
export interface SampleRequirements {
  sample_type: SampleType;
  container: string;
  minimum_volume_ml: number;
  fasting_required: boolean;
  collection_notes?: string;
  rejection_criteria?: RejectionReasonId[];
}

/** Slim orderable test row from catalog API (includes workup ids). */
export type OrderableTestSummary = ApiOrderableTestSummaryResponse;

/** Full orderable test with embedded analyte catalog entries. */
export type OrderableTest = ApiOrderableTestResponse;

/** One analytes.json row — OpenAPI wire type (matches contract JSON keys). */
export type AnalyteDefinition = ApiCatalogAnalyteEntry;

/**
 * Standardized interface for a test with its associated order and patient context.
 *
 * This is the canonical "Superset" type for all lab workflow views:
 * Result Entry, Result Validation, and Escalation workflow views.
 * Use this type instead of creating feature-specific variants.
 *
 * Built by `useOrderTestsWithLabContext` — the single enrichment hook that joins
 * Order[] + Sample[] + Patient[] + OrderableTest[] into this unified shape.
 */
export interface TestWithContext {
  orderId: string;
  patientId: string;
  patientName: string;
  testName: string;
  testCode: string;
  sampleType?: string;
  sampleId?: string;
  priority: string;
  status: string;
  collectedAt?: string;
  collectedBy?: string;
  resultEnteredAt?: string;
  enteredBy?: string;
  resultValidatedAt?: string;
  validatedBy?: string;
  referentDoctorId?: string | null;
  referentDoctorName?: string | null;
  referentDoctorEmail?: string | null;
  referentDoctorPhone?: string | null;
  referentDoctorHospital?: string | null;
  referentDoctorUsername?: string | null;
  patient?: Patient; // Full patient object if needed
  results?: Record<string, TestResult>;
  flags?: string[];
  technicianNotes?: string;
  validationNotes?: string;

  // Order-level fields (set by useOrderTestsWithLabContext)
  /** ISO date string of the order — used for sorting and display in lab workflow views. */
  orderDate?: string;

  // Patient-level fields (set by useOrderTestsWithLabContext when includePatient=true)
  /** Patient date of birth — used for demographic reference range checks in ResultEntryQueue. */
  patientDob?: string;

  // Derived flags (set by useOrderTestsWithLabContext when includeHasCriticalValues=true)
  /** Whether this test has critical values flagged — used by ResultValidationQueue. */
  hasCriticalValues?: boolean;

  /** Order test row id — required for critical value API calls. */
  id?: number;

  // Critical value notification state (from OrderTest)
  criticalNotificationSent?: boolean;
  criticalNotifiedAt?: string;
  criticalNotifiedTo?: string;
  criticalAcknowledgedAt?: string;

  // Retest tracking fields (for result validation re-test flow)
  isRetest?: boolean;
  retestOfTestId?: number;
  retestNumber?: number;

  // Sample recollection tracking fields (for sample re-collect flow)
  sampleStatus?: string;
  sampleIsRecollection?: boolean;
  sampleOriginalSampleId?: string;
  sampleRecollectionReason?: string;
  sampleRecollectionAttempt?: number;

  // Escalation ticket fields (from pending-escalation API)
  ticketId?: number;
  reasonCode?: string;
  severity?: string;
  ticketMetadata?: Record<string, unknown>;

  /** Server-driven action gates from lab worklists (when present). */
  allowedActions?: {
    collect: boolean;
    enterResults: boolean;
    validate: boolean;
    reject: boolean;
  };
  denyReason?: string | null;
  denyMessage?: string | null;
  allowForceValidate?: boolean;
  lab?: import('@/lib/api/types').LabWorkItemProjection | null;

  [key: string]: unknown;
}


// =============================================================================
// payments
// =============================================================================
/** Invoices and payment records. */

export type { PaymentMethod } from '../generated/enums';

export interface InvoiceItem {
  testCode: string;
  testName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  invoiceId: string;
  orderId: string;
  patientId: string;
  patientName?: string;
  status: PaymentStatus;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  createdAt: string;
  dueDate?: string;
}

export interface Payment {
  paymentId: string;
  orderId: string;
  invoiceId: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  paidAt: string;
  createdBy: string;
  receiptGenerated: boolean;
  notes?: string;
  orderTotalPrice?: number;
  numberOfTests?: number;
  patientName?: string;
  orderPaymentStatus?: PaymentStatus;
}
