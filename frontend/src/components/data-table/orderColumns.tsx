/**
 * Shared order column recipes for Order and Payment tables.
 */

import type { ReactNode } from 'react';
import { Badge } from '@/components';
import type { OrderTest, PaymentStatus, PriorityLevel, OrderStatus } from '@/types';
import { createIdColumn, createBadgeColumn } from './columnHelpers';
import type { ColumnConfig } from './types';
import {
  renderOrderDateCell,
  renderOrderPatientName,
  renderOrderTestsBlock,
  renderOrderTotalPrice,
} from './columnRenders';

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
    orderId: createIdColumn<T>('orderId', 'Order ID', item => renderers.renderOrderId(item), {
      sortable: true,
      accessor: item => accessors.getOrderId(item),
    }),
    patientName: {
      key: 'patientName',
      header: 'Patient',
      width: 'fill',
      sortable: true,
      accessor: item => accessors.getPatientName(item),
      render: item =>
        renderOrderPatientName(accessors.getPatientName(item), accessors.getPatientId(item)),
    },
    tests: {
      key: 'tests',
      header: 'Tests',
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
      header: 'Amount',
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
      'Payment',
      item => <Badge variant={accessors.getPaymentStatus(item)} size="sm" />,
      {
        sortable: true,
        width: 'sm',
        accessor: item => accessors.getPaymentStatus(item),
      }
    ),
    orderDate: {
      key: 'orderDate',
      header: 'Date',
      width: 'lg',
      sortable: true,
      accessor: item => accessors.getOrderDate(item),
      render: item => renderOrderDateCell(accessors.getOrderDate(item)),
    },
  };

  if (accessors.getPriority) {
    columns.priority = createBadgeColumn<T>(
      'priority',
      'Priority',
      item => <Badge variant={accessors.getPriority!(item)} size="sm" className="border-none" />,
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
      'Status',
      item => <Badge variant={accessors.getOverallStatus!(item)} size="sm" />,
      {
        sortable: true,
        width: 'md',
        accessor: item => accessors.getOverallStatus!(item),
      }
    );
  }

  return columns as Record<OrderSharedColumnKey, ColumnConfig<T>>;
}
