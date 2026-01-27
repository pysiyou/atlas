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
import { ListView } from '@/shared/components';
import { Button } from '@/shared/ui';
import { useModal, ModalType } from '@/shared/context/ModalContext';
import { FilterBar, useFilteredData, type FilterValues } from '@/utils/filters';
import { orderFilterConfig } from '../config/orderFilterConfig';
import { createOrderTableConfig } from './OrderTableConfig';
import type { Order } from '@/types';

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

  // Centralized filter state management
  const [filters, setFilters] = useState<FilterValues>({
    searchQuery: '',
    dateRange: null,
    overallStatus: [],
    paymentStatus: [],
  });

  // Apply filters using centralized hook
  const preFilteredOrders = useFilteredData<Order>({
    items: orders,
    filterValues: filters,
    filterConfig: orderFilterConfig,
    customSearchFields: order => [
      order.orderId.toString(),
      order.patientId.toString(),
      getPatientName(order.patientId),
    ],
    customDateGetter: (order, field) => {
      if (field === 'dateRange' || field === 'orderDate') {
        return order.orderDate;
      }
      return null;
    },
  });

  // Apply patientIdFilter from URL params (separate from filter system)
  const filteredOrders = useMemo(() => {
    if (patientIdFilter) {
      const numericPatientId =
        typeof patientIdFilter === 'string' ? parseInt(patientIdFilter, 10) : patientIdFilter;
      return preFilteredOrders.filter(order => order.patientId === numericPatientId);
    }
    return preFilteredOrders;
  }, [preFilteredOrders, patientIdFilter]);

  // Memoize table config to prevent recreation on every render
  const orderTableConfig = useMemo(
    () => createOrderTableConfig(navigate, getPatientName, getTestName, openModal),
    [navigate, getPatientName, getTestName, openModal]
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
      filters={<FilterBar config={orderFilterConfig} value={filters} onChange={setFilters} />}
      pagination={true}
      pageSize={20}
      pageSizeOptions={[10, 20, 50, 100]}
    />
  );
};
