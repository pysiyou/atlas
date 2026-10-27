import type { NavigateFunction } from 'react-router-dom';
import { getActiveTests } from '@/features/orders';
import { StatusValueBadge } from '@/features/shared';
import type { TableViewConfig } from '@/components/data-table';
import { buildViews } from '@/components/data-table';
import {
  ORDER_TABLE_COLUMN_HEADERS,
  ORDER_TABLE_VIEW_KEYS_PAYMENT,
  createOrderSharedColumns,
  renderOrderDateCell,
  renderOrderId,
} from '@/features/orders';
import { PaymentButton } from '../components/PaymentButton';
import { PaymentCard } from '../components/PaymentCard';
import type { OrderPaymentView } from '../types';
import { PAYMENT_LIST_WIDTH_OVERRIDES } from '@/features/orders/constants/orderTableWidthOverrides';
import { TABLE_COLUMN_WIDTH } from '@/components/data-table';
import { INTERACTIVE } from '@/theme/recipes';
import { cn } from '@/utils';

function getPaymentSortDate(item: OrderPaymentView): string {
  return item.paymentDate ?? item.order.orderDate;
}

function getTestsSortValue(item: OrderPaymentView): string {
  const active = getActiveTests(item.order.tests ?? []);
  if (active.length > 0) {
    return active.map(t => t.testCode).join('/');
  }
  return (item.order.testCodes ?? []).join('/');
}

export const createPaymentTableConfig = (
  _navigate: NavigateFunction,
  getPatientNameFn: (patientId: number | string) => string,
  getTestName: (testCode: string) => string,
  onPaymentSuccess?: () => void
): TableViewConfig<OrderPaymentView> => {
  const shared = createOrderSharedColumns<OrderPaymentView>(
    {
      getOrderId: item => item.order.orderId,
      getPatientName: item => item.order.patientName || getPatientNameFn(item.order.patientId),
      getPatientGender: item => item.order.patientGender,
      getPatientDob: item => item.order.patientDob,
      getTests: item => getActiveTests(item.order.tests ?? []),
      getTestCount: item => item.order.testCount ?? item.order.tests?.length,
      getTestCodes: item => item.order.testCodes,
      getTotalPrice: item => item.order.totalPrice,
      getPaymentStatus: item => item.order.paymentStatus,
      getOrderDate: item => item.order.orderDate,
      getOverallStatus: item => item.order.overallStatus,
      getPriority: item => item.order.priority,
      getTestsSortValue: item => getTestsSortValue(item),
    },
    {
      renderOrderId: item => renderOrderId(item.order.orderId),
    },
    { testsSortable: true, getTestName }
  );

  const columnMap = {
    ...shared,
    paymentMethod: {
      key: 'paymentMethod',
      header: 'Method',
      width: TABLE_COLUMN_WIDTH.badge,
      sortable: true,
      accessor: (item: OrderPaymentView) => item.paymentMethod ?? '',
      render: (item: OrderPaymentView) => {
        if (!item.paymentMethod || item.order.paymentStatus === 'unpaid') return null;
        return <StatusValueBadge value={item.paymentMethod} size="xs" />;
      },
    },
    paidDate: {
      key: 'paidDate',
      header: ORDER_TABLE_COLUMN_HEADERS.orderDate,
      width: TABLE_COLUMN_WIDTH.datetime,
      sortable: true,
      accessor: (item: OrderPaymentView) => getPaymentSortDate(item),
      render: (item: OrderPaymentView) => renderOrderDateCell(getPaymentSortDate(item)),
    },
    action: {
      key: 'action',
      header: 'Action',
      width: TABLE_COLUMN_WIDTH.action,
      render: (item: OrderPaymentView) => (
        <div
          className={cn('flex items-center justify-start font-normal', INTERACTIVE.actionIsland)}
          onClick={e => e.stopPropagation()}
        >
          <PaymentButton order={item.order} onPaymentSuccess={onPaymentSuccess} />
        </div>
      ),
    },
  };

  return {
    ...buildViews(columnMap, ORDER_TABLE_VIEW_KEYS_PAYMENT, PAYMENT_LIST_WIDTH_OVERRIDES),
    CardComponent: PaymentCard,
  };
};
