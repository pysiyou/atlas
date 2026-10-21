/**
 * DetailsTable Component
 * Generic details table with consistent styling and automatic filtering of empty values
 */

import React from 'react';
import { Panel, type PanelPresetId } from '@/components/surfaces';
import { EmptyState } from './EmptyState';
import { PANEL_EMPTY_STATE } from './emptyStatePresets';
import { DETAIL_TYPE, TABLE_CELL } from '@/theme/recipes';
import { DEFAULT_EMPTY_TITLE, DEFAULT_EMPTY_DESCRIPTION } from '@/utils/constants';
import { filterDetailRows, type DetailTableRow } from './detailsTableUtils';

/** Re-export for consumers */
export type { DetailTableRow };

export interface DetailsTableProps {
  preset: PanelPresetId;
  meta?: string;
  rows: DetailTableRow[];
  filteredRows?: DetailTableRow[];
}

export const DetailsTable: React.FC<DetailsTableProps> = ({
  preset,
  meta,
  rows,
  filteredRows: providedFilteredRows,
}) => {
  const filteredRows = providedFilteredRows ?? filterDetailRows(rows);

  return (
    <Panel preset={preset} meta={meta}>
      <table className="w-full">
        <tbody>
          {filteredRows.map((row, idx) => (
            <tr
              key={`${row.label}-${idx}`}
              className="border-b border-border-subtle last:border-b-0"
            >
              <td className={`${TABLE_CELL.default} align-top text-left w-2/5`}>
                <span className={`block ${DETAIL_TYPE.sectionTitleCompact}`}>{row.label}</span>
              </td>
              <td className={`${TABLE_CELL.default} align-top text-left w-3/5`}>
                <div className={`break-words ${DETAIL_TYPE.value}`}>{row.value}</div>
              </td>
            </tr>
          ))}
          {filteredRows.length === 0 && (
            <tr>
              <td colSpan={2} className={TABLE_CELL.default}>
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
