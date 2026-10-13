/**
 * Shared two-column detail field layout for order test modal panels.
 */

import { DetailFieldGroup, type DetailFieldConfig } from '@/components/display/DetailFieldGroup';

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
