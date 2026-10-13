/**
 * PaymentList — server-paginated orders joined with cached payments with URL filter support.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientListFilter } from '@/hooks/useClientListFilter';
import { usePageFilters } from '@/hooks/usePageFilters';
import { ListView, UrlFilterBadges } from '@/components';
import { PaymentFilters } from '../components/PaymentFilters';
import { createPaymentTableConfig } from '../config/PaymentTable.config';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { useTestNameLookup } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { usePaginatedOrders } from '@/features/orders';
import { usePaymentsForOrderIds } from '../api/payments';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { errorAlertMessage } from '@/utils/feedback';
import type { Order, Payment, PaymentStatus, PaymentMethod } from '@/types';
import type { OrderPaymentView } from '../types';

const PAYMENT_URL_FILTER_KEYS = ['orderId', 'patientId'] as const;

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

  // URL-synced entity filters + local UI filters
  const {
    filters,
    urlFilters,
    setFilter,
    clearUrlFilters,
    setUrlFilter,
  } = usePageFilters({
    urlFilterKeys: PAYMENT_URL_FILTER_KEYS,
    initialFilters: {
      methodFilters: [] as PaymentMethod[],
      dateRange: null,
      statusFilters: [] as PaymentStatus[],
    },
  });

  const methodFilters = useMemo(() => (filters.methodFilters as PaymentMethod[]) ?? [], [filters.methodFilters]);
  const dateRange = (filters.dateRange as [Date, Date] | null) ?? null;
  const statusFilters = useMemo(() => (filters.statusFilters as PaymentStatus[]) ?? [], [filters.statusFilters]);

  const serverFilters = useMemo(
    () => ({
      patientId: urlFilters.patientId ?? undefined,
      orderId: urlFilters.orderId ? Number(urlFilters.orderId) : undefined,
      paymentStatus: statusFilters.length === 1 ? statusFilters[0] : undefined,
    }),
    [urlFilters.patientId, urlFilters.orderId, statusFilters]
  );

  const {
    orders,
    pagination,
    page,
    goToPage,
    resetPage,
    isLoading: ordersLoading,
    isFetching,
    isError: ordersError,
    error: ordersErrorObj,
    refetch,
  } = usePaginatedOrders(serverFilters, 1, DEFAULT_LIST_PAGE_SIZE);

  const orderIds = useMemo(() => orders.map(order => order.orderId), [orders]);
  const { payments, isLoading: paymentsLoading } = usePaymentsForOrderIds(orderIds);
  const { getPatientName, isLoading: patientsLoading } = usePatientNameLookup();
  const { getTestName, isLoading: testsCatalogLoading } = useTestNameLookup();
  const isLoading =
    ordersLoading || isFetching || paymentsLoading || patientsLoading || testsCatalogLoading;

  const error = ordersError
    ? {
        message: errorAlertMessage('payments.list.loadFailed', ordersErrorObj),
        operation: 'load' as const,
      }
    : null;

  const orderPaymentViews = useMemo(
    () => buildOrderPaymentViews(orders, payments),
    [orders, payments]
  );

  const {
    filteredItems: searchFilteredOrders,
    searchQuery,
    setSearchQuery,
  } = useClientListFilter<OrderPaymentView>(orderPaymentViews, {
    searchFields: item => [
      item.order.orderId.toString(),
      item.order.patientId.toString(),
      getPatientName(item.order.patientId),
    ],
  });

  const handleStatusFiltersChange = useCallback(
    (filters: PaymentStatus[]) => {
      setFilter('statusFilters', filters);
      resetPage();
    },
    [setFilter, resetPage]
  );

  const filteredOrders = useMemo(() => {
    let filtered = searchFilteredOrders;

    if (statusFilters.length > 1) {
      filtered = filtered.filter(item =>
        statusFilters.includes(item.order.paymentStatus)
      );
    }

    if (dateRange) {
      const [start, end] = dateRange;
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter(item => {
        const dateValue = item.paymentDate ?? item.order.orderDate;
        const rowDate = new Date(dateValue);
        return rowDate >= startDate && rowDate <= endDate;
      });
    }

    if (methodFilters.length > 0) {
      filtered = filtered.filter(
        item =>
          item.paymentMethod &&
          (methodFilters as string[]).includes(item.paymentMethod as string)
      );
    }

    return filtered;
  }, [searchFilteredOrders, statusFilters, dateRange, methodFilters]);

  const handlePaymentSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  const paymentTableConfig = useMemo(
    () => createPaymentTableConfig(navigate, getPatientName, getTestName, handlePaymentSuccess),
    [navigate, getPatientName, getTestName, handlePaymentSuccess]
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
          items={filteredOrders}
          viewConfig={paymentTableConfig}
          loading={isLoading}
          error={error}
          onRetry={refetch}
          onDismissError={() => undefined}
          onRowClick={handleRowClick}
          title="Payments"
          filters={
            <>
              {urlFilters && Object.keys(urlFilters).length > 0 && (
                <UrlFilterBadges
                  urlFilters={urlFilters}
                  onClear={clearUrlFilters}
                  onClearSingle={(key) => {
                    const urlKey = PAYMENT_URL_FILTER_KEYS.find(k => k === key);
                    if (urlKey) setUrlFilter(urlKey, undefined);
                  }}
                />
              )}
              <PaymentFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                dateRange={dateRange}
                onDateRangeChange={(value) => setFilter('dateRange', value)}
                statusFilters={statusFilters}
                onStatusFiltersChange={handleStatusFiltersChange}
                methodFilters={methodFilters}
                onMethodFiltersChange={(value) => setFilter('methodFilters', value)}
              />
            </>
          }
          pagination={{
            mode: 'server',
            currentPage: page,
            pageSize: pagination.pageSize,
            totalItems: pagination.total,
            onPageChange: goToPage,
            pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
          }}
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
