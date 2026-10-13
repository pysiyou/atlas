/**
 * Layout helpers for order test detail field grids (no React components).
 */
import type { DetailFieldConfig } from '@/components/display/DetailFieldGroup';

export function detailFieldIsVisible(field: DetailFieldConfig): boolean {
  if (field.hidden) return false;
  const hasValue = field.value !== undefined && field.value !== null && field.value !== '';
  const hasTimestamp = field.timestamp !== undefined && field.timestamp !== '';
  const hasBadge = field.badge?.value !== undefined && field.badge?.value !== '';
  return hasValue || hasTimestamp || hasBadge;
}

/** Split fields into two columns with as equal a row count as possible (first column gets the extra when odd). */
export function splitDetailFieldsIntoTwoColumns(
  fields: DetailFieldConfig[]
): DetailFieldConfig[][] {
  const visible = fields.filter(detailFieldIsVisible);
  if (visible.length === 0) {
    return [[], []];
  }
  const mid = Math.ceil(visible.length / 2);
  return [visible.slice(0, mid), visible.slice(mid)];
}
