/**
 * Composed view models (lab queues, reports, pagination).
 */
import type {
  PaymentStatus,
  PriorityLevel,
  SampleType,
  ContainerTopColor,
  ContainerType,
  EscalationResolutionAction,
  QualityDomain,
  QualityIssueTargetType,
  QualityStage,
  RemedyType,
  OrderStatus,
} from '../generated/enums';
import type { Sample, Order } from './entities';
import type { LabWorklistAllowedActions, StatusPresentation } from '@/lib/api/types';


// --- lab-workflow ---

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

/** Collection queue row mapped from `CollectionWorklistItem`. */
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
  statusPresentation?: StatusPresentation | null;
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

// --- report ---

/**
 * ReportableOrder - One lab report row for a non-cancelled order with active tests.
 */
export interface ReportableOrder {
  orderId: number;
  orderDate: string;
  overallStatus: OrderStatus;
  statusPresentation: StatusPresentation;
  patientId: number;
  patientName: string;
  patientAge?: number;
  /** ISO date of birth from the report DTO; used on the printable header. */
  patientDob?: string;
  patientGender?: string;
  patientEmail?: string;
  /** Loaded for report payloads; not printed on PDF/preview. */
  patientPhone?: string;
  activeTestCount: number;
  validatedTestCount: number;
  testCodes: string[];
  testNames: string[];
  /** Present on detail/download payloads; omitted from list rows. */
  order?: Order;
}

/** Placeholder shown when a catalog investigation has no result yet. */
export const RESULT_NOT_AVAILABLE = 'Not available';

/**
 * LabReportPayload - Data structure for lab report preview and printable export.
 */
export interface LabReportPayload {
  order: Order;
  patientId: number;
  patientName: string;
  patientAge?: number;
  /** ISO date of birth for the header Date of Birth field. */
  patientDob?: string;
  patientGender?: string;
  patientEmail?: string;
  /** Present on payload for future use; omitted from printable header. */
  patientPhone?: string;
  sampleCollection?: {
    address?: string;
    collectedAt?: string;
    collectedBy?: string;
  };
  timestamps?: {
    registeredAt?: string;
    collectedAt?: string;
    /** Earliest lab processing time (result entry, else collection). */
    acceptedAt?: string;
    reportedAt?: string;
  };
  testResults: Array<{
    testCode: string;
    testName: string;
    /** Catalog exam category (e.g. Clinical Chemistry). */
    category: string;
    /** Common method from catalog, shown under exam title on PDF. */
    methodology?: string;
    parameters: Array<{
      name: string;
      code: string;
      value: string | number;
      unit?: string;
      referenceRange?: string;
      status?: string;
      isCritical?: boolean;
    }>;
    technicianNotes?: string;
    validationNotes?: string;
    enteredBy?: string;
    validatedBy?: string;
    validatedByName?: string;
    enteredAt?: string;
    validatedAt?: string;
  }>;
}

export interface ReportTemplate {
  name: string;
  logo?: string;
  headerText: string;
  footerText: string;
  includeSignature: boolean;
}

/** Report preview layout — same values as lab `ResultsGridLayout`. */
export type ReportPreviewResultsLayout = 'table' | 'grid';

// --- pagination ---
export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
