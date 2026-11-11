/**
 * Results table skeleton — real column headers, one body fill until values are ready.
 */

import { FieldsPlaceholder, FIELDS_PLACEHOLDER_TABLE_INSET } from '@/components/surfaces/FieldsPlaceholder';
import { DATA_GRID } from '@/theme/recipes';

export const LAB_RESULTS_TABLE_HEADERS = ['Parameter', 'Result', 'Reference interval'] as const;

export function LabResultsTableSkeleton() {
  return (
    <div className={DATA_GRID.scrollWrap} aria-busy="true">
      <table className={DATA_GRID.table}>
        <colgroup>
          {DATA_GRID.colGroup.table.map(col => (
            <col key={col} className={col} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {LAB_RESULTS_TABLE_HEADERS.map(label => (
              <th key={label} scope="col" className={DATA_GRID.headerCell}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={LAB_RESULTS_TABLE_HEADERS.length}
              className={`${DATA_GRID.bodyCell} p-0`}
            >
              <FieldsPlaceholder className={FIELDS_PLACEHOLDER_TABLE_INSET} />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
