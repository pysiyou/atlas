/**
 * PaymentList Component - Migrated to use ListView
 * 
 * Displays a list of orders with payment information.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 * Now uses shared ListView component for consistent UX.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiltering } from '@/utils/filtering';
import { ListView } from '@/shared/components';
import { PaymentFilters } from './PaymentFilters';
import { getPaymentTableColumns } from './PaymentTableColumns';
import { useOrdersList, usePaymentMethodByOrder } from '@/hooks/queries';
import type { Order, PaymentStatus, PaymentMethod } from '@/types';

/** Extended order type with payment method from cross-referencing */
export interface OrderWithPaymentMethod extends Order {
  lastPaymentMethod?: PaymentMethod;
}

/**
 * PaymentList Component
 * 
 * Benefits of ListView migration:
 * - Reduced code by ~60 lines
 * - Consistent UX with other list views
 * - Built-in loading/error/empty states
 */
export const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [methodFilters, setMethodFilters] = useState<PaymentMethod[]>([]);

  // Use shared query hooks - data is cached and shared across components
  const { orders, isLoading: ordersLoading, isError: ordersError, error: ordersErrorObj, refetch } = useOrdersList();
  const { paymentMethodMap, isLoading: paymentsLoading } = usePaymentMethodByOrder();

  // Combined loading state
  const isLoading = ordersLoading || paymentsLoading;

  // Format error for ErrorAlert component
  const error = ordersError ? {
    message: ordersErrorObj instanceof Error ? ordersErrorObj.message : 'Failed to load data',
    operation: 'load' as const,
  } : null;

  // Merge orders with payment method from cached payments data
  const ordersWithPaymentMethod: OrderWithPaymentMethod[] = useMemo(() => {
    return orders.map(order => ({
      ...order,
      lastPaymentMethod: paymentMethodMap.get(order.orderId),
    }));
  }, [orders, paymentMethodMap]);

  // Use shared filtering hook for search and status filters
  const {
    filteredItems: preFilteredOrders,
    searchQuery,
    setSearchQuery,
    statusFilters,
    setStatusFilters
  } = useFiltering<OrderWithPaymentMethod, PaymentStatus>(ordersWithPaymentMethod, {
    searchFields: (order) => [
      order.orderId,
      order.patientName || '',
    ],
    statusField: 'paymentStatus',
    defaultSort: { field: 'orderDate', direction: 'desc' }
  });

  // Apply payment method filter
  const filteredOrders = useMemo(() => {
    if (methodFilters.length === 0) return preFilteredOrders;
    return preFilteredOrders.filter(order => 
      order.lastPaymentMethod && methodFilters.includes(order.lastPaymentMethod)
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

  return (
    <ListView
      mode="table"
      items={filteredOrders}
      columns={columns}
      loading={isLoading}
      error={error}
      onRetry={refetch}
      onDismissError={handleDismissError}
      onRowClick={(order: OrderWithPaymentMethod) => navigate(`/orders/${order.orderId}`)}
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
  );
};
