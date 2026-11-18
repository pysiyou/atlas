/**
 * Atlas frontend types — style spec and public barrel.
 *
 * ## Layers (import rules)
 * - `@/types` — app entities, view models, and contract enums (this barrel).
 * - `@/types/generated/{enums,feedback,policies,audit}` — generated catalogs (do not import
 *   policies/feedback/audit from `@/types` unless added here intentionally).
 * - `@/types/zod` — shared Zod schemas and API error shapes.
 * - `@/lib/api/types` — OpenAPI wire DTOs (never copy into `domain/`).
 *
 * ## Naming
 * - Interfaces / type aliases: PascalCase (`Patient`, `Sample`).
 * - Contract enums: `Thing`, `THING_VALUES`, `THING_CONFIG`, `THING_OPTIONS`.
 * - Constants: SCREAMING_SNAKE. Type guards: `isThing`. Helpers: `getThing`, `getThingCount`.
 * - App fields: camelCase. Catalog JSON wire types: snake_case fields only inside
 *   types marked “Wire shape (catalog JSON)” in `domain/entities.ts`.
 * - Prefer generated enum types (e.g. `PriorityLevel`) over string unions on entities.
 *
 * ## Domain files
 * - `domain/entities.ts` — sections: patient → order → sample → user → catalog → payments.
 * - `domain/models.ts` — sections: lab-workflow → report → pagination.
 * - Section delimiters and export order: see those files (must match this barrel).
 *
 * ## Generated
 * - `npm run codegen` — OpenAPI types and `generated/feedback.ts`.
 * - `generated/*.ts` — keep in sync with flat `contracts/*.json` via `npm run codegen`.
 * - Do not hand-edit generated files except via contract/codegen workflows.
 */

export * from './generated/enums';

// =============================================================================
// patient
// =============================================================================
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

// =============================================================================
// order
// =============================================================================
export type {
  Order,
  OrderTest,
  TestResult,
  ResultRejectionType,
  LatestPaymentSnippet,
} from './domain/entities';
export { getOrderTests, getOrderTestCount } from './domain/entities';

// =============================================================================
// sample
// =============================================================================
export type {
  Sample,
  PendingSample,
  CollectedSample,
  RejectedSample,
} from './domain/entities';
export { isCollectedSample, isRejectedSample } from './domain/entities';

// =============================================================================
// user
// =============================================================================
export type { User, AuthUser } from './domain/entities';

// =============================================================================
// catalog
// =============================================================================
export type {
  OrderableTest,
  OrderableTestSummary,
  TestCategory,
  AnalyteDefinition,
  CatalogReferenceRange,
  CriticalRange,
  DemographicRange,
  TestWithContext,
} from './domain/entities';
export type {
  CatalogAnalyteEntry,
  CatalogOrderableTestEntry,
  CatalogValueType,
  CatalogReferenceRange as CatalogReferenceRangeWire,
} from './generated/catalogContracts';

// =============================================================================
// payments
// =============================================================================
export type { Payment, PaymentMethod, Invoice } from './domain/entities';

// =============================================================================
// lab-workflow
// =============================================================================
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

// =============================================================================
// report
// =============================================================================
export type {
  ReportableOrder,
  LabReportPayload,
  ReportTemplate,
  ReportPreviewResultsLayout,
} from './domain/models';
export { RESULT_NOT_AVAILABLE } from './domain/models';

// =============================================================================
// pagination
// =============================================================================
export type { PaginatedResponse, PaginationMeta } from './domain/models';