import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderCreateSchema, orderUpdateSchema, orderSchema } from '../schemas/order.schema';
import type { Order } from '@/types';
import { apiClient } from '@/services/api/client';
import { queryKeys } from '@/lib/query/keys';
import { toast } from '@/shared/components/feedback';
import { getErrorMessage } from '@/utils/errorHelpers';
import { formInputToPayload } from '../utils/form-transformers';

export function useOrderService() {
  const queryClient = useQueryClient();

  const create = useMutation({
    mutationFn: async (input: unknown) => {
      const validated = orderCreateSchema.parse(input);
      const transformed = formInputToPayload(validated);
      const response = await apiClient.post<Order>('/orders', transformed);
      return orderSchema.parse(response) as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success('Order created successfully');
    },
    onError: (error) => {
      toast.error(`Failed to create order: ${getErrorMessage(error, 'Unknown error')}`);
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: unknown }) => {
      const validated = orderUpdateSchema.parse(data);
      const transformed = formInputToPayload(validated);
      const response = await apiClient.put<Order>(`/orders/${id}`, transformed);
      return orderSchema.parse(response) as Order;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.byId(String(id)) });
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all });
      toast.success('Order updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update order: ${getErrorMessage(error, 'Unknown error')}`);
    },
  });

  // Business logic functions
  
  /**
   * Calculate total price from tests
   */
  const calculateTotalPrice = (tests: Array<{ priceAtOrder: number }>) => {
    return tests.reduce((sum, test) => sum + test.priceAtOrder, 0);
  };

  /**
   * Get order status based on test statuses
   */
  const getOrderStatus = (order: { tests: Array<{ status: string }> }): string => {
    if (order.tests.length === 0) return 'pending';
    
    const statuses = order.tests.map(t => t.status);
    
    // If all tests are validated, order is validated
    if (statuses.every(s => s === 'validated')) return 'validated';
    
    // If any test is validated, order is processing
    if (statuses.some(s => s === 'validated')) return 'processing';
    
    // If any test is in progress, order is processing
    if (statuses.some(s => s === 'in-progress' || s === 'resulted')) return 'processing';
    
    // If any test is collected, order is collected
    if (statuses.some(s => s === 'sample-collected' || s === 'collected')) return 'collected';
    
    return 'pending';
  };

  return {
    // Mutations
    create,
    update,
    
    // Business logic
    calculateTotalPrice,
    getOrderStatus,
  };
}
