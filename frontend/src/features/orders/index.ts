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
} from './api/orders.api';
export type { OrdersFilter, OrdersFilters, PaginationOptions } from './api/orders.api';

export { useOrderSearch, useOrderLookup, useInvalidateOrders } from './hooks/useOrderUtils';

export { OrderUpsertModal } from './components/OrderUpsertModal';
export type { OrderUpsertModalProps } from './components/OrderUpsertModal';
export { OrderReceipt } from './components/OrderReceipt';
export type { OrderReceiptProps, OrderReceiptVariant } from './components/OrderReceipt';

export * from './utils';
export { formInputToPayload, orderToFormInput } from './utils/formTransformers';
