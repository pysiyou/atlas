/**
 * OrderList Component - Migrated to use ListView
 *
 * Displays a list of test orders with filtering and search capabilities.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 * Now uses shared ListView component for consistent UX.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrdersList, usePatientNameLookup, useTestNameLookup } from '@/hooks/queries';
import { useFiltering } from '@/utils/filtering';
import { ListView } from '@/shared/components';
import { Button } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { OrderFilters } from '../../components/filters/OrderFilters';
import { createOrderTableConfig } from './OrderTableConfig';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

/**
 * OrderList Component
 *
 * Benefits of ListView migration:
 * - Reduced code by ~80 lines
 * - Consistent UX with other list views
 * - Built-in loading/error/empty states
 * - Easy to add grid view in future
 */
export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [searchParams] = useSearchParams();
  const patientIdFilter = searchParams.get('patientId');

  // Use new query hooks - data is cached and shared across components
  const { orders, isLoading, isError, error: queryError, refetch } = useOrdersList();
  const { getPatientName, isLoading: patientsLoading } = usePatientNameLookup();
  const { getTestName, isLoading: testsLoading } = useTestNameLookup();

  // Combined loading state
  const loading = isLoading || patientsLoading || testsLoading;

  // Format error for ErrorAlert component
  const error = isError
    ? {
        message: queryError instanceof Error ? queryError.message : 'Failed to load orders',
        operation: 'load' as const,
      }
    : null;

  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<PaymentStatus[]>([]);

  // Use shared filtering hook for search and order status filters
  const {
    filteredItems: preFilteredOrders,
    searchQuery,
    setSearchQuery,
    statusFilters,
    setStatusFilters,
  } = useFiltering<Order, OrderStatus>(orders, {
    searchFields: order => [
      order.orderId.toString(),
      order.patientId.toString(),
      getPatientName(order.patientId),
    ],
    statusField: 'overallStatus',
    defaultSort: { field: 'orderDate', direction: 'desc' },
  });

  // Apply date range, patient filter, and payment filters separately
  const filteredOrders = useMemo(() => {
    let filtered = preFilteredOrders;

    // Apply patientIdFilter
    if (patientIdFilter) {
      const numericPatientId =
        typeof patientIdFilter === 'string' ? parseInt(patientIdFilter, 10) : patientIdFilter;
      filtered = filtered.filter(order => order.patientId === numericPatientId);
    }

    // Apply date range
    if (dateRange) {
      const [start, end] = dateRange;
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      const startDate = new Date(start);
      startDate.setHours(0, 0, 0, 0);

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
    }

    // Apply payment status filter
    if (paymentFilters.length > 0) {
      filtered = filtered.filter(order => paymentFilters.includes(order.paymentStatus));
    }

    return filtered;
  }, [preFilteredOrders, patientIdFilter, dateRange, paymentFilters]);

  // Memoize table config to prevent recreation on every render
  const orderTableConfig = useMemo(
    () => createOrderTableConfig(navigate, getPatientName, getTestName),
    [navigate, getPatientName, getTestName]
  );

  const handleDismissError = () => {
    // Error will be cleared on next successful fetch
  };

  return (
    <ListView
      mode="table"
      items={filteredOrders}
      viewConfig={orderTableConfig}
      loading={loading}
      error={error}
      onRetry={refetch}
      onDismissError={handleDismissError}
      onRowClick={(order: Order) => navigate(`/orders/${order.orderId}`)}
      title="Orders"
      headerActions={
        <Button
          variant="add"
          onClick={() => {
            openModal(ModalType.NEW_ORDER, {});
          }}
        >
          New Order
        </Button>
      }
      filters={
        <OrderFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          statusFilters={statusFilters}
          onStatusFiltersChange={setStatusFilters}
          paymentFilters={paymentFilters}
          onPaymentFiltersChange={setPaymentFilters}
        />
      }
      pagination={true}
      pageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
};
