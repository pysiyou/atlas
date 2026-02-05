/**
 * PatientOrdersTable – uses shared Table with viewConfig.
 * Same props; variant "simple" uses 3-column config, "detailed" uses 6-column config.
 */

import React, { useMemo } from 'react';
import { Table, Badge, EmptyState } from '@/shared/ui';
import type { TableViewConfig, CardComponentProps } from '@/shared/ui/Table';
import { DATA_AMOUNT, DATA_ID_PRIMARY } from '@/shared/constants';
import { displayId } from '@/utils';
import type { Order } from '@/types/order';
import { formatDetailDate, formatOrderPrice } from '../utils/patient-formatters';
import { ICONS } from '@/utils';

export interface PatientOrdersTableProps {
  orders: Order[];
  onOrderClick: (orderId: string) => void;
  variant?: 'simple' | 'detailed';
}

const EMPTY_MESSAGE = (
  <EmptyState
    icon={ICONS.dataFields.document}
    title="No Orders Found"
    description="This patient has no orders yet."
  />
);

function buildSimpleViewConfig(): TableViewConfig<Order> {
  const columns = [
    {
      key: 'orderId',
      header: 'Order ID',
      width: 'sm' as const,
      render: (order: Order) => (
        <span className={DATA_ID_PRIMARY}>{displayId.order(order.orderId)}</span>
      ),
    },
    {
      key: 'orderDate',
      header: 'Date',
      width: 'md' as const,
      render: (order: Order) => (
        <span className="text-xs text-text-tertiary">{formatDetailDate(order.orderDate, 'short')}</span>
      ),
    },
    {
      key: 'overallStatus',
      header: 'Status',
      width: 'sm' as const,
      render: (order: Order) => <Badge variant={order.overallStatus} size="sm" />,
    },
  ];
  const CardComponent: React.FC<CardComponentProps<Order>> = ({ item, onClick }) => (
    <div
      className="p-3 border border-border-default rounded-lg hover:bg-surface-hover cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={DATA_ID_PRIMARY}>{displayId.order(item.orderId)}</span>
        <Badge variant={item.overallStatus} size="sm" />
      </div>
      <div className="text-xs text-text-tertiary mt-1">{formatDetailDate(item.orderDate, 'short')}</div>
    </div>
  );
  return {
    fullColumns: columns,
    mediumColumns: columns,
    compactColumns: columns,
    CardComponent,
  };
}

function buildDetailedViewConfig(): TableViewConfig<Order> {
  const fullColumns = [
    {
      key: 'orderId',
      header: 'Order ID',
      width: 'sm' as const,
      render: (order: Order) => (
        <span className={`block truncate ${DATA_ID_PRIMARY}`}>{displayId.order(order.orderId)}</span>
      ),
    },
    {
      key: 'orderDate',
      header: 'Date',
      width: 'md' as const,
      render: (order: Order) => (
        <span className="block truncate text-xs text-text-tertiary">{formatDetailDate(order.orderDate, 'short')}</span>
      ),
    },
    {
      key: 'tests',
      header: 'Tests',
      width: 'lg' as const,
      render: (order: Order) => (
        <div className="min-w-0">
          <div className="font-medium truncate">
            {order.tests.length} test{order.tests.length !== 1 ? 's' : ''}
          </div>
          <div className="text-xs text-text-tertiary truncate">
            {order.tests.slice(0, 2).map(t => t.testName || t.testCode).join(', ')}
            {order.tests.length > 2 && ` +${order.tests.length - 2} more`}
          </div>
        </div>
      ),
    },
    {
      key: 'overallStatus',
      header: 'Status',
      width: 'sm' as const,
      render: (order: Order) => <Badge variant={order.overallStatus} size="sm" />,
    },
    {
      key: 'paymentStatus',
      header: 'Payment',
      width: 'sm' as const,
      render: (order: Order) => <Badge variant={order.paymentStatus} size="sm" />,
    },
    {
      key: 'totalPrice',
      header: 'Amount',
      width: 'sm' as const,
      align: 'right' as const,
      render: (order: Order) => (
        <span className={`block truncate ${DATA_AMOUNT}`}>{formatOrderPrice(order.totalPrice)}</span>
      ),
    },
  ];
  const compactColumns = fullColumns.slice(0, 3);
  const CardComponent: React.FC<CardComponentProps<Order>> = ({ item, onClick }) => (
    <div
      className="p-3 border border-border-default rounded-lg hover:bg-surface-hover cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={DATA_ID_PRIMARY}>{displayId.order(item.orderId)}</span>
        <Badge variant={item.overallStatus} size="sm" />
      </div>
      <div className="text-xs text-text-tertiary mt-1">{formatDetailDate(item.orderDate, 'short')}</div>
      <div className="text-xs text-text-secondary mt-1">
        {item.tests.length} test(s) · {formatOrderPrice(item.totalPrice)}
      </div>
    </div>
  );
  return {
    fullColumns,
    mediumColumns: fullColumns,
    compactColumns,
    CardComponent,
  };
}

export const PatientOrdersTable: React.FC<PatientOrdersTableProps> = ({
  orders,
  onOrderClick,
  variant = 'simple',
}) => {
  const viewConfig = useMemo(
    () => (variant === 'detailed' ? buildDetailedViewConfig() : buildSimpleViewConfig()),
    [variant]
  );

  return (
    <Table<Order>
      data={orders}
      viewConfig={viewConfig}
      onRowClick={(order) => onOrderClick(String(order.orderId))}
      getRowKey={(order) => order.orderId}
      pagination={false}
      emptyMessage={EMPTY_MESSAGE}
      embedded
    />
  );
};
