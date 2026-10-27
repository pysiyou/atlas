/**
 * PaymentList — server-paginated orders with latestPayment embed (single request).
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageFilters } from '@/hooks';
import { ListView } from '@/components/surfaces';
import { UrlFilterChipBar } from '@/components/filters';
import { PaymentFilters } from '../components/PaymentFilters';
import { PAYMENT_URL_FILTER_KEYS } from '../config/paymentFilters.config';
import { createPaymentTableConfig } from '../config/PaymentTable.config';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { useTestNameLookup } from '@/features/catalog';
import { usePaginatedPaymentOrders } from '../api/payments';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { useServerListChrome } from '@/hooks';
import { inclusiveDateRangeBounds, toIsoDateParam } from '@/utils';
import type { PaymentStatus } from '@/types';
import type { OrderPaymentView } from '../types';

export const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<OrderPaymentView | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const {
    filters,
    urlFilters,
    setFilter,
    clearUrlFilters,
    setUrlFilter,
  } = usePageFilters({
    urlFilterKeys: PAYMENT_URL_FILTER_KEYS,
    initialFilters: {
      search: '',
      dateRange: null,
      statusFilters: [] as PaymentStatus[],
    },
  });

  const searchQuery = (filters.search as string) ?? '';
  const dateRange = (filters.dateRange as [Date, Date] | null) ?? null;
  const statusFilters = useMemo(
    () => (filters.statusFilters as PaymentStatus[]) ?? [],
    [filters.statusFilters]
  );

  const serverFilters = useMemo(() => {
    const bounds = inclusiveDateRangeBounds(dateRange);
    return {
      patientId: urlFilters.patientId ?? undefined,
      orderId: urlFilters.orderId ? Number(urlFilters.orderId) : undefined,
      paymentStatus: statusFilters.length > 0 ? statusFilters : undefined,
      search: searchQuery.trim() || undefined,
      dateFrom: bounds ? toIsoDateParam(bounds.start) : undefined,
      dateTo: bounds ? toIsoDateParam(bounds.end) : undefined,
    };
  }, [urlFilters.patientId, urlFilters.orderId, statusFilters, searchQuery, dateRange]);

  const {
    orderPaymentViews,
    pagination,
    page,
    goToPage,
    resetPage,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch,
  } = usePaginatedPaymentOrders(serverFilters, 1, DEFAULT_LIST_PAGE_SIZE);

  const { getTestName } = useTestNameLookup();

  const { loading, error, listPagination, setFilterAndReset, onRetry } = useServerListChrome({
    setFilter,
    resetPage,
    loadFailedKey: 'payments.list.loadFailed',
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch,
    page,
    pagination,
    goToPage,
    pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
  });

  const handlePaymentSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const paymentTableConfig = useMemo(
    () => createPaymentTableConfig(navigate, () => '—', getTestName, handlePaymentSuccess),
    [navigate, getTestName, handlePaymentSuccess]
  );

  const handleRowClick = useCallback((item: OrderPaymentView) => {
    setSelectedOrder(item);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  }, []);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col">
        <ListView
          items={orderPaymentViews}
          viewConfig={paymentTableConfig}
          loading={loading}
          error={error}
          onRetry={onRetry}
          onDismissError={() => undefined}
          onRowClick={handleRowClick}
          title="Payments"
          filters={
            <>
              <UrlFilterChipBar
                urlFilters={urlFilters}
                urlFilterKeys={PAYMENT_URL_FILTER_KEYS}
                onClear={clearUrlFilters}
                onClearSingle={key => setUrlFilter(key, undefined)}
              />
              <PaymentFilters
                searchQuery={searchQuery}
                onSearchChange={value => setFilterAndReset('search', value)}
                dateRange={dateRange}
                onDateRangeChange={value => setFilterAndReset('dateRange', value)}
                statusFilters={statusFilters}
                onStatusFiltersChange={values => setFilterAndReset('statusFilters', values)}
              />
            </>
          }
          pagination={listPagination}
          defaultSort={{ key: 'paidDate', direction: 'desc' }}
        />
      </div>

      <PaymentDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};
