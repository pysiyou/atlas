/**
 * Shared responsive column widths for order-family tables (orders, payments, patient orders).
 */

import { TABLE_COLUMN_WIDTH, type ColumnViewPreset } from '@/components/data-table';
import type { ColumnWidthOverride } from '@/components/data-table/columnHelpers';

type ViewWidthOverrides = Partial<Record<string, ColumnWidthOverride>>;
type ResponsiveWidthOverrides = Partial<Record<ColumnViewPreset, ViewWidthOverrides>>;

const ORDER_CORE_WIDTHS: ResponsiveWidthOverrides = {
  full: {
    orderId: TABLE_COLUMN_WIDTH.id,
    orderDate: TABLE_COLUMN_WIDTH.datetime,
    tests: TABLE_COLUMN_WIDTH.flex,
    overallStatus: TABLE_COLUMN_WIDTH.badgeWide,
    priority: TABLE_COLUMN_WIDTH.badge,
    paymentStatus: TABLE_COLUMN_WIDTH.badge,
    totalPrice: TABLE_COLUMN_WIDTH.amount,
  },
  medium: {
    orderId: TABLE_COLUMN_WIDTH.id,
    orderDate: TABLE_COLUMN_WIDTH.datetime,
    tests: TABLE_COLUMN_WIDTH.flex,
    overallStatus: TABLE_COLUMN_WIDTH.badgeWide,
    totalPrice: TABLE_COLUMN_WIDTH.amount,
  },
  compact: {
    orderId: TABLE_COLUMN_WIDTH.id,
    orderDate: TABLE_COLUMN_WIDTH.datetime,
    overallStatus: TABLE_COLUMN_WIDTH.badge,
    totalPrice: TABLE_COLUMN_WIDTH.amount,
  },
};

function withPatientName(overrides: ResponsiveWidthOverrides): ResponsiveWidthOverrides {
  return {
    full: { ...overrides.full, patientName: TABLE_COLUMN_WIDTH.patientName },
    medium: { ...overrides.medium, patientName: TABLE_COLUMN_WIDTH.patientName },
    compact: { ...overrides.compact, patientName: TABLE_COLUMN_WIDTH.patientName },
  };
}

/** Main orders list (includes patient column). */
export const ORDER_LIST_WIDTH_OVERRIDES = withPatientName(ORDER_CORE_WIDTHS);

/** Patient detail — related orders (no patient column). */
export const ORDER_LIST_WIDTH_OVERRIDES_WITHOUT_PATIENT = ORDER_CORE_WIDTHS;

/** Payments list — date column is `paidDate`; tighter total/method/action columns. */
export const PAYMENT_LIST_WIDTH_OVERRIDES: ResponsiveWidthOverrides = {
  full: {
    ...ORDER_LIST_WIDTH_OVERRIDES.full,
    paidDate: TABLE_COLUMN_WIDTH.datetime,
    totalPrice: TABLE_COLUMN_WIDTH.amount,
    paymentMethod: TABLE_COLUMN_WIDTH.badge,
    action: TABLE_COLUMN_WIDTH.action,
  },
  medium: {
    ...ORDER_LIST_WIDTH_OVERRIDES.medium,
    paidDate: TABLE_COLUMN_WIDTH.datetime,
    totalPrice: TABLE_COLUMN_WIDTH.amount,
    action: TABLE_COLUMN_WIDTH.action,
  },
  compact: {
    ...ORDER_LIST_WIDTH_OVERRIDES.compact,
    paidDate: TABLE_COLUMN_WIDTH.datetime,
    totalPrice: TABLE_COLUMN_WIDTH.amount,
    action: TABLE_COLUMN_WIDTH.action,
  },
};
