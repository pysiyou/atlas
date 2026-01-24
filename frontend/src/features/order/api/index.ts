/**
 * Order API layer
 * Re-exports from TanStack Query hooks for consistency
 */

export {
  useOrdersList,
  useOrder,
  useCreateOrder,
  useUpdateOrder,
  useDeleteOrder,
  useInvalidateOrders,
} from '@/hooks/queries';
