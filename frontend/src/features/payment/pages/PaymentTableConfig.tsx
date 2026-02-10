/**
 * Payment Table Configuration
 *
 * Multi-view table configuration for payment list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils';
import { Badge } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { DATA_AMOUNT, DATA_ID_PRIMARY_CLICKABLE, DATA_ID_SECONDARY } from '@/shared/constants';
import { PaymentButton } from '../components/PaymentButton';
import { PaymentCard } from '../components/PaymentCard';
import type { OrderPaymentDetails } from '../types';

/**
 * Create payment table configuration with full, compact, and card views
 *
 * @param navigate - React Router navigate function
 * @param onPaymentSuccess - Callback to invoke after successful payment (for cache invalidation)
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function
export const createPaymentTableConfig = (
  navigate: NavigateFunction,
  onPaymentSuccess?: () => void
): TableViewConfig<OrderPaymentDetails> => {
  // Shared render functions
  const renderOrderId = (item: OrderPaymentDetails) => (
    <button
      onClick={e => {
        e.stopPropagation();
        navigate(`/orders/${item.orderId}`);
      }}
      className={`${DATA_ID_PRIMARY_CLICKABLE} font-normal`}
    >
      {displayId.order(item.orderId)}
    </button>
  );

  const renderPatientName = (item: OrderPaymentDetails) => (
    <div className="min-w-0 font-normal">
      <div className="text-fg truncate font-normal capitalize">{item.patientName || 'N/A'}</div>
      <div className={`${DATA_ID_SECONDARY} font-normal`}>{displayId.patient(item.patientId)}</div>
    </div>
  );

  const renderTests = (item: OrderPaymentDetails) => {
    const activeTests = (item.tests ?? []).filter(
      t => t.status !== 'superseded' && t.status !== 'removed'
    );
    const activeCount = activeTests.length;
    return (
      <div className="min-w-0 font-normal">
        <div className="truncate font-mono text-xs text-fg font-normal">
          {activeTests.map(t => t.testCode ?? t.testName).join('/')}
        </div>
        <div className="text-xs text-fg-subtle truncate font-normal">
          {activeCount} test{activeCount !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  const renderTotalPrice = (item: OrderPaymentDetails) => (
    <span className={`${DATA_AMOUNT} truncate block font-normal`}>{formatCurrency(item.totalPrice)}</span>
  );

  const renderPaymentStatus = (item: OrderPaymentDetails) => (
    <Badge variant={item.paymentStatus} size="sm" />
  );

  const renderPaymentMethod = (item: OrderPaymentDetails) => {
    // If order has not been paid yet (unpaid status or no payment method), keep it empty
    if (!item.paymentMethod || item.paymentStatus === 'unpaid') {
      return null;
    }
    // Display payment method as a badge
    return <Badge variant={item.paymentMethod} size="sm" />;
  };

  const renderOrderDate = (item: OrderPaymentDetails) => (
    <span className="text-xs text-fg-subtle truncate block font-normal">{formatDate(item.orderDate)}</span>
  );

  const renderAction = (item: OrderPaymentDetails) => (
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
