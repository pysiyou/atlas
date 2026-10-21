/**
 * CatalogList — test catalog with client-side filters and pagination.
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestCatalog } from '../api/tests';
import { ListView } from '@/components/surfaces';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components/data-table';
import { CatalogFilters } from '../components/CatalogFilters';
import { createCatalogTableConfig } from '../config/CatalogTable.config';
import {
  catalogListInitialFilters,
  filterCatalogTests,
} from '../utils/filterCatalogTests';
import { applyPageFilters, usePageFilters } from '@/hooks/usePageFilters';
import { toListLoadError } from '@/hooks/listPage';
import type { TestSummary } from '@/types';

export const CatalogList: React.FC = () => {
  const navigate = useNavigate();

  const { tests, isLoading, isError, error: queryError, refetch } = useTestCatalog();

  const { filters, setFilter } = usePageFilters({
    initialFilters: catalogListInitialFilters,
  });

  const filteredTests = useMemo(
    () => applyPageFilters(tests, filters, filterCatalogTests),
    [tests, filters],
  );

  const error = isError ? toListLoadError('catalog.list.loadFailed', queryError) : null;

  const catalogTableConfig = useMemo(() => createCatalogTableConfig(navigate), [navigate]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={filteredTests}
        viewConfig={catalogTableConfig}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        onDismissError={() => undefined}
        onRowClick={(test: TestSummary) => navigate(`/catalog/${test.code}`)}
        title="Test Catalog"
        filters={<CatalogFilters filters={filters} setFilter={setFilter} />}
        pagination={{
          mode: 'client',
          pageSize: 20,
          pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
        }}
      />
    </div>
  );
};
