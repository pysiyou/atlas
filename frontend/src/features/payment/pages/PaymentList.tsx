/**
 * PaymentList Component - Migrated to use ListView
 *
 * Displays a list of orders with payment information.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 * Now uses shared ListView component for consistent UX.
 *
 * Row clicks open a PaymentDetailModal with full order/payment info.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiltering } from '@/utils/filtering';
import { ListView } from '@/shared/components';
import { DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL } from '@/shared/ui/Table';
import { PaymentFilters } from '../components/PaymentFilters';
import { createPaymentTableConfig } from './PaymentTableConfig';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { useOrdersList, usePaymentsList } from '@/hooks/queries';
import { useInvalidatePayments } from '@/hooks/queries/usePayments';
import type { Order, Payment, PaymentStatus, PaymentMethod } from '@/types';
import type { OrderPaymentView } from '../types';

/** Cross-reference orders with payment data for list/table display. Uses Map for O(n+m) join. */
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

/**
 * PaymentList Component
 *
 * Benefits of ListView migration:
 * - Reduced code by ~60 lines
 * - Consistent UX with other list views
 * - Built-in loading/error/empty states
 *
 * Row click opens PaymentDetailModal for full payment processing.
 */
export const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const { invalidateAll } = useInvalidatePayments();
  const [methodFilters, setMethodFilters] = useState<PaymentMethod[]>([]);
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);

  // State for payment detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderPaymentView | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use shared query hooks - data is cached and shared across components
  const {
    orders,
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrorObj,
    refetch,
  } = useOrdersList();
  const { payments, isLoading: paymentsLoading } = usePaymentsList();

  // Combined loading state
  const isLoading = ordersLoading || paymentsLoading;

  // Format error for ErrorAlert component
  const error = ordersError
    ? {
        message: ordersErrorObj instanceof Error ? ordersErrorObj.message : 'Failed to load data',
        operation: 'load' as const,
      }
    : null;

  // Cross-reference orders with payment data using centralized helper
  const orderPaymentViews = useMemo(
    () => buildOrderPaymentViews(orders, payments),
    [orders, payments]
  );

  // Use shared filtering hook for search (status/sort handled manually below for nested access)
  const {
    filteredItems: searchFilteredOrders,
    searchQuery,
    setSearchQuery,
  } = useFiltering<OrderPaymentView>(orderPaymentViews, {
    searchFields: item => [item.order.orderId.toString(), item.order.patientName || ''],
  });

  // Status, method, and date range filters + sorting
  const [statusFilters, setStatusFilters] = useState<PaymentStatus[]>([]);

  const filteredOrders = useMemo(() => {
    let filtered = searchFilteredOrders;

    // Apply payment status filter
    if (statusFilters.length > 0) {
      filtered = filtered.filter(item =>
        (statusFilters as string[]).includes(item.order.paymentStatus)
      );
    }

    // Apply date range filter
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

    // Apply payment method filter
    if (methodFilters.length > 0) {
      filtered = filtered.filter(
        item => item.paymentMethod && (methodFilters as string[]).includes(item.paymentMethod)
      );
    }

    // Sort by order date descending
    filtered = [...filtered].sort((a, b) =>
      b.order.orderDate.localeCompare(a.order.orderDate)
    );

    return filtered;
  }, [searchFilteredOrders, statusFilters, dateRange, methodFilters]);

  /**
   * Handles successful payment - invalidates caches to refresh the data
   */
  const handleTablePaymentSuccess = useCallback(() => {
    invalidateAll();
    refetch();
  }, [invalidateAll, refetch]);

  // Memoize table config to prevent recreation on every render
  const paymentTableConfig = useMemo(
    () => createPaymentTableConfig(navigate, handleTablePaymentSuccess),
    [navigate, handleTablePaymentSuccess]
  );

  const handleDismissError = () => {
    // Error will be cleared on next successful fetch
  };

  /**
   * Opens the payment detail modal for a specific order
   */
  const handleRowClick = useCallback((item: OrderPaymentView) => {
    setSelectedOrder(item);
    setIsModalOpen(true);
  }, []);

  /**
   * Closes the payment detail modal
   */
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  }, []);

  /**
   * Handles successful payment from modal - invalidates caches and refetches data
   */
  const handlePaymentSuccess = useCallback(() => {
    invalidateAll();
    refetch();
  }, [invalidateAll, refetch]);

  return (
    <>
      <ListView
        mode="table"
        items={filteredOrders}
        viewConfig={paymentTableConfig}
        loading={isLoading}
        error={error}
        onRetry={refetch}
        onDismissError={handleDismissError}
        onRowClick={handleRowClick}
        title="Payments"
        filters={
          <PaymentFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            statusFilters={statusFilters}
            onStatusFiltersChange={setStatusFilters}
            methodFilters={methodFilters}
            onMethodFiltersChange={setMethodFilters}
          />
        }
        pagination={true}
        pageSize={20}
        pageSizeOptions={DEFAULT_PAGE_SIZE_OPTIONS_WITH_ALL}
      />

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        order={selectedOrder}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};
