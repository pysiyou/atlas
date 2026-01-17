import React, { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrders } from '@/features/order/OrderContext';
import { usePatients } from '@/hooks';
import { useTests } from '@/features/test/useTests';
import { useFiltering } from '@/hooks/useFiltering';
import { Table, Button } from '@/shared/ui';
import { Plus } from 'lucide-react';
import { OrderFilters } from './OrderFilters';
import { getOrderTableColumns } from './OrderTableColumns';
import { getPatientName, getTestName } from '@/utils/typeHelpers';
import type { Order, OrderStatus, PaymentStatus } from '@/types';

export const OrderList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ordersContext = useOrders();
  const patientsContext = usePatients();
  const testsContext = useTests();
  const patientIdFilter = searchParams.get('patientId');

  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null);
  const [paymentFilters, setPaymentFilters] = useState<PaymentStatus[]>([]);

  const orders = ordersContext?.orders || [];
  
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
      getPatientName(order.patientId, patientsContext.patients)
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

  if (!ordersContext || !patientsContext || !testsContext) {
    return <div>Loading...</div>;
  }

  const getPatientNameFn = (patientId: string) =>
    getPatientName(patientId, patientsContext.patients);
  const getTestNameFn = (testCode: string) =>
    getTestName(testCode, testsContext.tests);

  // Memoize columns to prevent recreation on every render
  const columns = useMemo(
    () => getOrderTableColumns(navigate, getPatientNameFn, getTestNameFn),
    [navigate, getPatientNameFn, getTestNameFn]
  );

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
            emptyMessage="No orders found. Try adjusting your search or filters."
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
