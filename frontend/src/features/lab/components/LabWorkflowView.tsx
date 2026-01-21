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

type IconName = 'search' | 'sample-collection' | 'checklist' | 'shield-check';

interface LabWorkflowViewProps<T> {
  /** Page title displayed in the header */
  title: string;
  /** All items before filtering */
  items: T[];
  /** Filter function for search */
  filterFn: (item: T, query: string) => boolean;
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
  /** Optional filters to display in the header */
  filters?: ReactNode;
  /** Search placeholder text */
  searchPlaceholder?: string;
}

/**
 * LabWorkflowView provides the shared layout for all lab workflow pages
 * 
 * Structure:
 * - Header row: Title + Filters (left), Search (right)
 * - Content: Grid of cards or empty state
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
}: LabWorkflowViewProps<T>): React.ReactElement {
  const { filteredItems, searchQuery, setSearchQuery, isEmpty } = useSearch(items, filterFn);

  const hasItems = items.length > 0;
  const showEmptyState = !hasItems || isEmpty;
  const showSearchEmpty = hasItems && isEmpty;

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between shrink-0">
        <div className="flex items-center gap-4 flex-wrap">
          <h3 className="text-base font-medium text-gray-900">{title}</h3>
          {hasItems && filters && (
            <>
              <div className="h-6 w-px bg-gray-300 hidden md:block" />
              {filters}
            </>
          )}
        </div>

        {hasItems && (
          <div className="w-full md:w-72">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              size="sm"
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className={`flex-1 ${showEmptyState ? 'flex flex-col' : 'grid gap-4 content-start overflow-y-auto min-h-0'}`}>
        {!showEmptyState && filteredItems.map((item, idx) => (
          <React.Fragment key={getItemKey(item, idx)}>
            {renderCard(item, idx, filteredItems)}
          </React.Fragment>
        ))}

        {!hasItems && (
          <div className="flex-1">
            <EmptyState
              icon={emptyIcon}
              title={emptyTitle}
              description={emptyDescription}
            />
          </div>
        )}

        {showSearchEmpty && (
          <div className="flex-1">
            <EmptyState
              icon="search"
              title="No Matches Found"
              description={`No items found matching "${searchQuery}"`}
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
export function createLabItemFilter<T extends {
  orderId?: string;
  patientName?: string;
  testName?: string;
  sampleId?: string;
}>(extraFields?: (item: T) => string[]): (item: T, query: string) => boolean {
  return (item: T, query: string): boolean => {
    const lowerQuery = query.toLowerCase();
    const baseFields = [
      item.orderId,
      item.patientName,
      item.testName,
      item.sampleId,
    ].filter(Boolean) as string[];

    const extra = extraFields ? extraFields(item) : [];
    const allFields = [...baseFields, ...extra];

    return allFields.some(field => field.toLowerCase().includes(lowerQuery));
  };
}
