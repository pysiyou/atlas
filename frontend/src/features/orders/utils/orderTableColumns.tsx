/**
 * Shared order column recipes for Order and Payment tables.
 */

import type { ReactNode } from 'react';
import type { OrderTest, PaymentStatus, PriorityLevel, OrderStatus } from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import { createIdColumn, createBadgeColumn } from '@/components/data-table/columnHelpers';
import type { ColumnConfig } from '@/components/data-table/types';
import {
  OrderPriorityBadge,
  OrderStatusBadge,
} from '../components/OrderDomainBadges';
import { PaymentStatusBadge } from '@/features/payments';
import { ORDER_TABLE_COLUMN_HEADERS } from '../constants/orderTableColumns';
import {
  renderOrderDateCell,
  renderOrderPatientName,
  renderOrderTestsBlock,
  renderOrderTotalPrice,
} from './orderTableColumnRenders';

export interface OrderColumnAccessors<T> {
  getOrderId: (item: T) => number | string;
  getPatientId: (item: T) => number | string;
  getPatientName: (item: T) => string;
  getTests: (item: T) => OrderTest[];
  getTestCount?: (item: T) => number | undefined;
  getTestCodes?: (item: T) => string[] | undefined;
  getTotalPrice: (item: T) => number;
  getPaymentStatus: (item: T) => PaymentStatus;
  getOrderDate: (item: T) => string;
  getPriority?: (item: T) => PriorityLevel;
  getOverallStatus?: (item: T) => OrderStatus;
  getStatusPresentation?: (item: T) => StatusPresentation | null | undefined;
  getTestsSortValue?: (item: T) => string;
}

export interface OrderColumnRenderers<T> {
  renderOrderId: (item: T) => ReactNode;
  renderTotalPrice?: (item: T) => ReactNode;
}

export interface OrderSharedColumnOptions {
  testsSortable?: boolean;
  getTestName?: (testCode: string) => string;
}

export type OrderSharedColumnKey =
  | 'orderId'
  | 'patientName'
  | 'tests'
  | 'priority'
  | 'overallStatus'
  | 'totalPrice'
  | 'paymentStatus'
  | 'orderDate';

export function createOrderSharedColumns<T>(
  accessors: OrderColumnAccessors<T>,
  renderers: OrderColumnRenderers<T>,
  options: OrderSharedColumnOptions = {}
): Record<OrderSharedColumnKey, ColumnConfig<T>> {
  const { testsSortable = false, getTestName } = options;

  const columns: Partial<Record<OrderSharedColumnKey, ColumnConfig<T>>> = {
    orderId: createIdColumn<T>(
      'orderId',
      ORDER_TABLE_COLUMN_HEADERS.orderId,
      item => renderers.renderOrderId(item),
      {
      sortable: true,
        accessor: item => accessors.getOrderId(item),
      }
    ),
    patientName: {
      key: 'patientName',
      header: ORDER_TABLE_COLUMN_HEADERS.patientName,
      width: 'fill',
      sortable: true,
      accessor: item => accessors.getPatientName(item),
      render: item =>
        renderOrderPatientName(accessors.getPatientName(item), accessors.getPatientId(item)),
    },
    tests: {
      key: 'tests',
      header: ORDER_TABLE_COLUMN_HEADERS.tests,
      width: 'fill',
      sortable: testsSortable,
      accessor: accessors.getTestsSortValue
        ? item => accessors.getTestsSortValue!(item)
        : undefined,
      render: item => {
        const tests = accessors.getTests(item);
        const count = accessors.getTestCount?.(item);
        const testCodes = accessors.getTestCodes?.(item);
        return renderOrderTestsBlock(tests, {
          fallbackCount: count != null && tests.length === 0 ? count : undefined,
          testCodes: tests.length === 0 ? testCodes : undefined,
          getTestName,
        });
      },
    },
    totalPrice: {
      key: 'totalPrice',
      header: ORDER_TABLE_COLUMN_HEADERS.totalPrice,
      width: 'md',
      sortable: true,
      accessor: item => accessors.getTotalPrice(item),
      render: item =>
        renderers.renderTotalPrice
          ? renderers.renderTotalPrice(item)
          : renderOrderTotalPrice(accessors.getTotalPrice(item)),
    },
    paymentStatus: createBadgeColumn<T>(
      'paymentStatus',
      ORDER_TABLE_COLUMN_HEADERS.paymentStatus,
      item => <PaymentStatusBadge status={accessors.getPaymentStatus(item)} size="xs" />,
      {
        sortable: true,
        width: 'sm',
        accessor: item => accessors.getPaymentStatus(item),
      }
    ),
    orderDate: {
      key: 'orderDate',
      header: ORDER_TABLE_COLUMN_HEADERS.orderDate,
      width: 'lg',
      sortable: true,
      accessor: item => accessors.getOrderDate(item),
      render: item => renderOrderDateCell(accessors.getOrderDate(item)),
    },
  };

  if (accessors.getPriority) {
    columns.priority = createBadgeColumn<T>(
      'priority',
      ORDER_TABLE_COLUMN_HEADERS.priority,
      item => <OrderPriorityBadge priority={accessors.getPriority!(item)} size="xs" className="border-none" />,
      {
        sortable: true,
        width: 'sm',
        accessor: item => accessors.getPriority!(item),
      }
    );
  }

  if (accessors.getOverallStatus) {
    columns.overallStatus = createBadgeColumn<T>(
      'overallStatus',
      ORDER_TABLE_COLUMN_HEADERS.overallStatus,
      item => (
        <OrderStatusBadge
          status={accessors.getOverallStatus!(item)}
          presentation={accessors.getStatusPresentation?.(item)}
          layout="compact"
          size="xs"
        />
      ),
      {
        sortable: true,
        width: 'md',
        accessor: item => accessors.getOverallStatus!(item),
      }
    );
  }

  return columns as Record<OrderSharedColumnKey, ColumnConfig<T>>;
}
