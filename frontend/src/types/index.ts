/**
 * Central type exports
 */

// Export all enums from consolidated source
export * from '@/shared/types/enums';

// Export type interfaces (not enums) to avoid conflicts
export type { Patient, Address, EmergencyContact, MedicalHistory, VitalSigns, Affiliation } from './patient';
export type { Order, OrderTest, TestResult, ResultRejectionType, ResultRejectionRecord } from './order';
export type { Sample, PendingSample, CollectedSample, RejectedSample, RejectionRecord } from './sample';
export { isCollectedSample } from './sample'; // Export value (function)
export type { Aliquot, AliquotPlan } from './aliquot';
export type { Appointment } from './appointment';
export type { User, AuthUser } from './user';
export type { Test, TestCategory, TestParameter, CatalogReferenceRange, CriticalRange, ResultItem, TestWithContext } from './test';
export type { Payment, PaymentMethod, Invoice } from './billing';

// Note: Container and AffiliationDuration are already in consolidated enums
export type { SampleDisplay } from '../features/lab/types';
