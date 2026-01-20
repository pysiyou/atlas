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
import { Card } from '@/shared/ui';
import { PaymentFilters } from './PaymentFilters';
import { getPaymentTableColumns } from './PaymentTableColumns';
import { useOrdersList, usePaymentMethodByOrder } from '@/hooks/queries';
import type { Order, PaymentStatus, PaymentMethod } from '@/types';
import { formatCurrency } from '@/utils';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

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

  // Calculate stats from cached orders data
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => o.orderDate.startsWith(today));
    const todayRevenue = todayOrders
      .filter(o => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + o.totalPrice, 0);
    
    const unpaidOrders = orders.filter(o => o.paymentStatus === 'unpaid').length;
    const paidOrders = orders.filter(o => o.paymentStatus === 'paid').length;
    
    return {
      todayRevenue,
      unpaidOrders,
      paidOrders,
    };
  }, [orders]);

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
    <div className="h-full flex flex-col p-4 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 shrink-0">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Today's Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.todayRevenue)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Unpaid Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unpaidOrders}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Paid Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.paidOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* List View */}
      <div className="flex-1 min-h-0">
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
          className="h-full"
        />
      </div>
    </div>
  );
};
