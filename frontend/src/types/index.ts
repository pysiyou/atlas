/**
 * Central type exports
 */

export * from './contracts/enums';

export type {
  Patient,
  PatientContext,
  Address,
  EmergencyContact,
  MedicalHistory,
  Affiliation,
} from './domain/patient';
export type {
  Order,
  OrderTest,
  TestResult,
  ResultRejectionType,
  LatestPaymentSnippet,
} from './domain/order';
export { getOrderTests, getOrderTestCount } from './domain/order';
export type {
  Sample,
  PendingSample,
  CollectedSample,
  RejectedSample,
} from './domain/sample';
export { isCollectedSample, isRejectedSample } from './domain/sample';
export type { User, AuthUser } from './domain/user';
export type { PaginatedResponse, PaginationMeta } from './domain/pagination';
export type {
  Test,
  TestSummary,
  TestCategory,
  TestParameter,
  CatalogReferenceRange,
  CriticalRange,
  ResultItem,
  TestWithContext,
} from './domain/test';
export type { Payment, PaymentMethod, Invoice } from './domain/payments';
export type { AffiliationPlan, AffiliationPricing } from './domain/affiliation';
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
  SampleRequirement,
} from './domain/labOperations';
export type { ApiError, ApiErrorDetail } from './validation';
export {
  zEnumFromValues,
  phoneSchema,
  emailSchema,
  postalCodeSchema,
  dateStringSchema,
  nullableApiDatetimeSchema,
  dateSchema,
  positiveIntSchema,
  percentageSchema,
  nonEmptyString,
  nameSchema,
  apiErrorSchema,
  apiErrorDetailSchema,
} from './validation';
export type {
  ReportableOrder,
  LabReportPayload,
  ReportTemplate,
  ReportPreviewResultsLayout,
} from './domain/report';
export { RESULT_NOT_AVAILABLE } from './domain/report';