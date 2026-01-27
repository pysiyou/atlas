/**
 * Order Table Configuration
 *
 * Multi-view table configuration for order list.
 * Defines separate column sets for full table, compact table, and mobile card view.
 */

import type { NavigateFunction } from 'react-router-dom';
import { Badge, TableActionMenu, TableActionItem, Icon } from '@/shared/ui';
import type { TableViewConfig } from '@/shared/ui/Table';
import { formatDate, formatCurrency } from '@/utils';
import { displayId } from '@/utils/id-display';
import type { Order } from '@/types';
import { OrderTableCard } from '../components/cards/OrderTableCard';
import { PaymentPopover } from '@/features/payment/components/filters/PaymentPopover';
import { ModalType } from '@/shared/context/ModalContext';
import { ICONS } from '@/utils/icon-mappings';

/**
 * Create order table configuration with full, compact, and card views
 *
 * @param navigate - React Router navigate function
 * @param getPatientNameFn - Function to get patient name from patientId
 * @param getTestNameFn - Function to get test name from testCode
 * @param openModalFn - Function to open modal (optional, for edit action)
 * @returns TableViewConfig with fullColumns, compactColumns, and CardComponent
 */
// Large function is necessary to define multiple table column configurations (full, compact, card views) with render functions
// eslint-disable-next-line max-lines-per-function
export const createOrderTableConfig = (
  navigate: NavigateFunction,
  getPatientNameFn: (patientId: number | string) => string,
  _getTestNameFn: (testCode: string) => string,
  openModalFn?: (type: ModalType, props?: Record<string, unknown>) => void
): TableViewConfig<Order> => {
  // Shared render functions
  const renderOrderId = (order: Order) => (
    <span className="text-xs text-brand font-medium font-mono truncate block hover:underline hover:font-bold">
      {displayId.order(order.orderId)}
    </span>
  );

  const renderPatientName = (order: Order) => (
    <div className="min-w-0">
      <div className="font-semibold text-text-primary truncate">
        {getPatientNameFn(order.patientId)}
      </div>
      <div className="text-xxs text-brand truncate font-mono">{displayId.patient(order.patientId)}</div>
    </div>
  );

  const renderTests = (order: Order) => {
    // Filter out superseded and removed tests - only count active tests
    const activeTests = order.tests.filter(t => t.status !== 'superseded' && t.status !== 'removed');
    const activeCount = activeTests.length;

    return (
      <div className="min-w-0">
        <div className="font-medium truncate font-mono text-xs text-brand">
          {activeTests.map(t => t.testCode).join('/')}
        </div>
        <div className="text-xs text-text-tertiary truncate">
          {activeCount} test{activeCount !== 1 ? 's' : ''}
        </div>
      </div>
    );
  };

  const renderPriority = (order: Order) => (
    <Badge variant={order.priority} size="sm" className="border-none font-medium" />
  );

  const renderStatus = (order: Order) => <Badge variant={order.overallStatus} size="sm" />;

  const renderTotalPrice = (order: Order) => (
    <div className="font-medium text-brand truncate">{formatCurrency(order.totalPrice)}</div>
  );

  const renderPaymentStatus = (order: Order) => <Badge variant={order.paymentStatus} size="sm" />;

  const renderOrderDate = (order: Order) => (
    <div className="text-xs text-text-tertiary truncate">{formatDate(order.orderDate)}</div>
  );

  const renderActions = (order: Order) => {
    // Orders can be edited if they are in 'ordered' status (not yet in progress)
    const canEdit = order.overallStatus === 'ordered';
    
    return (
      <TableActionMenu>
        <TableActionItem
          label="View Details"
          icon={<Icon name={ICONS.actions.view} className="w-4 h-4" />}
          onClick={() => navigate(`/orders/${order.orderId}`)}
        />
        {canEdit && openModalFn && (
          <TableActionItem
            label="Edit Order"
            icon={<Icon name={ICONS.actions.edit} className="w-4 h-4" />}
            onClick={() => openModalFn(ModalType.NEW_ORDER, { order, mode: 'edit' })}
          />
        )}
        <TableActionItem
          label="View Patient"
          icon={<Icon name={ICONS.dataFields.user} className="w-4 h-4" />}
          onClick={() => navigate(`/patients/${order.patientId}`)}
        />
        {order.paymentStatus === 'unpaid' && (
          /* Stop propagation so menu stays open when opening payment popover */
          <div onClick={e => e.stopPropagation()} className="w-full">
            <PaymentPopover
              order={order}
              trigger={
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-app-bg transition-colors cursor-pointer text-text-secondary"
                >
                  <span className="inline-flex w-5 h-5 shrink-0 items-center justify-center text-text-tertiary">
                    <Icon name={ICONS.dataFields.wallet} className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0">Payment</span>
                </button>
              }
            />
          </div>
        )}
      </TableActionMenu>
    );
  };

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
        render: renderTests,
      },
      {
        key: 'priority',
        header: 'Priority',
        width: 'sm',
        sortable: true,
        render: renderPriority,
      },
      {
        key: 'overallStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
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
        header: 'Payment',
        width: 'sm',
        sortable: true,
        render: renderPaymentStatus,
      },
      {
        key: 'orderDate',
        header: 'Date',
        width: 'md',
        sortable: true,
        render: renderOrderDate,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
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
        render: renderTests,
      },
      {
        key: 'overallStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
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
        header: 'Payment',
        width: 'sm',
        sortable: true,
        render: renderPaymentStatus,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
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
        key: 'tests',
        header: 'Tests',
        width: 'fill',
        render: renderTests,
      },
      {
        key: 'overallStatus',
        header: 'Status',
        width: 'sm',
        sortable: true,
        render: renderStatus,
      },
      {
        key: 'totalPrice',
        header: 'Amount',
        width: 'sm',
        sortable: true,
        render: renderTotalPrice,
      },
      {
        key: 'actions',
        header: '',
        width: 'xs',
        sticky: 'right',
        className: 'overflow-visible !px-1',
        headerClassName: '!px-1',
        render: renderActions,
      },
    ],
    CardComponent: OrderTableCard,
  };
};
