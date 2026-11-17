/**
 * CatalogList — test catalog with client-side filters and pagination.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderableTests } from '../api/orderableTests';
import { ListView } from '@/components/surfaces';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/components/data-table';
import { CatalogFilters } from '../components/CatalogFilters';
import { createCatalogTableConfig } from '../config/CatalogTable.config';
import {
  catalogListInitialFilters,
  filterOrderableTests,
} from '../utils/filterOrderableTests';
import { applyPageFilters, useClientListChrome, usePageFilters } from '@/hooks';
import type { OrderableTestSummary } from '@/types';
import { useModuleListTitles } from '@/hooks';

export function CatalogList() {
  const listTitles = useModuleListTitles();
  const navigate = useNavigate();

  const { tests, isLoading, isError, error: queryError, refetch } = useOrderableTests();

  const { filters, setFilter } = usePageFilters({
    initialFilters: catalogListInitialFilters,
  });

  const filteredTests = useMemo(
    () => applyPageFilters(tests, filters, filterOrderableTests),
    [tests, filters],
  );

  const { loading } = useClientListChrome({
    loadFailedKey: 'catalog.list.loadFailed',
    isLoading,
    isError,
    error: queryError,
    refetch,
  });

  const catalogTableConfig = useMemo(() => createCatalogTableConfig(navigate), [navigate]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={filteredTests}
        viewConfig={catalogTableConfig}
        loading={loading}
        onRowClick={(test: OrderableTestSummary) => navigate(`/catalog/${test.code}`)}
        title={listTitles.catalog}
        filters={<CatalogFilters filters={filters} setFilter={setFilter} />}
        pagination={{
          mode: 'client',
          pageSize: 20,
          pageSizeOptions: DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL,
        }}
      />
    </div>
  );
}
