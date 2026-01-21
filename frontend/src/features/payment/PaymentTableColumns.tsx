/**
 * Payment Table Columns - Shows all orders with payment status and method
 */
import type { NavigateFunction } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/utils';
import { Badge } from '@/shared/ui';
import { PaymentButton } from './PaymentButton';
import type { OrderPaymentDetails } from './types';

export const getPaymentTableColumns = (navigate: NavigateFunction) => [
  {
    key: 'orderId',
    header: 'Order ID',
    width: '14%',
    sortable: true,
    render: (item: OrderPaymentDetails) => (
      <button
        onClick={(e) => {
          e.stopPropagation();
          navigate(`/orders/${item.orderId}`);
        }}
        className="text-xs text-sky-600 font-medium font-mono hover:underline truncate block max-w-full"
      >
        {item.orderId}
      </button>
    ),
  },
  {
    key: 'patientName',
    header: 'Patient',
    width: '16%',
    sortable: true,
    render: (item: OrderPaymentDetails) => (
      <div className="min-w-0">
        <div className="font-semibold text-gray-900 truncate">{item.patientName || 'N/A'}</div>
        <div className="text-xxs text-gray-500 truncate">{item.patientId}</div>
      </div>
    ),
  },
  {
    key: 'tests',
    header: 'Tests',
    width: '16%',
    sortable: true,
    render: (item: OrderPaymentDetails) => (
      <div className="min-w-0">
        <div className="font-medium truncate">{item.tests?.length || 0} test{item.tests?.length !== 1 ? 's' : ''}</div>
        <div className="text-xs text-gray-500 truncate">
          {item.tests?.slice(0, 2).map(t => t.testName || t.testCode).join(', ')}
          {(item.tests?.length || 0) > 2 && ` +${(item.tests?.length || 0) - 2} more`}
        </div>
      </div>
    ),
  },
  {
    key: 'totalPrice',
    header: 'Amount',
    width: '10%',
    sortable: true,
    render: (item: OrderPaymentDetails) => (
      <span className="font-medium text-sky-600 truncate block">
        {formatCurrency(item.totalPrice)}
      </span>
    ),
  },
  {
    key: 'paymentStatus',
    header: 'Status',
    width: '10%',
    sortable: true,
    render: (item: OrderPaymentDetails) => (
      <Badge variant={item.paymentStatus} size="sm" />
    ),
  },
  {
    key: 'paymentMethod',
    header: 'Method',
    width: '12%',
    sortable: true,
    render: (item: OrderPaymentDetails) => {
      // If order has not been paid yet (unpaid status or no payment method), keep it empty
      if (!item.paymentMethod || item.paymentStatus === 'unpaid') {
        return null;
      }
      // Display payment method as a badge
      return <Badge variant={item.paymentMethod} size="sm" />;
    },
  },
  {
    key: 'orderDate',
    header: 'Date',
    width: '10%',
    sortable: true,
    render: (item: OrderPaymentDetails) => (
      <span className="text-xs text-gray-500 truncate block">{formatDate(item.orderDate)}</span>
    ),
  },
  {
    key: 'action',
    header: '',
    width: '12%',
    render: (item: OrderPaymentDetails) => (
      <div onClick={(e) => e.stopPropagation()}>
        <PaymentButton 
          order={item._order} 
          onPaymentSuccess={() => {
            // Refresh the page or update the order status
            window.location.reload();
          }}
        />
      </div>
    ),
  },
];
