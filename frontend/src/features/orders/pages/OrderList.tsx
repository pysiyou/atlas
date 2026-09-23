/**
 * OrderList Component - Migrated to use ListView
 *
 * Uses server-side pagination via usePaginatedOrders; client-side search/date/multi-filter on current page.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTestNameLookup } from '@/features/catalog';
import { usePatientNameLookup } from '@/features/patients';
import { usePaginatedOrders } from '../api/orders';
import { actionButtonPreset, ListView } from '@/components';
import { Button } from '@/components';
import { useModal, ModalType } from '@/lib/context/ModalContext';
import { OrderFilters } from '../components/OrderFilters';
import { createOrderTableConfig } from '../config/OrderTable.config';
import { DEFAULT_LIST_PAGE_SIZE } from '@/lib/api/constants';
import { errorAlertMessage } from '@/utils/feedback';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();
  const [searchParams] = useSearchParams();
  const patientIdFilter = searchParams.get('patientId');

  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<PaymentStatus[]>([]);
  const [statusFilters, setStatusFilters] = useState<OrderStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const serverFilters = useMemo(
    () => ({
      patientId: patientIdFilter ?? undefined,
      status: statusFilters.length === 1 ? statusFilters[0] : undefined,
      paymentStatus: paymentFilters.length === 1 ? paymentFilters[0] : undefined,
    }),
    [patientIdFilter, statusFilters, paymentFilters]
  );

  const {
    orders,
    pagination,
    isLoading,
    isError,
    error: queryError,
    refetch,
    page,
    goToPage,
    resetPage,
    isFetching,
  } = usePaginatedOrders(serverFilters, 1, DEFAULT_LIST_PAGE_SIZE);

  const handleStatusFiltersChange = useCallback(
    (filters: OrderStatus[]) => {
      setStatusFilters(filters);
      resetPage();
    },
    [resetPage]
  );

  const handlePaymentFiltersChange = useCallback(
    (filters: PaymentStatus[]) => {
      setPaymentFilters(filters);
      resetPage();
    },
    [resetPage]
  );

  const { getPatientName, isLoading: patientsLoading } = usePatientNameLookup();
  const { getTestName, isLoading: testsLoading } = useTestNameLookup();

  const loading = isLoading || isFetching || patientsLoading || testsLoading;

  const error = isError
    ? {
        message: errorAlertMessage('orders.list.loadFailed', queryError),
        operation: 'load' as const,
      }
    : null;

  const filteredOrders = useMemo(() => {
    let filtered = orders;

    if (statusFilters.length > 1) {
      filtered = filtered.filter(order => statusFilters.includes(order.overallStatus));
    }

    if (paymentFilters.length > 1) {
      filtered = filtered.filter(order => paymentFilters.includes(order.paymentStatus));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const patientName = getPatientName(order.patientId).toLowerCase();
        return (
          order.orderId.toString().includes(query) ||
          order.patientId.toString().includes(query) ||
          patientName.includes(query)
        );
      });
    }

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

    return filtered;
  }, [orders, statusFilters, paymentFilters, searchQuery, dateRange, getPatientName]);

  const orderTableConfig = useMemo(
    () => createOrderTableConfig(navigate, getPatientName, getTestName),
    [navigate, getPatientName, getTestName]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ListView
        items={filteredOrders}
        viewConfig={orderTableConfig}
        loading={loading}
        error={error}
        onRetry={refetch}
        onDismissError={() => undefined}
        onRowClick={(order: Order) => navigate(`/orders/${order.orderId}`)}
        title="Orders"
        headerActions={
          <Button {...actionButtonPreset('add')} size="sm" onClick={() => openModal(ModalType.NEW_ORDER, {})}>
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
            onStatusFiltersChange={handleStatusFiltersChange}
            paymentFilters={paymentFilters}
            onPaymentFiltersChange={handlePaymentFiltersChange}
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
      />
    </div>
  );
};
