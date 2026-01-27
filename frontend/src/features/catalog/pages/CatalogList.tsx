/**
 * CatalogList Component
 *
 * Displays a list of available tests in the catalog with filtering and search capabilities.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 * Uses shared ListView component for consistent UX.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCatalog } from '@/hooks/queries';
import { ListView } from '@/shared/components';
import { FilterBar, useFilteredData, type FilterValues } from '@/utils/filters';
import { catalogFilterConfig } from '../config/catalogFilterConfig';
import { createCatalogTableConfig } from './CatalogTableConfig';
import type { Test } from '@/types';
import { PRICE_RANGE } from '@/shared/constants';

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

  // Centralized filter state management
  const [filters, setFilters] = useState<FilterValues>({
    searchQuery: '',
    category: [],
    sampleType: [],
    priceRange: [PRICE_RANGE.MIN, PRICE_RANGE.MAX],
  });

  // Apply filters using centralized hook
  const filteredTests = useFilteredData<Test>({
    items: tests,
    filterValues: filters,
    filterConfig: catalogFilterConfig,
    customSearchFields: test => [
      test.name,
      test.code,
      ...(test.synonyms || []),
      ...(test.loincCodes || []),
      ...(test.panels || []),
    ],
  });

  // Sort by name by default
  const sortedTests = useMemo(
    () => [...filteredTests].sort((a, b) => a.name.localeCompare(b.name)),
    [filteredTests]
  );

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
      items={sortedTests}
      viewConfig={catalogTableConfig}
      loading={isLoading}
      error={error}
      onRetry={refetch}
      onDismissError={handleDismissError}
      onRowClick={(test: Test) => navigate(`/catalog/${test.code}`)}
      title="Test Catalog"
      filters={<FilterBar config={catalogFilterConfig} value={filters} onChange={setFilters} />}
      pagination={true}
      pageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
};
