import type { TableViewConfig } from '@/components';
import { buildViews, type CardComponentProps } from '@/components/data-table';
import {
  createOrderSharedColumns,
  getActiveTests,
  OrderTableCard,
  renderOrderId,
  renderOrderTestsBlock,
} from '@/features/orders';
import type { Order } from '@/types';

/** Column sets tuned for the patient detail “Related Orders” panel (patient name omitted). */
const PATIENT_RELATED_ORDER_VIEWS = {
  full: ['orderId', 'orderDate', 'tests', 'overallStatus', 'paymentStatus', 'totalPrice'],
  medium: ['orderId', 'orderDate', 'tests', 'overallStatus', 'totalPrice'],
  compact: ['orderId', 'orderDate', 'overallStatus', 'totalPrice'],
} as const;

const PATIENT_RELATED_WIDTH_OVERRIDES = {
  full: {
    orderId: 'id' as const,
    orderDate: { min: 148, base: 168, grow: 0, shrink: 0 },
    tests: { min: 200, grow: 2, shrink: 1 },
    overallStatus: 'md' as const,
    paymentStatus: 'sm' as const,
    totalPrice: 'md' as const,
  },
  medium: {
    orderId: 'id' as const,
    orderDate: { min: 132, base: 152, grow: 0, shrink: 0 },
    tests: { min: 160, grow: 2, shrink: 1 },
    overallStatus: 'md' as const,
    totalPrice: 'md' as const,
  },
  compact: {
    orderId: 'id' as const,
    orderDate: 'lg' as const,
    overallStatus: 'sm' as const,
    totalPrice: 'md' as const,
  },
} as const;

export function createPatientRelatedOrdersTableConfig(
  getTestName: (testCode: string) => string
): TableViewConfig<Order> {
  const shared = createOrderSharedColumns<Order>(
    {
      getOrderId: order => order.orderId,
      getPatientId: order => order.patientId,
      getPatientName: () => '',
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
    { getTestName }
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
    tests: {
      ...shared.tests,
      header: 'Tests',
      width: { min: 200, grow: 2, shrink: 1 },
      render: (order: Order) => {
        const tests = getActiveTests(order.tests ?? []);
        const count = order.testCount ?? order.tests?.length;
        const testCodes = order.testCodes;
        return renderOrderTestsBlock(tests, {
          fallbackCount: count != null && tests.length === 0 ? count : undefined,
          testCodes: tests.length === 0 ? testCodes : undefined,
          getTestName,
          layout: 'namesFirst',
        });
      },
    },
    totalPrice: {
      ...shared.totalPrice,
      header: 'Total',
      align: 'right' as const,
    },
  };

  function PatientRelatedOrderCard(props: CardComponentProps<Order>) {
    return <OrderTableCard {...props} hidePatientName />;
  }

  return {
    ...buildViews(columnMap, PATIENT_RELATED_ORDER_VIEWS, PATIENT_RELATED_WIDTH_OVERRIDES),
    CardComponent: PatientRelatedOrderCard,
  };
}
