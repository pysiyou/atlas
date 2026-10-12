/**
 * Shared two-column detail field layout for order test modal panels.
 */

import { DetailFieldGroup, type DetailFieldConfig } from '@/components/display/DetailFieldGroup';

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

export function OrderTestDetailFieldGrid({
  columns,
  resolveUserDisplay,
}: {
  columns: DetailFieldConfig[][];
  resolveUserDisplay: (id: string) => string;
}) {
  const nonEmpty = columns.filter(col => col.length > 0);
  if (nonEmpty.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-layout-section gap-y-space-4 items-start w-full">
      {nonEmpty.map((fields, index) => (
        <DetailFieldGroup
          key={index}
          fields={fields}
          spacing="tight"
          resolveUserDisplay={resolveUserDisplay}
          className="min-w-0"
        />
      ))}
    </div>
  );
}
