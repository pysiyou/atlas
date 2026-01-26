/**
 * Payment Table Configuration
 *
 * Multi-view table configuration for payment list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils/id-display';
import { Badge } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { PaymentButton } from '../components/display/PaymentButton';
import type { OrderPaymentDetails } from '../types/types';
import { PaymentCard } from '../components/cards/PaymentCard';
import { brandColors } from '@/shared/design-system/tokens/colors';

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
      className={`text-xs ${brandColors.primary.icon} font-medium font-mono hover:underline truncate block max-w-full`}
    >
      {displayId.order(item.orderId)}
    </button>
  );

  const renderPatientName = (item: OrderPaymentDetails) => (
    <div className="min-w-0">
      <div className="font-semibold text-text-primary truncate">{item.patientName || 'N/A'}</div>
      <div className="text-xxs text-text-muted truncate font-mono">{displayId.patient(item.patientId)}</div>
    </div>
  );

  const renderTests = (item: OrderPaymentDetails) => (
    <div className="min-w-0">
      <div className="font-medium truncate">
        {item.tests?.length || 0} test{(item.tests?.length || 0) !== 1 ? 's' : ''}
      </div>
      <div className="text-xs text-text-muted truncate">
        {item.tests
          ?.slice(0, 2)
          .map(t => t.testName || t.testCode)
          .join(', ')}
        {(item.tests?.length || 0) > 2 && ` +${(item.tests?.length || 0) - 2} more`}
      </div>
    </div>
  );

  const renderTotalPrice = (item: OrderPaymentDetails) => (
    <span className={`font-medium ${brandColors.primary.icon} truncate block`}>
      {formatCurrency(item.totalPrice)}
    </span>
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
    <span className="text-xs text-text-muted truncate block">{formatDate(item.orderDate)}</span>
  );

  const renderAction = (item: OrderPaymentDetails) => (
    <div onClick={e => e.stopPropagation()}>
      <PaymentButton order={item._order} onPaymentSuccess={onPaymentSuccess} />
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
        width: 'sm',
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
        width: 'sm',
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
        width: 'sm',
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
        width: 'sm',
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
