/**
 * Shared responsive column widths for order-family tables (orders, payments, patient orders).
 * All tokens resolve via global {@link COLUMN_SIZE} / {@link SIZE_PRESETS}.
 */

import { COLUMN_SIZE, type ColumnViewPreset } from '@/components/data-table';
import type { ColumnWidthOverride } from '@/components/data-table/columnHelpers';

type ViewWidthOverrides = Partial<Record<string, ColumnWidthOverride>>;
type ResponsiveWidthOverrides = Partial<Record<ColumnViewPreset, ViewWidthOverrides>>;

const ORDER_CORE_WIDTHS: ResponsiveWidthOverrides = {
  full: {
    orderId: COLUMN_SIZE.md,
    orderDate: COLUMN_SIZE.md,
    tests: COLUMN_SIZE.xl,
    overallStatus: COLUMN_SIZE.md,
    priority: COLUMN_SIZE.sm,
    paymentStatus: COLUMN_SIZE.sm,
    totalPrice: COLUMN_SIZE.md,
  },
  medium: {
    orderId: COLUMN_SIZE.md,
    orderDate: COLUMN_SIZE.md,
    tests: COLUMN_SIZE.xl,
    overallStatus: COLUMN_SIZE.md,
    totalPrice: COLUMN_SIZE.md,
  },
  compact: {
    orderId: COLUMN_SIZE.md,
    orderDate: COLUMN_SIZE.md,
    overallStatus: COLUMN_SIZE.sm,
    totalPrice: COLUMN_SIZE.md,
  },
};

function withPatientName(overrides: ResponsiveWidthOverrides): ResponsiveWidthOverrides {
  return {
    full: { ...overrides.full, patientName: COLUMN_SIZE.lg },
    medium: { ...overrides.medium, patientName: COLUMN_SIZE.lg },
    compact: { ...overrides.compact, patientName: COLUMN_SIZE.lg },
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
    paidDate: COLUMN_SIZE.md,
    totalPrice: COLUMN_SIZE.sm,
    paymentMethod: COLUMN_SIZE.sm,
    action: COLUMN_SIZE.md,
  },
  medium: {
    ...ORDER_LIST_WIDTH_OVERRIDES.medium,
    paidDate: COLUMN_SIZE.md,
    totalPrice: COLUMN_SIZE.sm,
    action: COLUMN_SIZE.md,
  },
  compact: {
    ...ORDER_LIST_WIDTH_OVERRIDES.compact,
    paidDate: COLUMN_SIZE.md,
    totalPrice: COLUMN_SIZE.sm,
    action: COLUMN_SIZE.md,
  },
};
