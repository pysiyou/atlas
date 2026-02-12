/**
 * ID Display Utilities
 * Functions for formatting numeric IDs with prefixes for display
 */

export const ID_PREFIXES = {
  patient: 'PAT',
  order: 'ORD',
  sample: 'SAM',
  orderTest: 'TST',
  aliquot: 'ALQ',
  invoice: 'INV',
  payment: 'PAY',
  claim: 'CLM',
  report: 'RPT',
  user: 'USR',
  audit: 'AUD',
  appointment: 'APT',
} as const;

export type EntityType = keyof typeof ID_PREFIXES;

/**
 * Format a numeric ID for display with prefix, zero-padded to 4 digits
 * @example formatDisplayId('patient', 42) => 'PAT0042'
 * @example formatDisplayId('order', 123) => 'ORD0123'
 * @example formatDisplayId('sample', 5) => 'SAM0005'
 */
export function formatDisplayId(entityType: EntityType, id: number | null | undefined): string {
  if (id === null || id === undefined) {
    return '-';
  }
  const n = Number(id);
  if (!Number.isInteger(n) || n < 0) {
    return '-';
  }
  const prefix = ID_PREFIXES[entityType];
  const paddedId = n.toString().padStart(4, '0');
  return `${prefix}${paddedId}`;
}

/**
 * Convenience functions for each entity type
 */
export const displayId = {
  patient: (id: number | null | undefined) => formatDisplayId('patient', id),
  order: (id: number | null | undefined) => formatDisplayId('order', id),
  sample: (id: number | null | undefined) => formatDisplayId('sample', id),
  orderTest: (id: number | null | undefined) => formatDisplayId('orderTest', id),
  aliquot: (id: number | null | undefined) => formatDisplayId('aliquot', id),
  invoice: (id: number | null | undefined) => formatDisplayId('invoice', id),
  payment: (id: number | null | undefined) => formatDisplayId('payment', id),
  claim: (id: number | null | undefined) => formatDisplayId('claim', id),
  report: (id: number | null | undefined) => formatDisplayId('report', id),
  user: (id: number | null | undefined) => formatDisplayId('user', id),
  audit: (id: number | null | undefined) => formatDisplayId('audit', id),
  appointment: (id: number | null | undefined) => formatDisplayId('appointment', id),
};

/**
 * Parse a display ID back to its numeric value
 * @example parseDisplayId('PAT0042') => { entityType: 'patient', id: 42 }
 * @example parseDisplayId('PAT42') => { entityType: 'patient', id: 42 } (also handles non-padded format)
 */
export function parseDisplayId(
  displayIdStr: string
): { entityType: EntityType; id: number } | null {
  if (!displayIdStr) return null;

  const upperStr = displayIdStr.toUpperCase();

  for (const [entityType, prefix] of Object.entries(ID_PREFIXES)) {
    if (upperStr.startsWith(prefix)) {
      const numStr = upperStr.slice(prefix.length);
      const id = parseInt(numStr, 10);
      if (!isNaN(id)) {
        return { entityType: entityType as EntityType, id };
      }
    }
  }

  return null;
}

/**
 * Extract numeric ID from a display ID string
 * @example extractNumericId('PAT0042') => 42
 * @example extractNumericId('PAT42') => 42 (also handles non-padded format)
 */
export function extractNumericId(displayIdStr: string): number | null {
  const parsed = parseDisplayId(displayIdStr);
  return parsed ? parsed.id : null;
}
