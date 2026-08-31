/**
 * Payment Table Configuration
 *
 * Multi-view table configuration for payment list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { getActiveTests } from '@/features/orders/utils';
import { Badge } from '@/components';
import type { TableViewConfig } from '@/components';
import {
  renderNavigableOrderId,
  renderOrderPatientName,
  renderOrderTestsBlock,
  renderOrderTotalPriceInline,
  renderOrderDateCell,
} from '@/components/data-table';
import { PaymentButton } from '../components/PaymentButton';
import { PaymentCard } from '../components/PaymentCard';
import type { OrderPaymentView } from '../types';

/**
 * Create payment table configuration with full, compact, and card views
 */
// eslint-disable-next-line max-lines-per-function
export const createPaymentTableConfig = (
  navigate: NavigateFunction,
  onPaymentSuccess?: () => void
): TableViewConfig<OrderPaymentView> => {
  const renderOrderId = (item: OrderPaymentView) =>
    renderNavigableOrderId(item.order.orderId, navigate);

  const renderPatientName = (item: OrderPaymentView) =>
    renderOrderPatientName(item.order.patientName || 'N/A', item.order.patientId);

  const renderTests = (item: OrderPaymentView) =>
    renderOrderTestsBlock(getActiveTests(item.order.tests ?? []));

  const renderTotalPrice = (item: OrderPaymentView) =>
    renderOrderTotalPriceInline(item.order.totalPrice);

  const renderPaymentStatus = (item: OrderPaymentView) => (
    <Badge variant={item.order.paymentStatus} size="sm" />
  );

  const renderPaymentMethod = (item: OrderPaymentView) => {
    if (!item.paymentMethod || item.order.paymentStatus === 'unpaid') {
      return null;
    }
    return <Badge variant={item.paymentMethod} size="sm" />;
  };

  const renderOrderDate = (item: OrderPaymentView) => renderOrderDateCell(item.order.orderDate);

  const renderAction = (item: OrderPaymentView) => (
    <div className="flex items-center font-normal" onClick={e => e.stopPropagation()}>
      <PaymentButton order={item.order} onPaymentSuccess={onPaymentSuccess} />
    </div>
  );

  return {
    fullColumns: [
      {
        key: 'orderId',
        header: 'Order ID',
        width: 'sm',
        sortable: true,
        render: renderOrderId,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      {
        key: 'tests',
        header: 'Tests',
        width: 'fill',
        sortable: true,
        render: renderTests,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'md',
        sortable: true,
        render: renderTotalPrice,
      },
      {
        key: 'paymentStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderPaymentStatus,
      },
      {
        key: 'paymentMethod',
        header: 'Method',
        width: 'md',
        sortable: true,
        render: renderPaymentMethod,
      },
      {
        key: 'orderDate',
        header: 'Date',
        width: 'lg',
        sortable: true,
        render: renderOrderDate,
      },
      {
        key: 'action',
        header: 'Action',
        width: 'md',
        render: renderAction,
      },
    ],
    mediumColumns: [
      {
        key: 'orderId',
        header: 'Order ID',
        width: 'sm',
        sortable: true,
        render: renderOrderId,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      {
        key: 'tests',
        header: 'Tests',
        width: 'fill',
        sortable: true,
        render: renderTests,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'md',
        sortable: true,
        render: renderTotalPrice,
      },
      {
        key: 'paymentStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderPaymentStatus,
      },
      {
        key: 'action',
        header: 'Action',
        width: 'md',
        render: renderAction,
      },
    ],
    compactColumns: [
      {
        key: 'orderId',
        header: 'Order ID',
        width: 'sm',
        sortable: true,
        render: renderOrderId,
      },
      {
        key: 'patientName',
        header: 'Patient',
        width: 'fill',
        sortable: true,
        render: renderPatientName,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'md',
        sortable: true,
        render: renderTotalPrice,
      },
      {
        key: 'paymentStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderPaymentStatus,
      },
      {
        key: 'action',
        header: 'Action',
        width: 'md',
        render: renderAction,
      },
    ],
    CardComponent: PaymentCard,
  };
};
