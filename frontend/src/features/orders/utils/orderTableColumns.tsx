/**
 * Shared order column recipes for Order and Payment tables.
 */

import type { ReactNode } from 'react';
import type { OrderTest, PaymentStatus, PriorityLevel, OrderStatus } from '@/types';
import type { StatusPresentation } from '@/types/labProjection';
import { TABLE_COLUMN_WIDTH } from '@/components/data-table';
import { createIdColumn, createBadgeColumn } from '@/components/data-table/columnHelpers';
import type { ColumnConfig } from '@/components/data-table/types';
import { BADGE } from '@/theme/recipes';
import {
  OrderPriorityBadge,
  OrderStatusBadge,
} from '../components/OrderDomainBadges';
import { StatusValueBadge } from '@/features/shared';
import { ORDER_TABLE_COLUMN_HEADERS } from '../constants/orderTableColumns';
import { formatPatientSexAgeLine } from '@/utils/presentation';
import type { Gender } from '@/types';
import {
  renderOrderDateCell,
  renderOrderPatientName,
  renderOrderTestsBlock,
  renderOrderTotalPrice,
} from '@/utils/presentation';

export interface OrderColumnAccessors<T> {
  getOrderId: (item: T) => number | string;
  getPatientName: (item: T) => string;
  getPatientGender?: (item: T) => Gender | string | null | undefined;
  getPatientDob?: (item: T) => string | null | undefined;
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
      width: TABLE_COLUMN_WIDTH.flex,
      sortable: true,
      accessor: item =>
        [
          accessors.getPatientName(item),
          formatPatientSexAgeLine(
            accessors.getPatientGender?.(item),
            accessors.getPatientDob?.(item),
          ),
        ]
          .filter(Boolean)
          .join(' '),
      render: item => {
        const demographics = {
          gender: accessors.getPatientGender?.(item),
          dateOfBirth: accessors.getPatientDob?.(item),
        };
        return renderOrderPatientName(accessors.getPatientName(item), demographics);
      },
    },
    tests: {
      key: 'tests',
      header: ORDER_TABLE_COLUMN_HEADERS.tests,
      width: TABLE_COLUMN_WIDTH.flex,
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
          layout: 'namesFirst',
        });
      },
    },
    totalPrice: {
      key: 'totalPrice',
      header: ORDER_TABLE_COLUMN_HEADERS.totalPrice,
      width: TABLE_COLUMN_WIDTH.amount,
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
      item => <StatusValueBadge value={accessors.getPaymentStatus(item)} size="xs" />,
      {
        sortable: true,
        accessor: item => accessors.getPaymentStatus(item),
      }
    ),
    orderDate: {
      key: 'orderDate',
      header: ORDER_TABLE_COLUMN_HEADERS.orderDate,
      width: TABLE_COLUMN_WIDTH.datetime,
      sortable: true,
      accessor: item => accessors.getOrderDate(item),
      render: item => renderOrderDateCell(accessors.getOrderDate(item)),
    },
  };

  if (accessors.getPriority) {
    columns.priority = createBadgeColumn<T>(
      'priority',
      ORDER_TABLE_COLUMN_HEADERS.priority,
      item => (
        <OrderPriorityBadge
          priority={accessors.getPriority!(item)}
          size="xs"
          className={BADGE.tableEmbed}
        />
      ),
      {
        sortable: true,
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
        width: TABLE_COLUMN_WIDTH.badgeWide,
        accessor: item => accessors.getOverallStatus!(item),
      }
    );
  }

  return columns as Record<OrderSharedColumnKey, ColumnConfig<T>>;
}
