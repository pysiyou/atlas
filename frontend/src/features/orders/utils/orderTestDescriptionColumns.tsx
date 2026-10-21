/**
 * Shared two-column description layout for order test modal panels.
 */

import { DescriptionList, type DescriptionListItemConfig } from '@/components/display/DescriptionList';

export function OrderTestDescriptionItemGrid({
  columns,
  resolveUserDisplay,
}: {
  columns: DescriptionListItemConfig[][];
  resolveUserDisplay: (id: string) => string;
}) {
  const nonEmpty = columns.filter(col => col.length > 0);
  if (nonEmpty.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-layout-section gap-y-space-4 items-start w-full">
      {nonEmpty.map((fields, index) => (
        <DescriptionList
          key={index}
          items={fields}
          spacing="tight"
          resolveUserDisplay={resolveUserDisplay}
          className="min-w-0"
        />
      ))}
    </div>
  );
}
