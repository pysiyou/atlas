/**
 * Central type exports
 */

// Export all enums from consolidated source
export * from '@/types/enums';

// Export type interfaces (not enums) to avoid conflicts
export type {
  Patient,
  PatientContext,
  Address,
  EmergencyContact,
  MedicalHistory,
  VitalSigns,
  Affiliation,
} from './patient';
export type {
  Order,
  OrderTest,
  TestResult,
  ResultRejectionType,
  ResultRejectionRecord,
} from './order';
export type {
  Sample,
  PendingSample,
  CollectedSample,
  RejectedSample,
  RejectionRecord,
} from './sample';
export { isCollectedSample } from './sample'; // Export value (function)
export type { User, AuthUser } from './user';
export type { PaginatedResponse, PaginationMeta } from './pagination';
export type {
  Test,
  TestCategory,
  TestParameter,
  CatalogReferenceRange,
  CriticalRange,
  ResultItem,
  TestWithContext,
} from './test';
export type { Payment, PaymentMethod, Invoice } from './payments';
// SampleDisplay is a lab feature type; import from @/features/lab/types
