import type { NavigateFunction } from 'react-router-dom';
import { getActiveTests } from '@/features/orders';
import { PaymentMethodBadge } from '../components/PaymentStatusBadge';
import type { TableViewConfig } from '@/components';
import { buildViews } from '@/components/data-table';
import {
  createOrderSharedColumns,
  renderOrderDateCell,
  renderOrderId,
  renderOrderTestsBlock,
} from '@/features/orders';
import { PaymentButton } from '../components/PaymentButton';
import { PaymentCard } from '../components/PaymentCard';
import type { OrderPaymentView } from '../types';

/** Order → patient → date → tests → status → total → payment → method → action. */
const PAYMENT_VIEWS = {
  full: [
    'orderId',
    'patientName',
    'paidDate',
    'tests',
    'overallStatus',
    'totalPrice',
    'paymentStatus',
    'paymentMethod',
    'action',
  ],
  medium: [
    'orderId',
    'patientName',
    'paidDate',
    'tests',
    'overallStatus',
    'totalPrice',
    'paymentStatus',
    'action',
  ],
  compact: [
    'orderId',
    'patientName',
    'paidDate',
    'overallStatus',
    'totalPrice',
    'paymentStatus',
    'action',
  ],
} as const;

const PAYMENT_LIST_WIDTH_OVERRIDES = {
  full: {
    orderId: 'id' as const,
    patientName: { min: 168, base: 176, grow: 0, shrink: 1 },
    overallStatus: 'md' as const,
    tests: { min: 200, grow: 1, shrink: 1 },
    paidDate: { min: 148, base: 168, grow: 0, shrink: 0 },
    totalPrice: 'md' as const,
    paymentStatus: 'sm' as const,
    paymentMethod: 'sm' as const,
  },
  medium: {
    orderId: 'id' as const,
    patientName: { min: 148, base: 160, grow: 0, shrink: 1 },
    overallStatus: 'md' as const,
    tests: { min: 160, grow: 1, shrink: 1 },
    paidDate: { min: 132, base: 152, grow: 0, shrink: 0 },
    totalPrice: 'md' as const,
  },
  compact: {
    orderId: 'id' as const,
    patientName: { min: 128, base: 140, grow: 0, shrink: 1 },
    paidDate: 'lg' as const,
    overallStatus: 'sm' as const,
    totalPrice: 'md' as const,
  },
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
  _navigate: NavigateFunction,
  getPatientNameFn: (patientId: number | string) => string,
  getTestName: (testCode: string) => string,
  onPaymentSuccess?: () => void
): TableViewConfig<OrderPaymentView> => {
  const shared = createOrderSharedColumns<OrderPaymentView>(
    {
      getOrderId: item => item.order.orderId,
      getPatientId: item => item.order.patientId,
      getPatientName: item => getPatientNameFn(item.order.patientId),
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
      renderOrderId: item => renderOrderId(item.order.orderId),
    },
    { testsSortable: true, getTestName }
  );

  const columnMap = {
    ...shared,
    orderId: {
      ...shared.orderId,
      header: 'Order',
    },
    totalPrice: {
      ...shared.totalPrice,
      header: 'Total',
    },
    tests: {
      ...shared.tests,
      render: (item: OrderPaymentView) => {
        const tests = getActiveTests(item.order.tests ?? []);
        const count = item.order.testCount ?? item.order.tests?.length;
        const testCodes = item.order.testCodes;
        return renderOrderTestsBlock(tests, {
          fallbackCount: count != null && tests.length === 0 ? count : undefined,
          testCodes: tests.length === 0 ? testCodes : undefined,
          getTestName,
          layout: 'namesFirst',
        });
      },
    },
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
        return <PaymentMethodBadge method={item.paymentMethod} size="xs" />;
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
      render: (item: OrderPaymentView) => (
        <div className="flex items-center justify-start font-normal" onClick={e => e.stopPropagation()}>
          <PaymentButton order={item.order} onPaymentSuccess={onPaymentSuccess} />
        </div>
      ),
    },
  };

  return {
    ...buildViews(columnMap, PAYMENT_VIEWS, PAYMENT_LIST_WIDTH_OVERRIDES),
    CardComponent: PaymentCard,
  };
};
