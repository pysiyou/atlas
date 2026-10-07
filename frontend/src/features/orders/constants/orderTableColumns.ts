/**
 * Canonical order-list table column headers and responsive view key order.
 * id → patient → tests → date → status → priority → total → payment
 */

import type { OrderSharedColumnKey } from '../utils/orderTableColumns';

export const ORDER_TABLE_COLUMN_HEADERS = {
  orderId: 'Order',
  patientName: 'Patient',
  tests: 'Tests',
  orderDate: 'Date',
  overallStatus: 'Status',
  priority: 'Priority',
  paymentStatus: 'Payment',
  totalPrice: 'Total',
} as const satisfies Record<OrderSharedColumnKey, string>;

const ORDER_TABLE_VIEW_KEYS_FULL: OrderSharedColumnKey[] = [
  'orderId',
  'patientName',
  'tests',
  'orderDate',
  'overallStatus',
  'priority',
  'totalPrice',
  'paymentStatus',
];

const ORDER_TABLE_VIEW_KEYS_MEDIUM: OrderSharedColumnKey[] = [
  'orderId',
  'patientName',
  'tests',
  'orderDate',
  'overallStatus',
  'totalPrice',
];

const ORDER_TABLE_VIEW_KEYS_COMPACT: OrderSharedColumnKey[] = [
  'orderId',
  'patientName',
  'orderDate',
  'overallStatus',
  'totalPrice',
];

export const ORDER_TABLE_VIEW_KEYS = {
  full: ORDER_TABLE_VIEW_KEYS_FULL,
  medium: ORDER_TABLE_VIEW_KEYS_MEDIUM,
  compact: ORDER_TABLE_VIEW_KEYS_COMPACT,
} as const;

function withoutPatient<T extends readonly string[]>(keys: T): Exclude<T[number], 'patientName'>[] {
  return keys.filter((key): key is Exclude<T[number], 'patientName'> => key !== 'patientName');
}

export const ORDER_TABLE_VIEW_KEYS_WITHOUT_PATIENT = {
  full: withoutPatient(ORDER_TABLE_VIEW_KEYS.full),
  medium: withoutPatient(ORDER_TABLE_VIEW_KEYS.medium),
  compact: withoutPatient(ORDER_TABLE_VIEW_KEYS.compact),
} as const;

/** Payment list uses paidDate in place of orderDate, then method + action after total. */
export type PaymentTableViewKey =
  | OrderSharedColumnKey
  | 'paidDate'
  | 'paymentMethod'
  | 'action';

const PAYMENT_VIEW_KEYS_FULL: PaymentTableViewKey[] = [
  'orderId',
  'patientName',
  'tests',
  'paidDate',
  'paymentStatus',
  'totalPrice',
  'paymentMethod',
  'action',
];

const PAYMENT_VIEW_KEYS_MEDIUM: PaymentTableViewKey[] = [
  'orderId',
  'patientName',
  'tests',
  'paidDate',
  'totalPrice',
  'paymentStatus',
  'action',
];

const PAYMENT_VIEW_KEYS_COMPACT: PaymentTableViewKey[] = [
  'orderId',
  'patientName',
  'paidDate',
  'totalPrice',
  'paymentStatus',
  'action',
];

export const ORDER_TABLE_VIEW_KEYS_PAYMENT = {
  full: PAYMENT_VIEW_KEYS_FULL,
  medium: PAYMENT_VIEW_KEYS_MEDIUM,
  compact: PAYMENT_VIEW_KEYS_COMPACT,
} as const;
