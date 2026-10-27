import type { NavigateFunction } from 'react-router-dom';
import type { TableViewConfig } from '@/components/data-table';
import { buildViews, type CardComponentProps } from '@/components/data-table';
import {
  ORDER_TABLE_VIEW_KEYS,
  ORDER_TABLE_VIEW_KEYS_WITHOUT_PATIENT,
} from '../constants/orderTableColumns';
import {
  createOrderSharedColumns,
  renderOrderId,
} from '@/features/orders';
import { getActiveTests } from '../utils/orderCalculator';
import type { Order } from '@/types';
import { OrderTableCard } from '../components/OrderTableCard';
import {
  ORDER_LIST_WIDTH_OVERRIDES,
  ORDER_LIST_WIDTH_OVERRIDES_WITHOUT_PATIENT,
} from '../constants/orderTableWidthOverrides';

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
      getPatientName: order => order.patientName || getPatientNameFn(order.patientId),
      getPatientGender: order => order.patientGender,
      getPatientDob: order => order.patientDob,
      getTests: order => getActiveTests(order.tests ?? []),
      getTestCount: order => order.testCount ?? order.tests?.length,
      getTestCodes: order => order.testCodes,
      getTestNames: order => order.testNames,
      getTotalPrice: order => order.totalPrice,
      getPaymentStatus: order => order.paymentStatus,
      getOrderDate: order => order.orderDate,
      getPriority: order => order.priority,
      getOverallStatus: order => order.overallStatus,
      getStatusPresentation: order => order.statusPresentation,
    },
    {
      renderOrderId: order => renderOrderId(order.orderId),
    },
    { getTestName: getTestNameFn }
  );

  const columnMap = shared;

  const views = hidePatientName ? ORDER_TABLE_VIEW_KEYS_WITHOUT_PATIENT : ORDER_TABLE_VIEW_KEYS;

  const CardComponent = hidePatientName
    ? function PatientContextOrderCard(props: CardComponentProps<Order>) {
        return <OrderTableCard {...props} hidePatientName />;
      }
    : OrderTableCard;

  return {
    ...buildViews(
      columnMap,
      views,
      hidePatientName ? ORDER_LIST_WIDTH_OVERRIDES_WITHOUT_PATIENT : ORDER_LIST_WIDTH_OVERRIDES
    ),
    CardComponent,
  };
};

/** Patient detail related-orders table (no patient column). */
export function createPatientRelatedOrdersTableConfig(
  getTestName: (testCode: string) => string
): TableViewConfig<Order> {
  return createOrderTableConfig((() => undefined) as NavigateFunction, () => '', getTestName, {
    hidePatientName: true,
  });
}
