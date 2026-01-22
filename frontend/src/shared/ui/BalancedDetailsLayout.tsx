/**
 * BalancedDetailsLayout Component
 * 
 * Automatically arranges multiple DetailsTable components across columns
 * using the LPT (Longest Processing Time) algorithm to minimize empty space.
 * 
 * Tables are distributed so columns have roughly equal heights.
 */

import React from 'react';
import { DetailsTable } from './DetailsTable';
import type { DetailRow } from './DetailsTable';
import { filterDetailRows } from './detailsTableUtils';

/**
 * Input specification for a single table
 */
export interface TableInput {
  /** Unique key for React reconciliation */
  key: string;
  /** Table title */
  title: string;
  /** Rows to display */
  rows: DetailRow[];
}

/**
 * Props for BalancedDetailsLayout component
 */
export interface BalancedDetailsLayoutProps {
  /** Array of table specifications */
  tables: TableInput[];
  /** Number of columns (default: 2) */
  columns?: number;
  /** Tie-break bias when columns have equal height (default: 'left') */
  tieBreakBias?: 'left' | 'right';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Internal table specification with computed properties
 */
interface TableSpec {
  key: string;
  title: string;
  rows: DetailRow[];
  filteredRows: DetailRow[];
  effectiveHeight: number;
  originalIndex: number;
}

/**
 * Column bin for LPT algorithm
 */
interface ColumnBin {
  items: TableSpec[];
  height: number;
}

/**
 * Preprocess tables into specs with filtered rows and heights
 */
const preprocessTables = (tables: TableInput[]): TableSpec[] => {
  return tables.map((t, i) => {
    const filteredRows = filterDetailRows(t.rows);
    return {
      key: t.key,
      title: t.title,
      rows: t.rows,
      filteredRows,
      effectiveHeight: Math.max(filteredRows.length, 1),
      originalIndex: i,
    };
  });
};

/**
 * Pick the column index with minimum height (tie-break using bias)
 */
const pickColumnIndex = (
  cols: ColumnBin[],
  tieBreakBias: 'left' | 'right' = 'left'
): number => {
  // Find minimum height
  let minHeight = Infinity;
  for (const c of cols) minHeight = Math.min(minHeight, c.height);

  // Gather all indices with minimum height
  const candidates = cols
    .map((c, idx) => ({ idx, h: c.height }))
    .filter((x) => x.h === minHeight)
    .map((x) => x.idx);

  if (candidates.length === 1) return candidates[0];
  return tieBreakBias === 'right'
    ? candidates[candidates.length - 1]
    : candidates[0];
};

/**
 * Balance tables across columns using LPT algorithm
 */
const balanceTablesAcrossColumns = (
  tables: TableInput[],
  columns: number = 2,
  tieBreakBias: 'left' | 'right' = 'left'
): ColumnBin[] => {
  if (!Array.isArray(tables) || tables.length === 0) {
    return [];
  }

  const safeColumns = Math.max(1, Math.floor(columns));

  // Preprocess tables into specs
  const specs = preprocessTables(tables);

  // Largest-Processing-Time (greedy): sort by height descending
  const byHeightDesc = [...specs].sort(
    (a, b) => b.effectiveHeight - a.effectiveHeight
  );

  // Prepare column bins
  const cols: ColumnBin[] = Array.from({ length: safeColumns }, () => ({
    items: [],
    height: 0,
  }));

  // Assign each table to the currently shortest column
  for (const spec of byHeightDesc) {
    const idx = pickColumnIndex(cols, tieBreakBias);
    cols[idx].items.push(spec);
    cols[idx].height += spec.effectiveHeight;
  }

  // Preserve original order within each column for natural reading
  cols.forEach((col) =>
    col.items.sort((a, b) => a.originalIndex - b.originalIndex)
  );

  return cols;
};

/**
 * BalancedDetailsLayout Component
 * 
 * Distributes tables across columns to minimize empty space using LPT algorithm.
 * 
 * @example
 * ```tsx
 * <BalancedDetailsLayout
 *   tables={[
 *     { key: 'overview', title: 'Overview', rows: [...] },
 *     { key: 'sample', title: 'Sample Info', rows: [...] },
 *     { key: 'pricing', title: 'Pricing', rows: [...] },
 *   ]}
 *   columns={3}
 * />
 * ```
 */
export const BalancedDetailsLayout: React.FC<BalancedDetailsLayoutProps> = ({
  tables,
  columns = 2,
  tieBreakBias = 'left',
  className = '',
}) => {
  if (!Array.isArray(tables) || tables.length === 0) {
    return null;
  }

  const safeColumns = Math.max(1, Math.floor(columns));

  // Balance tables across columns using LPT algorithm
  const balancedColumns = balanceTablesAcrossColumns(
    tables,
    safeColumns,
    tieBreakBias
  );

  // Render as a responsive grid with dynamic column count
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
    >
      {balancedColumns.map((col, i) => (
        <div key={`col-${i}`} className="flex flex-col gap-4">
          {col.items.map((spec) => (
            <DetailsTable
              key={spec.key}
              title={spec.title}
              rows={spec.rows}
              filteredRows={spec.filteredRows}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default BalancedDetailsLayout;
