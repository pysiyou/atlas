import type { NavigateFunction } from 'react-router-dom';
import type { TableViewConfig } from '@/components';
import { buildViews, type CardComponentProps } from '@/components/data-table';
import {
  createOrderSharedColumns,
  renderOrderId,
  renderOrderTestsBlock,
} from '@/features/orders';
import { getActiveTests } from '../utils/orderCalculator';
import type { Order } from '@/types';
import { OrderTableCard } from '../components/OrderTableCard';

/** Identity → clinical → status → billing (left to right). */
const ORDER_VIEWS = {
  full: [
    'orderId',
    'patientName',
    'orderDate',
    'tests',
    'priority',
    'overallStatus',
    'paymentStatus',
    'totalPrice',
  ],
  medium: ['orderId', 'patientName', 'orderDate', 'tests', 'overallStatus', 'totalPrice'],
  compact: ['orderId', 'patientName', 'orderDate', 'overallStatus', 'totalPrice'],
} as const;

const ORDER_VIEWS_WITHOUT_PATIENT = {
  full: ORDER_VIEWS.full.filter(key => key !== 'patientName'),
  medium: ORDER_VIEWS.medium.filter(key => key !== 'patientName'),
  compact: ORDER_VIEWS.compact.filter(key => key !== 'patientName'),
} as const;

const BADGE_HEADER = 'justify-center' as const;

const ORDER_LIST_WIDTH_OVERRIDES = {
  full: {
    orderId: 'id' as const,
    patientName: { min: 168, base: 176, grow: 0, shrink: 1 },
    orderDate: { min: 148, base: 168, grow: 0, shrink: 0 },
    tests: { min: 200, grow: 1, shrink: 1 },
    priority: 'sm' as const,
    overallStatus: 'md' as const,
    paymentStatus: 'sm' as const,
    totalPrice: 'md' as const,
  },
  medium: {
    orderId: 'id' as const,
    patientName: { min: 148, base: 160, grow: 0, shrink: 1 },
    orderDate: { min: 132, base: 152, grow: 0, shrink: 0 },
    tests: { min: 160, grow: 1, shrink: 1 },
    overallStatus: 'md' as const,
    totalPrice: 'md' as const,
  },
  compact: {
    orderId: 'id' as const,
    patientName: { min: 128, base: 140, grow: 0, shrink: 1 },
    orderDate: 'lg' as const,
    overallStatus: 'sm' as const,
    totalPrice: 'md' as const,
  },
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

  const columnMap = {
    ...shared,
    orderId: {
      ...shared.orderId,
      header: 'Order',
    },
    orderDate: {
      ...shared.orderDate,
      header: 'Ordered',
    },
    priority: {
      ...shared.priority,
      align: 'center' as const,
      headerClassName: BADGE_HEADER,
    },
    overallStatus: {
      ...shared.overallStatus,
      align: 'center' as const,
      headerClassName: BADGE_HEADER,
    },
    paymentStatus: {
      ...shared.paymentStatus,
      align: 'center' as const,
      headerClassName: BADGE_HEADER,
    },
    tests: {
      ...shared.tests,
      render: (order: Order) => {
        const tests = getActiveTests(order.tests ?? []);
        const count = order.testCount ?? order.tests?.length;
        const testCodes = order.testCodes;
        return renderOrderTestsBlock(tests, {
          fallbackCount: count != null && tests.length === 0 ? count : undefined,
          testCodes: tests.length === 0 ? testCodes : undefined,
          getTestName: getTestNameFn,
          layout: 'namesFirst',
        });
      },
    },
    totalPrice: {
      ...shared.totalPrice,
      header: 'Total',
      align: 'right' as const,
      headerClassName: 'justify-end',
    },
  };

  const views = hidePatientName ? ORDER_VIEWS_WITHOUT_PATIENT : ORDER_VIEWS;

  const CardComponent = hidePatientName
    ? function PatientContextOrderCard(props: CardComponentProps<Order>) {
        return <OrderTableCard {...props} hidePatientName />;
      }
    : OrderTableCard;

  return {
    ...buildViews(columnMap, views, ORDER_LIST_WIDTH_OVERRIDES),
    CardComponent,
  };
};
