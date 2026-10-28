/**
 * Union of catalog-defined rejection criteria for one or more tests.
 */
import { resolveRejectionReasonLabel } from '@/types/generated/rejectionReasonRegistry';

function criterionLabel(item: string | { reason?: string; label?: string; reasonId?: string }): string {
  if (typeof item === 'string') return resolveRejectionReasonLabel(item);
  if (item.reasonId) return resolveRejectionReasonLabel(item.reasonId);
  return resolveRejectionReasonLabel(item.reason ?? item.label ?? '');
}

/** Format rejection criteria for display tables. */
export function formatRejectionCriteriaList(
  items?: Array<string | { reason?: string; label?: string; domain?: string; reasonId?: string }>
): string[] {
  if (!items?.length) return [];
  return items.map(item => criterionLabel(item));
}
