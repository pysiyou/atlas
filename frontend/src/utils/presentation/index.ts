/**
 * Cross-feature presentation — view models, formatters, descriptors (no React).
 *
 * Name collision (do not merge):
 * - `@/utils/presentation` — this module
 * - `@/theme/recipes/presentation` — CSS recipes
 * - `@/types/enums/generated/presentation` — generated enum
 *
 * React table/card renders: `@/features/shared/entityPresentation`.
 * Screen hooks: `@/hooks/presentationHooks`.
 * Patient-only formatters: `@/features/patients/utils/patientFormatters`.
 */

export {
  type FieldKind,
  type PresentationContext,
  type FieldDescriptor,
  buildDescriptionItems,
} from './descriptors';

export { formatDateTime, formatDateTimeOrDash } from './datetime';

export { formatCurrency, formatTableAmount } from './currency';

export { formatSynonymsPreview } from './catalog';

export { formatPatientSexAgeLine } from './patient';

export {
  formatTestCountLabel,
  formatReportValidationStatus,
  formatPatientOrdersCountLabel,
  type OrderTestsBlockLayout,
  type OrderTestsPresentationInput,
  type OrderTestsPresentationResult,
  type ReportableOrderTestsInput,
  getActiveOrderTests,
  resolveOrderTestsPresentation,
  resolveReportableOrderTests,
  getReportOrderTestLabels,
  formatReportOrderTestsPreview,
  type PatientListSnippet,
  type OrderListHeader,
  type OrderContextPresentation,
  buildOrderContextPresentation,
} from './order';

export {
  formatVolumeMl,
  formatSampleStatusLabel,
  formatSampleTypeLabel,
  type SampleCollectionViewModel,
  getSampleCollectionViewModel,
  resolveCollectionPatientName,
  deriveCollectionModalFields,
  getSampleCollectionFieldDescriptors,
  buildSampleCollectionDescriptionItems,
} from './sample';

export {
  type ReportHeaderSource,
  type ReportHeaderViewModel,
  formatReportDocumentDate,
  formatReportOnAt,
  formatReportAtDateTime,
  formatReportGenderLetter,
  buildReportHeaderViewModel,
} from './report';

export { formatStatusBadgeLabel, resolveStatusBadgeColor } from '@/utils/statusBadge';
