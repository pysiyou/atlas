/**
 * Payment Table Configuration
 */

import type { NavigateFunction } from 'react-router-dom';
import { getActiveTests } from '@/features/orders/utils';
import { Badge } from '@/components';
import type { TableViewConfig } from '@/components';
import {
  buildViews,
  createOrderSharedColumns,
  renderNavigableOrderId,
  renderOrderTotalPriceInline,
} from '@/components/data-table';
import { PaymentButton } from '../components/PaymentButton';
import { PaymentCard } from '../components/PaymentCard';
import type { OrderPaymentView } from '../types';

const PAYMENT_VIEWS = {
  full: ['orderId', 'patientName', 'tests', 'totalPrice', 'paymentStatus', 'paymentMethod', 'orderDate', 'action'],
  medium: ['orderId', 'patientName', 'tests', 'totalPrice', 'paymentStatus', 'action'],
  compact: ['orderId', 'patientName', 'totalPrice', 'paymentStatus', 'action'],
} as const;

export const createPaymentTableConfig = (
  navigate: NavigateFunction,
  onPaymentSuccess?: () => void
): TableViewConfig<OrderPaymentView> => {
  const shared = createOrderSharedColumns<OrderPaymentView>(
    {
      getOrderId: item => item.order.orderId,
      getPatientId: item => item.order.patientId,
      getPatientName: item => item.order.patientName ?? '',
      getTests: item => getActiveTests(item.order.tests ?? []),
      getTotalPrice: item => item.order.totalPrice,
      getPaymentStatus: item => item.order.paymentStatus,
      getOrderDate: item => item.order.orderDate,
      getTestsSortValue: item =>
        getActiveTests(item.order.tests ?? [])
          .map(t => t.testCode)
          .join('/'),
    },
    {
      renderOrderId: item => renderNavigableOrderId(item.order.orderId, navigate),
      renderTotalPrice: item => renderOrderTotalPriceInline(item.order.totalPrice),
    },
    { testsSortable: true }
  );

  const columnMap = {
    ...shared,
    paymentStatus: {
      ...shared.paymentStatus,
      header: 'Status',
    },
    paymentMethod: {
      key: 'paymentMethod',
      header: 'Method',
      width: 'md' as const,
      sortable: true,
      accessor: (item: OrderPaymentView) => item.paymentMethod ?? '',
      render: (item: OrderPaymentView) => {
        if (!item.paymentMethod || item.order.paymentStatus === 'unpaid') return null;
        return <Badge variant={item.paymentMethod} size="sm" />;
      },
    },
    action: {
      key: 'action',
      header: 'Action',
      width: 'md' as const,
      render: (item: OrderPaymentView) => (
        <div className="flex items-center font-normal" onClick={e => e.stopPropagation()}>
          <PaymentButton order={item.order} onPaymentSuccess={onPaymentSuccess} />
        </div>
      ),
    },
  };

  return {
    ...buildViews(columnMap, PAYMENT_VIEWS),
    CardComponent: PaymentCard,
  };
};
