/**
 * Payment feature types.
 * Single source of truth for OrderPaymentDetails used by PaymentList, PaymentTableConfig, PaymentCard, PaymentDetailModal.
 */

import type { Order } from '@/types';
import type { Payment } from '@/types';

export interface OrderPaymentDetails {
  orderId: number;
  orderDate: string;
  patientId: number;
  patientName: string;
  tests: Array<{
    testName: string;
    priceAtOrder: number;
    status?: string;
    testCode?: string;
  }>;
  totalPrice: number;
  paymentStatus: string;
  paymentMethod?: string;
  paymentDate?: string;
  order: Order;
  payment?: Payment;
}
