/**
 * Default Panel body placeholders. Body copy is always FieldsPlaceholder.
 */

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/feedback';
import { DATA_GRID, RADIUS } from '@/theme/recipes';
import { FieldsPlaceholder, FIELDS_PLACEHOLDER_ROWS } from './FieldsPlaceholder';

export type PanelLoadingShape = 'fields' | 'list' | 'table' | 'block';

export interface PanelLoadingOptions {
  shape?: PanelLoadingShape;
  /** Max placeholder pairs. Omit to fill the body. */
  rows?: number;
  tableColumns?: number;
  tableRows?: number;
  /** When set, render a real `<thead>` and FieldsPlaceholder in the body. */
  tableHeaders?: string[];
  fieldLayout?: 'grid' | 'column';
  content?: ReactNode;
}

export function PanelLoadingBody({
  shape = 'fields',
  rows,
  tableHeaders,
  content,
}: PanelLoadingOptions) {
  if (content != null) return content;

  if (shape === 'table' && tableHeaders?.length) {
    const columnCount = tableHeaders.length;
    const useLabResultsColGroup = columnCount === 3;
    return (
      <div className={useLabResultsColGroup ? DATA_GRID.scrollWrap : undefined}>
        <table className={useLabResultsColGroup ? DATA_GRID.table : 'w-full table-fixed border-collapse'}>
          {useLabResultsColGroup ? (
            <colgroup>
              {DATA_GRID.colGroup.table.map(col => (
                <col key={col} className={col} />
              ))}
            </colgroup>
          ) : null}
          <thead>
            <tr>
              {tableHeaders.map(label => (
                <th
                  key={label}
                  scope="col"
                  className={useLabResultsColGroup ? DATA_GRID.headerCell : `text-left ${RADIUS.surface} pb-space-1-5`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td
                colSpan={columnCount}
                className={useLabResultsColGroup ? `${DATA_GRID.bodyCell} p-0` : 'p-0 align-top'}
              >
                <FieldsPlaceholder />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return <FieldsPlaceholder rows={shape === 'fields' ? (rows ?? FIELDS_PLACEHOLDER_ROWS) : rows} />;
}

export function PanelHeaderAsidePlaceholder({ width = 56 }: { width?: number }) {
  return <Skeleton height={14} width={width} aria-hidden />;
}
