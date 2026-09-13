import type { NavigateFunction } from 'react-router-dom';
import type { TableViewConfig } from '@/components';
import { buildViews, createOrderSharedColumns, renderOrderId } from '@/components/data-table';
import { getActiveTests } from '@/features/orders/utils';
import type { Order } from '@/types';
import { OrderTableCard } from '../components/OrderTableCard';

const ORDER_VIEWS = {
  full: ['orderId', 'patientName', 'tests', 'priority', 'overallStatus', 'totalPrice', 'paymentStatus', 'orderDate'],
  medium: ['orderId', 'patientName', 'tests', 'overallStatus', 'totalPrice', 'paymentStatus'],
  compact: ['orderId', 'patientName', 'tests', 'overallStatus', 'totalPrice'],
} as const;

export const createOrderTableConfig = (
  _navigate: NavigateFunction,
  getPatientNameFn: (patientId: number | string) => string,
  _getTestNameFn: (testCode: string) => string
): TableViewConfig<Order> => {
  const shared = createOrderSharedColumns<Order>(
    {
      getOrderId: order => order.orderId,
      getPatientId: order => order.patientId,
      getPatientName: order => getPatientNameFn(order.patientId),
      getTests: order => getActiveTests(order.tests),
      getTotalPrice: order => order.totalPrice,
      getPaymentStatus: order => order.paymentStatus,
      getOrderDate: order => order.orderDate,
      getPriority: order => order.priority,
      getOverallStatus: order => order.overallStatus,
    },
    {
      renderOrderId: order => renderOrderId(order.orderId),
    }
  );

  return {
    ...buildViews(shared, ORDER_VIEWS),
    CardComponent: OrderTableCard,
  };
};
