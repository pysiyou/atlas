/**
 * DetailsTable Component
 * Generic details table with consistent styling and automatic filtering of empty values
 */

import React from 'react';
import { EmptyState, Panel } from '@/components';
import { DETAIL_TABLE_LABEL, DETAIL_VALUE, DEFAULT_EMPTY_TITLE } from '@/utils/constants';
import { ICONS } from '@/config/icons';
import { filterDetailRows, type DetailTableRow } from './detailsTableUtils';

/** Re-export for consumers */
export type { DetailTableRow };

export interface DetailsTableProps {
  title: string;
  rows: DetailTableRow[];
  filteredRows?: DetailTableRow[];
  className?: string;
}

export const DetailsTable: React.FC<DetailsTableProps> = ({
  title,
  rows,
  filteredRows: providedFilteredRows,
  className = '',
}) => {
  const filteredRows = providedFilteredRows ?? filterDetailRows(rows);

  return (
    <Panel title={title} padding="none" className={className}>
      <table className="w-full">
        <tbody>
          {filteredRows.map((row, idx) => (
            <tr
              key={`${row.label}-${idx}`}
              className="border-b border-border-subtle last:border-b-0"
            >
              <td className="px-space-4 py-2.5 align-top w-2/5">
                <span className={`block ${DETAIL_TABLE_LABEL}`}>{row.label}</span>
              </td>
              <td className="px-space-4 py-2.5 align-top w-3/5">
                <div className={`break-words ${DETAIL_VALUE}`}>{row.value}</div>
              </td>
            </tr>
          ))}
          {filteredRows.length === 0 && (
            <tr>
              <td colSpan={2} className="px-space-4 py-space-4">
                <EmptyState
                  variant="compact"
                  icon={ICONS.dataFields.document}
                  title={DEFAULT_EMPTY_TITLE}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  );
};
