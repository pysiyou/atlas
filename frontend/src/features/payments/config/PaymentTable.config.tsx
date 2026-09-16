import type { NavigateFunction } from 'react-router-dom';
import { getActiveTests } from '@/features/orders';
import { Badge } from '@/components';
import type { TableViewConfig } from '@/components';
import {
  buildViews,
  createOrderSharedColumns,
  renderNavigableOrderId,
  renderOrderDateCell,
  renderOrderTotalPriceInline,
} from '@/components/data-table';
import { PaymentButton } from '../components/PaymentButton';
import { PaymentCard } from '../components/PaymentCard';
import type { OrderPaymentView } from '../types';

const PAYMENT_VIEWS = {
  full: [
    'orderId',
    'patientName',
    'overallStatus',
    'tests',
    'paidDate',
    'totalPrice',
    'paymentStatus',
    'paymentMethod',
    'action',
  ],
  medium: [
    'orderId',
    'patientName',
    'overallStatus',
    'tests',
    'paidDate',
    'totalPrice',
    'paymentStatus',
    'action',
  ],
  compact: ['orderId', 'patientName', 'overallStatus', 'totalPrice', 'paymentStatus', 'action'],
} as const;

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
  navigate: NavigateFunction,
  onPaymentSuccess?: () => void,
  getTestName?: (testCode: string) => string
): TableViewConfig<OrderPaymentView> => {
  const shared = createOrderSharedColumns<OrderPaymentView>(
    {
      getOrderId: item => item.order.orderId,
      getPatientId: item => item.order.patientId,
      getPatientName: item => item.order.patientName ?? '',
      getTests: item => getActiveTests(item.order.tests ?? []),
      getTestCount: item => item.order.testCount ?? item.order.tests?.length,
      getTestCodes: item => item.order.testCodes,
      getTotalPrice: item => item.order.totalPrice,
      getPaymentStatus: item => item.order.paymentStatus,
      getOrderDate: item => item.order.orderDate,
      getOverallStatus: item => item.order.overallStatus,
      getTestsSortValue: item => getTestsSortValue(item),
    },
    {
      renderOrderId: item => renderNavigableOrderId(item.order.orderId, navigate),
      renderTotalPrice: item => renderOrderTotalPriceInline(item.order.totalPrice),
    },
    { testsSortable: true, getTestName }
  );

  const columnMap = {
    ...shared,
    paymentStatus: {
      ...shared.paymentStatus,
      header: 'Payment',
    },
    paymentMethod: {
      key: 'paymentMethod',
      header: 'Method',
      width: 'sm' as const,
      sortable: true,
      accessor: (item: OrderPaymentView) => item.paymentMethod ?? '',
      render: (item: OrderPaymentView) => {
        if (!item.paymentMethod || item.order.paymentStatus === 'unpaid') return null;
        return <Badge variant={item.paymentMethod} size="sm" />;
      },
    },
    paidDate: {
      key: 'paidDate',
      header: 'Date',
      width: 'lg' as const,
      sortable: true,
      accessor: (item: OrderPaymentView) => getPaymentSortDate(item),
      render: (item: OrderPaymentView) => renderOrderDateCell(getPaymentSortDate(item)),
    },
    action: {
      key: 'action',
      header: 'Action',
      width: 'md' as const,
      headerClassName: 'justify-end',
      align: 'right' as const,
      render: (item: OrderPaymentView) => (
        <div className="flex items-center justify-end font-normal" onClick={e => e.stopPropagation()}>
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
