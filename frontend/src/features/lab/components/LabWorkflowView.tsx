/**
 * LabWorkflowView - Shared layout for lab workflow pages
 *
 * Provides consistent structure for SampleCollectionView, ResultEntryView, and ResultValidationView:
 * - Header with title and optional filters
 * - Search bar
 * - Grid of cards with empty states
 */

import React, { type ReactNode } from 'react';
import { SearchBar, EmptyState } from '@/shared/ui';
import { useSearch } from '@/utils/filtering';
import { ICONS } from '@/utils';

type IconName = 'search' | 'sample-collection' | 'checklist' | 'shield-check';

interface LabWorkflowViewProps<T> {
  /** Optional title in header; omit when page title already reflects tab (e.g. lab tabs) */
  title?: string;
  /** All items (pre-filtered when using filterRow) */
  items: T[];
  /** Filter function for search; required in legacy mode, ignored when filterRow is provided */
  filterFn?: (item: T, query: string) => boolean;
  /** Render function for each item card (receives item, index, and full filtered list) */
  renderCard: (item: T, index: number, filteredItems: T[]) => ReactNode;
  /** Generate a unique key for each item */
  getItemKey: (item: T, index: number) => string;
  /** Icon to show when no items exist */
  emptyIcon: IconName;
  /** Title to show when no items exist */
  emptyTitle: string;
  /** Description to show when no items exist */
  emptyDescription: string;
  /** Optional filters to display in the header (legacy mode only) */
  filters?: ReactNode;
  /** Search placeholder text (legacy mode only) */
  searchPlaceholder?: string;
  /** Filter row (e.g. FilterBar). When provided, replaces header+search; parent filters items. */
  filterRow?: ReactNode;
  /** Content to render after filter row but before the grid (e.g. bulk action toolbar) */
  afterFilterRow?: ReactNode;
}

/**
 * LabWorkflowView provides the shared layout for all lab workflow pages
 *
 * Structure:
 * - Filter row mode: filterRow (FilterBar) then grid
 * - Legacy mode: Header (title + filters + SearchBar) then grid
 */
export function LabWorkflowView<T>({
  title,
  items,
  filterFn,
  renderCard,
  getItemKey,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  filters,
  searchPlaceholder = 'Search...',
  filterRow,
  afterFilterRow,
}: LabWorkflowViewProps<T>): React.ReactElement {
  const useFilterRow = filterRow != null;
  const searchFilterFn = filterFn ?? (() => true);
  const legacySearch = useSearch(items, searchFilterFn);

  const filteredItems = useFilterRow ? items : legacySearch.filteredItems;
  const searchQuery = legacySearch.searchQuery;
  const setSearchQuery = legacySearch.setSearchQuery;
  const hasItems = items.length > 0;
  const isEmpty = useFilterRow ? items.length === 0 : legacySearch.isEmpty;
  const showEmptyState = !hasItems || isEmpty;
  const showNoMatches = !useFilterRow && hasItems && legacySearch.isEmpty;

  return (
    <div className="h-full flex flex-col min-h-0">
      {useFilterRow ? (
        /* Filter row mode: FilterBar full width, same as ListView – no extra wrapper padding */
        <>
          <div className="shrink-0">{filterRow}</div>
          {afterFilterRow && <div className="shrink-0 px-6 pt-4">{afterFilterRow}</div>}
        </>
      ) : (
        /* Legacy mode: title + filters + SearchBar */
        <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            {title != null && title !== '' && (
              <h3 className="text-base font-medium text-text-primary">{title}</h3>
            )}
            {hasItems && filters && (
              <>
                {title != null && title !== '' && (
                  <div className="h-6 w-px bg-neutral-300 hidden md:block" />
                )}
                {filters}
              </>
            )}
          </div>

          {hasItems && (
            <div className="w-full md:w-72">
              <SearchBar
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                size="sm"
              />
            </div>
          )}
        </div>
      )}

      {/* Content: padded scrollable area like ListView table */}
      <div
        className={`flex-1 min-h-0 overflow-y-auto p-6 ${showEmptyState ? 'flex flex-col' : 'grid gap-4 content-start'}`}
      >
        {!showEmptyState &&
          filteredItems.map((item, idx) => (
            <React.Fragment key={getItemKey(item, idx)}>
              {renderCard(item, idx, filteredItems)}
            </React.Fragment>
          ))}

        {!hasItems && (
          <div className="flex-1">
            <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />
          </div>
        )}

        {showNoMatches && (
          <div className="flex-1">
            <EmptyState
              icon={ICONS.actions.search}
              title="No Matches Found"
              description={
                useFilterRow
                  ? 'Try adjusting your search or filters.'
                  : `No items found matching "${searchQuery}"`
              }
            />
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
