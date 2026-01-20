/**
 * PaymentList Component
 * 
 * Displays a list of orders with payment information.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiltering } from '@/utils/filtering';
import { Table, EmptyState, Card } from '@/shared/ui';
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
 * Displays orders with their payment status and allows filtering.
 * Now uses shared query hooks instead of direct API calls, eliminating
 * redundant network requests when order data is already cached.
 */
export const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [methodFilters, setMethodFilters] = useState<PaymentMethod[]>([]);

  // Use shared query hooks - data is cached and shared across components
  const { orders, isLoading: ordersLoading, isError: ordersError, error: ordersErrorObj } = useOrdersList();
  const { paymentMethodMap, isLoading: paymentsLoading } = usePaymentMethodByOrder();

  // Combined loading state
  const isLoading = ordersLoading || paymentsLoading;

  // Format error message
  const error = ordersError 
    ? (ordersErrorObj instanceof Error ? ordersErrorObj.message : 'Failed to load data')
    : null;

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

  // Show loading state
  if (isLoading && orders.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
          <p className="mt-2 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 space-y-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments & Billing</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all orders and payments</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 shrink-0">
        <Card>
          <div className="flex items-start gap-3 p-4">
            <div className="p-3 bg-green-50 rounded">
              <TrendingUp className="text-green-600" size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-600">Today's Revenue</div>
              <div className="text-xl font-bold text-green-600">{formatCurrency(stats.todayRevenue)}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-start gap-3 p-4">
            <div className="p-3 bg-orange-50 rounded">
              <DollarSign className="text-orange-600" size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-600">Unpaid Orders</div>
              <div className="text-xl font-bold text-orange-600">{stats.unpaidOrders}</div>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="flex items-start gap-3 p-4">
            <div className="p-3 bg-sky-50 rounded">
              <CreditCard className="text-sky-600" size={24} />
            </div>
            <div>
              <div className="text-xs text-gray-600">Paid Orders</div>
              <div className="text-xl font-bold text-sky-600">{stats.paidOrders}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shrink-0">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 overflow-hidden min-h-0 text-xs">
        <PaymentFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilters={statusFilters}
          onStatusFiltersChange={setStatusFilters}
          methodFilters={methodFilters}
          onMethodFiltersChange={setMethodFilters}
        />

        <div className="flex-1 min-h-0">
          <Table
            data={filteredOrders}
            columns={columns}
            emptyMessage={
              <EmptyState
                icon="wallet"
                title="No Orders Found"
                description="Try adjusting your search or filters to find what you're looking for."
              />
            }
            pagination={true}
            initialPageSize={20}
            pageSizeOptions={[10, 20, 50, 100]}
            onRowClick={(order) => navigate(`/orders/${order.orderId}`)}
            embedded={true}
          />
        </div>
      </div>
    </div>
  );
};
