import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFiltering } from '@/utils/filtering';
import { Table, EmptyState, Card } from '@/shared/ui';
import { PaymentFilters } from './PaymentFilters';
import { getPaymentTableColumns } from './PaymentTableColumns';
import type { Order, Payment, PaymentStatus, PaymentMethod } from '@/types';
import { orderAPI } from '@/services/api/orders';
import { getPayments } from '@/services/api/payments';
import { formatCurrency } from '@/utils';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';

/** Extended order type with payment method from cross-referencing */
export interface OrderWithPaymentMethod extends Order {
  lastPaymentMethod?: PaymentMethod;
}

export const PaymentList: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [methodFilters, setMethodFilters] = useState<PaymentMethod[]>([]);

  // Fetch all orders and payments
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordersData, paymentsData] = await Promise.all([
          orderAPI.getAll(),
          getPayments(),
        ]);
        setOrders(ordersData);
        setPayments(paymentsData);
        setError(null);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Create a map of orderId -> most recent payment method
  const paymentMethodByOrder = useMemo(() => {
    const map = new Map<string, PaymentMethod>();
    // Sort payments by date descending to get most recent first
    const sortedPayments = [...payments].sort(
      (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
    );
    // Map each order to its most recent payment method
    for (const payment of sortedPayments) {
      if (!map.has(payment.orderId)) {
        map.set(payment.orderId, payment.paymentMethod);
      }
    }
    return map;
  }, [payments]);

  // Merge orders with payment method
  const ordersWithPaymentMethod: OrderWithPaymentMethod[] = useMemo(() => {
    return orders.map(order => ({
      ...order,
      lastPaymentMethod: paymentMethodByOrder.get(order.orderId),
    }));
  }, [orders, paymentMethodByOrder]);

  // Calculate stats
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

