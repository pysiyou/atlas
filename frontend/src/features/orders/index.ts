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
export {
  OrderPriorityBadge,
  OrderStatusBadge,
  OrderTestStatusBadge,
} from './components/OrderDomainBadges';
export { OrderReceipt } from './components/OrderReceipt';
export type { OrderReceiptProps, OrderReceiptVariant } from './components/OrderReceipt';
export { BillingSummarySection } from './components/BillingSummarySection';
export type { BillingSummarySectionProps } from './components/BillingSummarySection';
export { FormDialogFooter } from '@/components/overlays/FormDialogFooter';
export type { FormDialogFooterProps } from '@/components/overlays/FormDialogFooter';

export * from './utils/orderTimelineUtils';
export * from './utils/orderCalculator';
export { formInputToPayload, orderToFormInput } from './utils/formTransformers';
export {
  createOrderSharedColumns,
  type OrderColumnAccessors,
  type OrderColumnRenderers,
  type OrderSharedColumnOptions,
  type OrderSharedColumnKey,
} from './utils/orderTableColumns';
export {
  renderOrderId,
  renderNavigableOrderId,
  renderOrderPatientName,
  renderOrderTestsBlock,
  renderOrderTotalPrice,
  renderOrderTotalPriceInline,
  renderOrderDateCell,
  type RenderOrderTestsBlockOptions,
} from './utils/orderTableColumnRenders';
