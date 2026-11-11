/**
 * Table loading chrome: real header row (not fetched) + FieldsPlaceholder in the body.
 */

import { FieldsPlaceholder, FIELDS_PLACEHOLDER_TABLE_INSET } from '@/components/surfaces/FieldsPlaceholder';
import { TABLE_CELL, TABLE_SHELL, TABLE_TYPE } from '@/theme/recipes';

export function TableLoadingPlaceholder({
  headers,
}: {
  /** Static column titles. Omit only when the real table header is already rendered above. */
  headers?: readonly string[];
}) {
  const labels = headers ?? ['\u00a0', '\u00a0', '\u00a0', '\u00a0', '\u00a0'];
  const gridTemplateColumns = `repeat(${labels.length}, minmax(0, 1fr))`;

  return (
    <div className="flex min-h-0 flex-1 flex-col" role="table" aria-busy="true">
      <div className="shrink-0" role="rowgroup">
        <div
          className={TABLE_SHELL.headerRow}
          style={{ gridTemplateColumns }}
          role="row"
        >
          {labels.map((label, index) => (
            <div
              key={`${label}-${index}`}
              role="columnheader"
              className={`${TABLE_CELL.default} ${TABLE_SHELL.headerCell} ${TABLE_TYPE.columnTitle}`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden" role="rowgroup">
        <FieldsPlaceholder className={FIELDS_PLACEHOLDER_TABLE_INSET} />
      </div>
    </div>
  );
}
