
import type { Order, PaymentMethod, PaymentStatus, Payment } from '@/types';


export interface OrderPaymentDetails {
  // Order identity
  orderId: number;
  orderDate: string;

  // Patient info
  patientId: number;
  patientName: string;

  // Order details
  tests: Order['tests'];
  totalPrice: number;
  priority: Order['priority'];
  overallStatus: Order['overallStatus'];

  // Payment info
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  paymentId?: number;
  paymentNotes?: string;

  // Original order reference (for full access if needed)
  _order: Order;
  // Original payment reference (for full access if needed)
  _payment?: Payment;
}

export function createOrderPaymentDetails(
  order: Order,
  payment?: Payment
): OrderPaymentDetails {
  return {
    // Order identity
    orderId: order.orderId,
    orderDate: order.orderDate,

    // Patient info
    patientId: order.patientId,
    patientName: order.patientName,

    // Order details
    tests: order.tests,
    totalPrice: order.totalPrice,
    priority: order.priority,
    overallStatus: order.overallStatus,

    // Payment info (from Payment entity if available)
    paymentStatus: order.paymentStatus,
    paymentMethod: payment?.paymentMethod,
    paymentDate: payment?.paidAt,
    paymentId: payment?.paymentId,
    paymentNotes: payment?.notes,

    // Original references
    _order: order,
    _payment: payment,
  };
}

export function buildPaymentsByOrderMap(payments: Payment[]): Map<number, Payment> {
  const map = new Map<number, Payment>();
  
  // Sort payments by date descending to get most recent first
  const sortedPayments = [...payments].sort(
    (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()
  );
  
  // Map each order to its most recent payment
  for (const payment of sortedPayments) {
    if (!map.has(payment.orderId)) {
      map.set(payment.orderId, payment);
    }
  }
  
  return map;
}

export function createOrderPaymentDetailsList(
  orders: Order[],
  payments: Payment[]
): OrderPaymentDetails[] {
  const paymentMap = buildPaymentsByOrderMap(payments);
  
  return orders.map(order => 
    createOrderPaymentDetails(order, paymentMap.get(order.orderId))
  );
}
