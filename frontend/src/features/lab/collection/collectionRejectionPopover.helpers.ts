/**
 * Pure helpers for CollectionRejectionPopover.
 */

export function parseNumericSampleId(sampleId: string): number | undefined {
  return typeof sampleId === 'string' && /^\d+$/.test(sampleId)
    ? parseInt(sampleId, 10)
    : undefined;
}

export function isRejectionFormValid(rejectionReason: string, criteria: string[]): boolean {
  return Boolean(rejectionReason) && criteria.includes(rejectionReason);
}
