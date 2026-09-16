/**
 * Orders Feature — public API
 */

export {
  orderAPI,
  useOrdersList,
  useOrder,
  useOrdersByPatient,
  useOrdersByStatus,
  usePaginatedOrders,
  useOrdersForPatientIds,
  useOrderStats,
  useOrderSummary,
  useRecentOrders,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useUpdatePaymentStatus,
} from './api/orders';
export type { OrdersFilter, OrdersFilters, PaginationOptions } from './api/orders';

export { useOrderSearch, useOrderLookup, useInvalidateOrders } from './hooks/useOrderDisplayHelpers';

export { OrderUpsertModal } from './components/OrderUpsertModal';
export type { OrderUpsertModalProps } from './components/OrderUpsertModal';
export { OrderReceipt } from './components/OrderReceipt';
export type { OrderReceiptProps, OrderReceiptVariant } from './components/OrderReceipt';
export { OrderModalFooter } from './components/OrderModalFooter';
export type { OrderModalFooterProps } from './components/OrderModalFooter';

export * from './utils/orderTimelineUtils';
export * from './utils/orderCalculator';
export { formInputToPayload, orderToFormInput } from './utils/formTransformers';
