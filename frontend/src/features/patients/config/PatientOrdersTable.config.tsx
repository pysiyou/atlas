import type { TableViewConfig } from '@/components/data-table';
import { buildViews, type CardComponentProps } from '@/components/data-table';
import { ORDER_TABLE_VIEW_KEYS_WITHOUT_PATIENT } from '@/features/orders/constants/orderTableColumns';
import {
  createOrderSharedColumns,
  getActiveTests,
  OrderTableCard,
  renderOrderId,
  renderOrderTestsBlock,
} from '@/features/orders';
import type { Order } from '@/types';
import { COLUMN_SIZE } from '@/components/data-table';
import { ORDER_LIST_WIDTH_OVERRIDES_WITHOUT_PATIENT } from '@/features/orders/constants/orderTableWidthOverrides';

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
    tests: {
      ...shared.tests,
      width: COLUMN_SIZE.fill,
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
  };

  function PatientRelatedOrderCard(props: CardComponentProps<Order>) {
    return <OrderTableCard {...props} hidePatientName />;
  }

  return {
    ...buildViews(columnMap, ORDER_TABLE_VIEW_KEYS_WITHOUT_PATIENT, ORDER_LIST_WIDTH_OVERRIDES_WITHOUT_PATIENT),
    CardComponent: PatientRelatedOrderCard,
  };
}
