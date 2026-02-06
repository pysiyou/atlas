/**
 * CatalogList Component
 *
 * Displays a list of available tests in the catalog with filtering and search capabilities.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 * Uses shared ListView component for consistent UX.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCatalog } from '@/hooks/queries';
import { ListView } from '@/shared/components';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/shared/ui/Table';
import { CatalogFilters } from '../components/CatalogFilters';
import { createCatalogTableConfig } from './CatalogTableConfig';
import { useCatalogFilters } from '../hooks/useCatalogFilters';
import type { Test } from '@/types';

/**
 * CatalogList Component
 *
 * Features:
 * - Search by test name, code, and synonyms
 * - Filter by category and sample type
 * - Sortable columns
 * - Pagination
 * - Click to view test details
 */
export const CatalogList: React.FC = () => {
  const navigate = useNavigate();

  // Use test catalog query hook - data is cached and shared across components
  const { tests, isLoading, isError, error: queryError, refetch } = useTestCatalog();

  // Format error for ErrorAlert component
  const error = isError
    ? {
        message: queryError instanceof Error ? queryError.message : 'Failed to load test catalog',
        operation: 'load' as const,
      }
    : null;

  // Use catalog filters hook
  const {
    filteredTests,
    searchQuery,
    setSearchQuery,
    categoryFilters,
    setCategoryFilters,
    sampleTypeFilters,
    setSampleTypeFilters,
    priceRange,
    setPriceRange,
  } = useCatalogFilters({ tests });

  // Memoize table config to prevent recreation on every render
  const catalogTableConfig = useMemo(() => createCatalogTableConfig(navigate), [navigate]);

  /**
   * Handle error dismissal
   */
  const handleDismissError = () => {
    // Error will be cleared on next successful fetch
  };

  return (
    <ListView
      mode="table"
      items={filteredTests}
      viewConfig={catalogTableConfig}
      loading={isLoading}
      error={error}
      onRetry={refetch}
      onDismissError={handleDismissError}
      onRowClick={(test: Test) => navigate(`/catalog/${test.code}`)}
      title="Test Catalog"
      filters={
        <CatalogFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilters={categoryFilters}
          onCategoryFiltersChange={setCategoryFilters}
          sampleTypeFilters={sampleTypeFilters}
          onSampleTypeFiltersChange={setSampleTypeFilters}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />
      }
      pagination={true}
      pageSize={20}
      pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL}
    />
  );
};
