/**
 * BalancedColumnsLayout — Distributes DetailsTable panels across balanced columns.
 * (was BalancedDetailsLayout)
 *
 * Uses the LPT (Longest Processing Time) algorithm to minimize empty space.
 */

import React from 'react';
import { DetailsTable, type DetailTableRow } from '@/components/display/DetailsTable';
import { filterDetailRows } from '@/components/display/detailsTableUtils';

export interface TableInput {
  key: string;
  title: string;
  rows: DetailTableRow[];
}

export interface BalancedColumnsLayoutProps {
  tables: TableInput[];
  columns?: number;
  tieBreakBias?: 'left' | 'right';
  className?: string;
}

interface TableSpec {
  key: string;
  title: string;
  rows: DetailTableRow[];
  filteredRows: DetailTableRow[];
  effectiveHeight: number;
  originalIndex: number;
}

interface ColumnBin {
  items: TableSpec[];
  height: number;
}

const preprocessTables = (tables: TableInput[]): TableSpec[] =>
  tables.map((t, i) => {
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

const pickColumnIndex = (cols: ColumnBin[], tieBreakBias: 'left' | 'right' = 'left'): number => {
  let minHeight = Infinity;
  for (const c of cols) minHeight = Math.min(minHeight, c.height);
  const candidates = cols
    .map((c, idx) => ({ idx, h: c.height }))
    .filter(x => x.h === minHeight)
    .map(x => x.idx);
  if (candidates.length === 1) return candidates[0];
  return tieBreakBias === 'right' ? candidates[candidates.length - 1] : candidates[0];
};

const balanceTablesAcrossColumns = (
  tables: TableInput[],
  columns = 2,
  tieBreakBias: 'left' | 'right' = 'left'
): ColumnBin[] => {
  if (!Array.isArray(tables) || tables.length === 0) return [];
  const safeColumns = Math.max(1, Math.floor(columns));
  const specs = preprocessTables(tables);
  const byHeightDesc = [...specs].sort((a, b) => b.effectiveHeight - a.effectiveHeight);
  const cols: ColumnBin[] = Array.from({ length: safeColumns }, () => ({ items: [], height: 0 }));
  for (const spec of byHeightDesc) {
    const idx = pickColumnIndex(cols, tieBreakBias);
    cols[idx].items.push(spec);
    cols[idx].height += spec.effectiveHeight;
  }
  cols.forEach(col => col.items.sort((a, b) => a.originalIndex - b.originalIndex));
  return cols;
};

export const BalancedColumnsLayout: React.FC<BalancedColumnsLayoutProps> = ({
  tables,
  columns = 2,
  tieBreakBias = 'left',
  className = '',
}) => {
  if (!Array.isArray(tables) || tables.length === 0) return null;
  const safeColumns = Math.max(1, Math.floor(columns));
  const balancedColumns = balanceTablesAcrossColumns(tables, safeColumns, tieBreakBias);
  return (
    <div
      className={`grid gap-4 ${className}`}
      style={{ gridTemplateColumns: `repeat(${safeColumns}, minmax(0, 1fr))` }}
    >
      {balancedColumns.map((col, i) => (
        <div key={`col-${i}`} className="flex flex-col gap-4">
          {col.items.map(spec => (
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

/** @deprecated Use BalancedColumnsLayout */
export const BalancedDetailsLayout = BalancedColumnsLayout;
/** @deprecated Use BalancedColumnsLayoutProps */
export type BalancedDetailsLayoutProps = BalancedColumnsLayoutProps;
