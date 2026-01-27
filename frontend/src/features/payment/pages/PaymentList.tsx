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
import { ListView } from '@/shared/components';
import { FilterBar, useFilteredData, type FilterValues } from '@/utils/filters';
import { paymentFilterConfig } from '../config/paymentFilterConfig';
import { createPaymentTableConfig } from './PaymentTableConfig';
import { PaymentDetailModal } from '../modals/PaymentDetailModal';
import { useOrdersList, usePaymentsList } from '@/hooks/queries';
import { createOrderPaymentDetailsList, type OrderPaymentDetails } from '../types/paymentTypes';
import { useInvalidatePayments } from '@/hooks/queries/usePayments';

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

  // Centralized filter state management
  const [filters, setFilters] = useState<FilterValues>({
    searchQuery: '',
    dateRange: null,
    paymentStatus: [],
    paymentMethod: [],
  });

  // State for payment detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderPaymentDetails | null>(null);
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
  const orderPaymentDetailsList = useMemo(
    () => createOrderPaymentDetailsList(orders, payments),
    [orders, payments]
  );

  // Apply filters using centralized hook
  const filteredOrders = useFilteredData<OrderPaymentDetails>({
    items: orderPaymentDetailsList,
    filterValues: filters,
    filterConfig: paymentFilterConfig,
    customSearchFields: item => [item.orderId.toString(), item.patientName || ''],
    customDateGetter: (item, field) => {
      if (field === 'dateRange' || field === 'orderDate') {
        return item.orderDate;
      }
      return null;
    },
  });

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
  const handleRowClick = useCallback((item: OrderPaymentDetails) => {
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
        filters={<FilterBar config={paymentFilterConfig} value={filters} onChange={setFilters} />}
        pagination={true}
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
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
