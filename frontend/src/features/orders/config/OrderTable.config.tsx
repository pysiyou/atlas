import type { NavigateFunction } from 'react-router-dom';
import type { TableViewConfig } from '@/components';
import { buildViews, type CardComponentProps } from '@/components/data-table';
import { createOrderSharedColumns, renderOrderId } from '@/features/orders';
import { getActiveTests } from '../utils/orderCalculator';
import type { Order } from '@/types';
import { OrderTableCard } from '../components/OrderTableCard';

const ORDER_VIEWS = {
  full: [
    'orderId',
    'patientName',
    'overallStatus',
    'priority',
    'tests',
    'orderDate',
    'totalPrice',
    'paymentStatus',
  ],
  medium: ['orderId', 'patientName', 'overallStatus', 'tests', 'totalPrice', 'orderDate'],
  compact: ['orderId', 'patientName', 'overallStatus', 'totalPrice'],
} as const;

const ORDER_VIEWS_WITHOUT_PATIENT = {
  full: ORDER_VIEWS.full.filter(key => key !== 'patientName'),
  medium: ORDER_VIEWS.medium.filter(key => key !== 'patientName'),
  compact: ORDER_VIEWS.compact.filter(key => key !== 'patientName'),
} as const;

export type OrderTableConfigOptions = {
  /** Omit patient column (e.g. orders shown on patient detail). */
  hidePatientName?: boolean;
};

export const createOrderTableConfig = (
  _navigate: NavigateFunction,
  getPatientNameFn: (patientId: number | string) => string,
  getTestNameFn: (testCode: string) => string,
  options: OrderTableConfigOptions = {}
): TableViewConfig<Order> => {
  const { hidePatientName = false } = options;
  const shared = createOrderSharedColumns<Order>(
    {
      getOrderId: order => order.orderId,
      getPatientId: order => order.patientId,
      getPatientName: order => getPatientNameFn(order.patientId),
      getTests: order => getActiveTests(order.tests ?? []),
      getTestCount: order => order.testCount ?? order.tests?.length,
      getTestCodes: order => order.testCodes,
      getTotalPrice: order => order.totalPrice,
      getPaymentStatus: order => order.paymentStatus,
      getOrderDate: order => order.orderDate,
      getPriority: order => order.priority,
      getOverallStatus: order => order.overallStatus,
    },
    {
      renderOrderId: order => renderOrderId(order.orderId),
    },
    { getTestName: getTestNameFn }
  );

  const views = hidePatientName ? ORDER_VIEWS_WITHOUT_PATIENT : ORDER_VIEWS;

  const CardComponent = hidePatientName
    ? function PatientContextOrderCard(props: CardComponentProps<Order>) {
        return <OrderTableCard {...props} hidePatientName />;
      }
    : OrderTableCard;

  return {
    ...buildViews(shared, views),
    CardComponent,
  };
};
