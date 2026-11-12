/**
 * Payments Feature — public API
 */

export {
  paymentAPI,
  remainingPaymentAmount,
  usePaymentsList,
  usePaginatedPaymentOrders,
  usePaymentsForOrderIds,
  usePayment,
  usePaymentsByOrder,
  useCreatePayment,
  useInvalidatePayments,
} from './api/payments';
export { hasRecordedPayment, isFullyPaid } from './utils/paymentStatus';
export type {
  PaymentCreate,
  PaymentFilters,
  PaymentsFilters,
  CreatePaymentData,
} from './api/payments';

export { PaymentPopover } from './components/PaymentPopover';
export { PaymentDetailModal } from './components/PaymentDetailModal';
export type { OrderPaymentView } from './types';
export { PaymentMethodSelector } from './components/PaymentMethodSelector';
export type { PaymentMethodSelectorProps } from './components/PaymentMethodSelector';
export { PaymentList as PaymentListPage } from './pages/PaymentList';
