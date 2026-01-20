/**
 * OrderList Component
 * 
 * Displays a list of test orders with filtering and search capabilities.
 * Uses TanStack Query hooks for efficient data fetching and caching.
 */

import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrdersList, usePatientNameLookup, useTestNameLookup, useInvalidateOrders } from '@/hooks/queries';
import { useFiltering } from '@/utils/filtering';
import { Table, Button, EmptyState } from '@/shared/ui';
import { Plus } from 'lucide-react';
import { OrderFilters } from './OrderFilters';
import { getOrderTableColumns } from './OrderTableColumns';
import { ErrorAlert } from '@/shared/components/ErrorAlert';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

/**
 * OrderList Component
 * 
 * Displays orders with filtering, search, and pagination.
 * Now uses shared query hooks for efficient caching and data sharing.
 */
export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientIdFilter = searchParams.get('patientId');

  // Use new query hooks - data is cached and shared across components
  const { orders, isLoading, isError, error: queryError, refetch } = useOrdersList();
  const { getPatientName, isLoading: patientsLoading } = usePatientNameLookup();
  const { getTestName, isLoading: testsLoading } = useTestNameLookup();
  const { invalidateAll: invalidateOrders } = useInvalidateOrders();

  // Combined loading state
  const loading = isLoading || patientsLoading || testsLoading;

  // Format error for ErrorAlert component
  const error = isError ? {
    message: queryError instanceof Error ? queryError.message : 'Failed to load orders',
    operation: 'load' as const,
  } : null;

  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<PaymentStatus[]>([]);
  
  // Use shared filtering hook for search and order status filters
  const { 
    filteredItems: preFilteredOrders, 
    searchQuery, 
    setSearchQuery, 
    statusFilters, 
    setStatusFilters 
  } = useFiltering<Order, OrderStatus>(orders, {
    searchFields: (order) => [
      order.orderId, 
      order.patientId,
      getPatientName(order.patientId)
    ],
    statusField: 'overallStatus',
    defaultSort: { field: 'orderDate', direction: 'desc' }
  });

  // Apply date range, patient filter, and payment filters separately
  const filteredOrders = useMemo(() => {
    let filtered = preFilteredOrders;
    
    // Apply patientIdFilter
    if (patientIdFilter) {
      filtered = filtered.filter(order => order.patientId === patientIdFilter);
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

  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => getOrderTableColumns(navigate, getPatientName, getTestName),
    [navigate, getPatientName, getTestName]
  );

  // Clear error by invalidating and refetching
  const clearError = () => {
    invalidateOrders();
  };

  // Show loading state
  if (loading && orders.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Test Orders</h1>
        </div>
        <Button
          onClick={() => navigate('/orders/new')}
          className="flex items-center gap-2 text-sm"
        >
          <Plus size={20} />
          Create New Order
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <ErrorAlert
          error={error}
          onDismiss={clearError}
          onRetry={refetch}
          className="shrink-0"
        />
      )}

      <div className="flex-1 flex flex-col bg-white rounded border border-gray-200 overflow-hidden min-h-0 text-xs">
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

        <div className="flex-1 min-h-0">
          <Table
            data={filteredOrders}
            columns={columns}
            emptyMessage={
              <EmptyState
                icon="checklist"
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
