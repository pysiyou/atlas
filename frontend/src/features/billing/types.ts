/**
 * Payment feature types.
 * OrderPaymentView: Order is the single source of truth, enriched with payment info.
 * Used by PaymentList, PaymentTableConfig, PaymentCard, PaymentDetailModal.
 */

import type { Order } from '@/types';

export interface OrderPaymentView {
  /** The order — single source of truth for orderId, patientName, tests, etc. */
  order: Order;
  /** Payment method from the most recent payment (if any). */
  paymentMethod?: string;
  /** Payment date from the most recent payment (if any). */
  paymentDate?: string;
}
