/**
 * Type layers:
 * - This barrel: contract enums + entity/model types
 * - `@/types/generated/*` — generated catalogs (feedback, policies, audit, enums)
 * - `./domain/*` — hand-written entities and view models (import via `@/types`)
 * - `@/types/zod` — shared Zod schemas
 * - `@/lib/api/types` — OpenAPI DTOs
 */

export * from './generated/enums';

export type {
  Patient,
  PatientContext,
  Address,
  EmergencyContact,
  MedicalHistory,
  Affiliation,
  AffiliationPlan,
  AffiliationPricing,
} from './domain/entities';
export type {
  Order,
  OrderTest,
  TestResult,
  ResultRejectionType,
  LatestPaymentSnippet,
} from './domain/entities';
export { getOrderTests, getOrderTestCount } from './domain/entities';
export type {
  Sample,
  PendingSample,
  CollectedSample,
  RejectedSample,
} from './domain/entities';
export { isCollectedSample, isRejectedSample } from './domain/entities';
export type { User, AuthUser } from './domain/entities';
export type { PaginatedResponse, PaginationMeta } from './domain/models';
export type {
  Test,
  TestSummary,
  TestCategory,
  TestParameter,
  CatalogReferenceRange,
  CriticalRange,
  DemographicRange,
  ResultItem,
  TestWithContext,
} from './domain/entities';
export type { Payment, PaymentMethod, Invoice } from './domain/entities';
export type {
  SampleCollectionQueueItem,
  SampleCollectionRequirement,
  CollectionQueueRow,
  QualityIssueOptions,
  QualityIssueResult,
  QualityIssueTarget,
  QualityIssueRecord,
  ReportQualityIssueRequest,
  EscalationResolveRequest,
  EscalationResolveResult,
  CriticalReadBackPayload,
  SampleRequirement,
} from './domain/models';
export type {
  ReportableOrder,
  LabReportPayload,
  ReportTemplate,
  ReportPreviewResultsLayout,
} from './domain/models';
export { RESULT_NOT_AVAILABLE } from './domain/models';