/**
 * OrderList Component - Migrated to use ListView with URL filter support
 *
 * Uses server-side pagination via usePaginatedOrders; client-side search/date/multi-filter on current page.
 * Supports URL-based entity filters (patientId, orderId) for cross-page navigation.
 */

import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { usePageFilters } from '@/hooks/usePageFilters';
import { ORDER_URL_FILTER_KEYS } from '../config/orderFilters.config';
import type { Order, OrderStatus, PaymentStatus } from '@/types';
import { UrlFilterBadges } from '@/components';

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const { openModal } = useModal();

  // URL-synced entity filters + local UI filters
  const {
    filters,
    urlFilters,
    setFilter,
    clearUrlFilters,
    setUrlFilter,
  } = usePageFilters({
    urlFilterKeys: ORDER_URL_FILTER_KEYS,
    initialFilters: {
      search: '',
      dateRange: null,
      status: [] as OrderStatus[],
      paymentStatus: [] as PaymentStatus[],
    },
  });

  const searchQuery = (filters.search as string) ?? '';
  const dateRange = (filters.dateRange as [Date, Date] | null) ?? null;
  const statusFilters = useMemo(() => (filters.status as OrderStatus[]) ?? [], [filters.status]);
  const paymentFilters = useMemo(() => (filters.paymentStatus as PaymentStatus[]) ?? [], [filters.paymentStatus]);
  const patientIdFilter = urlFilters.patientId;

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
      setFilter('status', filters);
      resetPage();
    },
    [setFilter, resetPage]
  );

  const handlePaymentFiltersChange = useCallback(
    (filters: PaymentStatus[]) => {
      setFilter('paymentStatus', filters);
      resetPage();
    },
    [setFilter, resetPage]
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
          <>
            {urlFilters && Object.keys(urlFilters).length > 0 && (
              <UrlFilterBadges
                urlFilters={urlFilters}
                onClear={clearUrlFilters}
                onClearSingle={(key) => {
                  const urlKey = ORDER_URL_FILTER_KEYS.find(k => k === key);
                  if (urlKey) setUrlFilter(urlKey, undefined);
                }}
              />
            )}
            <OrderFilters
              searchQuery={searchQuery}
              onSearchChange={(value) => setFilter('search', value)}
              dateRange={dateRange}
              onDateRangeChange={(value) => setFilter('dateRange', value)}
              statusFilters={statusFilters}
              onStatusFiltersChange={handleStatusFiltersChange}
              paymentFilters={paymentFilters}
              onPaymentFiltersChange={handlePaymentFiltersChange}
            />
          </>
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
