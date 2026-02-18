/**
 * Backward-compatibility re-exports for @/hooks/queries barrel.
 *
 * Files have physically moved to their respective feature api/ folders.
 * This barrel re-exports everything so existing callsites keep working.
 * Future work: update callsites to import directly from their feature.
 */

// Test Catalog → features/catalog
export * from '@/features/catalog/api/useTestCatalog';

// Users → features/admin
export * from '@/features/admin/api/useUsers';

// Patients → features/patients
export * from '@/features/patients/api/usePatients';

// Affiliation pricing → features/patients
export * from '@/features/patients/api/useAffiliationPricing';

// Patient context → features/patients
export * from '@/features/patients/api/usePatientContext';

// Orders → features/orders
export * from '@/features/orders/api/useOrderQueries';
export * from '@/features/orders/api/useOrderMutations';
export * from '@/features/orders/utils/useOrderUtils';

// Samples → features/collection
export * from '@/features/collection/api/useSamples';

// Payments → features/billing
export * from '@/features/billing/api/usePayments';

// Escalation → features/validation
export * from '@/features/validation/api/usePendingEscalation';

// Result mutations → features/validation
export * from '@/features/validation/api/useResultMutations';
