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
import { PaymentFilters } from './PaymentFilters';
import { getPaymentTableColumns } from './PaymentTableColumns';
import { PaymentDetailModal } from './PaymentDetailModal';
import { useOrdersList, usePaymentsList } from '@/hooks/queries';
import { createOrderPaymentDetailsList, type OrderPaymentDetails } from './types';
import type { PaymentStatus, PaymentMethod } from '@/types';

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
  const [methodFilters, setMethodFilters] = useState<PaymentMethod[]>([]);

  // State for payment detail modal
  const [selectedOrder, setSelectedOrder] = useState<OrderPaymentDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use shared query hooks - data is cached and shared across components
  const { orders, isLoading: ordersLoading, isError: ordersError, error: ordersErrorObj, refetch } = useOrdersList();
  const { payments, isLoading: paymentsLoading } = usePaymentsList();

  // Combined loading state
  const isLoading = ordersLoading || paymentsLoading;

  // Format error for ErrorAlert component
  const error = ordersError ? {
    message: ordersErrorObj instanceof Error ? ordersErrorObj.message : 'Failed to load data',
    operation: 'load' as const,
  } : null;

  // Cross-reference orders with payment data using centralized helper
  const orderPaymentDetailsList = useMemo(() => 
    createOrderPaymentDetailsList(orders, payments),
    [orders, payments]
  );

  // Use shared filtering hook for search and status filters
  const {
    filteredItems: preFilteredOrders,
    searchQuery,
    setSearchQuery,
    statusFilters,
    setStatusFilters
  } = useFiltering<OrderPaymentDetails, PaymentStatus>(orderPaymentDetailsList, {
    searchFields: (item) => [
      item.orderId,
      item.patientName || '',
    ],
    statusField: 'paymentStatus',
    defaultSort: { field: 'orderDate', direction: 'desc' }
  });

  // Apply payment method filter
  const filteredOrders = useMemo(() => {
    if (methodFilters.length === 0) return preFilteredOrders;
    return preFilteredOrders.filter(item => 
      item.paymentMethod && methodFilters.includes(item.paymentMethod)
    );
  }, [preFilteredOrders, methodFilters]);

  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => getPaymentTableColumns(navigate),
    [navigate]
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
   * Handles successful payment - refetches data to update the list
   */
  const handlePaymentSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <>
      <ListView
        mode="table"
        items={filteredOrders}
        columns={columns}
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
            statusFilters={statusFilters}
            onStatusFiltersChange={setStatusFilters}
            methodFilters={methodFilters}
            onMethodFiltersChange={setMethodFilters}
          />
        }
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
