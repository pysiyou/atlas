/**
 * ID Generation Utilities
 * Generates unique IDs with format: PREFIX-YYYYMMDD-XXX
 */

import { format } from 'date-fns';

/**
 * Get the current date in YYYYMMDD format
 */
const getDateString = (): string => {
  return format(new Date(), 'yyyyMMdd');
};

/**
 * Generate a sequential number with padding
 * @param existingIds - Array of existing IDs to determine next number
 */
const getNextNumber = (existingIds: string[]): string => {
  const dateString = getDateString();
  const todayIds = existingIds.filter(id => id.includes(dateString));
  
  if (todayIds.length === 0) {
    return '001';
  }
  
  const numbers = todayIds.map(id => {
    const parts = id.split('-');
    return parseInt(parts[2], 10);
  });
  
  const maxNumber = Math.max(...numbers);
  return String(maxNumber + 1).padStart(3, '0');
};

/**
 * Generate Patient ID: PAT-YYYYMMDD-XXX
 */
export const generatePatientId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `PAT-${dateString}-${nextNumber}`;
};

/**
 * Generate Order ID: ORD-YYYYMMDD-XXX
 */
export const generateOrderId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `ORD-${dateString}-${nextNumber}`;
};

/**
 * Generate Sample ID: SAM-YYYYMMDD-XXX
 * Generic function for generating sequential sample IDs
 */
export const generateSequentialSampleId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `SAM-${dateString}-${nextNumber}`;
};

/**
 * Generate Invoice ID: INV-YYYYMMDD-XXX
 */
export const generateInvoiceId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `INV-${dateString}-${nextNumber}`;
};

/**
 * Generate Payment ID: PAY-YYYYMMDD-XXX
 */
export const generatePaymentId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `PAY-${dateString}-${nextNumber}`;
};

/**
 * Generate Appointment ID: APT-YYYYMMDD-XXX
 */
export const generateAppointmentId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `APT-${dateString}-${nextNumber}`;
};

/**
 * Generate Report ID: REP-YYYYMMDD-XXX
 */
export const generateReportId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `REP-${dateString}-${nextNumber}`;
};

/**
 * Generate Claim ID: CLM-YYYYMMDD-XXX
 */
export const generateClaimId = (existingIds: string[] = []): string => {
  const dateString = getDateString();
  const nextNumber = getNextNumber(existingIds);
  return `CLM-${dateString}-${nextNumber}`;
};

/**
 * Generate Barcode for samples (12-digit number)
 */
export const generateBarcode = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return (timestamp + random).slice(-12);
};
