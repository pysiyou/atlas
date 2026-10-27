/**
 * Maps order list rows (with optional latestPayment embed) to payment list view-models.
 */
import type { LatestPaymentSnippet, Order } from '@/types';
import type { OrderPaymentView } from '../types';

export type OrderWithLatestPayment = Order & {
  latestPayment?: LatestPaymentSnippet | null;
};

export function buildOrderPaymentViewsFromOrders(orders: OrderWithLatestPayment[]): OrderPaymentView[] {
  return orders.map(order => ({
    order,
    paymentMethod: order.latestPayment?.paymentMethod,
    paymentDate: order.latestPayment?.paidAt,
  }));
}
