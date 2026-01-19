/**
 * Payment Table Columns - Shows all orders with payment status and method
 */
import type { NavigateFunction } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/utils';
import { Badge } from '@/shared/ui';
import { PaymentButton } from './PaymentButton';
import type { OrderWithPaymentMethod } from './PaymentList';

export const getPaymentTableColumns = (navigate: NavigateFunction) => [
  {
    key: 'orderId',
    header: 'Order ID',
    width: '14%',
    sortable: true,
    render: (order: OrderWithPaymentMethod) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/orders/${order.orderId}`);
        }}
        className="text-xs text-sky-600 font-medium font-mono hover:underline truncate block max-w-full"
      >
        {order.orderId}
      </button>
    ),
  },
  {
    key: 'patientName',
    header: 'Patient',
    width: '16%',
    sortable: true,
    render: (order: OrderWithPaymentMethod) => (
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate">{order.patientName || 'N/A'}</div>
        <div className="text-xxs text-gray-500 truncate">{order.patientId}</div>
      </div>
    ),
  },
  {
    key: 'tests',
    header: 'Tests',
    width: '16%',
    sortable: true,
    render: (order: OrderWithPaymentMethod) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{order.tests?.length || 0} test{order.tests?.length !== 1 ? 's' : ''}</div>
        <div className="text-xs text-gray-500 truncate">
          {order.tests?.slice(0, 2).map(t => t.testName || t.testCode).join(', ')}
          {(order.tests?.length || 0) > 2 && ` +${(order.tests?.length || 0) - 2} more`}
        </div>
      </div>
    ),
  },
  {
    key: 'totalPrice',
    header: 'Amount',
    width: '10%',
    sortable: true,
    render: (order: OrderWithPaymentMethod) => (
      <span className="font-medium text-sky-600 truncate block">
        {formatCurrency(order.totalPrice)}
      </span>
    ),
  },
  {
    key: 'paymentStatus',
    header: 'Status',
    width: '10%',
    sortable: true,
    render: (order: OrderWithPaymentMethod) => (
      <Badge variant={order.paymentStatus} size="sm" />
    ),
  },
  {
    key: 'lastPaymentMethod',
    header: 'Method',
    width: '12%',
    sortable: true,
    render: (order: OrderWithPaymentMethod) => {
      // If order has not been paid yet (unpaid status or no payment method), keep it empty
      if (!order.lastPaymentMethod || order.paymentStatus === 'unpaid') {
        return null;
      }
      // Display payment method as a badge
      return <Badge variant={order.lastPaymentMethod} size="sm" />;
    },
  },
  {
    key: 'orderDate',
    header: 'Date',
    width: '10%',
    sortable: true,
    render: (order: OrderWithPaymentMethod) => (
      <span className="text-xs text-gray-500 truncate block">{formatDate(order.orderDate)}</span>
    ),
  },
  {
    key: 'action',
    header: '',
    width: '12%',
    render: (order: OrderWithPaymentMethod) => (
      <div onClick={(e) => e.stopPropagation()}>
        <PaymentButton 
          order={order} 
          onPaymentSuccess={() => {
            // Refresh the page or update the order status
            window.location.reload();
          }}
        />
      </div>
    ),
  },
];
