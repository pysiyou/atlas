/**
 * LabWorkflowView - Shared layout for lab workflow pages
 *
 * Structure: filterRow (e.g. LabFilters) then optional afterFilterRow then grid of cards.
 */

import React, { type ReactNode } from 'react';
import { EmptyState } from '@/components';

type IconName = 'search' | 'sample-collection' | 'checklist' | 'shield-check';

interface LabWorkflowViewProps<T> {
  /** All items (parent applies filterRow filters) */
  items: T[];
  /** Render function for each item card (receives item, index, and full list) */
  renderCard: (item: T, index: number, filteredItems: T[]) => ReactNode;
  /** Generate a unique key for each item */
  getItemKey: (item: T, index: number) => string;
  /** Icon to show when no items exist */
  emptyIcon: IconName;
  /** Title to show when no items exist */
  emptyTitle: string;
  /** Description to show when no items exist */
  emptyDescription: string;
  /** Filter row (e.g. LabFilters). Parent filters items before passing here. */
  filterRow: ReactNode;
  /** Content to render after filter row but before the grid (e.g. bulk action toolbar) */
  afterFilterRow?: ReactNode;
}

export function LabWorkflowView<T>({
  items,
  renderCard,
  getItemKey,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  filterRow,
  afterFilterRow,
}: LabWorkflowViewProps<T>): React.ReactElement {
  const hasItems = items.length > 0;
  const showEmptyState = items.length === 0;

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0">{filterRow}</div>
      {afterFilterRow && <div className="shrink-0 px-6 pt-4">{afterFilterRow}</div>}

      <div
        className={`flex-1 min-h-0 overflow-y-auto p-6 ${showEmptyState ? 'flex flex-col' : 'grid gap-4 content-start'}`}
      >
        {!showEmptyState &&
          items.map((item, idx) => (
            <React.Fragment key={getItemKey(item, idx)}>
              {renderCard(item, idx, items)}
            </React.Fragment>
          ))}

        {!hasItems && (
          <div className="flex-1">
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Helper to create a filter function for tests/samples
 * Searches across common fields: orderId, patientName, testName, sampleId
 * Note: This utility function is intentionally co-located with LabWorkflowView
 */
// eslint-disable-next-line react-refresh/only-export-components
export function createLabItemFilter<
  T extends {
    orderId?: string | number;
    patientName?: string;
    testName?: string;
    sampleId?: string | number;
  },
>(extraFields?: (item: T) => string[]): (item: T, query: string) => boolean {
  return (item: T, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const baseFields = [
      item.orderId?.toString(),
      item.patientName,
      item.testName,
      item.sampleId?.toString(),
    ].filter(Boolean) as string[];

    const extra = extraFields ? extraFields(item) : [];
    const allFields = [...baseFields, ...extra];

    return allFields.some(field => field.toLowerCase().includes(lowerQuery));
  };
}
