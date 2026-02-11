/**
 * DetailsTable Component
 * Generic details table with consistent styling and automatic filtering of empty values
 *
 * Displays key-value pairs in a clean two-column table format.
 * Automatically filters out placeholder/empty values unless pre-filtered rows are provided.
 */

import React from 'react';
import { EmptyState } from '@/shared/ui';
import { DETAIL_LABEL, DETAIL_VALUE, DEFAULT_EMPTY_TITLE } from '@/shared/constants';
import { ICONS } from '@/utils';
import { filterDetailRows, type DetailTableRow } from './detailsTableUtils';

/** Re-export for consumers */
export type { DetailTableRow };

/**
 * Props for DetailsTable component
 */
export interface DetailsTableProps {
  /** Table title displayed in header */
  title: string;
  /** Array of rows to display */
  rows: DetailTableRow[];
  /** Optional pre-filtered rows (if provided, automatic filtering is skipped) */
  filteredRows?: DetailTableRow[];
  /** Additional CSS classes for the wrapper */
  className?: string;
}

/**
 * DetailsTable Component
 * Displays key-value pairs in a clean table format with automatic filtering
 */
export const DetailsTable: React.FC<DetailsTableProps> = ({
  title,
  rows,
  filteredRows: providedFilteredRows,
  className = '',
}) => {
  const filteredRows = providedFilteredRows ?? filterDetailRows(rows);

  return (
    <div className={`bg-panel border border-stroke rounded-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-stroke bg-canvas">
        <h3 className="text-xs text-fg-muted uppercase tracking-wide">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-0">
        <table className="w-full">
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={`${row.label}-${idx}`} className="border-b border-stroke-subtle last:border-b-0">
                {/* Label */}
                <td className="px-4 py-2.5 align-top w-2/5 uppercase">
                  <span className={`block ${DETAIL_LABEL}`}>{row.label}</span>
                </td>
                {/* Value */}
                <td className="px-4 py-2.5 align-top w-3/5">
                  <div className={`break-words ${DETAIL_VALUE}`}>{row.value}</div>
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-4">
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
      </div>
    </div>
  );
};
