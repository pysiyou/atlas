/**
 * Filter placeholders and display order by context.
 * Use these so search, date, status, etc. have consistent text and order per page.
 */

/** Placeholders for Orders page filters (order: search, date range, order status, payment status) */
export const ORDER_FILTER_PLACEHOLDERS = {
  search: 'Search orders...',
  searchLong: 'Search orders by ID, patient name, or details...',
  dateRange: 'Filter by date range',
  orderStatus: 'Select order status',
  paymentStatus: 'Select payment status',
} as const;

/** Placeholders for Patients page filters (order: search, age range, sex, affiliation status) */
export const PATIENT_FILTER_PLACEHOLDERS = {
  search: 'Search patients...',
  searchLong: 'Search patients by name, ID, phone, or email...',
  ageRange: 'Filter by age range',
  sex: 'Select sex',
  affiliationStatus: 'Select affiliation status',
} as const;

/** Placeholders for Payments page filters (order: search, date range, payment status, payment method) */
export const PAYMENT_FILTER_PLACEHOLDERS = {
  search: 'Search payments...',
  searchLong: 'Search payments by transaction ID, patient name, or reference...',
  dateRange: 'Filter by date range',
  paymentStatus: 'Select payment status',
  paymentMethod: 'Select payment method',
} as const;

/** Placeholders for Reports page filters (order: search, date range) */
export const REPORT_FILTER_PLACEHOLDERS = {
  search: 'Search reports...',
  searchLong: 'Search by test ID, order ID, patient name, or test name...',
  dateRange: 'Filter by date range',
} as const;

/** Shared placeholders for dropdown/range filters (used in lab and catalog configs) */
export const SHARED_FILTER_PLACEHOLDERS = {
  dateRange: 'Filter by date range',
  ageRange: 'Filter by age range',
  priceRange: 'Filter by price range',
  sampleType: 'Select sample type',
  status: 'Select status',
  testCategory: 'Select test category',
  paymentMethod: 'Select payment method',
} as const;
