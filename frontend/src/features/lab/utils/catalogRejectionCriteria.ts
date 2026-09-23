/**
 * Union of catalog-defined rejection criteria for one or more tests.
 */
function criterionLabel(item: string | { reason?: string; label?: string }): string {
  if (typeof item === 'string') return item;
  return item.reason ?? item.label ?? '';
}

/** Format rejection criteria for display tables. */
export function formatRejectionCriteriaList(
  items?: Array<string | { reason?: string; label?: string; domain?: string }>
): string[] {
  if (!items?.length) return [];
  return items.map(item => criterionLabel(item));
}
