/**
 * DetailsTable Component
 * Generic details table with consistent styling and automatic filtering of empty values
 *
 * Displays key-value pairs in a clean two-column table format.
 * Automatically filters out placeholder/empty values unless pre-filtered rows are provided.
 */

import React from 'react';
import { filterDetailRows, type DetailRow } from './detailsTableUtils';

/** Re-export for consumers */
export type { DetailRow };

/**
 * Props for DetailsTable component
 */
export interface DetailsTableProps {
  /** Table title displayed in header */
  title: string;
  /** Array of rows to display */
  rows: DetailRow[];
  /** Optional pre-filtered rows (if provided, automatic filtering is skipped) */
  filteredRows?: DetailRow[];
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
    <div className={`bg-surface border border-border rounded-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-app-bg">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">{title}</h3>
      </div>

      {/* Content */}
      <div className="p-0">
        <table className="w-full">
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={`${row.label}-${idx}`} className="border-b border-border-subtle last:border-b-0">
                {/* Label */}
                <td className="px-4 py-2.5 align-top w-2/5 uppercase text-xs">
                  <span className="block text-xxs text-text-muted">{row.label}</span>
                </td>
                {/* Value */}
                <td className="px-4 py-2.5 align-top w-3/5 text-sm">
                  <div className="text-sm text-text-primary break-words">{row.value}</div>
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={2} className="px-4 py-6 text-center text-text-disabled text-sm">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
