/**
 * Central export for all utilities
 */

// Export specific functions from id-generator to avoid conflicts
export {
  generatePatientId,
  generateOrderId,
  generateInvoiceId,
  generatePaymentId,
  generateAppointmentId,
  generateReportId,
  generateClaimId,
  generateBarcode,
  generateSequentialSampleId,
} from './id-generator';
export * from './validation';
export * from './formatters';
export * from './reference-ranges';
export * from './storage';
export * from './statusHelpers';
export * from './sampleHelpers';
export * from './classnames';
export * from './logger';
export * from './filtering';
export * from './barcodeHelpers';
export * from './tatHelpers';
export * from './orderUtils';

// Export result validation with renamed functions to avoid conflicts
export {
  validateNumericResult as validateLabResult,
  validateTextResult,
  validateTestResults,
  performDeltaCheck,
  requiresCriticalNotification,
  getFlagSeverity,
  formatResultValue,
  type ValidationResult as LabValidationResult,
  type ResultFlag,
  type DeltaCheck,
} from './resultValidation';
