/**
 * PaymentList — server-paginated orders joined with cached payments.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientListFilter } from '@/hooks/useClientListFilter';
import { ListView } from '@/components';
import { PaymentFilters } from '../components/PaymentFilters';
import { createPaymentTableConfig } from '../config/PaymentTable.config';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { usePaginatedOrders } from '@/features/orders';
import { usePaymentsForOrderIds } from '../api/payments';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { errorAlertMessage } from '@/utils/feedback';
import type { Order, Payment, PaymentStatus, PaymentMethod } from '@/types';
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
  const [methodFilters, setMethodFilters] = useState<PaymentMethod[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [statusFilters, setStatusFilters] = useState<PaymentStatus[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderPaymentView | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const serverFilters = useMemo(
    () => ({
      paymentStatus: statusFilters.length === 1 ? statusFilters[0] : undefined,
    }),
    [statusFilters]
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
  const isLoading = ordersLoading || isFetching || paymentsLoading;

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
    searchFields: item => [item.order.orderId.toString(), item.order.patientName || ''],
  });

  const handleStatusFiltersChange = useCallback(
    (filters: PaymentStatus[]) => {
      setStatusFilters(filters);
      resetPage();
    },
    [resetPage]
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
        const orderDate = new Date(item.order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
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
    () => createPaymentTableConfig(navigate, handlePaymentSuccess),
    [navigate, handlePaymentSuccess]
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
            <PaymentFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              statusFilters={statusFilters}
              onStatusFiltersChange={handleStatusFiltersChange}
              methodFilters={methodFilters}
              onMethodFiltersChange={setMethodFilters}
            />
          }
          pagination={{
            mode: 'server',
            currentPage: page,
            pageSize: pagination.pageSize,
            totalItems: pagination.total,
            onPageChange: goToPage,
            pageSizeOptions: [DEFAULT_LIST_PAGE_SIZE],
          }}
          defaultSort={{ key: 'orderDate', direction: 'desc' }}
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
