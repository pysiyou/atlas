/**
 * PaymentList — server-paginated orders joined with cached payments.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageFilters } from '@/hooks/usePageFilters';
import { ListView } from '@/components/surfaces';
import { UrlFilterChipBar } from '@/components/filters';
import { PaymentFilters } from '../components/PaymentFilters';
import { PAYMENT_URL_FILTER_KEYS } from '../config/paymentFilters.config';
import { createPaymentTableConfig } from '../config/PaymentTable.config';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { useTestNameLookup } from '@/features/catalog';
import { usePaginatedOrders } from '@/features/orders';
import { usePaymentsForOrderIds } from '../api/payments';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import {
  buildServerListPagination,
  toListLoadError,
  useFilterChangeWithPageReset,
} from '@/hooks/listPage';
import { inclusiveDateRangeBounds, toIsoDateParam } from '@/utils';
import type { Order, Payment, PaymentStatus } from '@/types';
import type { OrderPaymentView } from '../types';

function buildOrderPaymentViews(orders: Order[], payments: Payment[]): OrderPaymentView[] {
  const paymentByOrder = new Map(payments.map(p => [p.orderId, p]));
  return orders.map(order => {
    const payment = paymentByOrder.get(order.orderId);
    return {
      order,
      paymentMethod: payment?.paymentMethod,
      paymentDate: payment?.paidAt,
    };
  });
}

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
    orders,
    pagination,
    page,
    goToPage,
    resetPage,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch,
  } = usePaginatedOrders(serverFilters, 1, DEFAULT_LIST_PAGE_SIZE);

  const orderIds = useMemo(() => orders.map(order => order.orderId), [orders]);
  const { payments, isLoading: paymentsLoading } = usePaymentsForOrderIds(orderIds);
  const { getTestName, isLoading: testsCatalogLoading } = useTestNameLookup();
  const isLoading = ordersLoading || paymentsLoading || testsCatalogLoading;

  const { setFilterAndReset } = useFilterChangeWithPageReset(setFilter, resetPage);

  const error = ordersError ? toListLoadError('payments.list.loadFailed', ordersErrorObj) : null;

  const listPagination = useMemo(
    () =>
      buildServerListPagination({
        page,
        pagination,
        goToPage,
        pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
      }),
    [page, pagination, goToPage],
  );

  const orderPaymentViews = useMemo(
    () => buildOrderPaymentViews(orders, payments),
    [orders, payments]
  );

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
          loading={isLoading}
          error={error}
          onRetry={refetch}
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
