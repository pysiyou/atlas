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

export * from './utils';
export { formInputToPayload, orderToFormInput } from './utils/formTransformers';
