/**
 * Filter placeholders and display order by context with terminology support.
 * Use these so search, date, status, etc. have consistent text and order per page.
 */

import { t, tLower } from './clientConfig';

/** Get placeholders for Orders page filters with terminology */
export function getOrderFilterPlaceholders() {
  return {
    search: `Search ${tLower('orders', 'orders')}...`,
    searchLong: `Search ${tLower('orders', 'orders')} by ID, ${tLower('patient', 'patient')} name, or details...`,
    dateRange: 'Filter by date range',
    orderStatus: `Select ${tLower('order', 'order')} status`,
    paymentStatus: 'Select payment status',
  };
}

/** Get placeholders for Patients page filters with terminology */
export function getPatientFilterPlaceholders() {
  return {
    search: `Search ${tLower('patients', 'patients')}...`,
    searchLong: `Search ${tLower('patients', 'patients')} by name, ID, phone, or email...`,
    ageRange: 'Filter by age range',
    sex: 'Select sex',
    affiliationStatus: 'Select affiliation status',
  };
}

/** Get placeholders for Payments page filters with terminology */
export function getPaymentFilterPlaceholders() {
  return {
    search: 'Search payments...',
    searchLong: `Search payments by transaction ID, ${tLower('patient', 'patient')} name, or reference...`,
    dateRange: 'Filter by date range',
    paymentStatus: 'Select payment status',
    paymentMethod: 'Select payment method',
  };
}

/** Get placeholders for Reports page filters with terminology */
export function getReportFilterPlaceholders() {
  return {
    search: `Search ${tLower('reports', 'reports')}...`,
    searchLong: `Search by ${tLower('test', 'test')} ID, ${tLower('order', 'order')} ID, ${tLower('patient', 'patient')} name, or ${tLower('test', 'test')} name...`,
    dateRange: 'Filter by date range',
  };
}

/** Get shared placeholders for dropdown/range filters with terminology */
export function getSharedFilterPlaceholders() {
  return {
    dateRange: 'Filter by date range',
    ageRange: 'Filter by age range',
    priceRange: 'Filter by price range',
    sampleType: `Select ${tLower('sample', 'sample')} type`,
    status: 'Select status',
    testCategory: `Select ${tLower('test', 'test')} category`,
    paymentMethod: 'Select payment method',
  };
}

// Legacy constant exports for backward compatibility - call functions
export const ORDER_FILTER_PLACEHOLDERS = getOrderFilterPlaceholders();
export const PATIENT_FILTER_PLACEHOLDERS = getPatientFilterPlaceholders();
export const PAYMENT_FILTER_PLACEHOLDERS = getPaymentFilterPlaceholders();
export const REPORT_FILTER_PLACEHOLDERS = getReportFilterPlaceholders();
export const SHARED_FILTER_PLACEHOLDERS = getSharedFilterPlaceholders();
