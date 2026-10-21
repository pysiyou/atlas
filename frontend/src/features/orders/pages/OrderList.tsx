/**
 * OrderList — server-paginated orders with URL entity filters.
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTestNameLookup } from '@/features/catalog';
import { usePaginatedOrders } from '../api/orders';
import { actionButtonPreset } from '@/components/primitives';
import { ListView } from '@/components/surfaces';
import { Button } from '@/components/primitives';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { OrderFilters } from '../components/OrderFilters';
import { createOrderTableConfig } from '../config/OrderTable.config';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { useServerListChrome } from '@/hooks';
import { inclusiveDateRangeBounds, toIsoDateParam } from '@/utils';
import { usePageFilters } from '@/hooks';
import { ORDER_URL_FILTER_KEYS } from '../config/orderFilters.config';
import type { Order, OrderStatus } from '@/types';
import { UrlFilterChipBar } from '@/components/filters';

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();

  const {
    filters,
    urlFilters,
    setFilter,
    clearUrlFilters,
    setUrlFilter,
  } = usePageFilters({
    urlFilterKeys: ORDER_URL_FILTER_KEYS,
    initialFilters: {
      search: '',
      dateRange: null,
      status: [] as OrderStatus[],
    },
  });

  const searchQuery = (filters.search as string) ?? '';
  const dateRange = (filters.dateRange as [Date, Date] | null) ?? null;
  const statusFilters = useMemo(() => (filters.status as OrderStatus[]) ?? [], [filters.status]);

  const serverFilters = useMemo(() => {
    const bounds = inclusiveDateRangeBounds(dateRange);
    return {
      patientId: urlFilters.patientId ?? undefined,
      orderId: urlFilters.orderId ? Number(urlFilters.orderId) : undefined,
      status: statusFilters.length > 0 ? statusFilters : undefined,
      search: searchQuery.trim() || undefined,
      dateFrom: bounds ? toIsoDateParam(bounds.start) : undefined,
      dateTo: bounds ? toIsoDateParam(bounds.end) : undefined,
    };
  }, [urlFilters.patientId, urlFilters.orderId, statusFilters, searchQuery, dateRange]);

  const {
    orders,
    pagination,
    isLoading,
    isError,
    error: queryError,
    refetch,
    page,
    goToPage,
    resetPage,
  } = usePaginatedOrders(serverFilters, 1, DEFAULT_LIST_PAGE_SIZE);

  const { loading, error, listPagination, setFilterAndReset, onRetry } = useServerListChrome({
    setFilter,
    resetPage,
    loadFailedKey: 'orders.list.loadFailed',
    isLoading,
    isError,
    error: queryError,
    refetch,
    page,
    pagination,
    goToPage,
    pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
  });

  const handleStatusFiltersChange = useCallback(
    (next: OrderStatus[]) => {
      setFilterAndReset('status', next);
    },
    [setFilterAndReset],
  );

  const { getTestName } = useTestNameLookup();

  const orderTableConfig = useMemo(
    () => createOrderTableConfig(navigate, () => '—', getTestName),
    [navigate, getTestName]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={orders}
        viewConfig={orderTableConfig}
        loading={loading}
        error={error}
        onRetry={onRetry}
        onDismissError={() => undefined}
        onRowClick={(order: Order) => navigate(`/orders/${order.orderId}`)}
        title="Orders"
        headerActions={
          <Button {...actionButtonPreset('add')} size="sm" onClick={() => openModal({ type: ModalType.NEW_ORDER })}>
            New Order
          </Button>
        }
        filters={
          <>
            <UrlFilterChipBar
              urlFilters={urlFilters}
              urlFilterKeys={ORDER_URL_FILTER_KEYS}
              onClear={clearUrlFilters}
              onClearSingle={key => setUrlFilter(key, undefined)}
            />
            <OrderFilters
              searchQuery={searchQuery}
              onSearchChange={value => setFilterAndReset('search', value)}
              dateRange={dateRange}
              onDateRangeChange={value => setFilterAndReset('dateRange', value)}
              statusFilters={statusFilters}
              onStatusFiltersChange={handleStatusFiltersChange}
            />
          </>
        }
        pagination={listPagination}
      />
    </div>
  );
};
