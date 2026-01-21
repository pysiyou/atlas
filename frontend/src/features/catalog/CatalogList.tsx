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
import { CatalogFilters } from './CatalogFilters';
import { getCatalogTableColumns } from './CatalogTableColumns';
import type { Test, TestCategory } from '@/types';

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
  const error = isError ? {
    message: queryError instanceof Error ? queryError.message : 'Failed to load test catalog',
    operation: 'load' as const,
  } : null;

  // Local filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilters, setCategoryFilters] = useState<TestCategory[]>([]);
  const [sampleTypeFilters, setSampleTypeFilters] = useState<string[]>([]);

  // Apply filters to tests
  const filteredTests = useMemo(() => {
    let filtered = tests;

    // Apply search filter (name, code, synonyms)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((test) => {
        // Search in name
        if (test.name.toLowerCase().includes(query)) return true;
        // Search in code
        if (test.code.toLowerCase().includes(query)) return true;
        // Search in synonyms
        if (test.synonyms?.some((syn) => syn.toLowerCase().includes(query))) return true;
        // Search in LOINC codes
        if (test.loincCodes?.some((loinc) => loinc.toLowerCase().includes(query))) return true;
        // Search in panels
        if (test.panels?.some((panel) => panel.toLowerCase().includes(query))) return true;
        return false;
      });
    }

    // Apply category filter
    if (categoryFilters.length > 0) {
      filtered = filtered.filter((test) => categoryFilters.includes(test.category));
    }

    // Apply sample type filter
    if (sampleTypeFilters.length > 0) {
      filtered = filtered.filter((test) => sampleTypeFilters.includes(test.sampleType));
    }

    // Sort by name by default
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [tests, searchQuery, categoryFilters, sampleTypeFilters]);

  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => getCatalogTableColumns(navigate),
    [navigate]
  );

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
      columns={columns}
      loading={isLoading}
      error={error}
      onRetry={refetch}
      onDismissError={handleDismissError}
      onRowClick={(test: Test) => navigate(`/catalog/${test.code}`)}
      title="Test Catalog"
      subtitle={`${filteredTests.length} tests available`}
      filters={
        <CatalogFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilters={categoryFilters}
          onCategoryFiltersChange={setCategoryFilters}
          sampleTypeFilters={sampleTypeFilters}
          onSampleTypeFiltersChange={setSampleTypeFilters}
        />
      }
      pagination={true}
      pageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
};
