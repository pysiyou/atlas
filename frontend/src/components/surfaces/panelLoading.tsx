/**
 * Default Panel body placeholders — sized to match common panel content shapes.
 */

import type { ReactNode } from 'react';
import { Skeleton, SkeletonInfoSection, SkeletonTableRow } from '@/components/feedback';
import { RADIUS } from '@/theme/recipes';

export type PanelLoadingShape = 'fields' | 'list' | 'table' | 'block';

export interface PanelLoadingOptions {
  shape?: PanelLoadingShape;
  /** Field rows (`fields`) or list rows (`list`). */
  rows?: number;
  tableColumns?: number;
  tableRows?: number;
  fieldLayout?: 'grid' | 'column';
  /** Custom body when shape-specific defaults are not enough. */
  content?: ReactNode;
}

const DEFAULT_FIELD_ROWS = 4;
const DEFAULT_LIST_ROWS = 5;
const DEFAULT_TABLE_COLUMNS = 5;
const DEFAULT_TABLE_ROWS = 4;

function PanelListRowPlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-between gap-space-3 p-panel border border-border-default ${RADIUS.surface} ${className}`.trim()}
      aria-hidden
    >
      <div className="flex-1 min-w-0 space-y-space-1">
        <Skeleton height={16} width="42%" />
        <Skeleton height={14} width="58%" />
      </div>
      <Skeleton height={22} width={72} className={RADIUS.field} />
    </div>
  );
}

export function PanelLoadingBody({
  shape = 'fields',
  rows,
  tableColumns = DEFAULT_TABLE_COLUMNS,
  tableRows = DEFAULT_TABLE_ROWS,
  fieldLayout = 'column',
  content,
}: PanelLoadingOptions) {
  if (content != null) return content;

  if (shape === 'list') {
    const count = rows ?? DEFAULT_LIST_ROWS;
    return (
      <div className="space-y-space-3">
        {Array.from({ length: count }).map((_, index) => (
          <PanelListRowPlaceholder key={index} />
        ))}
      </div>
    );
  }

  if (shape === 'table') {
    return (
      <div className="border-t border-border-default">
        {Array.from({ length: tableRows }).map((_, index) => (
          <SkeletonTableRow key={index} columns={tableColumns} />
        ))}
      </div>
    );
  }

  if (shape === 'block') {
    return <Skeleton height={120} className="w-full" />;
  }

  return <SkeletonInfoSection rows={rows ?? DEFAULT_FIELD_ROWS} layout={fieldLayout} />;
}

export function PanelHeaderAsidePlaceholder({ width = 56 }: { width?: number }) {
  return <Skeleton height={14} width={width} aria-hidden />;
}
