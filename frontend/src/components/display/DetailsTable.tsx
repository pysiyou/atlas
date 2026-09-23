/**
 * DetailsTable Component
 * Generic details table with consistent styling and automatic filtering of empty values
 */

import React from 'react';
import { EmptyState, Panel, PANEL_EMPTY_STATE } from '@/components';
import { TABLE_CELL } from '@/components/theme/recipes';
import { DETAIL_TABLE_LABEL, DETAIL_VALUE, DEFAULT_EMPTY_TITLE, DEFAULT_EMPTY_DESCRIPTION } from '@/utils/constants';
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
              <td className={`${TABLE_CELL.default} align-top w-2/5`}>
                <span className={`block ${DETAIL_TABLE_LABEL}`}>{row.label}</span>
              </td>
              <td className={`${TABLE_CELL.default} align-top w-3/5`}>
                <div className={`break-words ${DETAIL_VALUE}`}>{row.value}</div>
              </td>
            </tr>
          ))}
          {filteredRows.length === 0 && (
            <tr>
              <td colSpan={2} className="px-space-4 py-space-4">
                <EmptyState
                  {...PANEL_EMPTY_STATE}
                  title={DEFAULT_EMPTY_TITLE}
                  description={DEFAULT_EMPTY_DESCRIPTION}
                />
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Panel>
  );
};
