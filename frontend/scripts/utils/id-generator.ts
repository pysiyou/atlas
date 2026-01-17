/**
 * ID Generator Utilities
 * Generates consistent IDs in the format PREFIX-YYYYMMDD-XXX
 */

// Counters for sequential IDs within a date
const counters: Record<string, number> = {};

/**
 * Format date as YYYYMMDD
 */
export function formatDateForId(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Generate a sequential ID with format PREFIX-YYYYMMDD-XXX
 */
export function generateId(prefix: string, date: Date): string {
  const dateStr = formatDateForId(date);
  const key = `${prefix}-${dateStr}`;

  if (!counters[key]) {
    counters[key] = 0;
  }

  counters[key]++;
  const sequence = String(counters[key]).padStart(3, '0');

  return `${prefix}-${dateStr}-${sequence}`;
}

/**
 * Generate patient ID
 */
export function generatePatientId(date: Date): string {
  return generateId('PAT', date);
}

/**
 * Generate order ID
 */
export function generateOrderId(date: Date): string {
  return generateId('ORD', date);
}

/**
 * Generate sample ID
 */
export function generateSampleId(date: Date): string {
  return generateId('SAM', date);
}

/**
 * Generate aliquot ID
 */
export function generateAliquotId(date: Date): string {
  return generateId('ALQ', date);
}

/**
 * Generate report ID
 */
export function generateReportId(date: Date): string {
  return generateId('REP', date);
}

/**
 * Generate assurance number
 */
export function generateAssuranceNumber(date: Date): string {
  return generateId('ASS', date);
}

/**
 * Reset all counters (useful for testing)
 */
export function resetCounters(): void {
  Object.keys(counters).forEach(key => delete counters[key]);
}
