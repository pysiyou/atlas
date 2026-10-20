/**
 * LabWorkflowQueueLayout - Shared layout for lab workflow pages
 *
 * Structure: filterRow (e.g. LabQueueFilters) then a virtualized list of cards.
 */

import React, { type ReactNode, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EmptyState, PANEL_EMPTY_STATE } from '@/components/display';
import { displayId } from '@/utils';
import { SPACING, WORKSPACE } from '@/components/theme/recipes';

/** Estimated card height used until the virtualizer measures the real node. */
const ESTIMATED_QUEUE_CARD_HEIGHT_PX = 160;
const QUEUE_OVERSCAN = 8;

/** Filter row + scroll region shared by workflow queues. */
export function LabWorkflowQueueScaffold({
  filterRow,
  children,
  scrollClassName = WORKSPACE.contentInset,
  scrollRef,
}: {
  filterRow: ReactNode;
  children: ReactNode;
  scrollClassName?: string;
  scrollRef?: React.Ref<HTMLDivElement>;
}): React.ReactElement {
  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="shrink-0">{filterRow}</div>
      <div ref={scrollRef} className={`flex-1 min-h-0 overflow-y-auto ${scrollClassName}`}>
        {children}
      </div>
    </div>
  );
}

interface LabWorkflowQueueLayoutProps<T> {
  /** All items (parent applies filterRow filters) */
  items: T[];
  /** Render function for each item card (receives item, index, and full list) */
  renderCard: (item: T, index: number, filteredItems: T[]) => ReactNode;
  /** Generate a unique key for each item */
  getItemKey: (item: T, index: number) => string;
  /** Title to show when no items exist */
  emptyTitle: string;
  /** Description to show when no items exist */
  emptyDescription: string;
  /** Filter row (e.g. LabQueueFilters). Parent filters items before passing here. */
  filterRow: ReactNode;
}

export function LabWorkflowQueueLayout<T>({
  items,
  renderCard,
  getItemKey,
  emptyTitle,
  emptyDescription,
  filterRow,
}: LabWorkflowQueueLayoutProps<T>): React.ReactElement {
  const hasItems = items.length > 0;
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ESTIMATED_QUEUE_CARD_HEIGHT_PX,
    overscan: QUEUE_OVERSCAN,
    enabled: hasItems,
  });

  return (
    <LabWorkflowQueueScaffold
      filterRow={filterRow}
      scrollRef={parentRef}
      scrollClassName={
        hasItems
          ? `${WORKSPACE.contentInset}`
          : `${WORKSPACE.contentInset} flex flex-col`
      }
    >
      {hasItems ? (
        <div
          className={`relative w-full ${SPACING.gapSection}`}
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map(virtualRow => {
            const item = items[virtualRow.index];
            return (
              <div
                key={getItemKey(item, virtualRow.index)}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="absolute left-0 top-0 w-full"
                style={{ transform: `translateY(${virtualRow.start}px)` }}
              >
                {renderCard(item, virtualRow.index, items)}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1">
          <EmptyState {...PANEL_EMPTY_STATE} title={emptyTitle} description={emptyDescription} />
        </div>
      )}
    </LabWorkflowQueueScaffold>
  );
}

/**
 * Helper to create a filter function for tests/samples
 * Searches across common fields: orderId, patientName, testName, sampleId
 * Note: This utility function is intentionally co-located with LabWorkflowQueueLayout
 */
// eslint-disable-next-line react-refresh/only-export-components
export function createLabQueueSearchFilter<
  T extends {
    id?: string | number;
    orderId?: string | number;
    patientName?: string;
    testName?: string;
    testCode?: string;
    sampleId?: string | number;
  },
>(extraFields?: (item: T) => string[]): (item: T, query: string) => boolean {
  return (item: T, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const orderTestId =
      item.id != null && Number.isFinite(Number(item.id)) ? displayId.orderTest(Number(item.id)) : undefined;
    const baseFields = [
      orderTestId,
      item.orderId?.toString(),
      item.patientName,
      item.testName,
      item.testCode,
      item.sampleId?.toString(),
    ].filter(Boolean) as string[];

    const extra = extraFields ? extraFields(item) : [];
    const allFields = [...baseFields, ...extra];

    return allFields.some(field => field.toLowerCase().includes(lowerQuery));
  };
}
